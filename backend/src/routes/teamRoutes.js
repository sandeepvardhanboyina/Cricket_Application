const express = require('express');
const {
  getTeams,
  getTeam,
  registerTeam,
  approveTeam,
  rejectTeam,
  updateTeam,
  getTeamRankings,
} = require('../controllers/teamController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getTeams);
router.get('/rankings', getTeamRankings);
router.get('/:id', getTeam);
router.post(
  '/register',
  optionalAuth,
  upload.fields([{ name: 'logo', maxCount: 1 }, ...Array.from({ length: 11 }, (_, i) => ({ name: `playerImage_${i}`, maxCount: 1 }))]),
  registerTeam
);
router.put('/:id', protect, upload.single('logo'), updateTeam);
router.put('/:id/approve', protect, authorize('admin'), approveTeam);
router.put('/:id/reject', protect, authorize('admin'), rejectTeam);

module.exports = router;
