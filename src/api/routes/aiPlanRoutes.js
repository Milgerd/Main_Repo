const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { generatePlan, savePlan, generatePlanDoc, generateCampaigns } = require('../controllers/aiPlanController');

router.post('/generate-plan', authenticate, generatePlan);
router.post('/save-plan', authenticate, savePlan);
router.post('/download-plan', authenticate, generatePlanDoc);
router.post('/generate-campaigns', authenticate, generateCampaigns);

module.exports = router;
