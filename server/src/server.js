const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');

const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB at ${config.mongodbUri}...`);
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB connected successfully.');

    app.listen(config.port, () => {
      console.log(`SafePath Server running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`Health check available at: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start SafePath server:', err.message);
    process.exit(1);
  }
};

startServer();
