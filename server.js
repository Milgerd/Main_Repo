require('dotenv').config();

const express = require('express');
const checkDatabaseHealth = require('./db/health');

async function startApp() {
  console.log("Starting application...");

  try {
    const isHealthy = await checkDatabaseHealth();

    if (!isHealthy) {
      console.error("Database is not healthy. Exiting...");
      process.exit(1);
    }

    console.log("Database healthy:", isHealthy);

    const app = express();
    app.use(express.json());
    const routes = require('./routes');
    const apiRoutes = require('./src/api/routes');
    app.use('/api', routes);
    app.use('/api', apiRoutes);

    app.get('/', (req, res) => {
      res.send('Server is running');
    });

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