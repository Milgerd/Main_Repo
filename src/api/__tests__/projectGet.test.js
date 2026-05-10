require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `test_pget_${Date.now()}`;

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

let userA, userB, tokenA, tokenB, projectA;

beforeAll(async () => {
  userA = await insertUser(`userA_${TAG}@test.com`, 'user');
  userB = await insertUser(`userB_${TAG}@test.com`, 'user');
  tokenA = makeToken(userA);
  tokenB = makeToken(userB);

  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: `Single_${TAG}`, description: 'Test description' });
  projectA = res.body;
});

afterAll(async () => {
  await pool.query('DELETE FROM project_activity WHERE project_id IN (SELECT id FROM projects WHERE name LIKE $1)', [`%${TAG}%`]);
  await pool.query('DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE name LIKE $1)', [`%${TAG}%`]);
  await pool.query('DELETE FROM projects WHERE name LIKE $1', [`%${TAG}%`]);
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`%${TAG}%`]);
  await pool.end();
});

describe('GET /api/projects/:id', () => {
  test('returns owned project with expected fields', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectA.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.id).toBe(projectA.id);
    expect(res.body.name).toBe(`Single_${TAG}`);
    expect(res.body.description).toBe('Test description');
    expect(res.body.status).toBe('draft');
    expect(res.body.created_at).toBeDefined();
    expect(res.body.updated_at).toBeDefined();
  });

  test('does not expose user_id', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectA.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.user_id).toBeUndefined();
  });

  test('returns 404 for another user\'s project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectA.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    expect(res.body.error).toBe('Project not found');
  });

  test('returns 404 for non-existent project', async () => {
    const res = await request(app)
      .get('/api/projects/999999')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);

    expect(res.body.error).toBe('Project not found');
  });

  test('returns 401 without auth token', async () => {
    await request(app)
      .get(`/api/projects/${projectA.id}`)
      .expect(401);
  });
});
