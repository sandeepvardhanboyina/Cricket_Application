const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Player = require('../models/Player');
const { uploadToCloudinary } = require('../utils/uploadImage');

exports.getTournaments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const tournaments = await Tournament.find(query)
      .populate('teams.team', 'teamName logo city')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Tournament.countDocuments(query);

    res.json({
      success: true,
      data: tournaments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('teams.team', 'teamName logo city captain statistics')
      .populate('pointsTable.team', 'teamName logo')
      .populate('createdBy', 'name');

    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    const matches = await Match.find({ tournament: tournament._id })
      .populate('teamA teamB', 'teamName logo')
      .populate('result.winner', 'teamName')
      .sort({ date: 1 });

    const topScorers = await Player.find()
      .sort({ 'statistics.batting.runs': -1 })
      .limit(5)
      .populate('team', 'teamName logo')
      .select('name statistics profileImage team');

    const topWicketTakers = await Player.find({ 'statistics.bowling.wickets': { $gt: 0 } })
      .sort({ 'statistics.bowling.wickets': -1 })
      .limit(5)
      .populate('team', 'teamName logo')
      .select('name statistics profileImage team');

    res.json({
      success: true,
      data: {
        tournament,
        matches,
        topScorers,
        topWicketTakers,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createTournament = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };

    if (req.file) {
      data.banner = await uploadToCloudinary(req.file.buffer, 'tournament-banners');
    }

    const tournament = await Tournament.create(data);
    res.status(201).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

exports.updateTournament = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.banner = await uploadToCloudinary(req.file.buffer, 'tournament-banners');
    }

    const tournament = await Tournament.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    res.json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

exports.deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    res.json({ success: true, message: 'Tournament deleted' });
  } catch (error) {
    next(error);
  }
};

exports.approveTeamRegistration = async (req, res, next) => {
  try {
    const { teamId } = req.body;
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    const entry = tournament.teams.find((t) => t.team.toString() === teamId);
    if (!entry) return res.status(404).json({ success: false, message: 'Team registration not found' });

    entry.registrationStatus = 'approved';

    const existing = tournament.pointsTable.find((p) => p.team.toString() === teamId);
    if (!existing) {
      tournament.pointsTable.push({ team: teamId });
    }

    await tournament.save();
    res.json({ success: true, data: tournament, message: 'Team registration approved' });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find({ status: { $in: ['upcoming', 'ongoing'] } })
      .sort({ startDate: 1 })
      .limit(5)
      .select('title banner startDate endDate registrationFee prizePool status');

    res.json({ success: true, data: tournaments });
  } catch (error) {
    next(error);
  }
};
