require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `test_task_${Date.now()}`;

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

async function insertProject(userId, name) {
  const res = await pool.query(
    'INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING id, user_id, name, status',
    [userId, name]
  );
  return res.rows[0];
}

let userA, userB, projectA, tokenA, tokenB;

beforeAll(async () => {
  userA = await insertUser(`userA_${TAG}@test.com`, 'user');
  userB = await insertUser(`userB_${TAG}@test.com`, 'user');
  projectA = await insertProject(userA.id, `Project_${TAG}`);
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

describe('POST /api/projects/:id/tasks', () => {
  test('creates a task with valid title', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'First task' })
      .expect(201);

    expect(res.body.title).toBe('First task');
    expect(res.body.status).toBe('open');
    expect(res.body.project_id).toBe(projectA.id);
  });

  test('rejects missing title', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(400);

    expect(res.body.error).toBe('Task title is required');
  });

  test('rejects invalid status', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Bad status', status: 'invalid' })
      .expect(400);

    expect(res.body.error).toMatch(/Status must be one of/);
  });

  test('returns 404 for another user\'s project', async () => {
    await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Intruder task' })
      .expect(404);
  });

  test('logs task_created activity', async () => {
    await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Activity check' })
      .expect(201);

    const activity = await pool.query(
      "SELECT event_type FROM project_activity WHERE project_id = $1 AND event_type = 'task_created' ORDER BY created_at DESC LIMIT 1",
      [projectA.id]
    );
    expect(activity.rows.length).toBe(1);
  });
});

describe('GET /api/projects/:id/tasks', () => {
  test('lists tasks for owned project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('returns 404 for another user\'s project', async () => {
    await request(app)
      .get(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });
});

describe('PATCH /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'To update' });
    taskId = res.body.id;
  });

  test('updates task title', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Updated title' })
      .expect(200);

    expect(res.body.title).toBe('Updated title');
  });

  test('updates task status to done', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'done' })
      .expect(200);

    expect(res.body.status).toBe('done');
  });

  test('rejects invalid status', async () => {
    await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'bogus' })
      .expect(400);
  });

  test('rejects empty title', async () => {
    await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: '' })
      .expect(400);
  });

  test('rejects update with no fields', async () => {
    await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({})
      .expect(400);
  });

  test('returns 404 for another user\'s task', async () => {
    await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hijack' })
      .expect(404);
  });

  test('logs task_updated activity', async () => {
    await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Activity update check' })
      .expect(200);

    const activity = await pool.query(
      "SELECT event_type FROM project_activity WHERE project_id = $1 AND event_type = 'task_updated' ORDER BY created_at DESC LIMIT 1",
      [projectA.id]
    );
    expect(activity.rows.length).toBe(1);
  });
});

describe('DELETE /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'To delete' });
    taskId = res.body.id;
  });

  test('returns 404 for another user\'s task', async () => {
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  test('deletes owned task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.message).toBe('Task deleted');
  });

  test('returns 404 after deletion', async () => {
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });

  test('logs task_deleted activity', async () => {
    const createRes = await request(app)
      .post(`/api/projects/${projectA.id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Delete for activity' });

    await request(app)
      .delete(`/api/tasks/${createRes.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const activity = await pool.query(
      "SELECT event_type FROM project_activity WHERE project_id = $1 AND event_type = 'task_deleted' ORDER BY created_at DESC LIMIT 1",
      [projectA.id]
    );
    expect(activity.rows.length).toBe(1);
  });
});
