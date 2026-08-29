const mongoose = require('mongoose');
const config = require('../config');
const seedDatabase = require('./seedData');

const runSeed = async () => {
  try {
    console.log(`Connecting to MongoDB at ${config.mongodbUri}...`);
    await mongoose.connect(config.mongodbUri);
    await seedDatabase();
    console.log('Seed process finished successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Database seeding failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runSeed();
