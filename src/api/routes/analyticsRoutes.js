const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { authenticate, requireRole } = require('../../../middleware/auth');

router.get('/', authenticate, requireRole(['admin', 'user', 'viewer']), getAnalytics);

module.exports = router;
