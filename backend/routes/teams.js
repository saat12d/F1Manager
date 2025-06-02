const express = require('express');
const router = express.Router();
const dataService = require('../services/DataService');

// GET /api/teams - Get all teams
router.get('/', (req, res) => {
  try {
    const teams = dataService.getAllTeams();
    res.json({
      success: true,
      data: teams,
      count: teams.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/teams/:id - Get team by ID
router.get('/:id', (req, res) => {
  try {
    const team = dataService.getTeamById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/teams/:id/drivers - Get team drivers
router.get('/:id/drivers', (req, res) => {
  try {
    const drivers = dataService.getDriversByTeam(req.params.id);
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

// GET /api/teams/:id/details - Get team with driver details
router.get('/:id/details', (req, res) => {
  try {
    const teamWithDrivers = dataService.getTeamWithDrivers(req.params.id);
    if (!teamWithDrivers) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    res.json({
      success: true,
      data: teamWithDrivers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 