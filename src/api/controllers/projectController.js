const pool = require('../../../db');

const createProject = async (req, res) => {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const result = await pool.query(
    'INSERT INTO projects (user_id, name, description) VALUES ($1, $2, $3) RETURNING id, user_id, name, description, status, created_at, updated_at',
    [req.user.id, name.trim(), description || null]
  );

  const project = result.rows[0];

  await pool.query(
    'INSERT INTO project_activity (user_id, project_id, event_type) VALUES ($1, $2, $3)',
    [req.user.id, project.id, 'project_created']
  );

  res.status(201).json(project);
};

const listProjects = async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, description, status, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );

  res.json(result.rows);
};

const getProjectDashboard = async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, status, created_at, updated_at FROM projects WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const project = result.rows[0];
  const daysSinceCreated = Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24));

  const activityResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM project_activity WHERE project_id = $1',
    [project.id]
  );

  const recentResult = await pool.query(
    'SELECT event_type, created_at FROM project_activity WHERE project_id = $1 ORDER BY created_at DESC LIMIT 50',
    [project.id]
  );

  res.json({
    projectId: project.id,
    projectName: project.name,
    status: project.status,
    daysSinceCreated,
    lastUpdated: project.updated_at,
    activitySummary: {
      totalEvents: activityResult.rows[0].total,
    },
    recentActivity: recentResult.rows,
  });
};

const ALLOWED_STATUSES = ['planning', 'active', 'completed'];

const updateProjectStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
  }

  const result = await pool.query(
    'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id, name, status, updated_at',
    [status, req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  await pool.query(
    'INSERT INTO project_activity (user_id, project_id, event_type) VALUES ($1, $2, $3)',
    [req.user.id, result.rows[0].id, 'status_changed']
  );

  res.json(result.rows[0]);
};

const updateProject = async (req, res) => {
  const { name, description } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'Project name cannot be empty' });
  }

  if (name === undefined && description === undefined) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }

  fields.push('updated_at = NOW()');

  const result = await pool.query(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING id, name, description, status, created_at, updated_at`,
    [...values, req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  await pool.query(
    'INSERT INTO project_activity (user_id, project_id, event_type) VALUES ($1, $2, $3)',
    [req.user.id, result.rows[0].id, 'project_updated']
  );

  res.json(result.rows[0]);
};

const deleteProject = async (req, res) => {
  const result = await pool.query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const projectId = result.rows[0].id;

  await pool.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);
  await pool.query('DELETE FROM project_activity WHERE project_id = $1', [projectId]);
  await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

  res.json({ message: 'Project deleted' });
};

module.exports = { createProject, listProjects, getProjectDashboard, updateProjectStatus, updateProject, deleteProject };
