const express = require('express');
const cors = require('cors');

const corsOrigin = process.env.CORS_ORIGIN || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('CORS_ORIGIN must be set in production'); })()
    : 'http://localhost:5173'
);

const app = express();
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const routes = require('./routes');
const apiRoutes = require('./src/api/routes');
app.use('/api', routes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

module.exports = app;
