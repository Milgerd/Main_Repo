require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `ratelimit_${Date.now()}`;

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

afterAll(async () => {
  await pool.query("DELETE FROM role_audit_log WHERE target_user_id IN (SELECT id FROM users WHERE email LIKE $1)", [`%${TAG}%`]);
  await pool.query("DELETE FROM users WHERE email LIKE $1", [`%${TAG}%`]);
  await pool.end();
});

describe('Admin rate limiting – 10 requests per minute', () => {
  let admin;
  let targetUser;
  let token;

  beforeAll(async () => {
    admin = await insertUser(`admin_${TAG}@test.com`, 'admin');
    targetUser = await insertUser(`target_${TAG}@test.com`, 'user');
    token = makeToken(admin);
  });

  test('11th request within the window returns 429', async () => {
    const results = [];

    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .put(`/api/admin/users/${targetUser.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'user' });
      results.push(res.status);
    }

    const first10 = results.slice(0, 10);
    const eleventh = results[10];

    first10.forEach((status) => {
      expect(status === 200 || status === 204).toBe(true);
    });

    expect(eleventh).toBe(429);
  });

  test('429 response contains rate limit message', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${targetUser.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' });

    expect(res.status).toBe(429);
    expect(res.body.message).toBe('Too many requests, please try again later');
  });
});
