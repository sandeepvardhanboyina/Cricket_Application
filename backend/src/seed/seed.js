require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-tournament-hub');
};

const seed = async () => {
  try {
    await connectDB();
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Team.deleteMany(),
      Player.deleteMany(),
      Tournament.deleteMany(),
      Match.deleteMany(),
    ]);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@crickethub.com',
      password: 'admin123',
      role: 'admin',
    });

    const manager = await User.create({
      name: 'Team Manager',
      email: 'manager@crickethub.com',
      password: 'manager123',
      role: 'team_manager',
    });

    const team = await Team.create({
      teamName: 'Mumbai Strikers',
      captain: 'Rohit Sharma',
      captainEmail: 'manager@crickethub.com',
      mobileNumber: '9876543210',
      city: 'Mumbai',
      logo: '',
      manager: manager._id,
      status: 'approved',
      statistics: { matches: 5, wins: 3, losses: 2, winPercentage: 60 },
    });

    manager.team = team._id;
    await manager.save();

    const playerNames = [
      { name: 'Rohit Sharma', role: 'Batsman', jersey: 45, isCaptain: true },
      { name: 'Virat Kohli', role: 'Batsman', jersey: 18 },
      { name: 'Jasprit Bumrah', role: 'Bowler', jersey: 93 },
      { name: 'Hardik Pandya', role: 'All-Rounder', jersey: 33 },
      { name: 'KL Rahul', role: 'Wicket Keeper', jersey: 1 },
      { name: 'Ravindra Jadeja', role: 'All-Rounder', jersey: 8 },
      { name: 'Mohammed Shami', role: 'Bowler', jersey: 11 },
      { name: 'Shubman Gill', role: 'Batsman', jersey: 77 },
      { name: 'Kuldeep Yadav', role: 'Bowler', jersey: 23 },
      { name: 'Suryakumar Yadav', role: 'Batsman', jersey: 63 },
      { name: 'Ishan Kishan', role: 'Wicket Keeper', jersey: 32 },
    ];

    const players = [];
    for (const p of playerNames) {
      const player = await Player.create({
        name: p.name,
        dateOfBirth: new Date('1990-01-15'),
        role: p.role,
        battingStyle: 'Right-hand bat',
        bowlingStyle: p.role === 'Bowler' ? 'Right-arm fast' : 'Does not bowl',
        jerseyNumber: p.jersey,
        team: team._id,
        isCaptain: p.isCaptain || false,
        isVerified: true,
        statistics: {
          batting: {
            matches: 5,
            innings: 5,
            runs: Math.floor(Math.random() * 300) + 50,
            highestScore: Math.floor(Math.random() * 100) + 30,
            fifties: Math.floor(Math.random() * 3),
            hundreds: 0,
            fours: Math.floor(Math.random() * 30),
            sixes: Math.floor(Math.random() * 15),
            average: parseFloat((Math.random() * 50 + 20).toFixed(2)),
            strikeRate: parseFloat((Math.random() * 50 + 100).toFixed(2)),
          },
          bowling: {
            wickets: p.role === 'Bowler' ? Math.floor(Math.random() * 15) + 5 : 0,
            economy: parseFloat((Math.random() * 4 + 5).toFixed(2)),
            average: parseFloat((Math.random() * 20 + 15).toFixed(2)),
            overs: Math.floor(Math.random() * 20) + 10,
          },
          fielding: { catches: Math.floor(Math.random() * 5) },
        },
      });
      players.push(player._id);
    }

    team.players = players;
    await team.save();

    const team2 = await Team.create({
      teamName: 'Delhi Warriors',
      captain: 'Rishabh Pant',
      captainEmail: 'pant@delhi.com',
      mobileNumber: '9876543211',
      city: 'Delhi',
      status: 'approved',
      statistics: { matches: 5, wins: 2, losses: 3, winPercentage: 40 },
    });

    const tournament = await Tournament.create({
      title: 'Premier Cricket League 2026',
      description: 'The biggest cricket tournament of the year featuring top teams from across the nation.',
      registrationFee: 5000,
      prizePool: 100000,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      overs: 20,
      maxTeams: 16,
      status: 'ongoing',
      createdBy: admin._id,
      teams: [
        { team: team._id, registrationStatus: 'approved' },
        { team: team2._id, registrationStatus: 'approved' },
      ],
      pointsTable: [
        { team: team._id, matches: 2, won: 1, lost: 1, points: 2, nrr: 0.5 },
        { team: team2._id, matches: 2, won: 1, lost: 1, points: 2, nrr: -0.5 },
      ],
      sponsors: [
        { name: 'SportsGear Pro', logo: '', website: 'https://example.com' },
        { name: 'Cricket World', logo: '', website: 'https://example.com' },
      ],
    });

    await Match.create({
      tournament: tournament._id,
      teamA: team._id,
      teamB: team2._id,
      date: new Date('2026-06-15'),
      ground: 'Wankhede Stadium',
      overs: 20,
      status: 'completed',
      innings: [
        {
          team: team._id,
          totalRuns: 185,
          totalWickets: 6,
          totalOvers: 20,
          batting: [],
          bowling: [],
        },
        {
          team: team2._id,
          totalRuns: 172,
          totalWickets: 8,
          totalOvers: 20,
          batting: [],
          bowling: [],
        },
      ],
      result: { winner: team._id, margin: '13 runs' },
      createdBy: admin._id,
    });

    console.log('Seed data created successfully!');
    console.log('Admin: admin@crickethub.com / admin123');
    console.log('Manager: manager@crickethub.com / manager123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
