const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      unique: true,
    },
    captain: {
      type: String,
      required: [true, 'Captain name is required'],
    },
    captainEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: '',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    statistics: {
      matches: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      winPercentage: { type: Number, default: 0 },
      totalRuns: { type: Number, default: 0 },
      totalWickets: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
  },
  { timestamps: true }
);

teamSchema.pre('save', function (next) {
  if (this.statistics.matches > 0) {
    this.statistics.winPercentage = parseFloat(
      ((this.statistics.wins / this.statistics.matches) * 100).toFixed(2)
    );
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);
