const pool = require('../../../db');

const getRoleAuditLog = async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const result = await pool.query(
    'SELECT admin_id, target_user_id, old_role, new_role, created_at FROM role_audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  res.json(result.rows);
};

module.exports = { getRoleAuditLog };
