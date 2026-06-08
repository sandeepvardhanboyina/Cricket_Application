const Team = require('../models/Team');
const Player = require('../models/Player');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../utils/uploadImage');
const { sendEmail } = require('../utils/email');

exports.getTeams = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 12 } = req.query;
    const query = {};

    if (search) query.teamName = { $regex: search, $options: 'i' };
    if (status) query.status = status;
    else query.status = { $in: ['approved', 'pending'] };

    const teams = await Team.find(query)
      .populate('players', 'name role profileImage jerseyNumber isCaptain')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Team.countDocuments(query);

    res.json({
      success: true,
      data: teams,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate('players').populate('manager', 'name email');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

exports.registerTeam = async (req, res, next) => {
  try {
    const { teamName, captain, captainEmail, mobileNumber, city, tournamentId } = req.body;
    let players = req.body.players;

    if (typeof players === 'string') {
      try {
        players = JSON.parse(players);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid players data format' });
      }
    }

    if (!players || players.length !== 11) {
      return res.status(400).json({ success: false, message: 'Exactly 11 players are required' });
    }

    const captainPlayer = players.find(
      (p) => p.name.toLowerCase() === captain.toLowerCase() || p.isCaptain
    );
    if (!captainPlayer) {
      return res.status(400).json({ success: false, message: 'Captain must be one of the 11 players' });
    }

    let logoUrl = '';
    if (req.file) {
      logoUrl = await uploadToCloudinary(req.file.buffer, 'team-logos');
    }

    const autoApprove =
      process.env.AUTO_APPROVE_TEAMS === 'true' || req.user?.role === 'admin';

    const team = await Team.create({
      teamName,
      captain,
      captainEmail,
      mobileNumber,
      city,
      logo: logoUrl,
      manager: req.user?._id,
      status: autoApprove ? 'approved' : 'pending',
    });

    const createdPlayers = [];
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      let profileImage = '';

      if (req.files?.[`playerImage_${i}`]) {
        profileImage = await uploadToCloudinary(
          req.files[`playerImage_${i}`][0].buffer,
          'player-profiles'
        );
      }

      const player = await Player.create({
        name: p.name,
        dateOfBirth: p.dateOfBirth,
        role: p.role,
        battingStyle: p.battingStyle,
        bowlingStyle: p.bowlingStyle,
        jerseyNumber: p.jerseyNumber,
        profileImage,
        team: team._id,
        isCaptain: p.name.toLowerCase() === captain.toLowerCase() || p.isCaptain,
        isVerified: autoApprove,
      });
      createdPlayers.push(player._id);
    }

    team.players = createdPlayers;
    await team.save();

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { team: team._id, role: 'team_manager' });
    }

    if (tournamentId) {
      const tournament = await Tournament.findById(tournamentId);
      if (tournament) {
        tournament.teams.push({ team: team._id, registrationStatus: 'pending' });
        await tournament.save();
      }
    }

    await sendEmail({
      to: captainEmail,
      subject: 'Team Registration Received - Cricket Tournament Hub',
      html: `<h2>Team Registration Submitted</h2>
        <p>Your team <strong>${teamName}</strong> has been registered and is pending approval.</p>`,
    });

    res.status(201).json({ success: true, data: team, message: 'Team registered successfully. Pending approval.' });
  } catch (error) {
    next(error);
  }
};

exports.approveTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    team.status = 'approved';
    await team.save();

    // Auto-verify all squad players when team is approved
    await Player.updateMany({ team: team._id }, { isVerified: true });

    if (team.manager) {
      await Notification.create({
        user: team.manager,
        title: 'Team Approved',
        message: `Your team "${team.teamName}" has been approved!`,
        type: 'success',
        link: `/teams/${team._id}`,
      });
    }

    await sendEmail({
      to: team.captainEmail,
      subject: 'Team Approved - Cricket Tournament Hub',
      html: `<h2>Congratulations!</h2><p>Your team <strong>${team.teamName}</strong> has been approved.</p>`,
    });

    res.json({ success: true, data: team, message: 'Team approved successfully' });
  } catch (error) {
    next(error);
  }
};

exports.rejectTeam = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    team.status = 'rejected';
    team.rejectionReason = reason;
    await team.save();

    if (team.manager) {
      await Notification.create({
        user: team.manager,
        title: 'Team Registration Rejected',
        message: `Your team "${team.teamName}" was rejected. Reason: ${reason}`,
        type: 'error',
      });
    }

    res.json({ success: true, data: team, message: 'Team rejected' });
  } catch (error) {
    next(error);
  }
};

exports.updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (req.user.role === 'team_manager' && team.manager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.logo = await uploadToCloudinary(req.file.buffer, 'team-logos');
    }

    const updated = await Team.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.getTeamRankings = async (req, res, next) => {
  try {
    const teams = await Team.find({ status: 'approved' })
      .sort({ 'statistics.winPercentage': -1, 'statistics.wins': -1 })
      .limit(20)
      .select('teamName logo city statistics captain');

    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};
