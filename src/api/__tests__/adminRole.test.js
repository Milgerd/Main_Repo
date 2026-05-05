require('dotenv').config();

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const pool = require('../../../db');

const SECRET = process.env.JWT_SECRET;
const TAG = `test_${Date.now()}`;

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

describe('Admin role update – last-admin protection', () => {
  let soloAdmin;
  let actingAdmin;
  let targetAdmin;

  beforeAll(async () => {
    // Demote all existing admins except one we control, so we can test the "last admin" edge
    // We'll create our own users and temporarily demote all pre-existing admins
    actingAdmin = await insertUser(`acting_${TAG}@test.com`, 'admin');
    targetAdmin = await insertUser(`target_${TAG}@test.com`, 'admin');
    soloAdmin = await insertUser(`solo_${TAG}@test.com`, 'admin');
  });

  // Test 2 (run first — it doesn't need solo-admin setup)
  test('demoting one of multiple admins returns 200', async () => {
    const token = makeToken(actingAdmin);
    const res = await request(app)
      .put(`/api/admin/users/${targetAdmin.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' })
      .expect(200);

    expect(res.body.role).toBe('user');
  });

  // Test 1
  test('demoting the last admin returns 403', async () => {
    // Demote every admin in the DB except soloAdmin
    await pool.query(
      "UPDATE users SET role = 'user' WHERE role = 'admin' AND id != $1",
      [soloAdmin.id]
    );

    // Use actingAdmin's token (JWT still says admin, passes middleware)
    const token = makeToken(actingAdmin);
    const res = await request(app)
      .put(`/api/admin/users/${soloAdmin.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' })
      .expect(403);

    expect(res.body.message).toBe('Cannot remove the last admin');

    // Restore admins so other tests/system aren't broken
    await pool.query(
      "UPDATE users SET role = 'admin' WHERE id = $1",
      [actingAdmin.id]
    );
  });

  // Test 3
  test('blocked demotion does NOT create audit log entry', async () => {
    // Ensure soloAdmin is the only admin again
    await pool.query(
      "UPDATE users SET role = 'user' WHERE role = 'admin' AND id != $1",
      [soloAdmin.id]
    );

    const token = makeToken(actingAdmin);

    const before = await pool.query(
      'SELECT COUNT(*)::int AS count FROM role_audit_log WHERE target_user_id = $1',
      [soloAdmin.id]
    );

    await request(app)
      .put(`/api/admin/users/${soloAdmin.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user' })
      .expect(403);

    const after = await pool.query(
      'SELECT COUNT(*)::int AS count FROM role_audit_log WHERE target_user_id = $1',
      [soloAdmin.id]
    );

    expect(after.rows[0].count).toBe(before.rows[0].count);

    // Restore admins
    await pool.query(
      "UPDATE users SET role = 'admin' WHERE id IN ($1, $2)",
      [actingAdmin.id, soloAdmin.id]
    );
  });
});
