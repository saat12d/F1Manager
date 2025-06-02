const express = require('express');
const router = express.Router();
const dataService = require('../services/DataService');
const raceSimulationService = require('../services/RaceSimulationService');
const gameStateService = require('../services/GameStateService');

// GET /api/races - Get all races
router.get('/', (req, res) => {
  try {
    const races = dataService.getAllRaces();
    res.json({
      success: true,
      data: races,
      count: races.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/races/next - Get next upcoming race (MUST come before /:id route)
router.get('/next', (req, res) => {
  try {
    const nextRace = dataService.getNextRace();
    if (!nextRace) {
      return res.status(404).json({
        success: false,
        error: 'No upcoming races found'
      });
    }
    
    res.json({
      success: true,
      data: nextRace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/races/status/upcoming - Get upcoming races
router.get('/status/upcoming', (req, res) => {
  try {
    const upcomingRaces = dataService.getUpcomingRaces();
    res.json({
      success: true,
      data: upcomingRaces,
      count: upcomingRaces.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/races/status/completed - Get completed races
router.get('/status/completed', (req, res) => {
  try {
    const completedRaces = dataService.getCompletedRaces();
    res.json({
      success: true,
      data: completedRaces,
      count: completedRaces.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/races/season/stats - Get season statistics
router.get('/season/stats', (req, res) => {
  try {
    const seasonStats = dataService.getSeasonStats();
    res.json({
      success: true,
      data: seasonStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/races/:id - Get race by ID (MUST come after specific routes)
router.get('/:id', (req, res) => {
  try {
    const race = dataService.getRaceById(req.params.id);
    if (!race) {
      return res.status(404).json({
        success: false,
        error: 'Race not found'
      });
    }
    
    res.json({
      success: true,
      data: race
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/races/:id/simulate - Simulate a race
router.post('/:id/simulate', (req, res) => {
  try {
    const raceId = req.params.id;
    
    // Check if game is initialized
    const gameState = gameStateService.getGameState();
    if (gameState.error) {
      return res.status(400).json({
        success: false,
        error: 'Game not initialized. Please select a team first.'
      });
    }
    
    // Simulate the race
    const simulationResult = raceSimulationService.simulateRace(raceId);
    
    // Update standings
    const updatedStandings = gameStateService.updateStandings(simulationResult.results);
    
    res.json({
      success: true,
      data: {
        ...simulationResult,
        standings: updatedStandings
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 