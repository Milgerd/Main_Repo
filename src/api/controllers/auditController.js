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

const getMostActiveAdmins = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.admin_id, u.email, COUNT(*)::int AS total_changes FROM role_audit_log r JOIN users u ON u.id = r.admin_id GROUP BY r.admin_id, u.email ORDER BY total_changes DESC LIMIT 5'
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch most active admins' });
  }
};

module.exports = { getRoleAuditLog, getMostActiveAdmins };
