const checkDatabaseHealth = require('../db/health');
const { redisClient } = require('../db/redis');

async function getHealthStatus() {
  const db = await checkDatabaseHealth().then(() => true).catch(() => false);
  const redis = await redisClient.ping().then(() => true).catch(() => false);
  const healthy = db && redis;
  return {
    status: healthy ? 'ok' : 'degraded',
    components: {
      database: db ? 'ok' : 'down',
      redis: redis ? 'ok' : 'down',
    },
  };
}

module.exports = { getHealthStatus };
