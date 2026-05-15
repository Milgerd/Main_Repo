const { connectRepo, analyzeRepo } = require('../services/githubService.js');

async function connectRepoHandler(req, res) {
  try {
    const { workspaceId, githubUrl } = req.body;
    if (!workspaceId || !githubUrl) {
      return res.status(400).json({ error: 'workspaceId and githubUrl are required' });
    }
    const workspace = await connectRepo(workspaceId, githubUrl);
    res.json({ message: 'Repository connected successfully', workspace });
  } catch (err) {
    console.error('connectRepo error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function analyzeRepoHandler(req, res) {
  try {
    const { githubUrl } = req.body;
    if (!githubUrl) {
      return res.status(400).json({ error: 'githubUrl is required' });
    }
    const result = await analyzeRepo(githubUrl);
    res.json(result);
  } catch (err) {
    console.error('analyzeRepo error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { connectRepoHandler, analyzeRepoHandler };
