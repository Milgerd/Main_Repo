const express = require('express');
const router = express.Router();
const { generateContent } = require('../controllers/aiController');
const { authenticate } = require('../../../middleware/auth');

router.post('/generate', authenticate, generateContent);

module.exports = router;
