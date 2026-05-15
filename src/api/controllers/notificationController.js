const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../services/notificationService.js');

async function getNotificationsHandler(req, res) {
  try {
    const notifications = await getNotifications(req.user.id);
    res.json(notifications);
  } catch (err) {
    console.error('getNotifications error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function getUnreadCountHandler(req, res) {
  try {
    const count = await getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function markAsReadHandler(req, res) {
  try {
    const notification = await markAsRead(req.params.id, req.user.id);
    res.json(notification);
  } catch (err) {
    console.error('markAsRead error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function markAllAsReadHandler(req, res) {
  try {
    await markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllAsRead error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler
};
