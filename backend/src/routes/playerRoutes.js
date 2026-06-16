const express = require('express');
const {
  getPlayers,
  getPlayer,
  registerPlayer,
  getUnassignedPlayers,
  assignToTeam,
  removeFromTeam,
  addPlayer,
  updatePlayer,
  verifyPlayer,
  deletePlayer,
  getTopBatsmen,
  getTopBowlers,
  getPlayerRankings,
} = require('../controllers/playerController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getPlayers);
router.get('/top/batsmen', getTopBatsmen);
router.get('/top/bowlers', getTopBowlers);
router.get('/rankings', getPlayerRankings);
router.get('/unassigned', getUnassignedPlayers);
router.post('/register', upload.single('profileImage'), registerPlayer);
router.get('/:id', getPlayer);
router.post('/', protect, authorize('admin', 'team_manager'), upload.single('profileImage'), addPlayer);
router.put('/:id', protect, authorize('admin', 'team_manager'), upload.single('profileImage'), updatePlayer);
router.put('/:id/assign-team', protect, authorize('admin', 'team_manager'), assignToTeam);
router.put('/:id/remove-team', protect, authorize('admin', 'team_manager'), removeFromTeam);
router.delete('/:id', protect, authorize('admin', 'team_manager'), deletePlayer);
router.put('/:id/verify', protect, authorize('admin'), verifyPlayer);

module.exports = router;
