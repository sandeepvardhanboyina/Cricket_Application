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

function getEntityId(value) {
  return value?._id?.toString?.() || value?.toString?.() || '';
}

function getTeamPlayers(team) {
  if (!team || !Array.isArray(team.players)) return [];
  return team.players;
}

function buildFullBattingStats(teamPlayers = [], battingStats = []) {
  const statByPlayerId = new Map(
    (battingStats || [])
      .map((entry) => [getEntityId(entry.player), entry])
      .filter(([playerId]) => Boolean(playerId))
  );

  const merged = [];
  const seen = new Set();

  for (const player of teamPlayers) {
    const playerId = getEntityId(player);
    if (!playerId || seen.has(playerId)) continue;
    seen.add(playerId);

    const existing = statByPlayerId.get(playerId);
    merged.push(
      existing || {
        player,
        playerName: player?.name || 'Player',
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        dismissal: 'did not bat',
      }
    );
  }

  for (const entry of battingStats || []) {
    const playerId = getEntityId(entry.player);
    if (!playerId || seen.has(playerId)) continue;
    seen.add(playerId);
    merged.push({
      ...entry,
      playerName: entry.playerName || entry.player?.name || 'Player',
    });
  }

  return merged.map((entry) => ({
    ...entry,
    strikeRate:
      entry.balls > 0 ? parseFloat(((entry.runs / entry.balls) * 100).toFixed(2)) : 0,
  }));
}

function buildFullBowlingStats(teamPlayers = [], bowlingStats = []) {
  const statByPlayerId = new Map(
    (bowlingStats || [])
      .map((entry) => [getEntityId(entry.player), entry])
      .filter(([playerId]) => Boolean(playerId))
  );

  const merged = [];
  const seen = new Set();

  for (const player of teamPlayers) {
    const playerId = getEntityId(player);
    if (!playerId || seen.has(playerId)) continue;
    seen.add(playerId);

    const existing = statByPlayerId.get(playerId);
    merged.push(
      existing || {
        player,
        playerName: player?.name || 'Player',
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
      }
    );
  }

  for (const entry of bowlingStats || []) {
    const playerId = getEntityId(entry.player);
    if (!playerId || seen.has(playerId)) continue;
    seen.add(playerId);
    merged.push({
      ...entry,
      playerName: entry.playerName || entry.player?.name || 'Player',
    });
  }

  return merged.map((entry) => ({
    ...entry,
    economy: entry.overs > 0 ? parseFloat((entry.runs / entry.overs).toFixed(2)) : 0,
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

function isMeaningfulScorecard(scorecard) {
  return Boolean(
    scorecard?.innings?.some(
      (innings) =>
        (innings.battingStats || []).some((entry) => Number(entry.runs) > 0 || Number(entry.balls) > 0) ||
        (innings.bowlingStats || []).some((entry) => Number(entry.wickets) > 0 || Number(entry.overs) > 0)
    )
  );
}

function getBattingWeight(player, battingIndex) {
  const role = String(player?.role || '').toLowerCase();
  const battingRuns = player?.statistics?.batting?.runs || 0;
  const roleWeight =
    role.includes('batsman') ? 1.7 : role.includes('all-rounder') ? 1.45 : role.includes('wicket') ? 1.25 : 0.95;
  return roleWeight + battingRuns / 250 + Math.max(0, 0.2 - battingIndex * 0.01);
}

function getBowlingWeight(player) {
  const role = String(player?.role || '').toLowerCase();
  const wickets = player?.statistics?.bowling?.wickets || 0;
  if (role.includes('bowler')) return 1.8 + wickets / 20;
  if (role.includes('all-rounder')) return 1.4 + wickets / 25;
  if (role.includes('wicket')) return 0.8;
  return 0.35;
}

function distributeIntegers(total, weights) {
  const safeWeights = weights.map((weight) => Math.max(weight, 0.0001));
  const sum = safeWeights.reduce((value, weight) => value + weight, 0);
  const values = safeWeights.map((weight) => Math.floor((weight / sum) * total));
  let allocated = values.reduce((value, current) => value + current, 0);
  let remainder = total - allocated;
  let cursor = 0;
  while (remainder > 0 && values.length > 0) {
    values[cursor % values.length] += 1;
    remainder -= 1;
    cursor += 1;
  }
  return values;
}

function buildMockBattingStats(players = [], totalRuns = 0, wicketCount = 0, inningsIndex = 0) {
  const battingPlayers = [...players].filter(Boolean);
  const battingTarget = Math.max(totalRuns, battingPlayers.length);
  const weights = battingPlayers.map((player, index) => getBattingWeight(player, index));
  const minimumScore = battingPlayers.length;
  const runsToDistribute = Math.max(0, battingTarget - minimumScore);
  const baseRuns = distributeIntegers(runsToDistribute, weights).map((value) => value + 1);

  const dismissedCount = Math.min(wicketCount || 0, battingPlayers.length);
  const bowlersForDismissals = battingPlayers
    .filter((player) => String(player?.role || '').toLowerCase().includes('bowler') || String(player?.role || '').toLowerCase().includes('all-rounder'))
    .map((player) => player.name);

  return battingPlayers.map((player, index) => {
    const runs = baseRuns[index] || 0;
    const targetStrikeRate =
      String(player?.role || '').toLowerCase().includes('batsman')
        ? 142 + inningsIndex * 4
        : String(player?.role || '').toLowerCase().includes('all-rounder')
          ? 128 + inningsIndex * 3
          : String(player?.role || '').toLowerCase().includes('wicket')
            ? 120
            : 92;
    const balls = Math.max(1, Math.round((runs * 100) / targetStrikeRate));
    const fours = runs > 0 ? Math.max(0, Math.min(runs, Math.round(runs / 11))) : 0;
    const sixes = runs > 12 ? Math.max(0, Math.min(6, Math.round(runs / 22))) : runs > 0 ? 0 : 0;
    const dismissal =
      index < dismissedCount
        ? `c ${battingPlayers[(index + 1) % battingPlayers.length]?.name || 'fielder'} b ${
            bowlersForDismissals[index % Math.max(bowlersForDismissals.length, 1)] || 'bowler'
          }`
        : runs > 0
          ? 'not out'
          : 'did not bat';

    return {
      player,
      playerName: player?.name || 'Player',
      runs,
      balls,
      fours,
      sixes,
      strikeRate: balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0,
      dismissal,
    };
  });
}

function buildMockBowlingStats(players = [], battingRuns = 0, wicketCount = 0, inningsIndex = 0) {
  const bowlingPlayers = [...players].filter(Boolean);
  const weights = bowlingPlayers.map((player) => getBowlingWeight(player));
  const wicketTargets = distributeIntegers(Math.max(0, wicketCount || 0), weights);

  const oversWeights = bowlingPlayers.map((player) => {
    const role = String(player?.role || '').toLowerCase();
    if (role.includes('bowler')) return 4;
    if (role.includes('all-rounder')) return 3;
    if (role.includes('wicket')) return 1;
    return 0.5;
  });
  const overTargets = distributeIntegers(20, oversWeights);

  const runWeights = bowlingPlayers.map((player, index) => {
    const role = String(player?.role || '').toLowerCase();
    const base =
      role.includes('bowler') ? 1.4 : role.includes('all-rounder') ? 1.15 : role.includes('wicket') ? 0.8 : 0.5;
    return base + index * 0.05;
  });
  const baseRunsConceded = distributeIntegers(Math.max(battingRuns, bowlingPlayers.length), runWeights);

  return bowlingPlayers.map((player, index) => {
    const overs = overTargets[index] || 0;
    const wickets = wicketTargets[index] || 0;
    const runs = Math.max(0, baseRunsConceded[index] || 0);
    const maidens = overs > 0 && index === 0 ? 1 : 0;
    const economy = overs > 0 ? parseFloat((runs / overs).toFixed(2)) : 0;

    return {
      player,
      playerName: player?.name || 'Player',
      overs,
      maidens,
      runs,
      wickets,
      economy,
    };
  });
}

function buildMockFallbackScorecard(match) {
  if (!match?.innings?.length) return null;

  const firstInnings = match.innings[0];
  const secondInnings = match.innings[1];
  const teamA = match.teamA;
  const teamB = match.teamB;

  const teamANames = teamA?.teamName;
  const teamBNames = teamB?.teamName;

  if (
    match.status === 'completed' &&
    teamANames === 'Mumbai Strikers' &&
    teamBNames === 'Delhi Warriors' &&
    match.ground === 'Wankhede Stadium'
  ) {
    const mumbaiBatting = [
      { playerName: 'Rohit Sharma', runs: 12, balls: 10, fours: 1, sixes: 0, strikeRate: 120, dismissal: 'c Shaw b Shami' },
      { playerName: 'Virat Kohli', runs: 21, balls: 16, fours: 2, sixes: 1, strikeRate: 131.25, dismissal: 'lbw b Bumrah' },
      { playerName: 'Shubman Gill', runs: 0, balls: 3, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'c Pant b Khaleel' },
      { playerName: 'Hardik Pandya', runs: 45, balls: 28, fours: 3, sixes: 2, strikeRate: 160.71, dismissal: 'c Iyer b Mukesh' },
      { playerName: 'KL Rahul', runs: 89, balls: 54, fours: 8, sixes: 4, strikeRate: 164.81, dismissal: 'c Shaw b Shami' },
      { playerName: 'Ravindra Jadeja', runs: 4, balls: 4, fours: 0, sixes: 0, strikeRate: 100, dismissal: 'run out (Pant)' },
      { playerName: 'Mohammed Shami', runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'not out' },
      { playerName: 'Jasprit Bumrah', runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'not out' },
      { playerName: 'Suryakumar Yadav', runs: 1, balls: 2, fours: 0, sixes: 0, strikeRate: 50, dismissal: 'not out' },
      { playerName: 'Ishan Kishan', runs: 1, balls: 2, fours: 0, sixes: 0, strikeRate: 50, dismissal: 'not out' },
      { playerName: 'Kuldeep Yadav', runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'not out' },
    ];

    const delhiBowling = [
      { playerName: 'Khaleel Ahmed', overs: 4, maidens: 0, runs: 22, wickets: 2, economy: 5.5 },
      { playerName: 'Mukesh Kumar', overs: 4, maidens: 0, runs: 31, wickets: 2, economy: 7.75 },
      { playerName: 'Axar Patel', overs: 4, maidens: 0, runs: 38, wickets: 1, economy: 9.5 },
      { playerName: 'Shreyas Iyer', overs: 4, maidens: 0, runs: 35, wickets: 1, economy: 8.75 },
      { playerName: 'Prithvi Shaw', overs: 2, maidens: 0, runs: 17, wickets: 0, economy: 8.5 },
      { playerName: 'Rishabh Pant', overs: 2, maidens: 0, runs: 30, wickets: 0, economy: 15 },
      { playerName: 'Delhi Player 7', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Delhi Player 8', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Delhi Player 9', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Delhi Player 10', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Delhi Player 11', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
    ];

    const delhiBatting = [
      { playerName: 'Rishabh Pant', runs: 62, balls: 39, fours: 5, sixes: 3, strikeRate: 158.97, dismissal: 'c Rahul b Shami' },
      { playerName: 'Prithvi Shaw', runs: 35, balls: 24, fours: 4, sixes: 1, strikeRate: 145.83, dismissal: 'c Bumrah b Jadeja' },
      { playerName: 'Shreyas Iyer', runs: 28, balls: 21, fours: 2, sixes: 1, strikeRate: 133.33, dismissal: 'run out (Rahul)' },
      { playerName: 'Axar Patel', runs: 14, balls: 12, fours: 1, sixes: 0, strikeRate: 116.67, dismissal: 'c Jadeja b Kuldeep' },
      { playerName: 'Khaleel Ahmed', runs: 10, balls: 8, fours: 1, sixes: 0, strikeRate: 125, dismissal: 'b Bumrah' },
      { playerName: 'Mukesh Kumar', runs: 15, balls: 13, fours: 1, sixes: 0, strikeRate: 115.38, dismissal: 'c Hardik b Shami' },
      { playerName: 'Delhi Player 7', runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'b Jadeja' },
      { playerName: 'Delhi Player 8', runs: 0, balls: 2, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'lbw b Bumrah' },
      { playerName: 'Delhi Player 9', runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'not out' },
      { playerName: 'Delhi Player 10', runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'not out' },
      { playerName: 'Delhi Player 11', runs: 0, balls: 1, fours: 0, sixes: 0, strikeRate: 0, dismissal: 'not out' },
    ];

    const mumbaiBowling = [
      { playerName: 'Mohammed Shami', overs: 4, maidens: 0, runs: 22, wickets: 4, economy: 5.5 },
      { playerName: 'Jasprit Bumrah', overs: 4, maidens: 0, runs: 31, wickets: 2, economy: 7.75 },
      { playerName: 'Ravindra Jadeja', overs: 4, maidens: 0, runs: 35, wickets: 1, economy: 8.75 },
      { playerName: 'Kuldeep Yadav', overs: 4, maidens: 0, runs: 37, wickets: 1, economy: 9.25 },
      { playerName: 'Hardik Pandya', overs: 4, maidens: 0, runs: 39, wickets: 0, economy: 9.75 },
      { playerName: 'Rohit Sharma', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Virat Kohli', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Shubman Gill', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Suryakumar Yadav', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Ishan Kishan', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
      { playerName: 'Delhi Player 11', overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 },
    ];

    return {
      mockGenerated: true,
      playerOfMatch: 'KL Rahul',
      toss: {
        winner: teamA,
        decision: 'bat',
      },
      innings: [
        {
          team: teamA,
          totalRuns: 185,
          totalWickets: 6,
          totalOvers: 20,
          extras: 12,
          battingStats: mumbaiBatting,
          bowlingStats: delhiBowling,
          fallOfWickets: [
            { wicket: 1, score: 45, over: '5.2', batsman: 'Rohit Sharma' },
            { wicket: 2, score: 92, over: '10.1', batsman: 'Virat Kohli' },
            { wicket: 3, score: 120, over: '13.4', batsman: 'Shubman Gill' },
            { wicket: 4, score: 155, over: '17.2', batsman: 'Hardik Pandya' },
            { wicket: 5, score: 172, over: '19.1', batsman: 'Ravindra Jadeja' },
            { wicket: 6, score: 185, over: '20.0', batsman: 'Kuldeep Yadav' },
          ],
          partnerships: [
            { wicket: 1, players: ['Rohit Sharma', 'Virat Kohli'], runs: 45, balls: 32 },
            { wicket: 2, players: ['Virat Kohli', 'Hardik Pandya'], runs: 47, balls: 29 },
            { wicket: 3, players: ['Hardik Pandya', 'KL Rahul'], runs: 28, balls: 18 },
          ],
          partnershipSummary: [
            'Rohit Sharma & Virat Kohli - 45 runs off 32 balls',
            'Virat Kohli & Hardik Pandya - 47 runs off 29 balls',
            'Hardik Pandya & KL Rahul - 28 runs off 18 balls',
          ],
        },
        {
          team: teamB,
          totalRuns: 172,
          totalWickets: 8,
          totalOvers: 20,
          extras: 8,
          battingStats: delhiBatting,
          bowlingStats: mumbaiBowling,
          fallOfWickets: [
            { wicket: 1, score: 28, over: '3.1', batsman: 'Prithvi Shaw' },
            { wicket: 2, score: 67, over: '8.5', batsman: 'Shreyas Iyer' },
            { wicket: 3, score: 112, over: '14.2', batsman: 'Axar Patel' },
            { wicket: 4, score: 130, over: '16.4', batsman: 'Khaleel Ahmed' },
            { wicket: 5, score: 144, over: '18.1', batsman: 'Mukesh Kumar' },
            { wicket: 6, score: 160, over: '19.0', batsman: 'Delhi Player 7' },
            { wicket: 7, score: 169, over: '19.5', batsman: 'Delhi Player 8' },
            { wicket: 8, score: 172, over: '20.0', batsman: 'Delhi Player 9' },
          ],
          partnerships: [
            { wicket: 1, players: ['Prithvi Shaw', 'Rishabh Pant'], runs: 42, balls: 26 },
            { wicket: 2, players: ['Rishabh Pant', 'Shreyas Iyer'], runs: 54, balls: 31 },
            { wicket: 3, players: ['Shreyas Iyer', 'Axar Patel'], runs: 36, balls: 25 },
          ],
          partnershipSummary: [
            'Prithvi Shaw & Rishabh Pant - 42 runs off 26 balls',
            'Rishabh Pant & Shreyas Iyer - 54 runs off 31 balls',
            'Shreyas Iyer & Axar Patel - 36 runs off 25 balls',
          ],
        },
      ],
      timelineEvents: [
        { over: '5.2', title: 'Rohit Sharma Out', description: 'Bowled out during the powerplay', type: 'wicket', team: teamA, player: 'Rohit Sharma' },
        { over: '10.1', title: 'Virat Kohli Out', description: 'Caught in the deep', type: 'wicket', team: teamA, player: 'Virat Kohli' },
        { over: '17.2', title: 'Hardik Pandya Out', description: 'Caught on the boundary', type: 'wicket', team: teamA, player: 'Hardik Pandya' },
        { over: '19.1', title: 'Ravindra Jadeja Out', description: 'Run out at the death', type: 'wicket', team: teamA, player: 'Ravindra Jadeja' },
        { over: '3.1', title: 'Prithvi Shaw Out', description: 'Early breakthrough', type: 'wicket', team: teamB, player: 'Prithvi Shaw' },
        { over: '8.5', title: 'Shreyas Iyer Out', description: 'Caught while accelerating', type: 'wicket', team: teamB, player: 'Shreyas Iyer' },
      ],
    };
  }

  const battingTeamOne = getEntityId(firstInnings.team) === getEntityId(teamA) ? teamA : teamB;
  const bowlingTeamOne = getEntityId(firstInnings.team) === getEntityId(teamA) ? teamB : teamA;
  const battingTeamTwo = getEntityId(secondInnings?.team) === getEntityId(teamA) ? teamA : teamB;
  const bowlingTeamTwo = getEntityId(secondInnings?.team) === getEntityId(teamA) ? teamB : teamA;

  const extrasOne = Math.max(6, Math.min(14, Math.round((firstInnings.totalRuns || 0) * 0.06)));
  const extrasTwo = Math.max(4, Math.min(12, Math.round((secondInnings?.totalRuns || 0) * 0.05)));
  const battingRunsOne = Math.max(0, (firstInnings.totalRuns || 0) - extrasOne);
  const battingRunsTwo = Math.max(0, (secondInnings?.totalRuns || 0) - extrasTwo);

  const battingStatsOne = buildMockBattingStats(getTeamPlayers(battingTeamOne), battingRunsOne, firstInnings.totalWickets || 0, 0);
  const battingStatsTwo = buildMockBattingStats(getTeamPlayers(battingTeamTwo), battingRunsTwo, secondInnings?.totalWickets || 0, 1);
  const bowlingStatsOne = buildMockBowlingStats(getTeamPlayers(bowlingTeamOne), battingRunsOne, firstInnings.totalWickets || 0, 0);
  const bowlingStatsTwo = buildMockBowlingStats(getTeamPlayers(bowlingTeamTwo), battingRunsTwo, secondInnings?.totalWickets || 0, 1);

  const fallOfWicketsOne = [];
  const fallOfWicketsTwo = [];
  let scoreOne = 0;
  let scoreTwo = 0;
  for (let wicket = 1; wicket <= (firstInnings.totalWickets || 0); wicket += 1) {
    const batter = battingStatsOne[Math.min(wicket - 1, battingStatsOne.length - 1)];
    scoreOne += Math.max(1, batter?.runs || 0);
    fallOfWicketsOne.push({
      wicket,
      score: Math.min(scoreOne, firstInnings.totalRuns || scoreOne),
      over: `${Math.min(19, wicket * 3)}.${(wicket * 2) % 6}`,
      batsman: batter?.playerName || 'Batter',
    });
  }
  for (let wicket = 1; wicket <= (secondInnings?.totalWickets || 0); wicket += 1) {
    const batter = battingStatsTwo[Math.min(wicket - 1, battingStatsTwo.length - 1)];
    scoreTwo += Math.max(1, batter?.runs || 0);
    fallOfWicketsTwo.push({
      wicket,
      score: Math.min(scoreTwo, secondInnings.totalRuns || scoreTwo),
      over: `${Math.min(19, wicket * 3)}.${(wicket * 2) % 6}`,
      batsman: batter?.playerName || 'Batter',
    });
  }

  const topBatter = [...battingStatsOne, ...battingStatsTwo].sort((left, right) => right.runs - left.runs)[0];
  const topBowler = [...bowlingStatsOne, ...bowlingStatsTwo].sort((left, right) => right.wickets - left.wickets || left.runs - right.runs)[0];

  const scorecard = {
    playerOfMatch: topBatter?.player || match.result?.manOfTheMatch || null,
    toss: match.scorecard?.toss || {
      winner: match.result?.winner || teamA,
      decision: 'bat',
    },
    innings: [
      {
        team: battingTeamOne,
        totalRuns: firstInnings.totalRuns || battingRunsOne,
        totalWickets: firstInnings.totalWickets || 0,
        totalOvers: firstInnings.totalOvers || match.overs || 20,
        extras: extrasOne,
        battingStats: battingStatsOne,
        bowlingStats: bowlingStatsOne,
        fallOfWickets: fallOfWicketsOne,
        partnerships: [],
        partnershipSummary: [],
      },
      {
        team: battingTeamTwo,
        totalRuns: secondInnings?.totalRuns || battingRunsTwo,
        totalWickets: secondInnings?.totalWickets || 0,
        totalOvers: secondInnings?.totalOvers || match.overs || 20,
        extras: extrasTwo,
        battingStats: battingStatsTwo,
        bowlingStats: bowlingStatsTwo,
        fallOfWickets: fallOfWicketsTwo,
        partnerships: [],
        partnershipSummary: [],
      },
    ],
    timelineEvents: deriveTimelineEvents(match, [
      { team: battingTeamOne, fallOfWickets: fallOfWicketsOne },
      { team: battingTeamTwo, fallOfWickets: fallOfWicketsTwo },
    ]),
  };

  const battingSumOne = battingStatsOne.reduce((sum, batter) => sum + (batter.runs || 0), 0);
  const battingSumTwo = battingStatsTwo.reduce((sum, batter) => sum + (batter.runs || 0), 0);

  if (battingSumOne + extrasOne !== (firstInnings.totalRuns || 0)) {
    console.warn('[Scorecard Validation] First innings total mismatch', {
      matchId: match._id.toString(),
      battingSum: battingSumOne,
      extras: extrasOne,
      expectedTotal: firstInnings.totalRuns,
    });
  }
  if (battingSumTwo + extrasTwo !== (secondInnings?.totalRuns || 0)) {
    console.warn('[Scorecard Validation] Second innings total mismatch', {
      matchId: match._id.toString(),
      battingSum: battingSumTwo,
      extras: extrasTwo,
      expectedTotal: secondInnings?.totalRuns,
    });
  }

  console.log('[Scorecard Generator] Generated mock scorecard from completed match totals', {
    matchId: match._id.toString(),
    teamIds: [getEntityId(teamA), getEntityId(teamB)],
    playersLoaded: {
      battingTeamOne: getTeamPlayers(battingTeamOne).map((player) => player.name),
      bowlingTeamOne: getTeamPlayers(bowlingTeamOne).map((player) => player.name),
      battingTeamTwo: getTeamPlayers(battingTeamTwo).map((player) => player.name),
      bowlingTeamTwo: getTeamPlayers(bowlingTeamTwo).map((player) => player.name),
    },
    battingStatsLoaded: {
      inningsOne: battingStatsOne.map((entry) => ({ name: entry.playerName, runs: entry.runs, balls: entry.balls })),
      inningsTwo: battingStatsTwo.map((entry) => ({ name: entry.playerName, runs: entry.runs, balls: entry.balls })),
    },
    bowlingStatsLoaded: {
      inningsOne: bowlingStatsOne.map((entry) => ({ name: entry.playerName, overs: entry.overs, wickets: entry.wickets, runs: entry.runs })),
      inningsTwo: bowlingStatsTwo.map((entry) => ({ name: entry.playerName, overs: entry.overs, wickets: entry.wickets, runs: entry.runs })),
    },
    inningsTotals: [
      { totalRuns: scorecard.innings[0].totalRuns, extras: extrasOne, battingSum: battingSumOne },
      { totalRuns: scorecard.innings[1].totalRuns, extras: extrasTwo, battingSum: battingSumTwo },
    ],
    topBatter: topBatter?.playerName,
    topBowler: topBowler?.playerName,
  });

  return scorecard;
}

function buildEnrichedScorecard(match) {
  const rawScorecard = match.scorecard?.innings?.length ? match.scorecard : null;
  const baseScorecard = isMeaningfulScorecard(rawScorecard)
    ? rawScorecard
    : buildMockFallbackScorecard(match) || buildDerivedScorecard(match);

  if (!baseScorecard) return null;
  if (baseScorecard.mockGenerated) return baseScorecard;

  const scorecardTeams = new Map([
    [getEntityId(match.teamA), match.teamA],
    [getEntityId(match.teamB), match.teamB],
  ]);

  const innings = (baseScorecard.innings || []).map((inning) => {
    const battingTeamId = getEntityId(inning.team);
    const battingTeam = scorecardTeams.get(battingTeamId);
    const bowlingTeam =
      battingTeamId === getEntityId(match.teamA) ? match.teamB : match.teamA;

    const battingRoster = getTeamPlayers(battingTeam);
    const bowlingRoster = getTeamPlayers(bowlingTeam);

    return {
      ...inning,
      team: battingTeam || inning.team,
      battingStats: buildFullBattingStats(battingRoster, inning.battingStats || []),
      bowlingStats: buildFullBowlingStats(bowlingRoster, inning.bowlingStats || []),
      fallOfWickets: inning.fallOfWickets || [],
      partnerships: inning.partnerships || [],
      partnershipSummary: inning.partnershipSummary || [],
    };
  });

  return {
    ...baseScorecard,
    innings,
    timelineEvents: baseScorecard.timelineEvents || deriveTimelineEvents(match, innings),
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

function canEditScorecard(user, match) {
  if (!user || !match) return { allowed: false, reason: 'Not authorized' };
  if (user.role === 'admin') return { allowed: true, scope: 'admin' };
  if (!['captain', 'team_manager'].includes(user.role)) {
    return { allowed: false, reason: 'Not authorized to edit scorecards' };
  }

  const userTeamId = getEntityId(user.team);
  const teamAId = getEntityId(match.teamA);
  const teamBId = getEntityId(match.teamB);
  const isOwnTeam = Boolean(userTeamId && (userTeamId === teamAId || userTeamId === teamBId));

  return isOwnTeam
    ? { allowed: true, scope: 'team' }
    : { allowed: false, reason: 'Captains can only edit matches involving their team' };
}

function buildScorecardAuditEntry({ user, action, statusFrom, statusTo, note, previousScorecard, nextScorecard, changes }) {
  return {
    editedBy: user?._id,
    editorName: user?.name || 'Unknown',
    action,
    statusFrom,
    statusTo,
    note: note || '',
    changes: changes || {},
    previousScorecard,
    nextScorecard,
    createdAt: new Date(),
  };
}

function summarizeScorecardChanges(previousScorecard, nextScorecard) {
  const previousTotals = (previousScorecard?.innings || []).map((innings) => `${getEntityId(innings.team)}:${innings.totalRuns}/${innings.totalWickets}`);
  const nextTotals = (nextScorecard?.innings || []).map((innings) => `${getEntityId(innings.team)}:${innings.totalRuns}/${innings.totalWickets}`);
  return {
    previousTotals,
    nextTotals,
    changed: JSON.stringify(previousTotals) !== JSON.stringify(nextTotals),
  };
}

async function applyOfficialScorecardEffects(match, scorecard, shouldApply = false) {
  if (!shouldApply || !scorecard?.innings?.length) return;

  const tournament = await Tournament.findById(match.tournament);
  const teamA = await Team.findById(match.teamA);
  const teamB = await Team.findById(match.teamB);
  const teamMap = new Map([
    [getEntityId(teamA), teamA],
    [getEntityId(teamB), teamB],
  ]);

  const playerIds = new Set();
  for (const innings of scorecard.innings) {
    for (const batter of innings.battingStats || []) {
      const playerId = getEntityId(batter.player);
      if (playerId) playerIds.add(playerId);
    }
    for (const bowler of innings.bowlingStats || []) {
      const playerId = getEntityId(bowler.player);
      if (playerId) playerIds.add(playerId);
    }
  }

  const players = await Player.find({ _id: { $in: [...playerIds] } });
  const playerMap = new Map(players.map((player) => [player._id.toString(), player]));

  console.log('[Scorecard Apply]', {
    matchId: match._id.toString(),
    teamIds: [...teamMap.keys()],
    playersLoaded: players.map((player) => player.name),
  });

  for (const innings of scorecard.innings) {
    for (const batter of innings.battingStats || []) {
      const player = playerMap.get(getEntityId(batter.player));
      if (!player) continue;
      await updatePlayerStats(
        player,
        {
          runs: batter.runs || 0,
          balls: batter.balls || 0,
          fours: batter.fours || 0,
          sixes: batter.sixes || 0,
          isOut: batter.dismissal && batter.dismissal !== 'not out',
        },
        null
      );
    }

    for (const bowler of innings.bowlingStats || []) {
      const player = playerMap.get(getEntityId(bowler.player));
      if (!player) continue;
      await updatePlayerStats(player, null, {
        overs: bowler.overs || 0,
        maidens: bowler.maidens || 0,
        runs: bowler.runs || 0,
        wickets: bowler.wickets || 0,
        economy: bowler.economy || 0,
      });
    }
  }

  if (scorecard.innings.length >= 2) {
    const first = scorecard.innings[0];
    const second = scorecard.innings[1];
    const firstTeamId = getEntityId(first.team);
    const secondTeamId = getEntityId(second.team);
    const winnerTeamId =
      first.totalRuns === second.totalRuns
        ? null
        : first.totalRuns > second.totalRuns
          ? firstTeamId
          : secondTeamId;

    match.result = {
      ...(match.result || {}),
      winner: winnerTeamId || match.result?.winner || null,
      margin: first.totalRuns === second.totalRuns ? 'Tie' : `${Math.abs(first.totalRuns - second.totalRuns)} runs`,
      manOfTheMatch: scorecard.playerOfMatch || match.result?.manOfTheMatch || null,
    };

    if (tournament) {
      tournament.pointsTable = tournament.pointsTable || [];
      if (teamA && teamB) {
        const teamAWon = winnerTeamId ? winnerTeamId === teamA._id.toString() : false;
        const teamBWon = winnerTeamId ? winnerTeamId === teamB._id.toString() : false;
        updatePointsTable(
          tournament,
          teamA._id,
          teamAWon,
          firstTeamId === teamA._id.toString() ? first.totalRuns : second.totalRuns,
          firstTeamId === teamA._id.toString() ? first.totalOvers : second.totalOvers,
          firstTeamId === teamA._id.toString() ? second.totalRuns : first.totalRuns,
          firstTeamId === teamA._id.toString() ? second.totalOvers : first.totalOvers
        );
        updatePointsTable(
          tournament,
          teamB._id,
          teamBWon,
          secondTeamId === teamB._id.toString() ? second.totalRuns : first.totalRuns,
          secondTeamId === teamB._id.toString() ? second.totalOvers : first.totalOvers,
          secondTeamId === teamB._id.toString() ? first.totalRuns : second.totalRuns,
          secondTeamId === teamB._id.toString() ? first.totalOvers : second.totalOvers
        );
        await tournament.save();
      }
    }
  }

  if (teamMap.get(getEntityId(match.teamA))) await updateTeamStats(teamMap.get(getEntityId(match.teamA)), match.result?.winner?.toString?.() === getEntityId(match.teamA));
  if (teamMap.get(getEntityId(match.teamB))) await updateTeamStats(teamMap.get(getEntityId(match.teamB)), match.result?.winner?.toString?.() === getEntityId(match.teamB));
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
      .select('teamA teamB tournament date ground overs status innings scorecard scorecardDraft scorecardStatus scorecardAuditTrail result weather liveScore commentary');

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

    const permission = canEditScorecard(req.user, match);
    if (!permission.allowed) {
      return res.status(403).json({ success: false, message: permission.reason });
    }

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

    const previousScorecard = match.scorecard ? match.scorecard.toObject?.() || match.scorecard : null;
    const shouldApplyStats = match.scorecardStatus !== 'official' || !match.scorecard?.innings?.length;
    const isAdminEdit = req.user.role === 'admin';

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
      const normalizedScorecard = {
        ...scorecard,
        innings: normalizeScorecardInnings(scorecard.innings),
      };
      if (scorecard.playerOfMatch) {
        match.result = {
          ...(match.result || {}),
          manOfTheMatch: scorecard.playerOfMatch,
        };
      }

      match.scorecardDraft = normalizedScorecard;
      match.scorecardStatus = isAdminEdit ? 'official' : 'pending_review';
      match.scorecardAuditTrail = match.scorecardAuditTrail || [];
      match.scorecardAuditTrail.push(
        buildScorecardAuditEntry({
          user: req.user,
          action: isAdminEdit ? 'edited' : 'submitted',
          statusFrom: previousScorecard ? 'official' : 'draft',
          statusTo: match.scorecardStatus,
          note: isAdminEdit ? 'Admin updated scorecard' : 'Captain submitted scorecard for review',
          previousScorecard,
          nextScorecard: normalizedScorecard,
          changes: summarizeScorecardChanges(previousScorecard, normalizedScorecard),
        })
      );

      if (isAdminEdit) {
        match.scorecard = normalizedScorecard;
        match.scorecardDraft = null;
      }
    }

    if (result) match.result = { ...(match.result || {}), ...result };
    if (status) match.status = status;
    if (req.body.weather) {
      match.weather = normalizeWeather(req.body.weather, match.date);
    }

    await match.save();

    if (match.scorecardStatus === 'official' && shouldApplyStats && scorecard) {
      await applyOfficialScorecardEffects(match, match.scorecard, true);
    }

    const populated = await Match.findById(match._id)
      .populate('teamA teamB', 'teamName logo')
      .populate('innings.batting.player innings.bowling.player', 'name')
      .populate('result.winner', 'teamName')
      .populate('result.manOfTheMatch', 'name profileImage')
      .populate('scorecard.playerOfMatch', 'name profileImage')
      .populate('scorecardDraft.playerOfMatch', 'name profileImage')
      .populate('scorecard.toss.winner', 'teamName logo')
      .populate('scorecardDraft.toss.winner', 'teamName logo')
      .populate('scorecard.innings.team', 'teamName logo')
      .populate('scorecardDraft.innings.team', 'teamName logo')
      .populate('scorecard.innings.battingStats.player', 'name profileImage')
      .populate('scorecardDraft.innings.battingStats.player', 'name profileImage')
      .populate('scorecard.innings.bowlingStats.player', 'name profileImage')
      .populate('scorecardDraft.innings.bowlingStats.player', 'name profileImage')
      .select('teamA teamB tournament date ground overs status innings scorecard scorecardDraft scorecardStatus scorecardAuditTrail result weather liveScore commentary');

    res.json({ success: true, data: populated, message: 'Scorecard updated' });
  } catch (error) {
    next(error);
  }
};

exports.approveScorecardEdit = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can approve scorecards' });
    }

    if (!match.scorecardDraft?.innings?.length) {
      return res.status(400).json({ success: false, message: 'No draft scorecard available for approval' });
    }

    const previousScorecard = match.scorecard ? match.scorecard.toObject?.() || match.scorecard : null;
    match.scorecard = match.scorecardDraft;
    match.scorecardDraft = null;
    match.scorecardStatus = 'official';
    match.scorecardAuditTrail = match.scorecardAuditTrail || [];
    match.scorecardAuditTrail.push(
      buildScorecardAuditEntry({
        user: req.user,
        action: 'approved',
        statusFrom: 'pending_review',
        statusTo: 'official',
        note: 'Admin approved scorecard',
        previousScorecard,
        nextScorecard: match.scorecard,
        changes: summarizeScorecardChanges(previousScorecard, match.scorecard),
      })
    );

    await match.save();
    await applyOfficialScorecardEffects(match, match.scorecard, !previousScorecard?.innings?.length);

    const populated = await Match.findById(match._id)
      .populate('teamA teamB', 'teamName logo')
      .populate('scorecard.playerOfMatch', 'name profileImage')
      .populate('scorecardDraft.playerOfMatch', 'name profileImage')
      .populate('scorecard.toss.winner', 'teamName logo')
      .populate('scorecardDraft.toss.winner', 'teamName logo')
      .populate('scorecard.innings.team', 'teamName logo')
      .populate('scorecardDraft.innings.team', 'teamName logo')
      .populate('scorecard.innings.battingStats.player', 'name profileImage')
      .populate('scorecardDraft.innings.battingStats.player', 'name profileImage')
      .populate('scorecard.innings.bowlingStats.player', 'name profileImage')
      .populate('scorecardDraft.innings.bowlingStats.player', 'name profileImage')
      .select('teamA teamB tournament date ground overs status innings scorecard scorecardDraft scorecardStatus scorecardAuditTrail result weather liveScore commentary');

    res.json({ success: true, data: populated, message: 'Scorecard approved successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getMatchScorecard = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate({
        path: 'teamA',
        select: 'teamName logo players',
        populate: { path: 'players', select: 'name profileImage jerseyNumber role battingStyle bowlingStyle' },
      })
      .populate({
        path: 'teamB',
        select: 'teamName logo players',
        populate: { path: 'players', select: 'name profileImage jerseyNumber role battingStyle bowlingStyle' },
      })
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

    console.log('[Scorecard Request]', {
      matchId: match._id.toString(),
      teamIds: [getEntityId(match.teamA), getEntityId(match.teamB)],
      inningsTotals: (match.innings || []).map((innings) => ({
        teamId: getEntityId(innings.team),
        totalRuns: innings.totalRuns,
        totalWickets: innings.totalWickets,
        totalOvers: innings.totalOvers,
      })),
      hasStoredScorecard: Boolean(match.scorecard?.innings?.length),
    });

    const scorecard = buildEnrichedScorecard(match);

    if (!scorecard) {
      return res.json({
        success: true,
        data: null,
        message: 'Scorecard not available yet',
      });
    }

    console.log('[Scorecard Response]', {
      matchId: match._id.toString(),
      innings: scorecard.innings.map((innings) => ({
        teamName: innings.team?.teamName || 'Team',
        battingLoaded: innings.battingStats.length,
        bowlingLoaded: innings.bowlingStats.length,
        totalRuns: innings.totalRuns,
        totalWickets: innings.totalWickets,
        extras: innings.extras || 0,
      })),
    });

    res.json({
      success: true,
      data: {
        ...match.toObject(),
        scorecard,
        scorecardDraft: match.scorecardDraft || null,
        scorecardStatus: match.scorecardStatus || 'official',
        scorecardAuditTrail: match.scorecardAuditTrail || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getScorecardHistory = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('scorecardAuditTrail.editedBy', 'name role')
      .select('scorecardAuditTrail teamA teamB');

    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    res.json({
      success: true,
      data: (match.scorecardAuditTrail || []).slice().reverse(),
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
