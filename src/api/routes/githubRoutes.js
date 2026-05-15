const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../../middleware/auth.js');
const { connectRepoHandler, analyzeRepoHandler } = require('../controllers/githubController.js');

router.post('/connect', authenticate, requireRole(['admin', 'user']), connectRepoHandler);
router.post('/analyze', authenticate, requireRole(['admin', 'user']), analyzeRepoHandler);

module.exports = router;
