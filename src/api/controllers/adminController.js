const pool = require('../../../db');

const updateUserRole = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const { role } = req.body;
  const allowedRoles = ['admin', 'user'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updatedUser = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
    [role, userId]
  );

  return res.status(200).json(updatedUser.rows[0]);
};

module.exports = {
  updateUserRole,
};
