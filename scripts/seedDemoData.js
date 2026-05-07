require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('../db');

const DEMO_USERS = [
  { email: 'founder.demo+launchforge@example.com', role: 'admin' },
  { email: 'analyst.demo+launchforge@example.com', role: 'user' },
  { email: 'marketer.demo+launchforge@example.com', role: 'user' },
  { email: 'viewer.demo+launchforge@example.com', role: 'user' },
];

async function upsertUser(client, email, role) {
  const existing = await client.query(
    'SELECT id, email, role FROM users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    return { user: existing.rows[0], created: false };
  }
  const result = await client.query(
    "INSERT INTO users (email, password, role) VALUES ($1, 'nologin', $2) RETURNING id, email, role",
    [email, role]
  );
  return { user: result.rows[0], created: true };
}

function daysAgo(days, hours = 0, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours, d.getMinutes() - minutes, 0, 0);
  return d.toISOString();
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const testEmail = 'milad@launchforge.dev';
    const testExists = await client.query('SELECT id FROM users WHERE email = $1', [testEmail]);
    if (testExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Test1234', 10);
      await client.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')",
        [testEmail, hashedPassword]
      );
      console.log(`Test user created: ${testEmail}`);
    } else {
      console.log(`Test user exists: ${testEmail}`);
    }

    const users = {};
    let createdCount = 0;
    let reusedCount = 0;

    for (const def of DEMO_USERS) {
      const { user, created } = await upsertUser(client, def.email, def.role);
      const key = def.email.split('.demo')[0];
      users[key] = user;
      if (created) createdCount++;
      else reusedCount++;
    }

    const auditEntries = [
      { admin: users.founder, target: users.analyst, old: 'user',  new: 'admin', at: daysAgo(14) },
      { admin: users.founder, target: users.analyst, old: 'admin', new: 'user',  at: daysAgo(12) },
      { admin: users.founder, target: users.marketer, old: 'user', new: 'admin', at: daysAgo(10) },
      { admin: users.founder, target: users.analyst, old: 'user',  new: 'admin', at: daysAgo(7) },
      { admin: users.founder, target: users.analyst, old: 'admin', new: 'user',  at: daysAgo(7, 0, 30) },
      { admin: users.founder, target: users.analyst, old: 'user',  new: 'admin', at: daysAgo(7, 0, 25) },
      { admin: users.founder, target: users.analyst, old: 'admin', new: 'user',  at: daysAgo(7, 0, 20) },
      { admin: users.founder, target: users.viewer,  old: 'user',  new: 'admin', at: daysAgo(3) },
      { admin: users.founder, target: users.viewer,  old: 'admin', new: 'user',  at: daysAgo(3, 0, 45) },
      { admin: users.founder, target: users.analyst, old: 'user',  new: 'admin', at: daysAgo(1, 0, 4) },
      { admin: users.founder, target: users.analyst, old: 'admin', new: 'user',  at: daysAgo(1, 0, 3) },
      { admin: users.founder, target: users.viewer,  old: 'user',  new: 'admin', at: daysAgo(1, 0, 2) },
      { admin: users.founder, target: users.viewer,  old: 'admin', new: 'user',  at: daysAgo(1, 0, 1) },
      { admin: users.founder, target: users.marketer, old: 'admin', new: 'user', at: daysAgo(1) },
      { admin: users.founder, target: users.marketer, old: 'user',  new: 'admin', at: daysAgo(1) },
    ];

    await client.query(
      "DELETE FROM role_audit_log WHERE admin_id IN (SELECT id FROM users WHERE email LIKE '%demo+launchforge%')"
    );

    let insertedCount = 0;
    for (const entry of auditEntries) {
      await client.query(
        'INSERT INTO role_audit_log (admin_id, target_user_id, old_role, new_role, created_at) VALUES ($1, $2, $3, $4, $5)',
        [entry.admin.id, entry.target.id, entry.old, entry.new, entry.at]
      );
      insertedCount++;
    }

    await client.query('COMMIT');

    console.log(`Demo users: ${createdCount} created, ${reusedCount} reused`);
    console.log(`Audit log:  ${insertedCount} records inserted`);
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
