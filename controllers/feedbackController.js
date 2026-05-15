const feedbackService = require('../services/feedbackService');

async function submitFeedback(req, res) {
  const { workspace_id, feedback_text, rating } = req.body;
  const submitted_by = req.user.id;

  if (!workspace_id || !rating) {
    return res.status(400).json({ error: 'workspace_id and rating are required' });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }

  try {
    const feedback = await feedbackService.submit({ workspace_id, submitted_by, feedback_text, rating });
    return res.status(201).json(feedback);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
}

async function getFeedback(req, res) {
  const { workspaceId } = req.params;

  try {
    const feedback = await feedbackService.getByWorkspace(workspaceId);
    return res.status(200).json(feedback);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch feedback' });
  }
}

async function getFeedbackSummary(req, res) {
  const { workspaceId } = req.params;

  try {
    const summary = await feedbackService.getSummary(workspaceId);
    return res.status(200).json(summary);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch feedback summary' });
  }
}

module.exports = { submitFeedback, getFeedback, getFeedbackSummary };
