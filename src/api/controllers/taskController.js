const pool = require('../../../db');

const ALLOWED_STATUSES = ['open', 'in_progress', 'done'];

async function verifyProjectOwnership(projectId, userId) {
  const result = await pool.query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows.length > 0;
}

const createTask = async (req, res) => {
  const projectId = req.params.id;
  const { title, description, status, due_date } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const ownsProject = await verifyProjectOwnership(projectId, req.user.id);
  if (!ownsProject) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const result = await pool.query(
    'INSERT INTO tasks (project_id, user_id, title, description, status, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, project_id, user_id, title, description, status, due_date, created_at, updated_at',
    [projectId, req.user.id, title.trim(), description || null, status || 'open', due_date || null]
  );

  await pool.query(
    'INSERT INTO project_activity (user_id, project_id, event_type) VALUES ($1, $2, $3)',
    [req.user.id, projectId, 'task_created']
  );

  res.status(201).json(result.rows[0]);
};

const listTasks = async (req, res) => {
  const projectId = req.params.id;
  const { status } = req.query;

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const ownsProject = await verifyProjectOwnership(projectId, req.user.id);
  if (!ownsProject) {
    return res.status(404).json({ error: 'Project not found' });
  }

  let query = 'SELECT t.id, t.title, t.description, t.status, t.due_date, t.created_at, t.updated_at, u.email AS assigned_email FROM tasks t JOIN users u ON t.user_id = u.id WHERE t.project_id = $1';
  const params = [projectId];

  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);

  res.json(result.rows);
};

const updateTask = async (req, res) => {
  const taskId = req.params.id;
  const { title, description, status, due_date } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({ error: 'Task title cannot be empty' });
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const taskResult = await pool.query(
    'SELECT t.id, t.project_id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = $1 AND p.user_id = $2',
    [taskId, req.user.id]
  );

  if (taskResult.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const task = taskResult.rows[0];

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(title.trim());
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (due_date !== undefined) {
    fields.push(`due_date = $${paramIndex++}`);
    values.push(due_date);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  fields.push(`updated_at = NOW()`);

  const result = await pool.query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, project_id, user_id, title, description, status, due_date, created_at, updated_at`,
    [...values, taskId]
  );

  await pool.query(
    'INSERT INTO project_activity (user_id, project_id, event_type) VALUES ($1, $2, $3)',
    [req.user.id, task.project_id, 'task_updated']
  );

  res.json(result.rows[0]);
};

const deleteTask = async (req, res) => {
  const taskId = req.params.id;

  const taskResult = await pool.query(
    'SELECT t.id, t.project_id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = $1 AND p.user_id = $2',
    [taskId, req.user.id]
  );

  if (taskResult.rows.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const task = taskResult.rows[0];

  await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

  await pool.query(
    'INSERT INTO project_activity (user_id, project_id, event_type) VALUES ($1, $2, $3)',
    [req.user.id, task.project_id, 'task_deleted']
  );

  res.json({ message: 'Task deleted' });
};

module.exports = { createTask, listTasks, updateTask, deleteTask };
