import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Users, 
  DollarSign, 
  Calendar, 
  Trophy, 
  Zap, 
  Shield, 
  Wrench,
  Flag,
  Target,
  RotateCcw,
  Play,
  MapPin,
  Timer,
  ChevronRight,
  CheckCircle,
  Star
} from 'lucide-react';
import { clsx } from 'clsx';
import { gameApi } from '../services/api';
import type { Team, Driver, Race, ObjectivesStatus, GameState, NavigationPage } from '../types';

interface DashboardData {
  team: Team;
  nextRace?: Race;
  seasonStats: any;
  standings: {
    drivers: any[];
    constructors: any[];
  };
  objectives: ObjectivesStatus;
  currentRound: number;
  season: number;
}

interface DashboardProps {
  gameState?: GameState | null;
  onResetGame?: () => void;
  onPageChange?: (page: NavigationPage) => void;
}

export default function Dashboard({ gameState, onResetGame, onPageChange }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameState) {
      // Use provided game state
      setDashboardData({
        team: gameState.selectedTeamData,
        nextRace: gameState.nextRace,
        seasonStats: gameState.seasonStats,
        standings: {
          drivers: gameState.standings.driverStandings,
          constructors: gameState.standings.constructorStandings,
        },
        objectives: { objectives: [], totalCompleted: 0, totalObjectives: 0 }, // Default for now
        currentRound: gameState.currentRound,
        season: gameState.season,
      });
      setLoading(false);
    } else {
      // Fallback to API data
      loadDashboardData();
    }
  }, [gameState]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await gameApi.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSeasonProgress = () => {
    if (!dashboardData?.seasonStats) return { completed: 0, total: 24, percentage: 0 };
    const completed = dashboardData.seasonStats.completedRaces || 0;
    const total = dashboardData.seasonStats.totalRaces || 24;
    return {
      completed,
      total,
      percentage: (completed / total) * 100
    };
  };

  const handleGoToRace = () => {
    if (onPageChange) {
      onPageChange('races');
    }
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

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">❌ {error}</div>
          <button 
            onClick={loadDashboardData}
            className="btn-futuristic px-6 py-3 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { team, nextRace, standings, objectives } = dashboardData;
  const progress = getSeasonProgress();

  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-3xl lg:text-4xl mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Team Dashboard
          </h1>
          <p className="text-gray-400">
            Season {dashboardData.season} • Round {dashboardData.currentRound} / {progress.total}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Managing</div>
            <div className={clsx('font-racing text-xl', getTeamColorClass(team.id))}>
              {team.fullName}
            </div>
          </div>
          {onResetGame && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onResetGame}
              className="px-4 py-2 rounded-lg text-white border border-gray-600 hover:border-gray-400 transition-colors flex items-center space-x-2 text-sm"
              title="Reset Game"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Season Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-racing text-lg text-white">Season Progress</h3>
          <span className="text-sm text-gray-400">
            {progress.completed} / {progress.total} races completed
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="text-right mt-1">
          <span className="text-xs text-gray-400">{Math.round(progress.percentage)}% complete</span>
        </div>
      </motion.div>

      {/* Top Row - Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Info Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 col-span-1"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Car className="w-6 h-6 text-blue-400" />
            <h2 className="font-racing text-xl text-white">Team Status</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Overall Rating</span>
              <span className="text-white font-bold text-lg">{team.overallRating}/100</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Pace</span>
                </div>
                <span className="text-white">{team.carStats.pace}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Reliability</span>
                </div>
                <span className="text-white">{team.carStats.reliability}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Development</span>
                </div>
                <span className="text-white">{team.carStats.development}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Budget Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-400" />
            <h2 className="font-racing text-xl text-white">Budget</h2>
          </div>
          
          <div className="text-3xl font-bold text-green-400 mb-2">
            {formatCurrency(team.budget)}
          </div>
          
          <div className="text-sm text-gray-400">
            Available for R&D and operations
          </div>
          
          {/* Budget Health Indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Budget Health</span>
              <span className={clsx('font-bold', {
                'text-green-400': team.budget > 100000000,
                'text-yellow-400': team.budget > 50000000 && team.budget <= 100000000,
                'text-red-400': team.budget <= 50000000,
              })}>
                {team.budget > 100000000 ? 'Excellent' : 
                 team.budget > 50000000 ? 'Good' : 'Critical'}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={clsx('h-2 rounded-full transition-all duration-500', {
                  'bg-green-400': team.budget > 100000000,
                  'bg-yellow-400': team.budget > 50000000 && team.budget <= 100000000,
                  'bg-red-400': team.budget <= 50000000,
                })}
                style={{ width: `${Math.min(100, (team.budget / 150000000) * 100)}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Next Race Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Flag className="w-6 h-6 text-red-400" />
            <h2 className="font-racing text-xl text-white">Next Race</h2>
          </div>
          
          {nextRace ? (
            <div className="space-y-4">
              <div>
                <div className="font-bold text-lg text-white mb-1">
                  {nextRace.name}
                </div>
                <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{nextRace.circuit.location}, {nextRace.circuit.country}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-gray-300">{formatDate(nextRace.date)}</div>
                    <div className="text-xs text-gray-500">{formatFullDate(nextRace.date)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-gray-300">Round {nextRace.round}</div>
                    <div className="text-xs text-gray-500">{nextRace.circuit.laps} laps</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Circuit Length</span>
                  <span>{(nextRace.circuit.length / 1000).toFixed(2)} km</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Race Distance</span>
                  <span>{((nextRace.circuit.length * nextRace.circuit.laps) / 1000).toFixed(1)} km</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToRace}
                className="w-full btn-futuristic py-3 rounded-lg text-white font-racing flex items-center justify-center space-x-2 mt-4"
              >
                <Play className="w-4 h-4" />
                <span>Go to Race</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <div className="text-white font-medium mb-1">Season Complete!</div>
              <div className="text-gray-400 text-sm">All races have been finished</div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Middle Row - Drivers and Standings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drivers Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-cyan-400" />
            <h2 className="font-racing text-xl text-white">Drivers</h2>
          </div>
          
          <div className="space-y-4">
            {team.driverDetails?.map((driver: Driver, index: number) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {driver.number}
                  </div>
                  <div>
                    <div className="font-bold text-white">{driver.fullName}</div>
                    <div className="text-sm text-gray-400">{driver.nationality}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{driver.rating}/100</div>
                  <div className="text-xs text-gray-400">Rating</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Current Standings Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="font-racing text-xl text-white">Championship</h2>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-400 mb-2">Constructor Standings</div>
            {standings.constructors.slice(0, 5).map((constructor: any, index: number) => (
              <div 
                key={constructor.teamId}
                className={clsx('flex items-center justify-between p-2 rounded', {
                  'bg-blue-600/20 border border-blue-600/50': constructor.teamId === team.id,
                  'bg-gray-800/30': constructor.teamId !== team.id,
                })}
              >
                <div className="flex items-center space-x-3">
                  <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', {
                    'bg-yellow-500 text-black': index === 0,
                    'bg-gray-400 text-black': index === 1,
                    'bg-orange-500 text-white': index === 2,
                    'bg-gray-600 text-white': index > 2,
                  })}>
                    {constructor.position}
                  </div>
                  <span className="text-white text-sm font-medium">{constructor.teamName}</span>
                  {constructor.teamId === team.id && (
                    <Star className="w-3 h-3 text-blue-400" />
                  )}
                </div>
                <span className="text-white font-bold">{constructor.points}</span>
              </div>
            ))}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPageChange?.('standings')}
              className="w-full mt-3 py-2 px-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>View Full Standings</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Objectives */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-orange-400" />
          <h2 className="font-racing text-xl text-white">Season Objectives</h2>
          <div className="ml-auto text-sm text-gray-400">
            {objectives.totalCompleted}/{objectives.totalObjectives} Completed
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {objectives.objectives.slice(0, 6).map((objective, index) => (
            <motion.div
              key={objective.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.05 }}
              className={clsx('p-4 rounded-lg border', {
                'bg-green-600/20 border-green-600/50': objective.isCompleted,
                'bg-gray-800/50 border-gray-600': !objective.isCompleted,
              })}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-white text-sm">{objective.title}</h3>
                <div className={clsx('text-xs px-2 py-1 rounded', {
                  'bg-green-500 text-white': objective.isCompleted,
                  'bg-yellow-500 text-black': objective.priority === 'high' && !objective.isCompleted,
                  'bg-red-500 text-white': objective.priority === 'critical' && !objective.isCompleted,
                  'bg-gray-500 text-white': objective.priority === 'medium' && !objective.isCompleted,
                })}>
                  {objective.isCompleted ? 'Complete' : objective.priority}
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mb-3">{objective.description}</p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">
                  {objective.current}/{objective.target}
                </span>
                <span className="text-green-400 font-bold">
                  {formatCurrency(objective.reward)}
                </span>
              </div>
              
              {objective.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className={clsx('h-1 rounded-full transition-all duration-500', {
                        'bg-green-400': objective.isCompleted,
                        'bg-blue-400': !objective.isCompleted,
                      })}
                      style={{ width: `${objective.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 