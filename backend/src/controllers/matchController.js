const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Player = require('../models/Player');
const { updatePlayerStats, updatePointsTable, updateTeamStats } = require('../utils/statistics');
const { isBlockedAvailabilityStatus } = require('../utils/playerAvailability');
const { createMockWeather, normalizeWeather } = require('../utils/weather');

function normalizeScorecardInnings(innings = []) {
  return (innings || []).map((inning) => ({
    ...inning,
    battingStats: (inning.battingStats || []).map((entry) => {
      const strikeRate =
        entry.balls > 0 ? parseFloat(((entry.runs / entry.balls) * 100).toFixed(2)) : 0;
      return { ...entry, strikeRate };
    }),
    bowlingStats: (inning.bowlingStats || []).map((entry) => {
      const economy = entry.overs > 0 ? parseFloat((entry.runs / entry.overs).toFixed(2)) : 0;
      return { ...entry, economy };
    }),
  }));
}

function derivePartnershipsFromBatting(batting = []) {
  const partnerships = [];
  for (let index = 0; index < batting.length - 1; index += 2) {
    const striker = batting[index];
    const partner = batting[index + 1];
    partnerships.push({
      wicket: index + 1,
      players: [striker?.playerName || 'Player', partner?.playerName || 'Player'],
      runs: (striker?.runs || 0) + (partner?.runs || 0),
      balls: (striker?.balls || 0) + (partner?.balls || 0),
    });
  }
  return partnerships;
}

function deriveTimelineEvents(match, scorecardInnings = []) {
  const timeline = [];

  for (const innings of scorecardInnings) {
    for (const wicket of innings.fallOfWickets || []) {
      timeline.push({
        over: wicket.over || '',
        title: `${wicket.batsman || 'Batter'} out`,
        description: `Fall of wicket at ${wicket.score}/${wicket.wicket}`,
        type: 'wicket',
        team: innings.team,
      });
    }
  }

  if (timeline.length === 0) {
    for (const commentary of match.commentary || []) {
      if (commentary.isWicket) {
        timeline.push({
          over: `${commentary.over}.${commentary.ball}`,
          title: 'Wicket',
          description: commentary.text,
          type: 'wicket',
        });
      }
    }
  }

  return timeline.sort((left, right) => String(left.over).localeCompare(String(right.over)));
}

function buildDerivedScorecard(match) {
  if (!match || !match.innings || match.innings.length === 0) {
    return null;
  }

  const innings = match.innings.map((inn) => ({
    team: inn.team,
    totalRuns: inn.totalRuns,
    totalWickets: inn.totalWickets,
    totalOvers: inn.totalOvers,
    extras: inn.extras || 0,
    battingStats: (inn.batting || []).map((entry) => ({
      player: entry.player,
      playerName: entry.player?.name || entry.player?.teamName || 'Player',
      runs: entry.runs,
      balls: entry.balls,
      fours: entry.fours,
      sixes: entry.sixes,
      strikeRate: entry.strikeRate,
      dismissal: entry.dismissalType || '',
    })),
    bowlingStats: (inn.bowling || []).map((entry) => ({
      player: entry.player,
      playerName: entry.player?.name || entry.player?.teamName || 'Player',
      overs: entry.overs,
      maidens: entry.maidens,
      runs: entry.runs,
      wickets: entry.wickets,
      economy: entry.economy,
    })),
    fallOfWickets: [],
    partnerships: [],
    partnershipSummary: [],
  }));

  return {
    playerOfMatch: match.result?.manOfTheMatch || null,
    innings: innings.map((inning) => ({
      ...inning,
      partnerships: derivePartnershipsFromBatting(inning.battingStats),
      partnershipSummary: derivePartnershipsFromBatting(inning.battingStats).map(
        (partnership) =>
          `${partnership.players.join(' & ')} — ${partnership.runs} runs off ${partnership.balls} balls`
      ),
    })),
    timelineEvents: deriveTimelineEvents(match, innings),
  };
}

function validateScorecard(scorecard) {
  if (!scorecard || !Array.isArray(scorecard.innings)) {
    return 'Scorecard innings must be an array';
  }

  for (const innings of scorecard.innings) {
    if (!innings.team) return 'Each scorecard innings requires a team';
    if (innings.battingStats && !Array.isArray(innings.battingStats)) {
      return 'Batting stats must be an array';
    }
    if (innings.bowlingStats && !Array.isArray(innings.bowlingStats)) {
      return 'Bowling stats must be an array';
    }
    if (innings.fallOfWickets && !Array.isArray(innings.fallOfWickets)) {
      return 'Fall of wickets must be an array';
    }
    if (innings.partnerships && !Array.isArray(innings.partnerships)) {
      return 'Partnerships must be an array';
    }
  }

  return null;
}

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
      .populate('result.manOfTheMatch', 'name profileImage')
      .select('teamA teamB tournament date ground overs status innings result scorecard weather liveScore')
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
      .populate('innings.batting.player', 'name profileImage jerseyNumber availabilityStatus')
      .populate('innings.bowling.player', 'name profileImage availabilityStatus')
      .populate('result.winner', 'teamName')
      .populate('result.manOfTheMatch', 'name profileImage')
      .populate('scorecard.playerOfMatch', 'name profileImage')
      .populate('scorecard.toss.winner', 'teamName logo')
      .populate('scorecard.innings.team', 'teamName logo')
      .populate('scorecard.innings.battingStats.player', 'name profileImage')
      .populate('scorecard.innings.bowlingStats.player', 'name profileImage')
      .select('teamA teamB tournament date ground overs status innings scorecard result weather liveScore commentary');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

exports.createMatch = async (req, res, next) => {
  try {
    const { tournament, teamA, teamB, date, ground, overs, weather } = req.body;

    const match = await Match.create({
      tournament,
      teamA,
      teamB,
      date,
      ground,
      overs: overs || 20,
      weather: normalizeWeather(weather, date),
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
    const updates = { ...req.body };
    if (updates.weather !== undefined) {
      const existingMatch = await Match.findById(req.params.id).select('date');
      if (existingMatch) {
        updates.weather = normalizeWeather(updates.weather, existingMatch.date);
      }
    }

    const match = await Match.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('teamA teamB', 'teamName logo');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, data: match });
  } catch (error) {
    next(error);
  }
};

exports.submitScorecard = async (req, res, next) => {
  try {
    const { innings, result, status, scorecard } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    if (scorecard) {
      const validationError = validateScorecard(scorecard);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }
    }

    const playerIds = Array.from(
      new Set(
        [
          ...(innings || [])
            .flatMap((inn) => [...(inn.batting || []), ...(inn.bowling || [])]),
          ...(scorecard?.innings || [])
            .flatMap((inn) => [...(inn.battingStats || []), ...(inn.bowlingStats || [])]),
        ]
          .map((entry) => entry.player?._id?.toString?.() || entry.player?.toString?.())
          .filter(Boolean)
      )
    );

    if (playerIds.length > 0) {
      const players = await Player.find({ _id: { $in: playerIds } }).select(
        'name availabilityStatus'
      );
      const blockedPlayer = players.find((player) => isBlockedAvailabilityStatus(player.availabilityStatus));
      if (blockedPlayer) {
        return res.status(400).json({
          success: false,
          message: `${blockedPlayer.name} is ${blockedPlayer.availabilityStatus.toLowerCase()} and cannot be selected`,
        });
      }
    }

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

    if (scorecard) {
      match.scorecard = {
        ...scorecard,
        innings: normalizeScorecardInnings(scorecard.innings),
      };
      if (scorecard.playerOfMatch) {
        match.result = {
          ...(match.result || {}),
          manOfTheMatch: scorecard.playerOfMatch,
        };
      }
    }

    if (result) match.result = { ...(match.result || {}), ...result };
    if (status) match.status = status;
    if (req.body.weather) {
      match.weather = normalizeWeather(req.body.weather, match.date);
    }

    await match.save();

    if (status === 'completed') {
      await processMatchCompletion(match);
    }

    const populated = await Match.findById(match._id)
      .populate('teamA teamB', 'teamName logo')
      .populate('innings.batting.player innings.bowling.player', 'name')
      .populate('result.winner', 'teamName')
      .populate('result.manOfTheMatch', 'name profileImage')
      .populate('scorecard.playerOfMatch', 'name profileImage')
      .populate('scorecard.toss.winner', 'teamName logo')
      .populate('scorecard.innings.team', 'teamName logo')
      .populate('scorecard.innings.battingStats.player', 'name profileImage')
      .populate('scorecard.innings.bowlingStats.player', 'name profileImage')
      .select('teamA teamB tournament date ground overs status innings scorecard result weather liveScore commentary');

    res.json({ success: true, data: populated, message: 'Scorecard updated' });
  } catch (error) {
    next(error);
  }
};

exports.getMatchScorecard = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('teamA teamB', 'teamName logo')
      .populate('tournament', 'title overs')
      .populate('result.winner', 'teamName')
      .populate('result.manOfTheMatch', 'name profileImage')
      .populate('scorecard.playerOfMatch', 'name profileImage')
      .populate('scorecard.toss.winner', 'teamName logo')
      .populate('scorecard.innings.team', 'teamName logo')
      .populate('scorecard.innings.battingStats.player', 'name profileImage')
      .populate('scorecard.innings.bowlingStats.player', 'name profileImage')
      .select('teamA teamB tournament date ground overs status innings scorecard result weather liveScore commentary');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const scorecard = match.scorecard?.innings?.length ? match.scorecard : buildDerivedScorecard(match);

    if (!scorecard) {
      return res.json({
        success: true,
        data: null,
        message: 'Scorecard not available yet',
      });
    }

    res.json({
      success: true,
      data: {
        ...match.toObject(),
        scorecard,
      },
    });
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
      .populate('result.manOfTheMatch', 'name profileImage')
      .select('teamA teamB tournament date ground overs status innings result scorecard weather liveScore')
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
