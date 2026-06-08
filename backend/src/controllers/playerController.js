const Player = require('../models/Player');
const Team = require('../models/Team');
const { uploadToCloudinary } = require('../utils/uploadImage');

exports.getPlayers = async (req, res, next) => {
  try {
    const { search, role, team, unassigned, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) query.name = { $regex: search, $options: 'i' };
    if (role) query.role = role;
    if (team) query.team = team;
    if (unassigned === 'true') query.team = null;

    const players = await Player.find(query)
      .populate('team', 'teamName logo')
      .sort({ 'statistics.batting.runs': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Player.countDocuments(query);

    res.json({
      success: true,
      data: players,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('team', 'teamName logo city')
      .populate({ path: 'careerHistory.match', select: 'date ground teamA teamB result' });

    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

    res.json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

exports.registerPlayer = async (req, res, next) => {
  try {
    const { name, dateOfBirth, role, battingStyle, bowlingStyle, jerseyNumber } = req.body;

    let profileImage = '';
    if (req.file) {
      profileImage = await uploadToCloudinary(req.file.buffer, 'player-profiles');
    }

    const player = await Player.create({
      name,
      dateOfBirth,
      role,
      battingStyle,
      bowlingStyle,
      jerseyNumber,
      profileImage,
      team: null,
      registrationType: 'individual',
      isVerified: false,
    });

    res.status(201).json({
      success: true,
      data: player,
      message: 'Player registered successfully. Awaiting verification and team assignment.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getUnassignedPlayers = async (req, res, next) => {
  try {
    const players = await Player.find({ team: null })
      .sort({ createdAt: -1 })
      .select('name role jerseyNumber profileImage battingStyle bowlingStyle dateOfBirth isVerified registrationType');

    res.json({ success: true, data: players });
  } catch (error) {
    next(error);
  }
};

exports.assignToTeam = async (req, res, next) => {
  try {
    const { teamId } = req.body;
    const player = await Player.findById(req.params.id);

    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
    if (!teamId) return res.status(400).json({ success: false, message: 'Team ID is required' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (req.user.role === 'team_manager' && team.manager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to assign players to this team' });
    }

    if (team.players.length >= 15) {
      return res.status(400).json({ success: false, message: 'Team already has maximum 15 players' });
    }

    const jerseyTaken = await Player.findOne({
      team: teamId,
      jerseyNumber: player.jerseyNumber,
      _id: { $ne: player._id },
    });
    if (jerseyTaken) {
      return res.status(400).json({
        success: false,
        message: `Jersey #${player.jerseyNumber} is already taken in this team`,
      });
    }

    // Remove from previous team if assigned elsewhere
    if (player.team) {
      await Team.findByIdAndUpdate(player.team, { $pull: { players: player._id } });
    }

    player.team = teamId;
    player.registrationType = 'team';
    await player.save();

    if (!team.players.includes(player._id)) {
      team.players.push(player._id);
      await team.save();
    }

    const populated = await Player.findById(player._id).populate('team', 'teamName logo city');

    res.json({
      success: true,
      data: populated,
      message: `Player assigned to ${team.teamName}`,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromTeam = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
    if (!player.team) {
      return res.status(400).json({ success: false, message: 'Player is not assigned to any team' });
    }

    if (req.user.role !== 'admin') {
      const team = await Team.findById(player.team);
      if (team?.manager?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    await Team.findByIdAndUpdate(player.team, { $pull: { players: player._id } });

    player.team = null;
    player.isCaptain = false;
    await player.save();

    res.json({ success: true, data: player, message: 'Player removed from team' });
  } catch (error) {
    next(error);
  }
};

exports.addPlayer = async (req, res, next) => {
  try {
    const team = await Team.findById(req.body.team || req.user.team);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (req.user.role === 'team_manager' && team.manager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (team.players.length >= 15) {
      return res.status(400).json({ success: false, message: 'Maximum 15 players allowed per team' });
    }

    let profileImage = '';
    if (req.file) {
      profileImage = await uploadToCloudinary(req.file.buffer, 'player-profiles');
    }

    const player = await Player.create({ ...req.body, team: team._id, profileImage });
    team.players.push(player._id);
    await team.save();

    res.status(201).json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

exports.updatePlayer = async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id).populate('team');
    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

    if (req.user.role === 'team_manager') {
      if (!player.team) {
        return res.status(403).json({ success: false, message: 'Not authorized to edit unassigned players' });
      }
      if (player.team.manager?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    const updates = { ...req.body };
    delete updates.team;
    if (req.file) {
      updates.profileImage = await uploadToCloudinary(req.file.buffer, 'player-profiles');
    }

    const updated = await Player.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.verifyPlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
    res.json({ success: true, data: player, message: 'Player verified' });
  } catch (error) {
    next(error);
  }
};

exports.getTopBatsmen = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const players = await Player.find()
      .sort({ 'statistics.batting.runs': -1 })
      .limit(limit)
      .populate('team', 'teamName logo')
      .select('name profileImage role statistics team');

    res.json({ success: true, data: players });
  } catch (error) {
    next(error);
  }
};

exports.getTopBowlers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const players = await Player.find({ 'statistics.bowling.wickets': { $gt: 0 } })
      .sort({ 'statistics.bowling.wickets': -1 })
      .limit(limit)
      .populate('team', 'teamName logo')
      .select('name profileImage role statistics team');

    res.json({ success: true, data: players });
  } catch (error) {
    next(error);
  }
};

exports.getPlayerRankings = async (req, res, next) => {
  try {
    const type = req.query.type || 'batting';
    const sortField =
      type === 'bowling' ? { 'statistics.bowling.wickets': -1 } : { 'statistics.batting.runs': -1 };

    const players = await Player.find()
      .sort(sortField)
      .limit(50)
      .populate('team', 'teamName logo')
      .select('name profileImage role statistics team');

    res.json({ success: true, data: players });
  } catch (error) {
    next(error);
  }
};
