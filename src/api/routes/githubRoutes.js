const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth.js');
const { connectRepoHandler, analyzeRepoHandler } = require('../controllers/githubController.js');

router.post('/connect', authenticate, connectRepoHandler);
router.post('/analyze', authenticate, analyzeRepoHandler);

module.exports = router;
