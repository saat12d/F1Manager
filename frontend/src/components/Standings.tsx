import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Users, 
  Flag, 
  Award, 
  RotateCcw,
  Medal,
  Star,
  BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';
import type { GameState, DriverStanding, ConstructorStanding, NavigationPage } from '../types';

interface StandingsProps {
  gameState?: GameState | null;
  onGameStateUpdate?: (newState: GameState) => void;
  onPageChange?: (page: NavigationPage) => void;
}

export default function Standings({ gameState, onGameStateUpdate }: StandingsProps) {
  const [activeTab, setActiveTab] = useState<'drivers' | 'constructors'>('drivers');
  const [showSeasonComplete, setShowSeasonComplete] = useState(false);

  useEffect(() => {
    checkSeasonCompletion();
    // Debug logging
    console.log('🏁 Standings Component - gameState:', gameState);
    if (gameState?.standings) {
      console.log('🏁 Standings Data:', gameState.standings);
      console.log('🏁 Driver Standings:', gameState.standings.driverStandings);
      console.log('🏁 Constructor Standings:', gameState.standings.constructorStandings);
    }
    
    // If standings are empty but we have a gameState, create initial standings
    if (gameState && (!gameState.standings?.driverStandings || gameState.standings.driverStandings.length === 0)) {
      console.log('🔧 Creating initial standings for empty game state');
      createInitialStandings();
    }
  }, [gameState]);

  const createInitialStandings = async () => {
    if (!gameState || !onGameStateUpdate) return;
    
    try {
      // Import teams and drivers APIs to get all data
      const { teamsApi } = await import('../services/api');
      const teams = await teamsApi.getAll();
      
      const driverStandings: any[] = [];
      const constructorStandings: any[] = [];
      
      // Create initial standings with all teams and drivers
      for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
        const team = teams[teamIndex];
        
        // Add team to constructor standings
        constructorStandings.push({
          position: teamIndex + 1,
          teamId: team.id,
          teamName: team.name,
          points: 0,
          wins: 0,
          podiums: 0,
          poles: 0,
          fastestLaps: 0
        });
        
        // Get team drivers and add to driver standings
        try {
          const teamDrivers = await teamsApi.getDrivers(team.id);
          teamDrivers.forEach((driver: any, driverIndex: number) => {
            driverStandings.push({
              position: (teamIndex * 2) + driverIndex + 1,
              driverId: driver.id,
              driverName: driver.fullName,
              teamId: team.id,
              teamName: team.name,
              points: 0,
              wins: 0,
              podiums: 0,
              poles: 0,
              fastestLaps: 0,
              races: 0
            });
          });
        } catch (error) {
          console.error(`Error getting drivers for team ${team.id}:`, error);
        }
      }
      
      // Update game state with initial standings
      const updatedGameState = {
        ...gameState,
        standings: {
          ...gameState.standings,
          driverStandings,
          constructorStandings,
          championshipLeader: driverStandings[0] || null
        }
      };
      
      console.log('✅ Created initial standings:', updatedGameState.standings);
      onGameStateUpdate(updatedGameState);
      
    } catch (error) {
      console.error('❌ Error creating initial standings:', error);
    }
  };

  const checkSeasonCompletion = () => {
    if (gameState?.seasonStats) {
      const isComplete = gameState.seasonStats.completedRaces >= gameState.seasonStats.totalRaces;
      
      // Only show modal if season is complete and we haven't shown it for this season yet
      if (isComplete) {
        const seasonCompletionKey = `season-complete-${gameState.season}`;
        const hasShownModal = localStorage.getItem(seasonCompletionKey);
        
        if (!hasShownModal) {
          setShowSeasonComplete(true);
          // Mark that we've shown the modal for this season
          localStorage.setItem(seasonCompletionKey, 'true');
        }
      }
    }
  };

  const handleSeasonRestart = () => {
    if (onGameStateUpdate && gameState) {
      // Reset to first race of new season
      const newGameState: GameState = {
        ...gameState,
        season: gameState.season + 1,
        currentRound: 1,
        seasonStats: {
          ...gameState.seasonStats,
          completedRaces: 0,
          upcomingRaces: gameState.seasonStats.totalRaces,
          lastCompletedRace: undefined
        },
        standings: {
          ...gameState.standings,
          driverStandings: gameState.standings.driverStandings.map(driver => ({
            ...driver,
            points: 0,
            wins: 0,
            podiums: 0,
            poles: 0,
            fastestLaps: 0,
            races: 0
          })),
          constructorStandings: gameState.standings.constructorStandings.map(constructor => ({
            ...constructor,
            points: 0,
            wins: 0,
            podiums: 0,
            poles: 0,
            fastestLaps: 0
          })),
          championshipLeader: gameState.standings.driverStandings[0]
        }
      };

      onGameStateUpdate(newGameState);
      setShowSeasonComplete(false);
      
      // Clear the season completion flag for the previous season
      const previousSeasonKey = `season-complete-${gameState.season}`;
      localStorage.removeItem(previousSeasonKey);
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

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-400" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold text-sm">{position}</span>;
    }
  };

  const calculatePointsGap = (standings: (DriverStanding | ConstructorStanding)[], currentIndex: number) => {
    if (currentIndex === 0) return 0;
    return standings[0].points - standings[currentIndex].points;
  };

  const getSeasonProgressPercentage = () => {
    if (!gameState?.seasonStats) return 0;
    return (gameState.seasonStats.completedRaces / gameState.seasonStats.totalRaces) * 100;
  };

  const renderDriversTable = () => {
    if (!gameState?.standings?.driverStandings) {
      console.log('🚨 No driver standings data available');
      return (
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-gray-400 mb-4">No driver standings data available</div>
          <div className="text-sm text-gray-500">
            Complete some races to see standings
          </div>
        </div>
      );
    }

    if (gameState.standings.driverStandings.length === 0) {
      return (
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-gray-400 mb-4">No drivers found</div>
          <div className="text-sm text-gray-500">
            Standings will appear after race simulations
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {gameState.standings.driverStandings.map((driver, index) => (
          <motion.div
            key={driver.driverId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={clsx(
              'glass rounded-xl p-4 border transition-all duration-300',
              {
                'border-yellow-400 glow bg-yellow-400/10': driver.position === 1,
                'border-gray-400 bg-gray-400/5': driver.position === 2,
                'border-orange-400 bg-orange-400/5': driver.position === 3,
                'border-blue-400/50 bg-blue-400/5': driver.teamId === gameState.selectedTeam,
                'border-gray-700': driver.position > 3 && driver.teamId !== gameState.selectedTeam,
              }
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Position */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800">
                  {getPositionIcon(driver.position)}
                </div>

                {/* Driver Info */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-racing text-lg text-white">{driver.driverName}</h3>
                    {driver.teamId === gameState.selectedTeam && (
                      <Star className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <p className={clsx('text-sm font-medium', getTeamColorClass(driver.teamId))}>
                    {driver.teamName}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{driver.points}</div>
                  <div className="text-gray-400">Points</div>
                  {driver.position > 1 && (
                    <div className="text-red-400 text-xs">
                      -{calculatePointsGap(gameState.standings.driverStandings, index)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{driver.wins}</div>
                  <div className="text-gray-400">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{driver.podiums}</div>
                  <div className="text-gray-400">Podiums</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{driver.poles}</div>
                  <div className="text-gray-400">Poles</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{driver.fastestLaps}</div>
                  <div className="text-gray-400">FL</div>
                </div>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Season Performance</span>
                <span>{driver.races} races</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={clsx('h-2 rounded-full transition-all duration-500', {
                    'bg-yellow-400': driver.position === 1,
                    'bg-gray-400': driver.position === 2,
                    'bg-orange-400': driver.position === 3,
                    'bg-blue-400': driver.teamId === gameState.selectedTeam && driver.position > 3,
                    'bg-gray-500': driver.position > 3 && driver.teamId !== gameState.selectedTeam,
                  })}
                  style={{ 
                    width: `${gameState.standings.driverStandings.length > 0 ? 
                      (driver.points / gameState.standings.driverStandings[0].points) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderConstructorsTable = () => {
    if (!gameState?.standings.constructorStandings) return null;

    return (
      <div className="space-y-4">
        {gameState.standings.constructorStandings.map((constructor, index) => (
          <motion.div
            key={constructor.teamId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={clsx(
              'glass rounded-xl p-4 border transition-all duration-300',
              {
                'border-yellow-400 glow bg-yellow-400/10': constructor.position === 1,
                'border-gray-400 bg-gray-400/5': constructor.position === 2,
                'border-orange-400 bg-orange-400/5': constructor.position === 3,
                'border-blue-400/50 bg-blue-400/5': constructor.teamId === gameState.selectedTeam,
                'border-gray-700': constructor.position > 3 && constructor.teamId !== gameState.selectedTeam,
              }
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Position */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800">
                  {getPositionIcon(constructor.position)}
                </div>

                {/* Team Info */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className={clsx('font-racing text-lg', getTeamColorClass(constructor.teamId))}>
                      {constructor.teamName}
                    </h3>
                    {constructor.teamId === gameState.selectedTeam && (
                      <Star className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">Constructor</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-white font-bold text-xl">{constructor.points}</div>
                  <div className="text-gray-400">Points</div>
                  {constructor.position > 1 && (
                    <div className="text-red-400 text-xs">
                      -{calculatePointsGap(gameState.standings.constructorStandings, index)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{constructor.wins}</div>
                  <div className="text-gray-400">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{constructor.podiums}</div>
                  <div className="text-gray-400">Podiums</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{constructor.poles}</div>
                  <div className="text-gray-400">Poles</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{constructor.fastestLaps}</div>
                  <div className="text-gray-400">FL</div>
                </div>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Constructor Performance</span>
                <span>{gameState.seasonStats.completedRaces} races</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={clsx('h-2 rounded-full transition-all duration-500', {
                    'bg-yellow-400': constructor.position === 1,
                    'bg-gray-400': constructor.position === 2,
                    'bg-orange-400': constructor.position === 3,
                    'bg-blue-400': constructor.teamId === gameState.selectedTeam && constructor.position > 3,
                    'bg-gray-500': constructor.position > 3 && constructor.teamId !== gameState.selectedTeam,
                  })}
                  style={{ 
                    width: `${gameState.standings.constructorStandings.length > 0 ? 
                      (constructor.points / gameState.standings.constructorStandings[0].points) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-3xl mb-4 text-white">No Game Active</h2>
          <p className="text-gray-400">Start a new season to view standings</p>
        </div>
      </div>
    );
  }

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
            Championship Standings
          </h1>
          <p className="text-gray-400">
            Season {gameState.season} • Round {gameState.currentRound} / {gameState.seasonStats.totalRaces}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Current Leader</div>
          <div className="text-white font-racing text-lg">
            {gameState.standings.championshipLeader?.driverName || 'TBD'}
          </div>
        </div>
      </motion.div>

      {/* Season Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-racing text-xl text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Season Progress</span>
          </h2>
          <div className="text-sm text-gray-400">
            {gameState.seasonStats.completedRaces} / {gameState.seasonStats.totalRaces} races completed
          </div>
        </div>
        
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${getSeasonProgressPercentage()}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{gameState.seasonStats.completedRaces}</div>
            <div className="text-sm text-gray-400">Races Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{gameState.seasonStats.upcomingRaces}</div>
            <div className="text-sm text-gray-400">Races Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{Math.round(getSeasonProgressPercentage())}%</div>
            <div className="text-sm text-gray-400">Season Complete</div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('drivers')}
          className={clsx(
            'flex-1 py-3 px-6 rounded-lg font-racing transition-all duration-300 flex items-center justify-center space-x-2',
            {
              'bg-blue-600 text-white': activeTab === 'drivers',
              'text-gray-400 hover:text-white': activeTab !== 'drivers',
            }
          )}
        >
          <Users className="w-4 h-4" />
          <span>Drivers Championship</span>
        </button>
        <button
          onClick={() => setActiveTab('constructors')}
          className={clsx(
            'flex-1 py-3 px-6 rounded-lg font-racing transition-all duration-300 flex items-center justify-center space-x-2',
            {
              'bg-blue-600 text-white': activeTab === 'constructors',
              'text-gray-400 hover:text-white': activeTab !== 'constructors',
            }
          )}
        >
          <Flag className="w-4 h-4" />
          <span>Constructors Championship</span>
        </button>
      </div>

      {/* Standings Tables */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'drivers' ? renderDriversTable() : renderConstructorsTable()}
        </motion.div>
      </AnimatePresence>

      {/* Season Complete Modal */}
      <AnimatePresence>
        {showSeasonComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="glass-strong rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Championship Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="mb-6"
                >
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 glow-yellow" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-yellow-400/20 rounded-full animate-ping"></div>
                  </div>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="font-display text-4xl lg:text-5xl mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
                >
                  🏆 CHAMPIONSHIP RESULTS 🏆
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xl text-gray-300 mb-2"
                >
                  Season {gameState.season} Formula 1 World Championship
                </motion.p>
                <div className="text-gray-400">
                  {gameState.seasonStats.totalRaces} races • {gameState.seasonStats.completedRaces} completed
                </div>
              </div>

              {/* Champions Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Drivers' Champion */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="relative"
                >
                  <div className="glass rounded-xl p-6 border-2 border-yellow-400/50 relative overflow-hidden">
                    {/* Champion Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-transparent to-yellow-400/10 animate-pulse"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <Crown className="w-8 h-8 text-yellow-400" />
                        <h3 className="font-racing text-2xl text-white">Drivers' Champion</h3>
                      </div>
                      
                      {gameState.standings.driverStandings[0] && (
                        <div className="text-center">
                          <div className="text-3xl font-bold text-yellow-400 mb-2">
                            {gameState.standings.driverStandings[0].driverName}
                          </div>
                          <div className={clsx('text-lg mb-4', getTeamColorClass(gameState.standings.driverStandings[0].teamId))}>
                            {gameState.standings.driverStandings[0].teamName}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{gameState.standings.driverStandings[0].points}</div>
                              <div className="text-sm text-gray-400">Points</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{gameState.standings.driverStandings[0].wins}</div>
                              <div className="text-sm text-gray-400">Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{gameState.standings.driverStandings[0].podiums}</div>
                              <div className="text-sm text-gray-400">Podiums</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{gameState.standings.driverStandings[0].poles}</div>
                              <div className="text-sm text-gray-400">Poles</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Confetti Effect */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 100, opacity: [0, 1, 0] }}
                          transition={{ delay: 1 + i * 0.2, duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                          style={{ left: `${20 + i * 15}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Constructors' Champion */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                  className="relative"
                >
                  <div className="glass rounded-xl p-6 border-2 border-blue-400/50 relative overflow-hidden">
                    {/* Champion Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-blue-400/10 animate-pulse"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <Flag className="w-8 h-8 text-blue-400" />
                        <h3 className="font-racing text-2xl text-white">Constructors' Champion</h3>
                      </div>
                      
                      {gameState.standings.constructorStandings[0] && (
                        <div className="text-center">
                          <div className={clsx('text-3xl font-bold mb-2', getTeamColorClass(gameState.standings.constructorStandings[0].teamId))}>
                            {gameState.standings.constructorStandings[0].teamName}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{gameState.standings.constructorStandings[0].points}</div>
                              <div className="text-sm text-gray-400">Points</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{gameState.standings.constructorStandings[0].wins}</div>
                              <div className="text-sm text-gray-400">Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{gameState.standings.constructorStandings[0].podiums}</div>
                              <div className="text-sm text-gray-400">Podiums</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{gameState.standings.constructorStandings[0].poles}</div>
                              <div className="text-sm text-gray-400">Poles</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Confetti Effect */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 100, opacity: [0, 1, 0] }}
                          transition={{ delay: 1.2 + i * 0.2, duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          className="absolute w-2 h-2 bg-blue-400 rounded-full"
                          style={{ left: `${20 + i * 15}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Your Team Performance */}
              {(() => {
                const playerTeamDrivers = gameState.standings.driverStandings.filter(d => d.teamId === gameState.selectedTeam);
                const playerTeamConstructor = gameState.standings.constructorStandings.find(c => c.teamId === gameState.selectedTeam);
                const bestDriverPosition = playerTeamDrivers.length > 0 ? Math.min(...playerTeamDrivers.map(d => d.position)) : null;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    className="glass rounded-xl p-6 mb-8"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <Users className="w-6 h-6 text-purple-400" />
                      <h3 className="font-racing text-xl text-white">Your Team Performance</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-400 mb-1">Constructors Position</div>
                        <div className="text-3xl font-bold text-purple-400">
                          P{playerTeamConstructor?.position || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-300">{playerTeamConstructor?.points || 0} points</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-400 mb-1">Best Driver Position</div>
                        <div className="text-3xl font-bold text-purple-400">
                          P{bestDriverPosition || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-300">
                          {playerTeamDrivers.length > 0 ? playerTeamDrivers[0].driverName : 'No drivers'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-gray-400 mb-1">Team Wins</div>
                        <div className="text-3xl font-bold text-purple-400">
                          {playerTeamConstructor?.wins || 0}
                        </div>
                        <div className="text-sm text-gray-300">race victories</div>
                      </div>
                    </div>
                    
                    {/* Performance Message */}
                    <div className="mt-4 p-4 rounded-lg text-center">
                      {playerTeamConstructor?.position === 1 ? (
                        <div className="text-yellow-400 font-bold text-lg">
                          🎉 Congratulations! You won the Constructors' Championship! 🎉
                        </div>
                      ) : (playerTeamConstructor?.position && playerTeamConstructor.position <= 3) ? (
                        <div className="text-green-400 font-bold">
                          🥉 Excellent season! Your team finished on the podium!
                        </div>
                      ) : (playerTeamConstructor?.position && playerTeamConstructor.position <= 5) ? (
                        <div className="text-blue-400 font-bold">
                          👏 Good performance! Your team fought well this season.
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          There's always next season. Keep developing and improving!
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}

              {/* Season Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="glass rounded-xl p-6 mb-8"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-green-400" />
                  <h3 className="font-racing text-xl text-white">Season Statistics</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{gameState.seasonStats.totalRaces}</div>
                    <div className="text-sm text-gray-400">Total Races</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {gameState.standings.driverStandings.reduce((acc, driver) => acc + driver.wins, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Different Winners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {gameState.standings.driverStandings.reduce((acc, driver) => acc + driver.poles, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Pole Positions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {gameState.standings.driverStandings.reduce((acc, driver) => acc + driver.fastestLaps, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Fastest Laps</div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 }}
                className="space-y-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSeasonRestart}
                  className="w-full btn-futuristic py-4 rounded-lg text-white font-racing flex items-center justify-center space-x-2 text-lg"
                >
                  <RotateCcw className="w-6 h-6" />
                  <span>🏁 Start Season {gameState.season + 1}</span>
                </motion.button>
                
                <button
                  onClick={() => setShowSeasonComplete(false)}
                  className="w-full py-3 rounded-lg text-gray-400 hover:text-white transition-colors border border-gray-600 hover:border-gray-400"
                >
                  📊 View Final Standings
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 