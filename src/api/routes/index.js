const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const adminRoutes = require('./adminRoutes');

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many requests, please try again later' },
});

router.use('/admin', adminLimiter, adminRoutes);

module.exports = router;
