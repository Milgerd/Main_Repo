const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { createProject, listProjects, getProjectDashboard } = require('../controllers/projectController');

router.post('/', authenticate, createProject);
router.get('/', authenticate, listProjects);
router.get('/:id/dashboard', authenticate, getProjectDashboard);

module.exports = router;
