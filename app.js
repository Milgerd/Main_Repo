const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const routes = require('./routes');
const apiRoutes = require('./src/api/routes');
app.use('/api', routes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

module.exports = app;
