const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../../../db/index');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateLaunchPlan({ projectName, description, goal, projectId, userId }) {
  const prompt = `You are a startup launch strategist. Generate a concise launch plan for the following project:

Project Name: ${projectName}
Description: ${description}
Goal: ${goal}

Provide a structured launch plan with these sections:
1. Target Audience
2. Key Messages
3. Launch Channels
4. 30-Day Action Plan
5. Success Metrics

Be specific and actionable.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0].text;

  await pool.query(
    `INSERT INTO project_activity (user_id, project_id, event_type) VALUES ($1, $2, $3)`,
    [userId, projectId, 'ai_generation']
  );

  return content;
}

module.exports = { generateLaunchPlan };
