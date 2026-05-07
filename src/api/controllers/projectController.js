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

  res.status(201).json(result.rows[0]);
};

const listProjects = async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, description, status, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );

  res.json(result.rows);
};

module.exports = { createProject, listProjects };
