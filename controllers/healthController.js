const { getHealthStatus } = require('../services/healthService');

function getHealth(req, res) {
  return res.json(getHealthStatus());
}

module.exports = { getHealth };
