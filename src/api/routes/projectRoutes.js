const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { createProject, listProjects } = require('../controllers/projectController');

router.post('/', authenticate, createProject);
router.get('/', authenticate, listProjects);

module.exports = router;
