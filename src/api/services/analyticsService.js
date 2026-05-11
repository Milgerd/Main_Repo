const pool = require('../../../db');
const { redisClient } = require('../../../db/redis');

const CACHE_KEY = 'analytics:summary';
const CACHE_TTL = 60;

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

async function getAnalyticsSummary() {
  try {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) {
      return { data: JSON.parse(cached), source: 'cache' };
    }
  } catch (err) {
    console.warn('Redis read failed, falling back to DB:', err.message);
  }

  const [taskStats, projectStats, activityTrend, userEngagement] = await Promise.all([
    getTaskStats(),
    getProjectStats(),
    getActivityTrend(),
    getUserEngagement(),
  ]);

  const data = { taskStats, projectStats, activityTrend, userEngagement };

  try {
    await redisClient.set(CACHE_KEY, JSON.stringify(data), { EX: CACHE_TTL });
  } catch (err) {
    console.warn('Redis write failed:', err.message);
  }

  return { data, source: 'database' };
}

module.exports = { getAnalyticsSummary };
