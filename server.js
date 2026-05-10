require('dotenv').config();

const app = require('./app');
const checkDatabaseHealth = require('./db/health');
const { connectRedis } = require('./db/redis');

async function startApp() {
  console.log("Starting application...");

  try {
    const isHealthy = await checkDatabaseHealth();

    if (!isHealthy) {
      console.error("Database is not healthy. Exiting...");
      process.exit(1);
    }

    console.log("Database healthy:", isHealthy);

    await connectRedis();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Database check failed:", error.message);
    process.exit(1);
  }
}

startApp();