const express = require('express');
const router = express.Router();
const dataService = require('../services/DataService');

// GET /api/drivers - Get all drivers
router.get('/', (req, res) => {
  try {
    const drivers = dataService.getAllDrivers();
    res.json({
      success: true,
      data: drivers,
      count: drivers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/drivers/team/:teamId - Get drivers by team ID (MUST come before /:id route)
router.get('/team/:teamId', (req, res) => {
  try {
    const drivers = dataService.getDriversByTeam(req.params.teamId);
    res.json({
      success: true,
      data: drivers,
      count: drivers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/drivers/:id - Get driver by ID (MUST come after specific routes)
router.get('/:id', (req, res) => {
  try {
    const driver = dataService.getDriverById(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 