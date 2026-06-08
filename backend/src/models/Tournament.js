const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tournament title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      default: '',
    },
    registrationFee: {
      type: Number,
      default: 0,
    },
    prizePool: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    overs: {
      type: Number,
      default: 20,
    },
    maxTeams: {
      type: Number,
      default: 16,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    teams: [
      {
        team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        registrationStatus: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        registeredAt: { type: Date, default: Date.now },
      },
    ],
    pointsTable: [
      {
        team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        matches: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        lost: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
        nrr: { type: Number, default: 0 },
        runsScored: { type: Number, default: 0 },
        oversFaced: { type: Number, default: 0 },
        runsConceded: { type: Number, default: 0 },
        oversBowled: { type: Number, default: 0 },
      },
    ],
    sponsors: [
      {
        name: String,
        logo: String,
        website: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tournament', tournamentSchema);
