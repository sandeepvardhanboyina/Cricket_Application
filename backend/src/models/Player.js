const mongoose = require('mongoose');

const statisticsSchema = new mongoose.Schema(
  {
    batting: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      fifties: { type: Number, default: 0 },
      hundreds: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      notOuts: { type: Number, default: 0 },
    },
    bowling: {
      matches: { type: Number, default: 0 },
      innings: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      bestBowling: { type: String, default: '0/0' },
      maidens: { type: Number, default: 0 },
    },
    fielding: {
      catches: { type: Number, default: 0 },
      runOuts: { type: Number, default: 0 },
      stumpings: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    role: {
      type: String,
      enum: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'],
      required: true,
    },
    battingStyle: {
      type: String,
      enum: ['Right-hand bat', 'Left-hand bat'],
      default: 'Right-hand bat',
    },
    bowlingStyle: {
      type: String,
      enum: [
        'Right-arm fast',
        'Right-arm medium',
        'Right-arm offbreak',
        'Right-arm legbreak',
        'Left-arm fast',
        'Left-arm medium',
        'Left-arm orthodox',
        'Left-arm chinaman',
        'Does not bowl',
      ],
      default: 'Does not bowl',
    },
    jerseyNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },
    profileImage: {
      type: String,
      default: '',
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    registrationType: {
      type: String,
      enum: ['team', 'individual'],
      default: 'team',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isCaptain: {
      type: Boolean,
      default: false,
    },
    statistics: {
      type: statisticsSchema,
      default: () => ({}),
    },
    careerHistory: [
      {
        match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
        runs: Number,
        balls: Number,
        wickets: Number,
        catches: Number,
        date: Date,
      },
    ],
  },
  { timestamps: true }
);

playerSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
});

playerSchema.set('toJSON', { virtuals: true });
playerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Player', playerSchema);
