const { generateLaunchPlan } = require('../services/aiService');

async function generateContent(req, res) {
  const { projectName, description, goal, projectId } = req.body;
  const userId = req.user.id;

  if (!projectName || !description || !goal || !projectId) {
    return res.status(400).json({ error: 'projectName, description, goal, and projectId are required' });
  }

  const content = await generateLaunchPlan({ projectName, description, goal, projectId, userId });
  res.json({ content });
}

module.exports = { generateContent };
