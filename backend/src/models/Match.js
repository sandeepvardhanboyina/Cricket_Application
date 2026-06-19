const mongoose = require('mongoose');

const battingEntrySchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    isOut: { type: Boolean, default: false },
    dismissalType: String,
    dismissedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  },
  { _id: false }
);

const bowlingEntrySchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    overs: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
  },
  { _id: false }
);

const battingStatsSchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    playerName: { type: String, default: '' },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    dismissal: { type: String, default: '' },
  },
  { _id: false }
);

const bowlingStatsSchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    playerName: { type: String, default: '' },
    overs: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
  },
  { _id: false }
);

const fallOfWicketsSchema = new mongoose.Schema(
  {
    wicket: { type: Number, required: true },
    score: { type: Number, required: true },
    over: { type: String, default: '' },
    batsman: { type: String, default: '' },
    wicketText: { type: String, default: '' },
  },
  { _id: false }
);

const partnershipSchema = new mongoose.Schema(
  {
    wicket: { type: Number, default: null },
    players: [{ type: String }],
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    over: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    type: { type: String, default: 'event' },
  },
  { _id: false }
);

const scorecardInningsSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalOvers: { type: Number, default: 0 },
    extras: { type: Number, default: 0 },
    battingStats: [battingStatsSchema],
    bowlingStats: [bowlingStatsSchema],
    fallOfWickets: [fallOfWicketsSchema],
    partnerships: [partnershipSchema],
    partnershipSummary: [{ type: String }],
  },
  { _id: false }
);

const scorecardSchema = new mongoose.Schema(
  {
    playerOfMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    toss: {
      winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      decision: { type: String, enum: ['bat', 'bowl'], default: 'bat' },
    },
    innings: [scorecardInningsSchema],
    timelineEvents: [timelineEventSchema],
  },
  { _id: false }
);

const scorecardAuditSchema = new mongoose.Schema(
  {
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editorName: { type: String, default: '' },
    action: { type: String, enum: ['submitted', 'approved', 'edited'], default: 'edited' },
    statusFrom: { type: String, default: '' },
    statusTo: { type: String, default: '' },
    note: { type: String, default: '' },
    changes: { type: Object, default: {} },
    previousScorecard: { type: scorecardSchema, default: null },
    nextScorecard: { type: scorecardSchema, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inningsSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalOvers: { type: Number, default: 0 },
    extras: { type: Number, default: 0 },
    batting: [battingEntrySchema],
    bowling: [bowlingEntrySchema],
  },
  { _id: false }
);

const commentarySchema = new mongoose.Schema(
  {
    over: Number,
    ball: Number,
    text: String,
    runs: Number,
    isWicket: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const weatherSchema = new mongoose.Schema(
  {
    temperature: { type: Number, default: null },
    condition: { type: String, default: '' },
    rainChance: { type: Number, default: null },
    windSpeed: { type: Number, default: null },
    icon: { type: String, default: '' },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    ground: {
      type: String,
      required: true,
    },
    overs: {
      type: Number,
      default: 20,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'abandoned'],
      default: 'scheduled',
    },
    innings: [inningsSchema],
    scorecard: {
      type: scorecardSchema,
      default: () => ({}),
    },
    scorecardDraft: {
      type: scorecardSchema,
      default: null,
    },
    scorecardStatus: {
      type: String,
      enum: ['official', 'pending_review', 'draft'],
      default: 'official',
    },
    scorecardAuditTrail: {
      type: [scorecardAuditSchema],
      default: [],
    },
    result: {
      winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      margin: String,
      manOfTheMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    },
    liveScore: {
      currentInnings: { type: Number, default: 0 },
      currentOver: { type: Number, default: 0 },
      currentBall: { type: Number, default: 0 },
      lastUpdated: Date,
    },
    weather: {
      type: weatherSchema,
      default: () => ({}),
    },
    commentary: [commentarySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
