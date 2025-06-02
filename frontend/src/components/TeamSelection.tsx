import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Zap, 
  Shield, 
  Wrench,
  ChevronRight,
  Star,
  RotateCcw,
  Save
} from 'lucide-react';
import { clsx } from 'clsx';
import { teamsApi } from '../services/api';
import GameStorageService from '../services/gameStorage';
import type { Team } from '../types';

interface TeamSelectionProps {
  onTeamSelect: (teamId: string) => void;
  isLoading: boolean;
}

export default function TeamSelection({ onTeamSelect, isLoading }: TeamSelectionProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingGame, setHasExistingGame] = useState(false);
  const [existingGameSummary, setExistingGameSummary] = useState<{
    teamName: string;
    season: number;
    lastSaved: string;
  } | null>(null);

  useEffect(() => {
    loadTeams();
    checkExistingGame();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await teamsApi.getAll();
      setTeams(teamsData);
    } catch (err) {
      setError('Failed to load teams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingGame = () => {
    const hasGame = GameStorageService.hasGameState();
    setHasExistingGame(hasGame);
    
    if (hasGame) {
      const summary = GameStorageService.getGameStateSummary();
      setExistingGameSummary(summary);
    }
  };

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
  };

  const handleConfirmSelection = () => {
    if (selectedTeam) {
      onTeamSelect(selectedTeam.id);
    }
  };

  const handleContinueExistingGame = () => {
    const savedState = GameStorageService.loadGameState();
    if (savedState) {
      // Trigger the app to load the existing game
      onTeamSelect(savedState.selectedTeam);
    }
  };

  const handleNewGame = () => {
    GameStorageService.clearGameState();
    setHasExistingGame(false);
    setExistingGameSummary(null);
  };

  const getTeamColorClass = (teamId: string) => {
    const colorMap: Record<string, string> = {
      'red-bull': 'team-red-bull',
      'mercedes': 'team-mercedes',
      'ferrari': 'team-ferrari',
      'mclaren': 'team-mclaren',
      'aston-martin': 'team-aston-martin',
      'alpine': 'team-alpine',
      'williams': 'team-williams',
      'alpha-tauri': 'team-rb',
      'haas': 'team-haas',
      'kick-sauber': 'team-kick-sauber',
    };
    return colorMap[teamId] || 'text-white';
  };

  const getChampionshipTier = (championships: number[]) => {
    if (championships.length >= 5) return 'Legendary';
    if (championships.length >= 2) return 'Championship';
    if (championships.length >= 1) return 'Winner';
    return 'Rising';
  };

  const renderStarRating = (value: number, colorClass: string) => {
    const stars = Math.floor(value / 20);
    return (
      <div className="star-rating">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={clsx('w-3 h-3 star', {
              [`${colorClass} fill-current`]: i < stars,
              'text-gray-600': i >= stars,
            })} 
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">❌ {error}</div>
          <button 
            onClick={loadTeams}
            className="btn-futuristic px-6 py-3 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 racing-grid">
      {/* Existing Game Notice */}
      {hasExistingGame && existingGameSummary && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="glass-strong rounded-xl p-6 border border-blue-400/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-racing text-xl text-blue-400 mb-2">
                  Existing Game Found
                </h3>
                <p className="text-gray-300">
                  You have a saved game with <span className="text-white font-bold">{existingGameSummary.teamName}</span> 
                  {' '}from Season {existingGameSummary.season}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Last saved: {new Date(existingGameSummary.lastSaved).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContinueExistingGame}
                  className="btn-futuristic px-6 py-3 rounded-lg text-white font-racing flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Continue</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNewGame}
                  className="px-6 py-3 rounded-lg text-white font-racing border border-gray-600 hover:border-gray-400 transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>New Game</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="font-display text-4xl md:text-6xl mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Choose Your Team
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Select the Formula 1 team you want to manage. Each team has unique strengths, 
          challenges, and championship history. Choose wisely - your legacy starts here.
        </p>
      </motion.div>

      {/* Teams Grid */}
      <div className="team-selection-grid max-w-7xl mx-auto mb-8">
        {teams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            onClick={() => handleTeamClick(team)}
            className={clsx(
              'team-card glass rounded-xl p-6 cursor-pointer border-2 relative overflow-hidden',
              {
                'selected border-blue-400 glow-pulse': selectedTeam?.id === team.id,
                'border-gray-700 hover:border-gray-500': selectedTeam?.id !== team.id,
              }
            )}
          >
            {/* Team Color Accent */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 z-10"
              style={{ backgroundColor: team.teamColor }}
            />

            {/* Optimized Shimmer Effect */}
            <div className="team-card-shimmer" />

            {/* Championship Tier Badge */}
            <div className={clsx(
              'absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold z-10',
              {
                'bg-yellow-500 text-black': getChampionshipTier(team.championships) === 'Legendary',
                'bg-purple-500 text-white': getChampionshipTier(team.championships) === 'Championship',
                'bg-green-500 text-white': getChampionshipTier(team.championships) === 'Winner',
                'bg-gray-500 text-white': getChampionshipTier(team.championships) === 'Rising',
              }
            )}>
              {getChampionshipTier(team.championships)}
            </div>

            {/* Team Name */}
            <div className="mb-4 relative z-10">
              <h3 className={clsx('font-racing text-xl mb-1', getTeamColorClass(team.id))}>
                {team.name}
              </h3>
              <p className="text-gray-400 text-sm">{team.nationality}</p>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Pace</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-white font-bold text-sm">{team.carStats.pace}</div>
                  {renderStarRating(team.carStats.pace, 'text-yellow-400')}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Reliability</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-white font-bold text-sm">{team.carStats.reliability}</div>
                  {renderStarRating(team.carStats.reliability, 'text-green-400')}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Development</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-white font-bold text-sm">{team.carStats.development}</div>
                  {renderStarRating(team.carStats.development, 'text-purple-400')}
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-center justify-between text-sm mb-4 relative z-10">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Budget</span>
              </div>
              <span className="text-white font-bold">
                ${(team.budget / 1000000).toFixed(0)}M
              </span>
            </div>

            {/* Championships */}
            <div className="flex items-center justify-between text-sm relative z-10">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Championships</span>
              </div>
              <span className="text-white font-bold">{team.championships.length}</span>
            </div>

            {/* Selection Indicator */}
            {selectedTeam?.id === team.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 border-2 border-blue-400 rounded-xl pointer-events-none z-10"
              >
                <div className="absolute top-2 left-2 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Confirm Selection */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="confirmation-panel p-6 rounded-xl max-w-md mx-auto">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h3 className={clsx('font-racing text-lg', getTeamColorClass(selectedTeam.id))}>
                    {selectedTeam.fullName}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    Overall Rating: {selectedTeam.overallRating}/100
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <span>Budget: ${(selectedTeam.budget / 1000000).toFixed(0)}M</span>
                    <span>•</span>
                    <span>Championships: {selectedTeam.championships.length}</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmSelection}
                  disabled={isLoading}
                  className="btn-futuristic px-8 py-3 rounded-lg text-white font-racing flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Start Season</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 