const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { createTask, listTasks, updateTask, deleteTask } = require('../controllers/taskController');

router.post('/projects/:id/tasks', authenticate, createTask);
router.get('/projects/:id/tasks', authenticate, listTasks);
router.patch('/tasks/:id', authenticate, updateTask);
router.delete('/tasks/:id', authenticate, deleteTask);

module.exports = router;
