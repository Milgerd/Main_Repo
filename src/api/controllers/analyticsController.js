const { getAnalyticsSummary } = require('../services/analyticsService');

async function getAnalytics(req, res) {
  const { data, source } = await getAnalyticsSummary();
  res.json({ source, ...data });
}

module.exports = { getAnalytics };
