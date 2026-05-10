require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `test_proj_${Date.now()}`;

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1h' });
}

async function insertUser(email, role) {
  const res = await pool.query(
    "INSERT INTO users (email, password, role) VALUES ($1, 'nologin', $2) RETURNING id, email, role",
    [email, role]
  );
  return res.rows[0];
}

let userA, userB, tokenA, tokenB;

beforeAll(async () => {
  userA = await insertUser(`userA_${TAG}@test.com`, 'user');
  userB = await insertUser(`userB_${TAG}@test.com`, 'user');
  tokenA = makeToken(userA);
  tokenB = makeToken(userB);
});

afterAll(async () => {
  await pool.query('DELETE FROM project_activity WHERE project_id IN (SELECT id FROM projects WHERE name LIKE $1)', [`%${TAG}%`]);
  await pool.query('DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE name LIKE $1)', [`%${TAG}%`]);
  await pool.query('DELETE FROM projects WHERE name LIKE $1', [`%${TAG}%`]);
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`%${TAG}%`]);
  await pool.end();
});

describe('POST /api/projects', () => {
  test('creates a project with valid name and returns 201', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Create_${TAG}`, description: 'A test project' })
      .expect(201);

    expect(res.body.name).toBe(`Create_${TAG}`);
    expect(res.body.status).toBe('draft');
    expect(res.body.user_id).toBe(userA.id);
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
  });

  test('trims whitespace from name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `  Trimmed_${TAG}  ` })
      .expect(201);

    expect(res.body.name).toBe(`Trimmed_${TAG}`);
  });

  test('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(400);

    expect(res.body.error).toBe('Project name is required');
  });

  test('rejects empty string name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: '   ' })
      .expect(400);

    expect(res.body.error).toBe('Project name is required');
  });

  test('rejects non-string name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 123 })
      .expect(400);

    expect(res.body.error).toBe('Project name is required');
  });

  test('sets description to null when omitted', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `NoDesc_${TAG}` })
      .expect(201);

    expect(res.body.description).toBeNull();
  });

  test('logs project_created activity', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Activity_${TAG}` })
      .expect(201);

    const activity = await pool.query(
      "SELECT event_type FROM project_activity WHERE project_id = $1 AND event_type = 'project_created'",
      [res.body.id]
    );
    expect(activity.rows.length).toBe(1);
  });

  test('returns 401 without auth token', async () => {
    await request(app)
      .post('/api/projects')
      .send({ name: 'No auth' })
      .expect(401);
  });
});

describe('GET /api/projects', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `ListA_${TAG}` });

    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: `ListB_${TAG}` });
  });

  test('returns only the authenticated user\'s projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const names = res.body.map(p => p.name);
    expect(names).toContain(`ListA_${TAG}`);
    expect(names).not.toContain(`ListB_${TAG}`);
  });

  test('returns projects ordered by created_at descending', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    for (let i = 1; i < res.body.length; i++) {
      expect(new Date(res.body[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(res.body[i].created_at).getTime());
    }
  });

  test('does not expose user_id in list response', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body[0].user_id).toBeUndefined();
  });
});

describe('GET /api/projects/:id/dashboard', () => {
  let ownedProject;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Dash_${TAG}` });
    ownedProject = res.body;
  });

  test('returns correct response shape for owned project', async () => {
    const res = await request(app)
      .get(`/api/projects/${ownedProject.id}/dashboard`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.projectId).toBe(ownedProject.id);
    expect(res.body.projectName).toBe(`Dash_${TAG}`);
    expect(res.body.status).toBe('draft');
    expect(typeof res.body.daysSinceCreated).toBe('number');
    expect(res.body.lastUpdated).toBeDefined();
    expect(res.body.activitySummary).toBeDefined();
    expect(typeof res.body.activitySummary.totalEvents).toBe('number');
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  test('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .get('/api/projects/999999/dashboard')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);

    expect(res.body.error).toBe('Project not found');
  });

  test('returns 404 for another user\'s project', async () => {
    const res = await request(app)
      .get(`/api/projects/${ownedProject.id}/dashboard`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    expect(res.body.error).toBe('Project not found');
  });
});

describe('PATCH /api/projects/:id/status', () => {
  let ownedProject;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Status_${TAG}` });
    ownedProject = res.body;
  });

  test('updates status to a valid value', async () => {
    const res = await request(app)
      .patch(`/api/projects/${ownedProject.id}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'active' })
      .expect(200);

    expect(res.body.status).toBe('active');
    expect(res.body.id).toBe(ownedProject.id);
  });

  test('rejects invalid status', async () => {
    const res = await request(app)
      .patch(`/api/projects/${ownedProject.id}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'invalid' })
      .expect(400);

    expect(res.body.error).toMatch(/Status must be one of/);
  });

  test('rejects missing status', async () => {
    const res = await request(app)
      .patch(`/api/projects/${ownedProject.id}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(400);

    expect(res.body.error).toMatch(/Status must be one of/);
  });

  test('returns 404 for another user\'s project', async () => {
    await request(app)
      .patch(`/api/projects/${ownedProject.id}/status`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'completed' })
      .expect(404);
  });

  test('returns 404 for non-existent project', async () => {
    await request(app)
      .patch('/api/projects/999999/status')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'active' })
      .expect(404);
  });

  test('logs status_changed activity', async () => {
    await request(app)
      .patch(`/api/projects/${ownedProject.id}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'completed' })
      .expect(200);

    const activity = await pool.query(
      "SELECT event_type FROM project_activity WHERE project_id = $1 AND event_type = 'status_changed' ORDER BY created_at DESC LIMIT 1",
      [ownedProject.id]
    );
    expect(activity.rows.length).toBe(1);
  });
});
