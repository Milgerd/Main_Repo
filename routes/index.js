const express = require('express');
const router = express.Router();

const healthRoute = require('./health');
const authRoute = require('./auth');

router.use('/', healthRoute);
router.use('/', authRoute);

module.exports = router;
