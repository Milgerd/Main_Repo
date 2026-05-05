require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `anomaly_${Date.now()}`;

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
  await pool.query(
    "DELETE FROM role_audit_log WHERE admin_id IN (SELECT id FROM users WHERE email LIKE $1)",
    [`%${TAG}%`]
  );
  await pool.query("DELETE FROM users WHERE email LIKE $1", [`%${TAG}%`]);
  await pool.end();
});

describe('Anomaly detection – role_flipping', () => {
  let admin;
  let target;
  let token;

  beforeAll(async () => {
    admin = await insertUser(`flip_admin_${TAG}@test.com`, 'admin');
    target = await insertUser(`flip_target_${TAG}@test.com`, 'user');
    token = makeToken(admin);
  });

  test('3rd role change on same target triggers role_flipping', async () => {
    const roles = ['admin', 'user', 'admin'];
    let lastResponse;

    for (const role of roles) {
      lastResponse = await request(app)
        .put(`/api/admin/users/${target.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role });
    }

    expect(lastResponse.status).toBe(200);
    expect(lastResponse.body.anomalies).toContain('role_flipping');
  });
});

describe('Anomaly detection – rapid_bulk_changes', () => {
  let admin;
  let targets;
  let token;

  beforeAll(async () => {
    admin = await insertUser(`bulk_admin_${TAG}@test.com`, 'admin');
    targets = [];
    for (let i = 0; i < 6; i++) {
      const t = await insertUser(`bulk_target${i}_${TAG}@test.com`, 'user');
      targets.push(t);
    }
    token = makeToken(admin);
  });

  test('6th role change by same admin triggers rapid_bulk_changes', async () => {
    let lastResponse;

    for (let i = 0; i < 6; i++) {
      lastResponse = await request(app)
        .put(`/api/admin/users/${targets[i].id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin' });
    }

    expect(lastResponse.status).toBe(200);
    expect(lastResponse.body.anomalies).toContain('rapid_bulk_changes');
  });
});
