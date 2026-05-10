const { getHealthStatus } = require('../services/healthService');

async function getHealth(req, res) {
  const health = await getHealthStatus();
  const status = health.status === 'ok' ? 200 : 503;
  return res.status(status).json(health);
}

module.exports = { getHealth };
