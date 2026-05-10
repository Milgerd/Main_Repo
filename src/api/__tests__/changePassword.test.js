require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `test_cpw_${Date.now()}`;
const ORIGINAL_PASSWORD = 'Original123';
const NEW_PASSWORD = 'Changed456';

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1h' });
}

let testUser, token;
const testEmail = `cpw_${TAG}@test.com`;

beforeAll(async () => {
  const hashed = await bcrypt.hash(ORIGINAL_PASSWORD, 10);
  const res = await pool.query(
    "INSERT INTO users (email, password, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
    [testEmail, hashed]
  );
  testUser = res.rows[0];
  token = makeToken(testUser);
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`%${TAG}%`]);
  await pool.end();
});

describe('POST /api/change-password', () => {
  test('returns 401 without auth token', async () => {
    await request(app)
      .post('/api/change-password')
      .send({ currentPassword: ORIGINAL_PASSWORD, newPassword: NEW_PASSWORD })
      .expect(401);
  });

  test('rejects missing currentPassword', async () => {
    const res = await request(app)
      .post('/api/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: NEW_PASSWORD })
      .expect(400);

    expect(res.body.error).toBe('Current password is required');
  });

  test('rejects missing newPassword', async () => {
    const res = await request(app)
      .post('/api/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: ORIGINAL_PASSWORD })
      .expect(400);

    expect(res.body.error).toBe('New password is required');
  });

  test('rejects newPassword shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: ORIGINAL_PASSWORD, newPassword: '12345' })
      .expect(400);

    expect(res.body.error).toBe('New password must be at least 6 characters long');
  });

  test('rejects wrong currentPassword', async () => {
    const res = await request(app)
      .post('/api/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPassword', newPassword: NEW_PASSWORD })
      .expect(401);

    expect(res.body.error).toBe('Current password is incorrect');
  });

  test('changes password successfully', async () => {
    const res = await request(app)
      .post('/api/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: ORIGINAL_PASSWORD, newPassword: NEW_PASSWORD })
      .expect(200);

    expect(res.body.message).toBe('Password changed successfully');
    expect(res.body.password).toBeUndefined();
    expect(res.body.hash).toBeUndefined();
  });

  test('old password no longer works for login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: testEmail, password: ORIGINAL_PASSWORD })
      .expect(401);

    expect(res.body.error).toBe('Invalid email or password');
  });

  test('new password works for login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: testEmail, password: NEW_PASSWORD })
      .expect(200);

    expect(res.body.message).toBe('Login successful');
    expect(res.body.token).toBeDefined();
  });
});
