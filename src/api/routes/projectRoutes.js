const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { createProject, listProjects, getProject, getProjectDashboard, updateProjectStatus, updateProject, deleteProject } = require('../controllers/projectController');

router.post('/', authenticate, createProject);
router.get('/', authenticate, listProjects);
router.get('/:id', authenticate, getProject);
router.get('/:id/dashboard', authenticate, getProjectDashboard);
router.patch('/:id/status', authenticate, updateProjectStatus);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

module.exports = router;
