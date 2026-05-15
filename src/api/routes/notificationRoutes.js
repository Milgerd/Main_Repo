const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../../middleware/auth.js');
const {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler
} = require('../controllers/notificationController.js');

router.get('/', authenticate, requireRole(['admin', 'user', 'viewer']), getNotificationsHandler);
router.get('/unread', authenticate, requireRole(['admin', 'user', 'viewer']), getUnreadCountHandler);
router.put('/:id/read', authenticate, requireRole(['admin', 'user']), markAsReadHandler);
router.put('/read-all', authenticate, requireRole(['admin', 'user']), markAllAsReadHandler);

module.exports = router;
