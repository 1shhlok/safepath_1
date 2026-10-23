const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const areaRoutes = require('./routes/areaRoutes');
const reportRoutes = require('./routes/reportRoutes');
const navigationRoutes = require('./routes/navigationRoutes');
const errorHandler = require('./middleware/errorHandler');
const MLService = require('./services/mlService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', async (req, res) => {
  const mlHealthy = await MLService.checkHealth();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'online',
      mlClassification: mlHealthy ? 'online' : 'unreachable'
    }
  });  
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/navigation', navigationRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
