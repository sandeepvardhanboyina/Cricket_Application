const express = require('express');
const {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  approveTeamRegistration,
  getUpcomingTournaments,
} = require('../controllers/tournamentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getTournaments);
router.get('/upcoming', getUpcomingTournaments);
router.get('/:id', getTournament);
router.post('/', protect, authorize('admin'), upload.single('banner'), createTournament);
router.put('/:id', protect, authorize('admin'), upload.single('banner'), updateTournament);
router.delete('/:id', protect, authorize('admin'), deleteTournament);
router.put('/:id/approve-team', protect, authorize('admin'), approveTeamRegistration);

module.exports = router;
