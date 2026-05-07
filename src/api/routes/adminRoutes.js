const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../../middleware/auth');
const pool = require('../../../db');
const { updateUserRole } = require('../controllers/adminController');
const { getRoleAuditLog, getMostActiveAdmins } = require('../controllers/auditController');

router.get('/test', authenticate, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});

router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, role FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put(
  '/users/:id/role',
  authenticate,
  requireRole('admin'),
  updateUserRole
);

router.get('/audit/roles', authenticate, requireRole('admin'), getRoleAuditLog);

router.get('/analytics/most-active-admins', authenticate, requireRole('admin'), getMostActiveAdmins);

module.exports = router;
