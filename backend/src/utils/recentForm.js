const Match = require('../models/Match');

const buildRecentFormMap = async (teamIds, limit = 5) => {
  if (!teamIds.length) return new Map();

  const matches = await Match.find({
    status: { $in: ['completed', 'abandoned'] },
    $or: [{ teamA: { $in: teamIds } }, { teamB: { $in: teamIds } }],
  })
    .populate('result.winner', '_id')
    .sort({ date: -1, createdAt: -1 })
    .select('teamA teamB date status result');

  const recentFormMap = new Map();

  for (const teamId of teamIds.map((id) => id.toString())) {
    recentFormMap.set(teamId, []);
  }

  for (const match of matches) {
    const teamAId = match.teamA.toString();
    const teamBId = match.teamB.toString();
    const winnerId = match.result?.winner?._id?.toString?.() || match.result?.winner?.toString?.();

    for (const teamId of [teamAId, teamBId]) {
      const form = recentFormMap.get(teamId);
      if (!form || form.length >= limit) continue;

      let result = 'NR';
      if (match.status === 'completed' && winnerId) {
        result = winnerId === teamId ? 'W' : 'L';
      }

      if (match.status === 'abandoned') {
        result = 'NR';
      }

      form.push(result);
    }
  }

  return recentFormMap;
};

module.exports = { buildRecentFormMap };
