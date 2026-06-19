const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Player = require('../models/Player');
const Team = require('../models/Team');
const { uploadToCloudinary } = require('../utils/uploadImage');
const { createMockWeather } = require('../utils/weather');

const PREMIER_LEAGUE_TITLE = 'Premier Cricket League 2026';
const PREMIER_LEAGUE_TEAM_NAMES = ['Mumbai Strikers', 'Delhi Warriors', 'Aces'];

async function ensurePremierLeagueTournamentData(tournament) {
  if (!tournament || tournament.title !== PREMIER_LEAGUE_TITLE) return tournament;

  const getTeamId = (value) => value?._id?.toString?.() || value?.toString?.();
  const teams = await Team.find({ teamName: { $in: PREMIER_LEAGUE_TEAM_NAMES } }).select(
    'teamName status'
  );
  const teamMap = new Map(teams.map((team) => [team.teamName, team]));
  const assignedTeamIds = (tournament.teams || []).map((entry) => getTeamId(entry.team)).filter(Boolean);
  const assignedTeamNames = teams
    .filter((team) => assignedTeamIds.includes(team._id.toString()))
    .map((team) => team.teamName);

  console.log('[Tournament Repair] Premier Cricket League 2026', {
    tournamentId: tournament._id.toString(),
    assignedTeamIds,
    assignedTeamNames,
  });

  let mutated = false;
  const dedupedTeams = [];
  const seenTeamIds = new Set();

  for (const entry of tournament.teams || []) {
    const teamId = getTeamId(entry.team);
    if (!teamId || seenTeamIds.has(teamId)) {
      mutated = true;
      continue;
    }
    seenTeamIds.add(teamId);
    dedupedTeams.push(entry);
  }
  if (dedupedTeams.length !== (tournament.teams || []).length) {
    tournament.teams = dedupedTeams;
  }

  const dedupedPoints = [];
  const seenPointTeamIds = new Set();
  for (const entry of tournament.pointsTable || []) {
    const teamId = getTeamId(entry.team);
    if (!teamId || seenPointTeamIds.has(teamId)) {
      mutated = true;
      continue;
    }
    seenPointTeamIds.add(teamId);
    dedupedPoints.push(entry);
  }
  if (dedupedPoints.length !== (tournament.pointsTable || []).length) {
    tournament.pointsTable = dedupedPoints;
  }

  for (const teamName of PREMIER_LEAGUE_TEAM_NAMES) {
    const team = teamMap.get(teamName);
    if (!team) continue;

    if (teamName === 'Aces' && team.status !== 'approved') {
      team.status = 'approved';
      await team.save();
      mutated = true;
    }

    const existingEntry = tournament.teams.find((entry) => getTeamId(entry.team) === team._id.toString());
    if (!existingEntry) {
      tournament.teams.push({ team: team._id, registrationStatus: 'approved' });
      mutated = true;
    } else if (existingEntry.registrationStatus !== 'approved') {
      existingEntry.registrationStatus = 'approved';
      mutated = true;
    }

    const pointsEntry = tournament.pointsTable.find((entry) => getTeamId(entry.team) === team._id.toString());
    if (!pointsEntry) {
      tournament.pointsTable.push({ team: team._id });
      mutated = true;
    }
  }

  if (mutated) {
    await tournament.save();
    console.log('[Tournament Repair] Saved updated tournament teams', {
      tournamentId: tournament._id.toString(),
      assignedTeamIds: tournament.teams.map((entry) => getTeamId(entry.team)).filter(Boolean),
      assignedTeamNames: tournament.teams
        .map((entry) => teams.find((team) => team._id.toString() === getTeamId(entry.team))?.teamName)
        .filter(Boolean),
    });
  }

  const fixtureBlueprints = [
    {
      teamA: 'Mumbai Strikers',
      teamB: 'Delhi Warriors',
      date: new Date('2026-06-15T14:00:00.000Z'),
      ground: 'Wankhede Stadium',
      status: 'completed',
      result: { winner: 'Mumbai Strikers', margin: '13 runs', manOfTheMatch: 'KL Rahul' },
    },
    {
      teamA: 'Aces',
      teamB: 'Mumbai Strikers',
      date: new Date('2026-06-18T14:00:00.000Z'),
      ground: 'Eden Gardens',
      status: 'scheduled',
    },
    {
      teamA: 'Aces',
      teamB: 'Delhi Warriors',
      date: new Date('2026-06-21T14:00:00.000Z'),
      ground: 'M. Chinnaswamy Stadium',
      status: 'scheduled',
    },
  ];

  for (const fixture of fixtureBlueprints) {
    const teamA = teamMap.get(fixture.teamA);
    const teamB = teamMap.get(fixture.teamB);
    if (!teamA || !teamB) continue;

    const existingMatch = await Match.findOne({
      tournament: tournament._id,
      $or: [
        { teamA: teamA._id, teamB: teamB._id },
        { teamA: teamB._id, teamB: teamA._id },
      ],
    });

    if (existingMatch) continue;

    const matchData = {
      tournament: tournament._id,
      teamA: teamA._id,
      teamB: teamB._id,
      date: fixture.date,
      ground: fixture.ground,
      overs: tournament.overs || 20,
      status: fixture.status,
      weather: createMockWeather(fixture.date),
      innings: [],
      createdBy: tournament.createdBy,
    };

    if (fixture.result) {
      const winnerTeam = teamMap.get(fixture.result.winner);
      const manOfTheMatchPlayer = fixture.result.manOfTheMatch
        ? await Player.findOne({ name: fixture.result.manOfTheMatch }).select('_id')
        : null;
      matchData.result = {
        winner: winnerTeam?._id,
        margin: fixture.result.margin,
        manOfTheMatch: manOfTheMatchPlayer?._id,
      };
    }

    await Match.create(matchData);
  }

  return tournament;
}

exports.getTournaments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    let tournaments = await Tournament.find(query)
      .populate('teams.team', 'teamName logo city')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    tournaments = await Promise.all(
      tournaments.map(async (tournament) => {
        if (tournament.title !== PREMIER_LEAGUE_TITLE) return tournament;
        await ensurePremierLeagueTournamentData(tournament);
        const refreshedTournament = await Tournament.findById(tournament._id)
          .populate('teams.team', 'teamName logo city')
          .sort({ startDate: -1 });
        console.log('[Tournament List] Refreshed Premier Cricket League 2026', {
          tournamentId: refreshedTournament?._id?.toString(),
          assignedTeamIds: refreshedTournament?.teams?.map((entry) => entry.team?._id?.toString()),
          assignedTeamNames: refreshedTournament?.teams?.map((entry) => entry.team?.teamName),
        });
        return refreshedTournament;
      })
    );

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
    let tournament = await Tournament.findById(req.params.id)
      .populate('teams.team', 'teamName logo city captain statistics')
      .populate('pointsTable.team', 'teamName logo')
      .populate('createdBy', 'name');

    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    tournament = await ensurePremierLeagueTournamentData(tournament);
    tournament = await Tournament.findById(tournament._id)
      .populate('teams.team', 'teamName logo city captain statistics')
      .populate('pointsTable.team', 'teamName logo')
      .populate('createdBy', 'name');
    console.log('[Tournament Detail] Premier Cricket League 2026', {
      tournamentId: tournament._id.toString(),
      assignedTeamIds: tournament.teams.map((entry) => entry.team?._id?.toString()),
      assignedTeamNames: tournament.teams.map((entry) => entry.team?.teamName),
    });

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
