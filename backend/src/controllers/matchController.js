const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Player = require('../models/Player');
const { updatePlayerStats, updatePointsTable, updateTeamStats } = require('../utils/statistics');

exports.getMatches = async (req, res, next) => {
  try {
    const { tournament, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (tournament) query.tournament = tournament;
    if (status) query.status = status;

    const matches = await Match.find(query)
      .populate('teamA teamB', 'teamName logo')
      .populate('tournament', 'title')
      .populate('result.winner', 'teamName')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Match.countDocuments(query);

    res.json({
      success: true,
      data: matches,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teamA teamB', 'teamName logo')
      .populate('tournament', 'title overs')
      .populate('innings.batting.player', 'name profileImage jerseyNumber')
      .populate('innings.bowling.player', 'name profileImage')
      .populate('result.winner', 'teamName')
      .populate('result.manOfTheMatch', 'name profileImage');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

exports.createMatch = async (req, res, next) => {
  try {
    const { tournament, teamA, teamB, date, ground, overs } = req.body;

    const match = await Match.create({
      tournament,
      teamA,
      teamB,
      date,
      ground,
      overs: overs || 20,
      createdBy: req.user._id,
      innings: [],
    });

    const populated = await Match.findById(match._id)
      .populate('teamA teamB', 'teamName logo')
      .populate('tournament', 'title');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

exports.updateMatch = async (req, res, next) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('teamA teamB', 'teamName logo');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

exports.submitScorecard = async (req, res, next) => {
  try {
    const { innings, result, status } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    // Calculate strike rates and economy for innings entries
    if (innings) {
      for (const inn of innings) {
        for (const bat of inn.batting || []) {
          bat.strikeRate =
            bat.balls > 0 ? parseFloat(((bat.runs / bat.balls) * 100).toFixed(2)) : 0;
        }
        for (const bowl of inn.bowling || []) {
          bowl.economy =
            bowl.overs > 0 ? parseFloat((bowl.runs / bowl.overs).toFixed(2)) : 0;
        }
      }
      match.innings = innings;
    }

    if (result) match.result = result;
    if (status) match.status = status;

    await match.save();

    if (status === 'completed') {
      await processMatchCompletion(match);
    }

    const populated = await Match.findById(match._id)
      .populate('teamA teamB', 'teamName logo')
      .populate('innings.batting.player innings.bowling.player', 'name');

    res.json({ success: true, data: populated, message: 'Scorecard updated' });
  } catch (error) {
    next(error);
  }
};

async function processMatchCompletion(match) {
  const tournament = await Tournament.findById(match.tournament);
  const teamA = await Team.findById(match.teamA);
  const teamB = await Team.findById(match.teamB);

  for (const inn of match.innings) {
    for (const bat of inn.batting) {
      const player = await Player.findById(bat.player);
      if (!player) continue;

      const bowlEntry = match.innings
        .flatMap((i) => i.bowling)
        .find((b) => b.player?.toString() === bat.player.toString());

      await updatePlayerStats(player, bat, bowlEntry);

      player.careerHistory.push({
        match: match._id,
        runs: bat.runs,
        balls: bat.balls,
        wickets: bowlEntry?.wickets || 0,
        date: match.date,
      });
      await player.save();
    }

    for (const bowl of inn.bowling) {
      const player = await Player.findById(bowl.player);
      if (!player) continue;
      const batEntry = match.innings
        .flatMap((i) => i.batting)
        .find((b) => b.player?.toString() === bowl.player.toString());
      if (!batEntry) {
        await updatePlayerStats(player, null, bowl);
      }
    }
  }

  if (match.result?.winner && tournament) {
    const winnerId = match.result.winner.toString();
    const loserId =
      winnerId === match.teamA.toString() ? match.teamB.toString() : match.teamA.toString();

    const innA = match.innings.find((i) => i.team.toString() === match.teamA.toString());
    const innB = match.innings.find((i) => i.team.toString() === match.teamB.toString());

    if (innA) {
      updatePointsTable(
        tournament,
        match.teamA,
        winnerId === match.teamA.toString(),
        innA.totalRuns,
        innA.totalOvers,
        innB?.totalRuns || 0,
        innB?.totalOvers || 0
      );
    }
    if (innB) {
      updatePointsTable(
        tournament,
        match.teamB,
        winnerId === match.teamB.toString(),
        innB.totalRuns,
        innB.totalOvers,
        innA?.totalRuns || 0,
        innA?.totalOvers || 0
      );
    }

    await tournament.save();
    await updateTeamStats(teamA, winnerId === match.teamA.toString());
    await updateTeamStats(teamB, winnerId === match.teamB.toString());
  }
}

exports.updateLiveScore = async (req, res, next) => {
  try {
    const { liveScore, commentary } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    if (liveScore) {
      match.liveScore = { ...match.liveScore, ...liveScore, lastUpdated: new Date() };
      match.status = 'live';
    }

    if (commentary) {
      match.commentary.push(commentary);
    }

    await match.save();
    res.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

exports.getLatestMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: { $in: ['completed', 'live'] } })
      .populate('teamA teamB', 'teamName logo')
      .populate('tournament', 'title')
      .populate('result.winner', 'teamName')
      .sort({ date: -1 })
      .limit(6);

    res.json({ success: true, data: matches });
  } catch (error) {
    next(error);
  }
};

exports.deleteMatch = async (req, res, next) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, message: 'Match deleted' });
  } catch (error) {
    next(error);
  }
};
