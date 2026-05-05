const pool = require('../../../db');

async function checkRoleChangeAnomalies(adminId, targetUserId) {
  const anomalies = [];

  try {
    const bulkResult = await pool.query(
      "SELECT COUNT(*) FROM role_audit_log WHERE admin_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'",
      [adminId]
    );
    if (parseInt(bulkResult.rows[0].count, 10) > 5) {
      anomalies.push('rapid_bulk_changes');
    }

    const flipResult = await pool.query(
      "SELECT COUNT(*) FROM role_audit_log WHERE target_user_id = $1 AND created_at > NOW() - INTERVAL '10 minutes'",
      [targetUserId]
    );
    if (parseInt(flipResult.rows[0].count, 10) > 2) {
      anomalies.push('role_flipping');
    }

    if (anomalies.length > 0) {
      console.warn('Role change anomaly detected', {
        rules: anomalies,
        adminId,
        targetUserId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Anomaly detection failed', error.message);
  }

  return anomalies;
}

module.exports = { checkRoleChangeAnomalies };
