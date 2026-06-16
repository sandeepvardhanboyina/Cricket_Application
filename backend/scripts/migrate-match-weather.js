require('dotenv').config();
const mongoose = require('mongoose');
const Match = require('../src/models/Match');
const { normalizeWeather } = require('../src/utils/weather');

async function connect() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-tournament-hub');
}

async function migrateMatchWeather({ manageConnection = false } = {}) {
  if (manageConnection) {
    await connect();
  }

  const matches = await Match.find().select('date weather');

  let updatedCount = 0;
  for (const match of matches) {
    if (!match.weather?.condition) {
      match.weather = normalizeWeather(match.weather, match.date);
      await match.save();
      updatedCount += 1;
    }
  }

  console.log(`Backfilled weather for ${updatedCount} matches.`);

  if (manageConnection) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  migrateMatchWeather({ manageConnection: true }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { migrateMatchWeather };
