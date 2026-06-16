const Team = require('../models/Team');
const Player = require('../models/Player');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalTeams,
      totalPlayers,
      totalMatches,
      totalTournaments,
      pendingTeams,
      unreadMessages,
      availablePlayers,
      injuredPlayers,
      suspendedPlayers,
      unavailablePlayers,
    ] = await Promise.all([
      Team.countDocuments({ status: 'approved' }),
      Player.countDocuments(),
      Match.countDocuments(),
      Tournament.countDocuments(),
      Team.countDocuments({ status: 'pending' }),
      ContactMessage.countDocuments({ isRead: false }),
      Player.countDocuments({
        $or: [{ availabilityStatus: 'AVAILABLE' }, { availabilityStatus: { $exists: false } }],
      }),
      Player.countDocuments({ availabilityStatus: 'INJURED' }),
      Player.countDocuments({ availabilityStatus: 'SUSPENDED' }),
      Player.countDocuments({ availabilityStatus: 'UNAVAILABLE' }),
    ]);

    res.json({
      success: true,
      data: {
        totalTeams,
        totalPlayers,
        totalMatches,
        totalTournaments,
        pendingTeams,
        unreadMessages,
        availablePlayers,
        injuredPlayers,
        suspendedPlayers,
        unavailablePlayers,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const tournamentRegistrations = await Tournament.aggregate([
      {
        $project: {
          title: 1,
          registrations: { $size: '$teams' },
        },
      },
    ]);

    const runsStats = await Player.aggregate([
      {
        $group: {
          _id: null,
          totalRuns: { $sum: '$statistics.batting.runs' },
          avgRuns: { $avg: '$statistics.batting.runs' },
          maxRuns: { $max: '$statistics.batting.runs' },
        },
      },
    ]);

    const wicketsStats = await Player.aggregate([
      {
        $group: {
          _id: null,
          totalWickets: { $sum: '$statistics.bowling.wickets' },
          avgWickets: { $avg: '$statistics.bowling.wickets' },
          maxWickets: { $max: '$statistics.bowling.wickets' },
        },
      },
    ]);

    const monthlyMatches = await Match.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        tournamentRegistrations,
        runsStats: runsStats[0] || { totalRuns: 0, avgRuns: 0, maxRuns: 0 },
        wicketsStats: wicketsStats[0] || { totalWickets: 0, avgWickets: 0, maxWickets: 0 },
        monthlyMatches,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ status: 'pending' })
      .populate('players', 'name role jerseyNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

exports.getUnverifiedPlayers = async (req, res, next) => {
  try {
    const players = await Player.find({ isVerified: false })
      .populate('team', 'teamName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: players });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').populate('team', 'teamName');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
      '-password'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
