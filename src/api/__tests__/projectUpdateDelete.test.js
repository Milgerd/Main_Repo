require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `test_pud_${Date.now()}`;

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

describe('PUT /api/projects/:id', () => {
  let projectId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Update_${TAG}`, description: 'Original description' });
    projectId = res.body.id;
  });

  test('updates name only', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Renamed_${TAG}` })
      .expect(200);

    expect(res.body.name).toBe(`Renamed_${TAG}`);
    expect(res.body.description).toBe('Original description');
  });

  test('updates description only', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: 'New description' })
      .expect(200);

    expect(res.body.description).toBe('New description');
  });

  test('updates both name and description', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Both_${TAG}`, description: 'Both updated' })
      .expect(200);

    expect(res.body.name).toBe(`Both_${TAG}`);
    expect(res.body.description).toBe('Both updated');
  });

  test('trims whitespace from name', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `  Trimmed_${TAG}  ` })
      .expect(200);

    expect(res.body.name).toBe(`Trimmed_${TAG}`);
  });

  test('allows setting description to null', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ description: null })
      .expect(200);

    expect(res.body.description).toBeNull();
  });

  test('rejects empty name', async () => {
    await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: '   ' })
      .expect(400);
  });

  test('rejects non-string name', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 42 })
      .expect(400);

    expect(res.body.error).toBe('Project name cannot be empty');
  });

  test('rejects empty body', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(400);

    expect(res.body.error).toBe('No fields to update');
  });

  test('returns 404 for another user\'s project', async () => {
    await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hijack' })
      .expect(404);
  });

  test('returns 404 for non-existent project', async () => {
    await request(app)
      .put('/api/projects/999999')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Ghost' })
      .expect(404);
  });

  test('logs project_updated activity', async () => {
    await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Logged_${TAG}` })
      .expect(200);

    const activity = await pool.query(
      "SELECT event_type FROM project_activity WHERE project_id = $1 AND event_type = 'project_updated' ORDER BY created_at DESC LIMIT 1",
      [projectId]
    );
    expect(activity.rows.length).toBe(1);
  });
});

describe('DELETE /api/projects/:id', () => {
  test('returns 404 for another user\'s project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `OwnerCheck_${TAG}` });

    await request(app)
      .delete(`/api/projects/${res.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  test('returns 404 for non-existent project', async () => {
    await request(app)
      .delete('/api/projects/999999')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  test('deletes owned project and its child records', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `ToDelete_${TAG}` });
    const projId = projRes.body.id;

    await request(app)
      .post(`/api/projects/${projId}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Child task' });

    const res = await request(app)
      .delete(`/api/projects/${projId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.message).toBe('Project deleted');

    const check = await pool.query('SELECT id FROM projects WHERE id = $1', [projId]);
    expect(check.rows.length).toBe(0);

    const taskCheck = await pool.query('SELECT id FROM tasks WHERE project_id = $1', [projId]);
    expect(taskCheck.rows.length).toBe(0);
  });

  test('returns 404 after deletion', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Gone_${TAG}` });

    await request(app)
      .delete(`/api/projects/${projRes.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    await request(app)
      .delete(`/api/projects/${projRes.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });
});
