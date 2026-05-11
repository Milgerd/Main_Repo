const pool = require('../../../db');

async function getTaskStats() {
  const result = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM tasks
    GROUP BY status
    ORDER BY status
  `);
  return result.rows;
}

async function getProjectStats() {
  const result = await pool.query(`
    SELECT status, COUNT(*) as count
    FROM projects
    GROUP BY status
    ORDER BY status
  `);
  return result.rows;
}

async function getActivityTrend() {
  const result = await pool.query(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM project_activity
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  return result.rows;
}

async function getUserEngagement() {
  const result = await pool.query(`
    SELECT u.email, COUNT(pa.id) as activity_count
    FROM users u
    LEFT JOIN project_activity pa ON pa.user_id = u.id
    GROUP BY u.id, u.email
    ORDER BY activity_count DESC
    LIMIT 10
  `);
  return result.rows;
}

module.exports = { getTaskStats, getProjectStats, getActivityTrend, getUserEngagement };
