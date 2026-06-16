require('dotenv').config();
const mongoose = require('mongoose');
const Player = require('../src/models/Player');

async function connect() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-tournament-hub');
}

async function migratePlayerAvailability({ manageConnection = false } = {}) {
  if (manageConnection) {
    await connect();
  }

  const result = await Player.updateMany(
    { availabilityStatus: { $exists: false } },
    { $set: { availabilityStatus: 'AVAILABLE' } }
  );

  console.log(`Backfilled availability for ${result.modifiedCount} players.`);

  if (manageConnection) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  migratePlayerAvailability({ manageConnection: true }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { migratePlayerAvailability };
