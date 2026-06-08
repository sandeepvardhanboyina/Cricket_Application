/**
 * Recalculate player batting/bowling statistics after a match
 */
const updatePlayerStats = async (player, battingEntry, bowlingEntry, fielding = {}) => {
  const stats = player.statistics;

  if (battingEntry) {
    stats.batting.matches += 1;
    stats.batting.innings += 1;
    stats.batting.runs += battingEntry.runs || 0;
    stats.batting.fours += battingEntry.fours || 0;
    stats.batting.sixes += battingEntry.sixes || 0;

    if (battingEntry.runs > stats.batting.highestScore) {
      stats.batting.highestScore = battingEntry.runs;
    }
    if (battingEntry.runs >= 100) stats.batting.hundreds += 1;
    else if (battingEntry.runs >= 50) stats.batting.fifties += 1;

    if (!battingEntry.isOut) stats.batting.notOuts += 1;

    const dismissals = stats.batting.innings - stats.batting.notOuts;
    stats.batting.average =
      dismissals > 0 ? parseFloat((stats.batting.runs / dismissals).toFixed(2)) : stats.batting.runs;

    if (battingEntry.balls > 0) {
      const totalBalls = (stats.batting.strikeRate > 0 ? 0 : 0); // recalc from career
      // Simplified strike rate update
      const prevTotalBalls = stats.batting.innings > 1
        ? Math.round((stats.batting.strikeRate * (stats.batting.innings - 1)) / 100 * 20)
        : 0;
      const allBalls = prevTotalBalls + (battingEntry.balls || 0);
      stats.batting.strikeRate =
        allBalls > 0 ? parseFloat(((stats.batting.runs / allBalls) * 100).toFixed(2)) : 0;
    }
  }

  if (bowlingEntry && bowlingEntry.overs > 0) {
    stats.bowling.matches += 1;
    stats.bowling.innings += 1;
    stats.bowling.overs += bowlingEntry.overs || 0;
    stats.bowling.wickets += bowlingEntry.wickets || 0;
    stats.bowling.runs += bowlingEntry.runs || 0;
    stats.bowling.maidens += bowlingEntry.maidens || 0;

    stats.bowling.economy =
      stats.bowling.overs > 0
        ? parseFloat((stats.bowling.runs / stats.bowling.overs).toFixed(2))
        : 0;

    stats.bowling.average =
      stats.bowling.wickets > 0
        ? parseFloat((stats.bowling.runs / stats.bowling.wickets).toFixed(2))
        : 0;

    const current = `${bowlingEntry.wickets}/${bowlingEntry.runs}`;
    const [bestW, bestR] = (stats.bowling.bestBowling || '0/0').split('/').map(Number);
    if (bowlingEntry.wickets > bestW || (bowlingEntry.wickets === bestW && bowlingEntry.runs < bestR)) {
      stats.bowling.bestBowling = current;
    }
  }

  if (fielding.catches) stats.fielding.catches += fielding.catches;
  if (fielding.runOuts) stats.fielding.runOuts += fielding.runOuts;
  if (fielding.stumpings) stats.fielding.stumpings += fielding.stumpings;

  player.statistics = stats;
  await player.save();
};

/**
 * Update tournament points table after match completion
 */
const updatePointsTable = (tournament, teamId, won, runsScored, oversFaced, runsConceded, oversBowled) => {
  let entry = tournament.pointsTable.find((p) => p.team.toString() === teamId.toString());

  if (!entry) {
    entry = {
      team: teamId,
      matches: 0,
      won: 0,
      lost: 0,
      points: 0,
      nrr: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
    };
    tournament.pointsTable.push(entry);
  }

  entry.matches += 1;
  if (won) {
    entry.won += 1;
    entry.points += 2;
  } else {
    entry.lost += 1;
  }
  entry.runsScored += runsScored;
  entry.oversFaced += oversFaced;
  entry.runsConceded += runsConceded;
  entry.oversBowled += oversBowled;

  const runRate = entry.oversFaced > 0 ? entry.runsScored / entry.oversFaced : 0;
  const concededRate = entry.oversBowled > 0 ? entry.runsConceded / entry.oversBowled : 0;
  entry.nrr = parseFloat((runRate - concededRate).toFixed(3));

  return tournament;
};

/**
 * Update team win/loss statistics
 */
const updateTeamStats = async (team, won) => {
  team.statistics.matches += 1;
  if (won) team.statistics.wins += 1;
  else team.statistics.losses += 1;
  team.statistics.winPercentage = parseFloat(
    ((team.statistics.wins / team.statistics.matches) * 100).toFixed(2)
  );
  await team.save();
};

module.exports = { updatePlayerStats, updatePointsTable, updateTeamStats };
