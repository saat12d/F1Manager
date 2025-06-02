import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Navigation from './components/Navigation';
import TeamSelection from './components/TeamSelection';
import Dashboard from './components/Dashboard';
import RaceCalendar from './components/RaceCalendar';
import Standings from './components/Standings';
import FinancialOverview from './components/FinancialOverview';
import { gameApi, healthCheck } from './services/api';
import GameStorageService from './services/gameStorage';
import type { NavigationPage, GameState } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('team-selection');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);

  useEffect(() => {
    checkBackendHealth();
    checkGameState();
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameState && gameState.isInitialized) {
      try {
        GameStorageService.saveGameState(gameState);
      } catch (error) {
        console.error('Failed to save game state:', error);
        toast.error('Failed to save game progress', { duration: 3000 });
      }
    }
  }, [gameState]);

  const checkBackendHealth = async () => {
    try {
      const healthy = await healthCheck();
      setBackendHealthy(healthy);
      if (!healthy) {
        toast.error('Backend server is not responding. Please ensure the server is running.');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setBackendHealthy(false);
      toast.error('Failed to connect to backend server');
    }
  };

  const checkGameState = async () => {
    try {
      // First, check localStorage for existing game
      const localGameState = GameStorageService.loadGameState();
      if (localGameState) {
        console.log('Loading existing game from localStorage');
        setGameState(localGameState);
        setCurrentPage('dashboard');
        toast.success(`Welcome back to ${localGameState.selectedTeamData.name}!`, { duration: 4000 });
        return;
      }

      // Fallback: check backend for game state (if backend is available)
      if (backendHealthy) {
        const state = await gameApi.getState();
        if (state && state.isInitialized) {
          setGameState(state);
          setCurrentPage('dashboard');
          // Save to localStorage for future use
          GameStorageService.saveGameState(state);
        }
      }
    } catch (error) {
      console.log('No existing game state found');
    }
  };

  const handleTeamSelect = async (teamId: string) => {
    if (!backendHealthy) {
      toast.error('Backend server is not available');
      return;
    }

    setIsLoading(true);
    try {
      // Check if this is continuing an existing game
      const existingState = GameStorageService.loadGameState();
      if (existingState && existingState.selectedTeam === teamId) {
        setGameState(existingState);
        setCurrentPage('dashboard');
        toast.success(`Welcome back to ${existingState.selectedTeamData.fullName}!`, { id: 'team-select' });
        return;
      }

      // Initialize new game
      toast.loading('Initializing game...', { id: 'team-select' });
      const state = await gameApi.initialize(teamId);
      
      // Save the new game state
      setGameState(state);
      setCurrentPage('dashboard');
      
      toast.success(`Welcome to ${state.selectedTeamData.fullName}!`, { id: 'team-select' });
    } catch (error) {
      console.error('Failed to initialize game:', error);
      toast.error('Failed to initialize game. Please try again.', { id: 'team-select' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: NavigationPage) => {
    // Allow team selection page always, or any page if game is initialized
    if (page === 'team-selection') {
      setCurrentPage(page);
    } else if (gameState?.isInitialized) {
      setCurrentPage(page);
    }
  };

  const handleResetGame = () => {
    GameStorageService.clearGameState();
    setGameState(null);
    setCurrentPage('team-selection');
    toast.success('Game reset successfully', { duration: 3000 });
  };

  const handleGameStateUpdate = (newState: GameState) => {
    setGameState(newState);
    toast.success('Game state updated', { duration: 2000 });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'team-selection':
        return (
          <TeamSelection 
            onTeamSelect={handleTeamSelect} 
            isLoading={isLoading}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            gameState={gameState} 
            onResetGame={handleResetGame}
            onPageChange={handlePageChange}
          />
        );
      case 'standings':
        return (
          <Standings 
            gameState={gameState}
            onGameStateUpdate={handleGameStateUpdate}
            onPageChange={handlePageChange}
          />
        );
      case 'races':
        return (
          <RaceCalendar 
            gameState={gameState} 
            onGameStateUpdate={handleGameStateUpdate}
          />
        );
      case 'objectives':
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-3xl mb-4 text-white">Season Objectives</h2>
              <p className="text-gray-400">Objectives view coming soon...</p>
            </div>
          </div>
        );
      case 'financial':
        return (
          <FinancialOverview 
            gameState={gameState}
          />
        );
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-3xl mb-4 text-white">Page Not Found</h2>
              <p className="text-gray-400">This page is under construction.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white racing-grid">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(31, 41, 55, 0.9)',
            color: '#ffffff',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(10px)',
            fontFamily: 'Rajdhani, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#ffffff',
            },
          },
        }}
      />

      {/* Backend Health Warning */}
      {!backendHealthy && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 bg-red-600/90 backdrop-blur-sm p-4 text-center z-50"
        >
          <div className="font-racing text-white">
            ⚠️ Backend server is not responding. Please start the backend server.
          </div>
          <button
            onClick={checkBackendHealth}
            className="ml-4 px-4 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Navigation */}
      <Navigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
        gameInitialized={gameState?.isInitialized || false}
        teamName={gameState?.selectedTeamData?.name}
      />

      {/* Main Content */}
      <div className="ml-20 lg:ml-64 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            {backendHealthy ? renderCurrentPage() : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <h2 className="font-display text-2xl mb-2 text-white">Connecting to Server</h2>
                  <p className="text-gray-400">Please wait while we establish connection...</p>
                  
                  {/* Show local game option if available */}
                  {GameStorageService.hasGameState() && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-300 mb-3">
                        You have a saved game available locally
                      </p>
                      <button
                        onClick={() => {
                          const localState = GameStorageService.loadGameState();
                          if (localState) {
                            setGameState(localState);
                            setCurrentPage('dashboard');
                            toast.success('Loaded local game save');
                          }
                        }}
                        className="btn-futuristic px-6 py-2 rounded-lg text-white text-sm"
                      >
                        Load Local Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="glass p-8 rounded-xl text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <div className="font-racing text-lg text-white">Initializing Game...</div>
              <div className="text-sm text-gray-400 mt-2">Setting up your F1 management experience</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-save Indicator */}
      <AnimatePresence>
        {gameState?.isInitialized && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-6 right-6 glass px-4 py-2 rounded-lg text-sm text-gray-300 z-40"
          >
            ✅ Auto-saved
          </motion.div>
        )}
      </AnimatePresence>

      {/* Racing Stripe Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-2 racing-stripes opacity-30 pointer-events-none" />
    </div>
  );
}

export default App;
