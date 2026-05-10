const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, changePasswordHandler } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts, please try again later' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/change-password', authenticate, changePasswordHandler);
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
