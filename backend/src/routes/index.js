const express = require('express');
const authRoutes = require('./authRoutes');
const teamRoutes = require('./teamRoutes');
const playerRoutes = require('./playerRoutes');
const tournamentRoutes = require('./tournamentRoutes');
const matchRoutes = require('./matchRoutes');
const adminRoutes = require('./adminRoutes');
const contactRoutes = require('./contactRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/matches', matchRoutes);
router.use('/admin', adminRoutes);
router.use('/contact', contactRoutes);
router.use('/notifications', notificationRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Cricket Tournament Hub API is running' });
});

module.exports = router;
