const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth.js');
const {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler
} = require('../controllers/notificationController.js');

router.get('/', authenticate, getNotificationsHandler);
router.get('/unread', authenticate, getUnreadCountHandler);
router.put('/:id/read', authenticate, markAsReadHandler);
router.put('/read-all', authenticate, markAllAsReadHandler);

module.exports = router;
