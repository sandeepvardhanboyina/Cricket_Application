const express = require('express');
const {
  getDashboardStats,
  getAnalytics,
  getPendingTeams,
  getUnverifiedPlayers,
  getAllUsers,
  updateUserRole,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/pending-teams', getPendingTeams);
router.get('/unverified-players', getUnverifiedPlayers);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
