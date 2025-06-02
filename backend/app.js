const express = require('express');
const cors = require('cors');
const path = require('path');

// Import route modules
const teamsRoutes = require('./routes/teams');
const driversRoutes = require('./routes/drivers');
const racesRoutes = require('./routes/races');
const standingsRoutes = require('./routes/standings');
const gameRoutes = require('./routes/game');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/teams', teamsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/races', racesRoutes);
app.use('/api/standings', standingsRoutes);
app.use('/api/game', gameRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'F1 Manager Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🏎️  F1 Manager Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
