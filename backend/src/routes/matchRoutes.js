const express = require('express');
const {
  getMatches,
  getMatch,
  createMatch,
  updateMatch,
  submitScorecard,
  updateLiveScore,
  getLatestMatches,
  deleteMatch,
} = require('../controllers/matchController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getMatches);
router.get('/latest', getLatestMatches);
router.get('/:id', getMatch);
router.post('/', protect, authorize('admin'), createMatch);
router.put('/:id', protect, authorize('admin'), updateMatch);
router.put('/:id/scorecard', protect, authorize('admin'), submitScorecard);
router.put('/:id/live', protect, authorize('admin'), updateLiveScore);
router.delete('/:id', protect, authorize('admin'), deleteMatch);

module.exports = router;
