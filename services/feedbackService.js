const pool = require('../db');
const { createNotification } = require('../src/api/services/notificationService.js');

async function submit({ workspace_id, submitted_by, feedback_text, rating }) {
  const { rows } = await pool.query(
    `INSERT INTO feedback (workspace_id, submitted_by, feedback_text, rating)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [workspace_id, submitted_by, feedback_text, rating]
  );
  await createNotification(submitted_by, 'feedback', 'New feedback received on your workspace');
  return rows[0];
}

async function getByWorkspace(workspaceId) {
  const { rows } = await pool.query(
    `SELECT f.*, u.email AS submitted_by_email
     FROM feedback f
     JOIN users u ON u.id = f.submitted_by
     WHERE f.workspace_id = $1
     ORDER BY f.created_at DESC`,
    [workspaceId]
  );
  return rows;
}

async function getSummary(workspaceId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count, ROUND(AVG(rating), 1) AS average_rating
     FROM feedback
     WHERE workspace_id = $1`,
    [workspaceId]
  );
  return {
    count: rows[0].count,
    average_rating: rows[0].average_rating ? parseFloat(rows[0].average_rating) : null,
  };
}

module.exports = { submit, getByWorkspace, getSummary };
