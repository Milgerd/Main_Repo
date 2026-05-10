require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `test_tfil_${Date.now()}`;

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

let userA, userB, tokenA, tokenB, projectId;

beforeAll(async () => {
  userA = await insertUser(`userA_${TAG}@test.com`, 'user');
  userB = await insertUser(`userB_${TAG}@test.com`, 'user');
  tokenA = makeToken(userA);
  tokenB = makeToken(userB);

  const projRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: `Filter_${TAG}` });
  projectId = projRes.body.id;

  await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ title: 'Open 1', status: 'open' });

  await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ title: 'Open 2', status: 'open' });

  await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ title: 'In Progress 1', status: 'in_progress' });

  await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ title: 'Done 1', status: 'done' });
});

afterAll(async () => {
  await pool.query('DELETE FROM project_activity WHERE project_id IN (SELECT id FROM projects WHERE name LIKE $1)', [`%${TAG}%`]);
  await pool.query('DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE name LIKE $1)', [`%${TAG}%`]);
  await pool.query('DELETE FROM projects WHERE name LIKE $1', [`%${TAG}%`]);
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`%${TAG}%`]);
  await pool.end();
});

describe('GET /api/projects/:id/tasks?status=', () => {
  test('no status param returns all tasks', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.length).toBe(4);
  });

  test('status=open returns only open tasks', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?status=open`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.length).toBe(2);
    expect(res.body.every(t => t.status === 'open')).toBe(true);
  });

  test('status=in_progress returns only in_progress tasks', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?status=in_progress`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe('in_progress');
  });

  test('status=done returns only done tasks', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?status=done`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe('done');
  });

  test('invalid status returns 400', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks?status=invalid`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);

    expect(res.body.error).toMatch(/Status must be one of/);
  });

  test('unauthorized project still returns 404', async () => {
    await request(app)
      .get(`/api/projects/${projectId}/tasks?status=open`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });
});
