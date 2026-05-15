const pool = require('../../../db/index.js');

async function createNotification(userId, type, message) {
  const result = await pool.query(
    'INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3) RETURNING *',
    [userId, type, message]
  );
  return result.rows[0];
}

async function getNotifications(userId) {
  const result = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return result.rows;
}

async function getUnreadCount(userId) {
  const result = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

async function markAsRead(notificationId, userId) {
  const result = await pool.query(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );
  if (result.rowCount === 0) {
    throw new Error('Notification not found');
  }
  return result.rows[0];
}

async function markAllAsRead(userId) {
  await pool.query(
    'UPDATE notifications SET read = true WHERE user_id = $1',
    [userId]
  );
}

module.exports = { createNotification, getNotifications, getUnreadCount, markAsRead, markAllAsRead };
