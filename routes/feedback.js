const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, feedbackController.submitFeedback);
router.get('/:workspaceId', authenticate, feedbackController.getFeedback);
router.get('/:workspaceId/summary', authenticate, feedbackController.getFeedbackSummary);

module.exports = router;
