const express = require('express');
const router = express.Router();
const gameStateService = require('../services/GameStateService');
const dataService = require('../services/DataService');

// GET /api/game/state - Get current game state
router.get('/state', (req, res) => {
  try {
    const gameState = gameStateService.getGameState();
    res.json({
      success: true,
      data: gameState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/game/initialize - Initialize new game with team selection
router.post('/initialize', (req, res) => {
  try {
    const { teamId } = req.body;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID is required'
      });
    }
    
    const gameState = gameStateService.initializeGame(teamId);
    res.json({
      success: true,
      data: gameState,
      message: `Game initialized with ${gameState.selectedTeamData.name}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/game/objectives - Get current objectives and progress
router.get('/objectives', (req, res) => {
  try {
    const objectivesStatus = gameStateService.getObjectivesStatus();
    if (objectivesStatus.error) {
      return res.status(400).json({
        success: false,
        error: objectivesStatus.error
      });
    }
    
    res.json({
      success: true,
      data: objectivesStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/game/grid - Get current grid (all teams with drivers)
router.get('/grid', (req, res) => {
  try {
    const grid = dataService.getGrid();
    res.json({
      success: true,
      data: grid,
      count: grid.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/game/reset - Reset game state
router.post('/reset', (req, res) => {
  try {
    gameStateService.resetGame();
    res.json({
      success: true,
      message: 'Game state has been reset'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/game/season/complete - Check if season is complete and get results
router.get('/season/complete', (req, res) => {
  try {
    const isComplete = gameStateService.isSeasonComplete();
    
    if (!isComplete) {
      return res.json({
        success: true,
        data: {
          isComplete: false,
          message: 'Season is still in progress'
        }
      });
    }
    
    const seasonResults = gameStateService.calculateSeasonEndResults();
    res.json({
      success: true,
      data: {
        isComplete: true,
        ...seasonResults
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/game/budget - Get current team budget info
router.get('/budget', (req, res) => {
  try {
    const gameState = gameStateService.getGameState();
    if (gameState.error) {
      return res.status(400).json({
        success: false,
        error: gameState.error
      });
    }
    
    const team = gameState.selectedTeamData;
    res.json({
      success: true,
      data: {
        teamId: team.id,
        teamName: team.name,
        currentBudget: team.budget,
        budgetFormatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        }).format(team.budget)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/game/dashboard - Get dashboard data (comprehensive game overview)
router.get('/dashboard', (req, res) => {
  try {
    const gameState = gameStateService.getGameState();
    if (gameState.error) {
      return res.status(400).json({
        success: false,
        error: gameState.error
      });
    }
    
    const objectives = gameStateService.getObjectivesStatus();
    
    res.json({
      success: true,
      data: {
        team: gameState.selectedTeamData,
        nextRace: gameState.nextRace,
        seasonStats: gameState.seasonStats,
        standings: {
          drivers: gameState.standings.driverStandings.slice(0, 5), // Top 5
          constructors: gameState.standings.constructorStandings.slice(0, 5) // Top 5
        },
        objectives: objectives,
        currentRound: gameState.currentRound,
        season: gameState.season
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 