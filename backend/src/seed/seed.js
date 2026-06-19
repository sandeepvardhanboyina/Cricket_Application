require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const { createMockWeather } = require('../utils/weather');

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
        availabilityStatus: 'AVAILABLE',
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

    const team3 = await Team.create({
      teamName: 'Aces',
      captain: 'Shreyas Iyer',
      captainEmail: 'aces@crickethub.com',
      mobileNumber: '9876543212',
      city: 'Bengaluru',
      logo: '',
      status: 'approved',
      statistics: { matches: 5, wins: 2, losses: 3, winPercentage: 40 },
    });

    const team2PlayerNames = [
      { name: 'Rishabh Pant', role: 'Wicket Keeper', jersey: 17, isCaptain: true },
      { name: 'Prithvi Shaw', role: 'Batsman', jersey: 5 },
      { name: 'Shreyas Iyer', role: 'Batsman', jersey: 41 },
      { name: 'Axar Patel', role: 'All-Rounder', jersey: 20 },
      { name: 'Khaleel Ahmed', role: 'Bowler', jersey: 33 },
      { name: 'Mukesh Kumar', role: 'Bowler', jersey: 49 },
    ];

    const team2Players = [];
    for (const p of team2PlayerNames) {
      const player = await Player.create({
        name: p.name,
        dateOfBirth: new Date('1992-01-15'),
        role: p.role,
        battingStyle: 'Right-hand bat',
        bowlingStyle: p.role === 'Bowler' ? 'Right-arm fast-medium' : 'Does not bowl',
        jerseyNumber: p.jersey,
        availabilityStatus: 'AVAILABLE',
        team: team2._id,
        isCaptain: p.isCaptain || false,
        isVerified: true,
        statistics: {
          batting: {
            matches: 5,
            innings: 5,
            runs: Math.floor(Math.random() * 250) + 40,
            highestScore: Math.floor(Math.random() * 100) + 20,
            fifties: Math.floor(Math.random() * 2),
            hundreds: 0,
            fours: Math.floor(Math.random() * 25),
            sixes: Math.floor(Math.random() * 12),
            average: parseFloat((Math.random() * 40 + 18).toFixed(2)),
            strikeRate: parseFloat((Math.random() * 45 + 100).toFixed(2)),
          },
          bowling: {
            wickets: p.role === 'Bowler' ? Math.floor(Math.random() * 12) + 3 : 0,
            economy: parseFloat((Math.random() * 4 + 6).toFixed(2)),
            average: parseFloat((Math.random() * 20 + 15).toFixed(2)),
            overs: Math.floor(Math.random() * 18) + 8,
          },
          fielding: { catches: Math.floor(Math.random() * 4) },
        },
      });
      team2Players.push(player._id);
    }

    team2.players = team2Players;
    await team2.save();

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
        { team: team3._id, registrationStatus: 'approved' },
      ],
      pointsTable: [
        { team: team._id, matches: 2, won: 1, lost: 1, points: 2, nrr: 0.5 },
        { team: team2._id, matches: 2, won: 1, lost: 1, points: 2, nrr: -0.5 },
        { team: team3._id, matches: 0, won: 0, lost: 0, points: 0, nrr: 0 },
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
      weather: createMockWeather(new Date('2026-06-15')),
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
      scorecard: {
        playerOfMatch: players[4],
        toss: { winner: team._id, decision: 'bat' },
        innings: [
          {
            team: team._id,
            totalRuns: 185,
            totalWickets: 6,
            totalOvers: 20,
            extras: 12,
            battingStats: [
              { player: players[4], playerName: 'KL Rahul', runs: 89, balls: 54, fours: 8, sixes: 4, strikeRate: 164.81, dismissal: 'c Shaw b Shami' },
              { player: players[3], playerName: 'Hardik Pandya', runs: 45, balls: 28, fours: 3, sixes: 2, strikeRate: 160.71, dismissal: 'lbw b Bumrah' },
              { player: players[1], playerName: 'Virat Kohli', runs: 30, balls: 22, fours: 2, sixes: 1, strikeRate: 136.36, dismissal: 'c Pant b Khaleel' },
            ],
            bowlingStats: [
              { player: team2Players[4], playerName: 'Khaleel Ahmed', overs: 4, maidens: 0, runs: 22, wickets: 2, economy: 5.5 },
              { player: team2Players[5], playerName: 'Mukesh Kumar', overs: 4, maidens: 0, runs: 31, wickets: 2, economy: 7.75 },
            ],
            fallOfWickets: [
              { wicket: 1, score: 45, over: '5.4', batsman: 'Rohit Sharma' },
              { wicket: 2, score: 82, over: '10.2', batsman: 'Virat Kohli' },
              { wicket: 3, score: 120, over: '14.6', batsman: 'Suryakumar Yadav' },
            ],
            partnerships: [
              { wicket: 1, players: ['Rohit Sharma', 'Virat Kohli'], runs: 74, balls: 42 },
              { wicket: 2, players: ['Virat Kohli', 'Hardik Pandya'], runs: 38, balls: 24 },
              { wicket: 3, players: ['Hardik Pandya', 'KL Rahul'], runs: 33, balls: 19 },
            ],
            partnershipSummary: ['Rohit Sharma & Virat Kohli - 74 runs off 42 balls', 'Virat Kohli & Hardik Pandya - 38 runs off 24 balls', 'Hardik Pandya & KL Rahul - 33 runs off 19 balls'],
          },
          {
            team: team2._id,
            totalRuns: 172,
            totalWickets: 8,
            totalOvers: 20,
            extras: 9,
            battingStats: [
              { player: team2Players[0], playerName: 'Rishabh Pant', runs: 62, balls: 39, fours: 5, sixes: 3, strikeRate: 158.97, dismissal: 'c Bumrah b Shami' },
              { player: team2Players[1], playerName: 'Prithvi Shaw', runs: 35, balls: 24, fours: 4, sixes: 1, strikeRate: 145.83, dismissal: 'lbw b Jadeja' },
              { player: team2Players[2], playerName: 'Shreyas Iyer', runs: 28, balls: 21, fours: 2, sixes: 1, strikeRate: 133.33, dismissal: 'run out (Rahul)' },
            ],
            bowlingStats: [
              { player: players[6], playerName: 'Mohammed Shami', overs: 4, maidens: 0, runs: 22, wickets: 4, economy: 5.5 },
              { player: players[2], playerName: 'Jasprit Bumrah', overs: 4, maidens: 0, runs: 31, wickets: 2, economy: 7.75 },
            ],
            fallOfWickets: [
              { wicket: 1, score: 28, over: '3.1', batsman: 'Prithvi Shaw' },
              { wicket: 2, score: 67, over: '8.5', batsman: 'Shreyas Iyer' },
              { wicket: 3, score: 112, over: '14.2', batsman: 'Axar Patel' },
            ],
            partnerships: [
              { wicket: 1, players: ['Prithvi Shaw', 'Rishabh Pant'], runs: 42, balls: 26 },
              { wicket: 2, players: ['Rishabh Pant', 'Shreyas Iyer'], runs: 54, balls: 31 },
              { wicket: 3, players: ['Shreyas Iyer', 'Axar Patel'], runs: 36, balls: 25 },
            ],
            partnershipSummary: ['Prithvi Shaw & Rishabh Pant - 42 runs off 26 balls', 'Rishabh Pant & Shreyas Iyer - 54 runs off 31 balls', 'Shreyas Iyer & Axar Patel - 36 runs off 25 balls'],
          },
        ],
        timelineEvents: [
          { over: '5.2', title: 'Rohit Sharma Out', description: 'Bowled out during the powerplay', type: 'wicket', team: team._id, player: players[0] },
          { over: '13.4', title: 'Hardik Pandya Out', description: 'Caught on the boundary', type: 'wicket', team: team._id, player: players[3] },
          { over: '18.6', title: 'KL Rahul Out', description: 'Big wicket at the death', type: 'wicket', team: team._id, player: players[4] },
        ],
      },
      result: { winner: team._id, margin: '13 runs', manOfTheMatch: players[4] },
      createdBy: admin._id,
    });

    await Match.create({
      tournament: tournament._id,
      teamA: team3._id,
      teamB: team._id,
      date: new Date('2026-06-18'),
      ground: 'Eden Gardens',
      overs: 20,
      status: 'scheduled',
      weather: createMockWeather(new Date('2026-06-18')),
      innings: [],
      createdBy: admin._id,
    });

    await Match.create({
      tournament: tournament._id,
      teamA: team3._id,
      teamB: team2._id,
      date: new Date('2026-06-21'),
      ground: 'M. Chinnaswamy Stadium',
      overs: 20,
      status: 'scheduled',
      weather: createMockWeather(new Date('2026-06-21')),
      innings: [],
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
