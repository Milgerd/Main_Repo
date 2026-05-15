const pool = require('../../../db');
const { checkRoleChangeAnomalies } = require('../services/anomalyService');

const updateUserRole = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const { role } = req.body;
  const allowedRoles = ['admin', 'user', 'viewer'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  if (String(req.user.id) === String(userId)) {
    return res.status(403).json({ message: 'Cannot modify your own role' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = result.rows[0].role;

    if (oldRole === 'admin' && role !== 'admin') {
      const admins = await client.query("SELECT id FROM users WHERE role = 'admin' FOR UPDATE");
      if (admins.rows.length === 1) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: 'Cannot remove the last admin' });
      }
    }

    const updatedUser = await client.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [role, userId]
    );

    await client.query(
      'INSERT INTO role_audit_log (admin_id, target_user_id, old_role, new_role) VALUES ($1, $2, $3, $4)',
      [req.user.id, userId, oldRole, role]
    );

    await client.query('COMMIT');

    const anomalies = await checkRoleChangeAnomalies(req.user.id, userId);

    return res.status(200).json({ ...updatedUser.rows[0], anomalies });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  updateUserRole,
};
