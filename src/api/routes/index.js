const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const adminRoutes = require('./adminRoutes');
const projectRoutes = require('./projectRoutes');
const taskRoutes = require('./taskRoutes');
const aiRoutes = require('./aiRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const campaignRoutes = require('./campaignRoutes');

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many requests, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
});

router.use('/admin', adminLimiter, adminRoutes);
router.use('/projects', apiLimiter, projectRoutes);
router.use('/', apiLimiter, taskRoutes);
router.use('/ai', apiLimiter, aiRoutes);
router.use('/analytics', apiLimiter, analyticsRoutes);
router.use('/campaigns', apiLimiter, campaignRoutes);

module.exports = router;
