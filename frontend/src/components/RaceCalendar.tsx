import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Flag, 
  Trophy, 
  Play, 
  Timer,
  Zap,
  Award,
  Target,
  Star,
  DollarSign,
  Wrench,
  BarChart3,
  Crown,
  Users,
  RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import { racesApi } from '../services/api';
import GameStorageService from '../services/gameStorage';
import type { Race, RaceResult, Team, Driver, GameState } from '../types';

interface RaceCalendarProps {
  gameState?: GameState | null;
  onGameStateUpdate?: (newState: GameState) => void;
}

interface SimulationResult {
  race: Race;
  qualifyingResults: QualifyingResult[];
  results: RaceResult[];
  fastestLap: RaceResult;
  polePosition: QualifyingResult;
  podium: RaceResult[];
  highlights: string[];
}

interface QualifyingResult {
  driverId: string;
  driverName: string;
  teamId: string;
  teamName: string;
  gridPosition: number;
  qualifyingTime: number;
  q1Time?: number;
  q2Time?: number;
  q3Time?: number;
  eliminatedIn?: 'Q1' | 'Q2' | 'Q3';
}

export default function RaceCalendar({ gameState, onGameStateUpdate }: RaceCalendarProps) {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatingRace, setSimulatingRace] = useState<string | null>(null);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState<'qualifying' | 'race'>('qualifying');
  const [showSeasonComplete, setShowSeasonComplete] = useState(false);
  
  // Ref for auto-scrolling to next race
  const nextRaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRaces();
  }, [gameState]);

  // Auto-scroll to next race when races are loaded
  useEffect(() => {
    if (races.length > 0 && gameState && !loading) {
      // Small delay to ensure DOM is updated
      const scrollTimer = setTimeout(() => {
        if (nextRaceRef.current) {
          nextRaceRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
      }, 500);

      return () => clearTimeout(scrollTimer);
    }
  }, [races, gameState, loading]);

  // Check for season completion
  useEffect(() => {
    if (gameState?.seasonStats) {
      const isComplete = gameState.seasonStats.completedRaces >= gameState.seasonStats.totalRaces;
      
      // Only show modal if season is complete and we haven't shown it for this season yet
      if (isComplete && !showSeasonComplete) {
        const seasonCompletionKey = `season-complete-${gameState.season}`;
        const hasShownModal = localStorage.getItem(seasonCompletionKey);
        
        if (!hasShownModal) {
          // Small delay to let race modal close first
          setTimeout(() => {
            setShowSeasonComplete(true);
            // Mark that we've shown the modal for this season
            localStorage.setItem(seasonCompletionKey, 'true');
          }, 1000);
        }
      }
    }
  }, [gameState?.seasonStats, showSeasonComplete]);

  const loadRaces = async () => {
    try {
      setLoading(true);
      
      // Load base races from API
      console.log('🏁 Loading races from API...');
      const baseRacesData = await racesApi.getAll();
      console.log(`🏁 Loaded ${baseRacesData.length} races from API`);
      
      // If we have gameState, sync race completion data
      if (gameState) {
        console.log(`🏁 Syncing races with game state (current round: ${gameState.currentRound})`);
        const syncedRaces = syncRacesWithGameState(baseRacesData, gameState);
        const completedRaces = syncedRaces.filter(r => r.isCompleted);
        console.log(`🏁 Found ${completedRaces.length} completed races after sync`);
        setRaces(syncedRaces);
      } else {
        console.log('🏁 No game state available, using base race data');
        setRaces(baseRacesData);
      }
    } catch (err) {
      setError('Failed to load race calendar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync races with game state to preserve completion data
  const syncRacesWithGameState = (baseRaces: Race[], gameState: GameState): Race[] => {
    return baseRaces.map(race => {
      // Mark races as completed if they're before current round
      if (race.round < gameState.currentRound) {
        // Try to get race result data from localStorage
        const savedResults = GameStorageService.getRaceResults(race.id);
        
        if (savedResults) {
          console.log(`🏁 Found saved results for Race ${race.round} (${race.name})`);
          return {
            ...race,
            status: 'completed' as const,
            isCompleted: true,
            isUpcoming: false,
            results: savedResults.results || [],
            winner: savedResults.winner || savedResults.results?.[0],
            podium: savedResults.podium || savedResults.results?.slice(0, 3) || [],
          };
        } else {
          console.log(`⚠️ No saved results found for Race ${race.round} (${race.name}), marking as completed without results`);
        }
        
        // Fallback: mark as completed but without detailed results
        return {
          ...race,
          status: 'completed' as const,
          isCompleted: true,
          isUpcoming: false,
          results: [],
          winner: undefined,
          podium: [],
        };
      }
      
      // Mark current round as upcoming/next
      if (race.round === gameState.currentRound) {
        console.log(`🎯 Race ${race.round} (${race.name}) is the current round`);
        return {
          ...race,
          status: 'upcoming' as const,
          isCompleted: false,
          isUpcoming: true,
        };
      }
      
      // Future races remain upcoming
      return {
        ...race,
        status: 'upcoming' as const,
        isCompleted: false,
        isUpcoming: true,
      };
    });
  };

  const simulateRace = async (race: Race) => {
    if (!gameState) return;

    console.log(`🏁 Starting race simulation for ${race.name} (Round ${race.round})`);
    console.log('🎮 Current game state:', gameState);

    setSimulatingRace(race.id);
    try {
      // Get all teams and drivers for simulation
      const teams = await import('../services/api').then(api => api.teamsApi.getAll());
      console.log(`🏎️ Loaded ${teams.length} teams for simulation`);
      
      // Create realistic race simulation
      const results = await createRaceSimulation(race, teams, gameState);
      console.log('🏆 Race simulation completed:', results);
      
      // Update race status
      const updatedRace = {
        ...race,
        status: 'completed' as const,
        isCompleted: true,
        isUpcoming: false,
        results: results.results,
        winner: results.results[0],
        podium: results.results.slice(0, 3),
      };

      console.log('📝 Updated race object:', updatedRace);

      // Update game state
      const updatedGameState = await updateGameStateAfterRace(updatedRace, results, gameState);
      console.log('🎮 Updated game state:', updatedGameState);
      
      setSimulationResult(results);
      setSelectedRace(updatedRace);
      setActiveResultsTab('qualifying'); // Reset to qualifying tab
      setShowSimulationModal(true);
      
      // Update races list
      setRaces(prev => prev.map(r => r.id === race.id ? updatedRace : r));
      
      // Save race results to localStorage for persistence
      const raceResultsData = {
        results: results.results,
        winner: results.results[0],
        podium: results.results.slice(0, 3),
        fastestLap: results.fastestLap,
        highlights: results.highlights,
        completedAt: new Date().toISOString()
      };
      
      console.log('💾 Saving race results to localStorage:', raceResultsData);
      GameStorageService.saveRaceResults(race.id, raceResultsData);
      
      // Save updated game state
      if (onGameStateUpdate) {
        console.log('📡 Updating parent component with new game state');
        onGameStateUpdate(updatedGameState);
      }
      console.log('💾 Saving updated game state to localStorage');
      GameStorageService.saveGameState(updatedGameState);

    } catch (error) {
      console.error('❌ Race simulation failed:', error);
      setError('Failed to simulate race');
    } finally {
      setSimulatingRace(null);
    }
  };

  const createRaceSimulation = async (race: Race, teams: Team[], gameState: GameState): Promise<SimulationResult> => {
    // Create driver entries for simulation
    const driverEntries: Array<{
      driver: Driver;
      team: Team;
      performanceRating: number;
    }> = [];

    // Get all drivers from teams
    for (const team of teams) {
      const teamDrivers = await import('../services/api').then(api => api.teamsApi.getDrivers(team.id));
      for (const driver of teamDrivers) {
        // Calculate combined performance rating (30% driver, 70% car)
        const driverWeight = 0.3;
        const carWeight = 0.7;
        const combined = (driver.rating * driverWeight) + (team.overallRating * carWeight);
        const randomFactor = (Math.random() - 0.5) * 10; // ±5 points randomness
        const performanceRating = Math.max(0, Math.min(100, combined + randomFactor));

        driverEntries.push({
          driver,
          team,
          performanceRating
        });
      }
    }

    // QUALIFYING SIMULATION
    console.log('🔥 Simulating qualifying...');
    const qualifyingResults: QualifyingResult[] = driverEntries.map(entry => {
      // Add qualifying-specific randomness
      const qualifyingRating = entry.performanceRating + (Math.random() - 0.5) * 8;
      
      // Generate Q1, Q2, Q3 times (simplified F1 qualifying format)
      const baseTime = generateQualifyingLapTime(qualifyingRating);
      const q1Time = baseTime + (Math.random() * 0.5); // Q1 typically slower
      const q2Time = baseTime + (Math.random() * 0.3); // Q2 a bit faster
      const q3Time = baseTime; // Q3 is the fastest session
      
      return {
        driverId: entry.driver.id,
        driverName: entry.driver.fullName,
        teamId: entry.team.id,
        teamName: entry.team.name,
        gridPosition: 0, // Will be set after sorting
        qualifyingTime: q3Time,
        q1Time,
        q2Time,
        q3Time,
        eliminatedIn: undefined // Will be set based on position
      };
    });

    // Sort by qualifying time (fastest first)
    qualifyingResults.sort((a, b) => a.qualifyingTime - b.qualifyingTime);

    // Assign grid positions and elimination sessions
    qualifyingResults.forEach((result, index) => {
      result.gridPosition = index + 1;
      
      // Simulate F1 qualifying elimination format
      if (index >= 15) {
        result.eliminatedIn = 'Q1'; // Bottom 5 eliminated in Q1
        result.q2Time = undefined;
        result.q3Time = undefined;
        result.qualifyingTime = result.q1Time!;
      } else if (index >= 10) {
        result.eliminatedIn = 'Q2'; // Next 5 eliminated in Q2
        result.q3Time = undefined;
        result.qualifyingTime = result.q2Time!;
      } else {
        result.eliminatedIn = 'Q3'; // Top 10 compete in Q3
      }
    });

    // RACE SIMULATION
    console.log('🏎️ Simulating race...');
    const raceEntries = qualifyingResults.map(qualResult => {
      const entry = driverEntries.find(e => e.driver.id === qualResult.driverId)!;
      
      // Race performance can be different from qualifying
      const raceRating = entry.performanceRating + (Math.random() - 0.5) * 12;
      
      // Factor in reliability (chance of DNF)
      const reliabilityRoll = Math.random() * 100;
      const isReliabilityFailure = reliabilityRoll > entry.team.carStats.reliability;
      
      // Factor in driver error chance
      const driverErrorRoll = Math.random() * 100;
      const isDriverError = driverErrorRoll > entry.driver.rating && Math.random() < 0.1;
      
      const dnf = isReliabilityFailure || isDriverError;
      const baseTime = calculateBaseRaceTime(entry.driver, entry.team);
      const penalties = Math.random() < 0.05 ? Math.random() * 20 : 0; // 5% chance of penalties

      return {
        ...entry,
        qualifyingPosition: qualResult.gridPosition,
        baseTime,
        penalties,
        dnf,
        raceRating
      };
    });

    // Sort race results (finished cars by time, then DNFs)
    raceEntries.sort((a, b) => {
      if (a.dnf && !b.dnf) return 1;
      if (!a.dnf && b.dnf) return -1;
      if (a.dnf && b.dnf) return a.qualifyingPosition - b.qualifyingPosition; // DNFs by qualifying order
      return (a.baseTime + a.penalties) - (b.baseTime + b.penalties);
    });

    // Calculate points based on F1 point system
    const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    
    // Create race results
    const results: RaceResult[] = raceEntries.map((entry, index) => {
      const position = index + 1;
      const points = !entry.dnf && index < 10 ? pointsSystem[index] : 0;
      
      return {
        driverId: entry.driver.id,
        driverName: entry.driver.fullName,
        teamId: entry.team.id,
        teamName: entry.team.name,
        position,
        points,
        status: entry.dnf ? 'DNF' : 'Finished',
        raceTime: entry.dnf ? undefined : entry.baseTime + entry.penalties,
        fastestLap: false,
        pole: entry.qualifyingPosition === 1
      };
    });

    // Assign fastest lap (random among top 10 finishers)
    const finishedDrivers = results.filter(r => r.status === 'Finished');
    if (finishedDrivers.length > 0) {
      const fastestLapIndex = Math.floor(Math.random() * Math.min(10, finishedDrivers.length));
      const fastestLapDriver = finishedDrivers[fastestLapIndex];
      fastestLapDriver.fastestLap = true;
      if (fastestLapDriver.position <= 10) {
        fastestLapDriver.points += 1; // Bonus point for fastest lap
      }
    }

    // Generate race highlights
    const highlights = generateRaceHighlights(results, race, gameState.selectedTeam, qualifyingResults, calculateRaceFinancials(results, gameState.selectedTeam));

    return {
      race,
      qualifyingResults,
      results,
      fastestLap: results.find(r => r.fastestLap) || results[0],
      polePosition: qualifyingResults[0], // First in qualifying gets pole
      podium: results.slice(0, 3),
      highlights
    };
  };

  // Helper function to generate qualifying lap time
  const generateQualifyingLapTime = (performanceRating: number): number => {
    // Base lap time around 90 seconds, adjusted by performance
    const baseTime = 90; // seconds
    const performanceFactor = (100 - performanceRating) / 100;
    const variation = performanceFactor * 5; // Up to 5 seconds slower
    
    return baseTime + variation + (Math.random() * 1); // Add random variation
  };

  const calculateBaseRaceTime = (driver: Driver, team: Team): number => {
    // Base race time in seconds (realistic F1 race duration)
    const baseTime = 5400 + Math.random() * 600; // 1:30:00 to 1:40:00

    // Factor in team performance
    const teamFactor = (team.carStats.pace + team.carStats.reliability) / 200;
    const driverFactor = driver.rating / 100;
    
    // Track characteristics influence
    const trackFactor = Math.random() * 0.1 + 0.95; // 5% variation for track characteristics
    
    // Weather impact
    const weatherFactor = Math.random() * 0.08 + 0.96; // Up to 4% slower/faster due to weather
    
    // Random factor for race incidents, strategy, etc.
    const randomFactor = Math.random() * 0.15 + 0.925; // Up to 7.5% variation
    
    return baseTime * (2 - teamFactor) * (2 - driverFactor) * trackFactor * weatherFactor * randomFactor;
  };

  const generateRaceHighlights = (results: RaceResult[], race: Race, selectedTeam: string, qualifyingResults: QualifyingResult[], raceFinancials?: any): string[] => {
    const highlights: string[] = [];
    
    // Pole position highlight
    const polePosition = qualifyingResults[0];
    highlights.push(`🏁 ${polePosition.driverName} takes pole position for the ${race.name}!`);
    
    // Winner highlight
    const winner = results[0];
    highlights.push(`🏆 ${winner.driverName} wins the ${race.name}!`);
    
    // Player team qualifying performance
    const playerTeamQualifying = qualifyingResults.filter(r => r.teamId === selectedTeam);
    if (playerTeamQualifying.length > 0) {
      const bestQualifyingResult = playerTeamQualifying[0];
      if (bestQualifyingResult.gridPosition === 1) {
        highlights.push(`🔥 ${bestQualifyingResult.driverName} secures pole position for your team!`);
      } else if (bestQualifyingResult.gridPosition <= 5) {
        highlights.push(`💨 ${bestQualifyingResult.driverName} qualifies P${bestQualifyingResult.gridPosition} - strong grid position!`);
      }
    }
    
    // Player team race performance
    const playerTeamResults = results.filter(r => r.teamId === selectedTeam);
    if (playerTeamResults.length > 0) {
      const bestPlayerResult = playerTeamResults[0];
      if (bestPlayerResult.position <= 3) {
        highlights.push(`🎉 ${bestPlayerResult.driverName} secures P${bestPlayerResult.position} for your team!`);
      } else if (bestPlayerResult.position <= 10) {
        highlights.push(`💪 ${bestPlayerResult.driverName} scores points with P${bestPlayerResult.position}!`);
      }
    }
    
    // Financial performance
    if (raceFinancials) {
      if (raceFinancials.netChange > 0) {
        highlights.push(`💰 Race weekend profit: ${formatCurrency(raceFinancials.netChange)} (Prize money: ${formatCurrency(raceFinancials.prizeMoney)})`);
      } else {
        highlights.push(`💸 Race weekend cost: ${formatCurrency(Math.abs(raceFinancials.netChange))} (Operational expenses: ${formatCurrency(raceFinancials.raceWeekendCost)})`);
      }
      
      if (raceFinancials.breakdown.fastestLapBonus > 0) {
        highlights.push(`⚡ Fastest lap bonus earned: ${formatCurrency(raceFinancials.breakdown.fastestLapBonus)}`);
      }
    }
    
    // Notable performances
    const fastestLap = results.find(r => r.fastestLap);
    if (fastestLap) {
      highlights.push(`⚡ ${fastestLap.driverName} sets the fastest lap!`);
    }
    
    // DNFs
    const dnfs = results.filter(r => r.status === 'DNF');
    if (dnfs.length > 0) {
      highlights.push(`⚠️ ${dnfs.length} driver(s) failed to finish the race`);
    }
    
    // Position changes from qualifying to race
    const bigMovers = results.filter(result => {
      const qualResult = qualifyingResults.find(q => q.driverId === result.driverId);
      if (!qualResult) return false;
      const positionGain = qualResult.gridPosition - result.position;
      return positionGain >= 5; // Gained 5+ positions
    });
    
    if (bigMovers.length > 0) {
      const bestMover = bigMovers[0];
      const qualResult = qualifyingResults.find(q => q.driverId === bestMover.driverId);
      const positionGain = qualResult!.gridPosition - bestMover.position;
      highlights.push(`📈 ${bestMover.driverName} charges from P${qualResult!.gridPosition} to P${bestMover.position} (+${positionGain} positions)!`);
    }
    
    return highlights;
  };

  const updateGameStateAfterRace = async (race: Race, simulation: SimulationResult, currentState: GameState): Promise<GameState> => {
    console.log('🔄 Updating game state after race...');
    console.log('🏁 Race:', race.name);
    console.log('📊 Current state standings:', currentState.standings);
    
    // Calculate financial impact of the race
    const raceFinancials = calculateRaceFinancials(simulation.results, currentState.selectedTeam);
    console.log('💰 Race financials:', raceFinancials);
    
    // Update current round
    const newCurrentRound = currentState.currentRound + 1;
    
    // Find next race
    const nextRace = races.find(r => r.round === newCurrentRound && r.status === 'upcoming');
    
    // Update season stats
    const updatedSeasonStats = {
      ...currentState.seasonStats,
      completedRaces: currentState.seasonStats.completedRaces + 1,
      upcomingRaces: currentState.seasonStats.upcomingRaces - 1,
      lastCompletedRace: race,
      nextRace: nextRace || undefined
    };

    // Ensure we have valid standings before updating
    let currentStandings = currentState.standings;
    if (!currentStandings || !currentStandings.driverStandings || !currentStandings.constructorStandings) {
      console.warn('⚠️ No valid standings found in current state, creating empty structure');
      currentStandings = {
        season: currentState.season,
        driverStandings: [],
        constructorStandings: [],
        lastUpdated: new Date().toISOString(),
        championshipLeader: undefined
      };
    }

    // Update standings (simplified - in real implementation would call backend)
    const updatedStandings = calculateUpdatedStandings(currentStandings, simulation.results);
    
    // Update team budget
    const updatedTeamData = {
      ...currentState.selectedTeamData,
      budget: currentState.selectedTeamData.budget + raceFinancials.netChange
    };
    
    console.log(`💰 Budget updated: ${formatCurrency(currentState.selectedTeamData.budget)} → ${formatCurrency(updatedTeamData.budget)} (${raceFinancials.netChange >= 0 ? '+' : ''}${formatCurrency(raceFinancials.netChange)})`);
    
    const newGameState = {
      ...currentState,
      currentRound: newCurrentRound,
      nextRace,
      seasonStats: updatedSeasonStats,
      standings: updatedStandings,
      selectedTeamData: updatedTeamData,
      raceFinancials // Store latest race financial data
    };
    
    console.log('✅ Game state updated:', newGameState);
    return newGameState;
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateUpdatedStandings = (currentStandings: any, raceResults: RaceResult[]) => {
    console.log('🏁 Calculating updated standings...');
    console.log('📊 Current standings:', currentStandings);
    console.log('🏆 Race results:', raceResults);
    
    // Ensure we have valid standings structure
    if (!currentStandings || !currentStandings.driverStandings || !currentStandings.constructorStandings) {
      console.error('❌ Invalid current standings structure');
      return currentStandings || { driverStandings: [], constructorStandings: [] };
    }
    
    // Deep clone the standings to avoid mutations
    const updatedDriverStandings = currentStandings.driverStandings.map((driver: any) => ({ ...driver }));
    const updatedConstructorStandings = currentStandings.constructorStandings.map((constructor: any) => ({ ...constructor }));
    
    console.log(`📈 Starting with ${updatedDriverStandings.length} drivers and ${updatedConstructorStandings.length} constructors`);
    
    // Add points from race results
    raceResults.forEach(result => {
      console.log(`🎯 Processing result for ${result.driverName} (${result.driverId}) - Position: ${result.position}, Points: ${result.points}`);
      
      // Find and update driver standings
      const driverIndex = updatedDriverStandings.findIndex((d: any) => d.driverId === result.driverId);
      if (driverIndex >= 0) {
        const driver = updatedDriverStandings[driverIndex];
        const oldPoints = driver.points;
        
        driver.points += result.points;
        if (result.position === 1) driver.wins += 1;
        if (result.position <= 3) driver.podiums += 1;
        if (result.pole) driver.poles += 1;
        if (result.fastestLap) driver.fastestLaps += 1;
        driver.races += 1;
        
        console.log(`✅ Updated ${result.driverName}: ${oldPoints} → ${driver.points} points`);
      } else {
        console.warn(`⚠️ Driver ${result.driverName} (${result.driverId}) not found in standings`);
        
        // Add missing driver to standings
        const newDriver = {
          position: updatedDriverStandings.length + 1,
          driverId: result.driverId,
          driverName: result.driverName,
          teamId: result.teamId,
          teamName: result.teamName,
          points: result.points,
          wins: result.position === 1 ? 1 : 0,
          podiums: result.position <= 3 ? 1 : 0,
          poles: result.pole ? 1 : 0,
          fastestLaps: result.fastestLap ? 1 : 0,
          races: 1
        };
        updatedDriverStandings.push(newDriver);
        console.log(`➕ Added new driver to standings: ${result.driverName}`);
      }
      
      // Find and update constructor standings
      const constructorIndex = updatedConstructorStandings.findIndex((c: any) => c.teamId === result.teamId);
      if (constructorIndex >= 0) {
        const constructor = updatedConstructorStandings[constructorIndex];
        const oldPoints = constructor.points;
        
        constructor.points += result.points;
        if (result.position === 1) constructor.wins += 1;
        if (result.position <= 3) constructor.podiums += 1;
        if (result.pole) constructor.poles += 1;
        if (result.fastestLap) constructor.fastestLaps += 1;
        
        console.log(`✅ Updated ${result.teamName}: ${oldPoints} → ${constructor.points} points`);
      } else {
        console.warn(`⚠️ Team ${result.teamName} (${result.teamId}) not found in constructor standings`);
        
        // Add missing constructor to standings
        const newConstructor = {
          position: updatedConstructorStandings.length + 1,
          teamId: result.teamId,
          teamName: result.teamName,
          points: result.points,
          wins: result.position === 1 ? 1 : 0,
          podiums: result.position <= 3 ? 1 : 0,
          poles: result.pole ? 1 : 0,
          fastestLaps: result.fastestLap ? 1 : 0
        };
        updatedConstructorStandings.push(newConstructor);
        console.log(`➕ Added new constructor to standings: ${result.teamName}`);
      }
    });
    
    // Re-sort standings by points (with tie-breakers)
    updatedDriverStandings.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.podiums - a.podiums;
    });
    
    updatedConstructorStandings.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.podiums - a.podiums;
    });
    
    // Update positions
    updatedDriverStandings.forEach((driver: any, index: number) => {
      driver.position = index + 1;
    });
    updatedConstructorStandings.forEach((constructor: any, index: number) => {
      constructor.position = index + 1;
    });
    
    const finalStandings = {
      ...currentStandings,
      driverStandings: updatedDriverStandings,
      constructorStandings: updatedConstructorStandings,
      championshipLeader: updatedDriverStandings[0],
      lastUpdated: new Date().toISOString()
    };
    
    console.log('🏁 Final updated standings:', finalStandings);
    console.log(`🏆 Championship leader: ${finalStandings.championshipLeader?.driverName} (${finalStandings.championshipLeader?.points} pts)`);
    
    return finalStandings;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);
    return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
  };

  const formatQualifyingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);
    return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
  };

  const getQualifyingSessionBadge = (eliminatedIn?: string) => {
    const badges = {
      'Q1': 'bg-red-500/20 text-red-400 border-red-500',
      'Q2': 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
      'Q3': 'bg-green-500/20 text-green-400 border-green-500'
    };
    
    if (!eliminatedIn) return '';
    return badges[eliminatedIn as keyof typeof badges] || '';
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

  const calculateRaceFinancials = (raceResults: RaceResult[], selectedTeamId: string) => {
    // Base race weekend cost (from backend RaceSimulationService)
    const baseCost = 500000; // $500k base cost per race weekend
    const raceWeekendCost = baseCost + (Math.random() * 200000); // Add some variation
    
    // Calculate prize money based on position (simplified per-race prize money)
    const raceFinishBonus = [
      1000000,  // 1st place - $1M bonus
      750000,   // 2nd place - $750k
      500000,   // 3rd place - $500k
      350000,   // 4th place - $350k
      250000,   // 5th place - $250k
      200000,   // 6th place - $200k
      150000,   // 7th place - $150k
      100000,   // 8th place - $100k
      75000,    // 9th place - $75k
      50000     // 10th place - $50k
    ];
    
    // Find player team results
    const playerTeamResults = raceResults.filter(r => r.teamId === selectedTeamId);
    let totalPrizeMoney = 0;
    
    playerTeamResults.forEach(result => {
      if (result.position <= 10) {
        totalPrizeMoney += raceFinishBonus[result.position - 1] || 0;
      }
      
      // Bonus for fastest lap
      if (result.fastestLap && result.position <= 10) {
        totalPrizeMoney += 50000; // $50k bonus for fastest lap
      }
    });
    
    // Net financial impact for the race
    const netChange = totalPrizeMoney - raceWeekendCost;
    
    return {
      raceWeekendCost: Math.round(raceWeekendCost),
      prizeMoney: totalPrizeMoney,
      netChange: Math.round(netChange),
      breakdown: {
        operationalCosts: Math.round(raceWeekendCost),
        positionBonus: totalPrizeMoney,
        fastestLapBonus: playerTeamResults.some(r => r.fastestLap) ? 50000 : 0
      }
    };
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
      
      // Clear any saved race results for new season
      localStorage.removeItem('f1-manager-race-results');
      
      // Clear the season completion flag for the previous season
      const previousSeasonKey = `season-complete-${gameState.season}`;
      localStorage.removeItem(previousSeasonKey);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">❌ {error}</div>
          <button 
            onClick={loadRaces}
            className="btn-futuristic px-6 py-3 rounded-lg text-white"
          >
            Retry
          </button>
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
            Race Calendar
          </h1>
          <p className="text-gray-400">
            Season {gameState?.season || 2024} • {races.filter(r => r.isCompleted).length}/{races.length} races completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Next Race</div>
          <div className="text-white font-racing text-lg">
            {races.find(r => r.status === 'upcoming')?.name || 'Season Complete'}
          </div>
        </div>
      </motion.div>

      {/* Race Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {races.map((race, index) => {
          // Check if this is the next race to simulate
          const isNextRace = race.round === gameState?.currentRound && race.status === 'upcoming';
          
          return (
            <motion.div
              key={race.id}
              ref={isNextRace ? nextRaceRef : null}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className={clsx(
                'glass rounded-xl p-6 border-2 relative overflow-hidden cursor-pointer transition-all duration-300',
                {
                  'border-green-400 glow-green': race.isCompleted,
                  'border-blue-400 glow': race.status === 'upcoming' && race.round === gameState?.currentRound,
                  'border-gray-700': race.status === 'upcoming' && race.round !== gameState?.currentRound,
                }
              )}
              onClick={() => race.isCompleted && setSelectedRace(race)}
            >
              {/* Race Status Badge */}
              <div className={clsx(
                'absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold',
                {
                  'bg-green-500 text-white': race.isCompleted,
                  'bg-blue-500 text-white': race.status === 'upcoming' && race.round === gameState?.currentRound,
                  'bg-gray-500 text-white': race.status === 'upcoming' && race.round !== gameState?.currentRound,
                }
              )}>
                {race.isCompleted ? 'Completed' : race.round === gameState?.currentRound ? 'Next' : 'Upcoming'}
              </div>

              {/* Race Info */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Flag className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-gray-400">Round {race.round}</span>
                </div>
                <h3 className="font-racing text-xl text-white mb-2">{race.name}</h3>
                <div className="flex items-center space-x-2 text-gray-300 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{race.circuit.location}, {race.circuit.country}</span>
                </div>
              </div>

              {/* Race Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">Date</span>
                  </div>
                  <span className="text-white">{formatDate(race.date)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">Laps</span>
                  </div>
                  <span className="text-white">{race.circuit.laps}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">Distance</span>
                  </div>
                  <span className="text-white">{(race.circuit.length * race.circuit.laps / 1000).toFixed(1)} km</span>
                </div>
              </div>

              {/* Winner or Action Button */}
              {race.isCompleted && race.winner ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400">Winner</div>
                    <div className={clsx('font-bold', getTeamColorClass(race.winner.teamId))}>
                      {race.winner.driverName}
                    </div>
                  </div>
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
              ) : race.round === gameState?.currentRound ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    simulateRace(race);
                  }}
                  disabled={simulatingRace === race.id}
                  className="w-full btn-futuristic py-3 rounded-lg text-white font-racing flex items-center justify-center space-x-2"
                >
                  {simulatingRace === race.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Simulate Race</span>
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="text-center py-3 text-gray-500 text-sm">
                  Race locked until Round {race.round}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Race Results Modal */}
      <AnimatePresence>
        {showSimulationModal && simulationResult && selectedRace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSimulationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="glass-strong rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Results Header */}
              <div className="text-center mb-6">
                <h2 className="font-display text-3xl mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  {selectedRace.name} Results
                </h2>
                <p className="text-gray-400">{selectedRace.circuit.location}, {selectedRace.circuit.country}</p>
              </div>

              {/* Race Highlights */}
              <div className="mb-6">
                <h3 className="font-racing text-xl text-white mb-3 flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span>Race Highlights</span>
                </h3>
                <div className="space-y-2">
                  {simulationResult.highlights.map((highlight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-gray-300 text-sm"
                    >
                      {highlight}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Podium */}
              <div className="mb-6">
                <h3 className="font-racing text-xl text-white mb-4 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span>Podium</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {simulationResult.podium.map((result, index) => (
                    <motion.div
                      key={result.driverId}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className={clsx(
                        'text-center p-4 rounded-lg',
                        {
                          'bg-yellow-500/20 border-2 border-yellow-500': index === 0,
                          'bg-gray-400/20 border-2 border-gray-400': index === 1,
                          'bg-orange-500/20 border-2 border-orange-500': index === 2,
                        }
                      )}
                    >
                      <div className="text-3xl mb-2">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="font-bold text-white">{result.driverName}</div>
                      <div className={clsx('text-sm', getTeamColorClass(result.teamId))}>
                        {result.teamName}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{result.points} pts</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              {gameState && (() => {
                const raceFinancials = calculateRaceFinancials(simulationResult.results, gameState.selectedTeam);
                return (
                  <div className="mb-6">
                    <h3 className="font-racing text-xl text-white mb-4 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span>Financial Impact</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Prize Money */}
                      <div className="glass rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">Prize Money</span>
                        </div>
                        <div className="text-xl font-bold text-green-400">
                          {formatCurrency(raceFinancials.prizeMoney)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Race performance bonus
                        </div>
                      </div>

                      {/* Race Costs */}
                      <div className="glass rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Wrench className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-gray-300">Race Costs</span>
                        </div>
                        <div className="text-xl font-bold text-red-400">
                          -{formatCurrency(raceFinancials.raceWeekendCost)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Weekend operations
                        </div>
                      </div>

                      {/* Net Impact */}
                      <div className="glass rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-300">Net Impact</span>
                        </div>
                        <div className={clsx('text-xl font-bold', {
                          'text-green-400': raceFinancials.netChange >= 0,
                          'text-red-400': raceFinancials.netChange < 0,
                        })}>
                          {raceFinancials.netChange >= 0 ? '+' : ''}{formatCurrency(raceFinancials.netChange)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Total financial result
                        </div>
                      </div>
                    </div>
                    
                    {/* Budget Update */}
                    <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-300 text-sm">Updated Team Budget:</span>
                        <span className="text-white font-bold">
                          {formatCurrency(gameState.selectedTeamData.budget + raceFinancials.netChange)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Results Tab Navigation */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveResultsTab('qualifying')}
                    className={clsx(
                      'flex-1 py-2 px-4 rounded-md font-racing text-sm transition-all duration-200',
                      {
                        'bg-blue-500 text-white': activeResultsTab === 'qualifying',
                        'text-gray-400 hover:text-white': activeResultsTab !== 'qualifying',
                      }
                    )}
                  >
                    🏁 Qualifying Results
                  </button>
                  <button
                    onClick={() => setActiveResultsTab('race')}
                    className={clsx(
                      'flex-1 py-2 px-4 rounded-md font-racing text-sm transition-all duration-200',
                      {
                        'bg-blue-500 text-white': activeResultsTab === 'race',
                        'text-gray-400 hover:text-white': activeResultsTab !== 'race',
                      }
                    )}
                  >
                    🏆 Race Results
                  </button>
                </div>
              </div>

              {/* Results Content */}
              <div className="mb-6">
                {activeResultsTab === 'qualifying' ? (
                  <div>
                    <h3 className="font-racing text-xl text-white mb-4 flex items-center space-x-2">
                      <Flag className="w-5 h-5 text-green-400" />
                      <span>Qualifying Results</span>
                      <span className="text-sm text-gray-400 font-normal">
                        (Pole: {simulationResult.polePosition?.driverName})
                      </span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 text-gray-400">Pos</th>
                            <th className="text-left py-2 text-gray-400">Driver</th>
                            <th className="text-left py-2 text-gray-400">Team</th>
                            <th className="text-right py-2 text-gray-400">Q1</th>
                            <th className="text-right py-2 text-gray-400">Q2</th>
                            <th className="text-right py-2 text-gray-400">Q3</th>
                            <th className="text-center py-2 text-gray-400">Session</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulationResult.qualifyingResults.map((result, index) => (
                            <motion.tr
                              key={result.driverId}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.02 }}
                              className={clsx(
                                'border-b border-gray-800 hover:bg-gray-800/30',
                                {
                                  'bg-blue-600/20': result.teamId === gameState?.selectedTeam,
                                  'bg-yellow-500/10': result.gridPosition === 1, // Pole position highlight
                                }
                              )}
                            >
                              <td className="py-2 font-bold text-white">
                                <div className="flex items-center space-x-2">
                                  <span>{result.gridPosition}</span>
                                  {result.gridPosition === 1 && <Flag className="w-4 h-4 text-yellow-400" />}
                                </div>
                              </td>
                              <td className="py-2 text-white">{result.driverName}</td>
                              <td className={clsx('py-2', getTeamColorClass(result.teamId))}>
                                {result.teamName}
                              </td>
                              <td className="py-2 text-right font-mono text-gray-300">
                                {result.q1Time ? formatQualifyingTime(result.q1Time) : '-'}
                              </td>
                              <td className="py-2 text-right font-mono text-gray-300">
                                {result.q2Time ? formatQualifyingTime(result.q2Time) : '-'}
                              </td>
                              <td className="py-2 text-right font-mono text-gray-300">
                                {result.q3Time ? formatQualifyingTime(result.q3Time) : '-'}
                              </td>
                              <td className="py-2 text-center">
                                <div className={clsx(
                                  'inline-block px-2 py-1 rounded-full text-xs border',
                                  getQualifyingSessionBadge(result.eliminatedIn)
                                )}>
                                  {result.eliminatedIn || 'Q3'}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-racing text-xl text-white mb-4">Race Results</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 text-gray-400">Pos</th>
                            <th className="text-left py-2 text-gray-400">Driver</th>
                            <th className="text-left py-2 text-gray-400">Team</th>
                            <th className="text-right py-2 text-gray-400">Time</th>
                            <th className="text-right py-2 text-gray-400">Grid</th>
                            <th className="text-right py-2 text-gray-400">Points</th>
                            <th className="text-center py-2 text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulationResult.results.map((result, index) => (
                            <motion.tr
                              key={result.driverId}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.02 }}
                              className={clsx(
                                'border-b border-gray-800 hover:bg-gray-800/30',
                                {
                                  'bg-blue-600/20': result.teamId === gameState?.selectedTeam,
                                }
                              )}
                            >
                              <td className="py-2 font-bold text-white">{result.position}</td>
                              <td className="py-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-white">{result.driverName}</span>
                                  {result.fastestLap && <Star className="w-4 h-4 text-purple-400" />}
                                  {result.pole && <Flag className="w-4 h-4 text-green-400" />}
                                </div>
                              </td>
                              <td className={clsx('py-2', getTeamColorClass(result.teamId))}>
                                {result.teamName}
                              </td>
                              <td className="py-2 text-right font-mono text-gray-300">
                                {result.raceTime ? formatTime(result.raceTime) : '-'}
                              </td>
                              <td className="py-2 text-right text-gray-400">
                                {simulationResult.qualifyingResults.find(q => q.driverId === result.driverId)?.gridPosition || '-'}
                              </td>
                              <td className="py-2 text-right font-bold text-white">{result.points}</td>
                              <td className={clsx('py-2 text-center text-xs', {
                                'text-green-400': result.status === 'Finished',
                                'text-red-400': result.status === 'DNF',
                              })}>
                                {result.status}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSimulationModal(false)}
                  className="btn-futuristic px-8 py-3 rounded-lg text-white font-racing"
                >
                  Continue Season
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Season Complete Modal */}
      <AnimatePresence>
        {showSeasonComplete && gameState && (
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
              className="glass-strong rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Championship Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="mb-6 relative"
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
                  className="font-display text-4xl mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
                >
                  🏆 SEASON COMPLETE! 🏆
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xl text-gray-300 mb-2"
                >
                  Season {gameState.season} has concluded
                </motion.p>
                <div className="text-gray-400">
                  All {gameState.seasonStats.totalRaces} races completed
                </div>
              </div>

              {/* Championship Results */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-6 mb-8"
              >
                {/* Drivers Champion */}
                <div className="glass rounded-xl p-6 border-2 border-yellow-400/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <h3 className="font-racing text-xl text-white">World Drivers' Champion</h3>
                  </div>
                  
                  {gameState.standings.driverStandings[0] && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        {gameState.standings.driverStandings[0].driverName}
                      </div>
                      <div className={`text-lg mb-2 ${getTeamColorClass(gameState.standings.driverStandings[0].teamId)}`}>
                        {gameState.standings.driverStandings[0].teamName}
                      </div>
                      <div className="text-sm text-gray-300">
                        {gameState.standings.driverStandings[0].points} points • {gameState.standings.driverStandings[0].wins} wins
                      </div>
                    </div>
                  )}
                </div>

                {/* Constructors Champion */}
                <div className="glass rounded-xl p-6 border-2 border-blue-400/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <Flag className="w-6 h-6 text-blue-400" />
                    <h3 className="font-racing text-xl text-white">Constructors' Champion</h3>
                  </div>
                  
                  {gameState.standings.constructorStandings[0] && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-1 ${getTeamColorClass(gameState.standings.constructorStandings[0].teamId)}`}>
                        {gameState.standings.constructorStandings[0].teamName}
                      </div>
                      <div className="text-sm text-gray-300">
                        {gameState.standings.constructorStandings[0].points} points • {gameState.standings.constructorStandings[0].wins} wins
                      </div>
                    </div>
                  )}
                </div>

                {/* Your Team Performance */}
                {(() => {
                  const playerTeamConstructor = gameState.standings.constructorStandings.find(c => c.teamId === gameState.selectedTeam);
                  
                  return (
                    <div className="glass rounded-xl p-6 border-2 border-purple-400/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <Users className="w-6 h-6 text-purple-400" />
                        <h3 className="font-racing text-xl text-white">Your Team Result</h3>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          P{playerTeamConstructor?.position || 'N/A'}
                        </div>
                        <div className="text-lg text-white mb-2">
                          {gameState.selectedTeamData.name}
                        </div>
                        <div className="text-sm text-gray-300 mb-4">
                          {playerTeamConstructor?.points || 0} points • {playerTeamConstructor?.wins || 0} wins
                        </div>
                        
                        {/* Performance message */}
                        <div className="p-3 rounded-lg">
                          {playerTeamConstructor?.position === 1 ? (
                            <div className="text-yellow-400 font-bold">
                              🎉 Champions! Incredible season! 🎉
                            </div>
                          ) : (playerTeamConstructor?.position && playerTeamConstructor.position <= 3) ? (
                            <div className="text-green-400 font-bold">
                              🥉 Podium finish! Excellent work!
                            </div>
                          ) : (playerTeamConstructor?.position && playerTeamConstructor.position <= 5) ? (
                            <div className="text-blue-400 font-bold">
                              💪 Strong performance this season!
                            </div>
                          ) : (
                            <div className="text-gray-400">
                              Room for improvement. Focus on development!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
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
                  📊 Continue Viewing Results
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 