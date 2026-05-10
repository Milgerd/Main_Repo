const express = require('express');
const router = express.Router();
const { register, login, changePasswordHandler } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', authenticate, changePasswordHandler);
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
