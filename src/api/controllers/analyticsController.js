const { getTaskStats, getProjectStats, getActivityTrend, getUserEngagement } = require('../services/analyticsService');

async function getAnalytics(req, res) {
  const [taskStats, projectStats, activityTrend, userEngagement] = await Promise.all([
    getTaskStats(),
    getProjectStats(),
    getActivityTrend(),
    getUserEngagement(),
  ]);

  res.json({ taskStats, projectStats, activityTrend, userEngagement });
}

module.exports = { getAnalytics };
