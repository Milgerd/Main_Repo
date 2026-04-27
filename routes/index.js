const express = require('express');
const router = express.Router();

const healthRoute = require('./health');

router.use('/', healthRoute);

module.exports = router;
