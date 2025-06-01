const express = require('express');
const router = express.Router();
const gameStateService = require('../services/GameStateService');

// GET /api/standings - Get current standings
router.get('/', (req, res) => {
  try {
    const gameState = gameStateService.getGameState();
    if (gameState.error) {
      return res.status(400).json({
        success: false,
        error: gameState.error
      });
    }
    
    res.json({
      success: true,
      data: gameState.standings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/standings/drivers - Get driver standings
router.get('/drivers', (req, res) => {
  try {
    const gameState = gameStateService.getGameState();
    if (gameState.error) {
      return res.status(400).json({
        success: false,
        error: gameState.error
      });
    }
    
    res.json({
      success: true,
      data: gameState.standings.driverStandings,
      count: gameState.standings.driverStandings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/standings/constructors - Get constructor standings
router.get('/constructors', (req, res) => {
  try {
    const gameState = gameStateService.getGameState();
    if (gameState.error) {
      return res.status(400).json({
        success: false,
        error: gameState.error
      });
    }
    
    res.json({
      success: true,
      data: gameState.standings.constructorStandings,
      count: gameState.standings.constructorStandings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/standings/leader - Get championship leader
router.get('/leader', (req, res) => {
  try {
    const gameState = gameStateService.getGameState();
    if (gameState.error) {
      return res.status(400).json({
        success: false,
        error: gameState.error
      });
    }
    
    res.json({
      success: true,
      data: gameState.standings.championshipLeader
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 