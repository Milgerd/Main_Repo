require('dotenv').config();

const pool = require('../db');

async function cleanup() {
  const testEmailPattern = '%test_%';
  const rateLimitPattern = '%ratelimit_%';
  const anomalyPattern = '%anomaly_%';

  const auditResult = await pool.query(
    `DELETE FROM role_audit_log
     WHERE admin_id IN (SELECT id FROM users WHERE email LIKE $1 OR email LIKE $2 OR email LIKE $3)
        OR target_user_id IN (SELECT id FROM users WHERE email LIKE $1 OR email LIKE $2 OR email LIKE $3)`,
    [testEmailPattern, rateLimitPattern, anomalyPattern]
  );
  console.log(`role_audit_log: ${auditResult.rowCount} rows deleted`);

  const userResult = await pool.query(
    `DELETE FROM users WHERE email LIKE $1 OR email LIKE $2 OR email LIKE $3`,
    [testEmailPattern, rateLimitPattern, anomalyPattern]
  );
  console.log(`users: ${userResult.rowCount} rows deleted`);

  await pool.end();
  console.log('Cleanup complete.');
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
