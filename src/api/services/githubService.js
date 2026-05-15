const pool = require('../../../db/index.js');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

async function connectRepo(workspaceId, githubUrl) {
  const result = await pool.query(
    'UPDATE workspaces SET github_url = $1 WHERE id = $2 RETURNING id, startup_name, github_url',
    [githubUrl, workspaceId]
  );
  if (result.rowCount === 0) {
    throw new Error('Workspace not found');
  }
  return result.rows[0];
}

async function analyzeRepo(githubUrl) {
  // Parse owner/repo from URL
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/);
  if (!match) {
    throw new Error('Invalid GitHub URL format');
  }
  const owner = match[1];
  const repo = match[2];

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'LaunchForge-AI'
  };

  // Fetch repo metadata
  const repoRes = await fetch(baseUrl, { headers });
  if (!repoRes.ok) {
    throw new Error(`GitHub API error: ${repoRes.status} ${repoRes.statusText}`);
  }
  const repoData = await repoRes.json();

  // Check README existence
  let hasReadme = false;
  try {
    const readmeRes = await fetch(`${baseUrl}/readme`, { headers });
    hasReadme = readmeRes.ok;
  } catch {
    hasReadme = false;
  }

  const metadata = {
    name: repoData.name,
    description: repoData.description || 'No description provided',
    language: repoData.language || 'Not specified',
    stars: repoData.stargazers_count,
    openIssues: repoData.open_issues_count,
    lastPush: repoData.pushed_at,
    license: repoData.license ? repoData.license.name : null,
    hasReadme,
    isPrivate: repoData.private,
    defaultBranch: repoData.default_branch
  };

  // Build AI prompt
  const prompt = `You are a deployment readiness advisor for startup software projects. Analyze the following GitHub repository metadata and generate a structured deployment readiness report.

Repository: ${metadata.name}
Description: ${metadata.description}
Primary Language: ${metadata.language}
Stars: ${metadata.stars}
Open Issues: ${metadata.openIssues}
Last Push: ${metadata.lastPush}
License: ${metadata.license || 'None'}
README Present: ${metadata.hasReadme ? 'Yes' : 'No'}
Default Branch: ${metadata.defaultBranch}

Write a deployment readiness report with three clearly labeled sections:
1. What looks good — strengths and positive signals from this repo
2. What is missing or needs attention — gaps that should be addressed before launch
3. Recommended next steps — specific, actionable items in priority order

Keep the tone professional and constructive. Be specific — reference the actual data points above.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const report = response.content[0].text;
  return { metadata, report };
}

module.exports = { connectRepo, analyzeRepo };
