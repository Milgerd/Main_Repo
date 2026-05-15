const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { generatePlan, savePlan, generatePlanDoc } = require('../controllers/aiPlanController');

router.post('/generate-plan', authenticate, generatePlan);
router.post('/save-plan', authenticate, savePlan);
router.post('/download-plan', authenticate, generatePlanDoc);

module.exports = router;
