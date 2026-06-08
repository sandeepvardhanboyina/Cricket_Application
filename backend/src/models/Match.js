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
    commentary: [commentarySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
