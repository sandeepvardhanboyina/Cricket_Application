require('dotenv').config();
const mongoose = require('mongoose');
const { execSync } = require('child_process');

const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

async function connectWithRetry() {
  const uri = process.env.MONGODB_URI;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected.');
      return;
    } catch (error) {
      console.log(`MongoDB not ready (attempt ${attempt}/${MAX_RETRIES})...`);
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

async function main() {
  await connectWithRetry();

  const User = require('../src/models/User');
  const userCount = await User.countDocuments();

  await mongoose.disconnect();

  if (userCount === 0) {
    console.log('Database is empty — seeding demo data...');
    execSync('node src/seed/seed.js', { stdio: 'inherit' });
  } else {
    console.log('Database already contains data — skipping seed.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
