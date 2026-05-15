const express = require('express');
const router = express.Router();
const feedbackController = require('../../../controllers/feedbackController');
const { authenticate, requireRole } = require('../../../middleware/auth');

router.post('/', authenticate, requireRole(['admin', 'user']), feedbackController.submitFeedback);
router.get('/:workspaceId', authenticate, feedbackController.getFeedback);
router.get('/:workspaceId/summary', authenticate, feedbackController.getFeedbackSummary);

module.exports = router;
