const express = require('express');

const app = express();
app.use(express.json());

const routes = require('./routes');
const apiRoutes = require('./src/api/routes');
app.use('/api', routes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

module.exports = app;
