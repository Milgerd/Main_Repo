require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../index');

const SALT_ROUNDS = 10;

async function migratePlainPasswords() {
  const { rows } = await pool.query(
    "SELECT id, email, password FROM users WHERE password NOT LIKE '$2b$%'"
  );

  console.log(`Found ${rows.length} user(s) with plain-text passwords.`);

  for (const user of rows) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
    console.log(`Updated: ${user.email}`);
  }

  console.log('Migration complete.');
  await pool.end();
}

migratePlainPasswords().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
