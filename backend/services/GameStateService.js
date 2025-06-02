const dataService = require('./DataService');
const Standings = require('../models/Standings');

class GameStateService {
  constructor() {
    this.gameState = {
      isInitialized: false,
      selectedTeam: null,
      season: 2024,
      currentRound: 1,
      standings: new Standings(2024, true),
      objectives: null,
      gameStartDate: null
    };
  }

  // Initialize a new game with team selection
  initializeGame(selectedTeamId) {
    const team = dataService.getTeamById(selectedTeamId);
    if (!team) {
      throw new Error('Invalid team selection');
    }

    this.gameState = {
      isInitialized: true,
      selectedTeam: selectedTeamId,
      season: 2024,
      currentRound: 1,
      standings: new Standings(2024, true),
      objectives: this.generateSeasonObjectives(team),
      gameStartDate: new Date().toISOString()
    };

    console.log(`🎮 Game initialized with ${team.name}`);
    console.log(`📊 Standings initialized with ${this.gameState.standings.driverStandings.length} drivers`);
    return this.getGameState();
  }

  // Generate season objectives for the selected team
  generateSeasonObjectives(team) {
    const objectives = [];
    
    // Based on team strength, set realistic objectives
    const teamRating = team.overallRating;
    
    if (teamRating >= 90) {
      // Top teams - championship contention
      objectives.push({
        id: 'championship',
        title: 'Win the Constructors Championship',
        description: 'Finish 1st in the Constructors Championship',
        target: 1,
        current: 0,
        type: 'constructor_position',
        priority: 'high',
        reward: 20000000 // $20M bonus
      });
      objectives.push({
        id: 'wins',
        title: 'Win at least 8 races',
        description: 'Achieve 8 or more race victories this season',
        target: 8,
        current: 0,
        type: 'race_wins',
        priority: 'medium',
        reward: 10000000
      });
    } else if (teamRating >= 80) {
      // Mid-tier teams - podium contention
      objectives.push({
        id: 'top3',
        title: 'Finish Top 3 in Championship',
        description: 'Finish 3rd or higher in Constructors Championship',
        target: 3,
        current: 0,
        type: 'constructor_position_or_better',
        priority: 'high',
        reward: 15000000
      });
      objectives.push({
        id: 'podiums',
        title: 'Achieve 5 podium finishes',
        description: 'Get 5 or more podium finishes this season',
        target: 5,
        current: 0,
        type: 'podiums',
        priority: 'medium',
        reward: 8000000
      });
    } else if (teamRating >= 70) {
      // Lower mid-tier - points contention
      objectives.push({
        id: 'points',
        title: 'Score 100 points',
        description: 'Score at least 100 championship points',
        target: 100,
        current: 0,
        type: 'points',
        priority: 'high',
        reward: 5000000
      });
      objectives.push({
        id: 'top8',
        title: 'Finish in Top 8',
        description: 'Finish 8th or higher in Constructors Championship',
        target: 8,
        current: 0,
        type: 'constructor_position_or_better',
        priority: 'medium',
        reward: 3000000
      });
    } else {
      // Backmarker teams - survival and development
      objectives.push({
        id: 'points_score',
        title: 'Score championship points',
        description: 'Score at least 10 championship points',
        target: 10,
        current: 0,
        type: 'points',
        priority: 'high',
        reward: 2000000
      });
      objectives.push({
        id: 'beat_rival',
        title: 'Outperform a rival team',
        description: 'Finish ahead of at least one team in the championship',
        target: 9,
        current: 10,
        type: 'constructor_position_or_better',
        priority: 'medium',
        reward: 1000000
      });
    }

    // Universal objectives
    objectives.push({
      id: 'budget',
      title: 'Stay within budget',
      description: 'Don\'t go bankrupt during the season',
      target: 0,
      current: team.budget,
      type: 'budget_positive',
      priority: 'critical',
      reward: 0 // No reward, but prevents penalty
    });

    return objectives;
  }

  // Get current game state
  getGameState() {
    if (!this.gameState.isInitialized) {
      return { error: 'Game not initialized' };
    }

    const selectedTeam = dataService.getTeamWithDrivers(this.gameState.selectedTeam);
    const nextRace = dataService.getNextRace();
    const seasonStats = dataService.getSeasonStats();

    return {
      ...this.gameState,
      selectedTeamData: selectedTeam,
      nextRace: nextRace,
      seasonStats: seasonStats,
      standings: this.gameState.standings.toJSON()
    };
  }

  // Update standings after a race
  updateStandings(raceResults) {
    if (!this.gameState.isInitialized) {
      throw new Error('Game not initialized');
    }

    this.gameState.standings.updateDriverStandings(raceResults);
    this.gameState.standings.updateConstructorStandings();
    
    // Update objectives progress
    this.updateObjectivesProgress(raceResults);
    
    // Increment current round
    this.gameState.currentRound++;
    
    return this.gameState.standings.toJSON();
  }

  // Update objectives progress based on race results
  updateObjectivesProgress(raceResults) {
    const playerTeamId = this.gameState.selectedTeam;
    
    this.gameState.objectives.forEach(objective => {
      switch (objective.type) {
        case 'race_wins':
          const wins = raceResults.filter(result => 
            result.teamId === playerTeamId && result.position === 1
          ).length;
          objective.current += wins;
          break;
          
        case 'podiums':
          const podiums = raceResults.filter(result => 
            result.teamId === playerTeamId && result.position <= 3
          ).length;
          objective.current += podiums;
          break;
          
        case 'points':
          const points = raceResults
            .filter(result => result.teamId === playerTeamId)
            .reduce((sum, result) => sum + result.points, 0);
          objective.current += points;
          break;
          
        case 'budget_positive':
          const team = dataService.getTeamById(playerTeamId);
          objective.current = team.budget;
          break;
      }
    });

    // Check constructor position objectives at end of season
    if (this.isSeasonComplete()) {
      this.updateConstructorPositionObjectives();
    }
  }

  // Update constructor championship position objectives
  updateConstructorPositionObjectives() {
    const playerTeamId = this.gameState.selectedTeam;
    const constructorStandings = this.gameState.standings.constructorStandings;
    const playerTeamStanding = constructorStandings.find(standing => 
      standing.teamId === playerTeamId
    );
    
    if (playerTeamStanding) {
      this.gameState.objectives.forEach(objective => {
        if (objective.type === 'constructor_position') {
          objective.current = playerTeamStanding.position;
        } else if (objective.type === 'constructor_position_or_better') {
          objective.current = playerTeamStanding.position;
        }
      });
    }
  }

  // Check if season is complete
  isSeasonComplete() {
    const totalRaces = dataService.getAllRaces().length;
    return this.gameState.currentRound > totalRaces;
  }

  // Get objectives status
  getObjectivesStatus() {
    if (!this.gameState.isInitialized) {
      return { error: 'Game not initialized' };
    }

    const objectives = this.gameState.objectives.map(objective => {
      let isCompleted = false;
      let progress = 0;

      switch (objective.type) {
        case 'race_wins':
        case 'podiums':
        case 'points':
          isCompleted = objective.current >= objective.target;
          progress = Math.min(100, (objective.current / objective.target) * 100);
          break;
          
        case 'constructor_position':
          isCompleted = objective.current <= objective.target && objective.current > 0;
          progress = isCompleted ? 100 : 0;
          break;
          
        case 'constructor_position_or_better':
          isCompleted = objective.current <= objective.target && objective.current > 0;
          progress = isCompleted ? 100 : 0;
          break;
          
        case 'budget_positive':
          isCompleted = objective.current > 0;
          progress = isCompleted ? 100 : 0;
          break;
      }

      return {
        ...objective,
        isCompleted,
        progress
      };
    });

    return {
      objectives,
      totalCompleted: objectives.filter(obj => obj.isCompleted).length,
      totalObjectives: objectives.length
    };
  }

  // Calculate season-end rewards and penalties
  calculateSeasonEndResults() {
    if (!this.isSeasonComplete()) {
      return { error: 'Season not complete yet' };
    }

    const objectivesStatus = this.getObjectivesStatus();
    let totalReward = 0;
    let completedObjectives = [];
    let failedObjectives = [];

    objectivesStatus.objectives.forEach(objective => {
      if (objective.isCompleted) {
        totalReward += objective.reward;
        completedObjectives.push(objective);
      } else {
        failedObjectives.push(objective);
      }
    });

    // Apply constructor championship prize money
    const playerTeamId = this.gameState.selectedTeam;
    const constructorStandings = this.gameState.standings.constructorStandings;
    const playerTeamStanding = constructorStandings.find(standing => 
      standing.teamId === playerTeamId
    );

    let prizeMoney = 0;
    if (playerTeamStanding) {
      // This would use the race simulation service's prize money calculation
      prizeMoney = this.calculateConstructorPrizeMoney(playerTeamStanding.position);
    }

    // Apply rewards to team budget
    const team = dataService.teams.find(t => t.id === playerTeamId);
    if (team) {
      team.updateBudget(totalReward + prizeMoney);
    }

    return {
      completedObjectives,
      failedObjectives,
      objectiveRewards: totalReward,
      constructorPosition: playerTeamStanding?.position || 'N/A',
      prizeMoney,
      totalEarnings: totalReward + prizeMoney,
      finalBudget: team?.budget || 0
    };
  }

  // Calculate constructor championship prize money
  calculateConstructorPrizeMoney(position) {
    const prizeMoneyScale = [
      50000000, 45000000, 40000000, 35000000, 30000000,
      25000000, 20000000, 15000000, 10000000, 5000000
    ];
    
    return prizeMoneyScale[position - 1] || 0;
  }

  // Reset game state (for new season or restart)
  resetGame() {
    this.gameState = {
      isInitialized: false,
      selectedTeam: null,
      season: 2024,
      currentRound: 1,
      standings: new Standings(2024, true),
      objectives: null,
      gameStartDate: null
    };
    
    // Reset all race statuses
    dataService.resetRaceStatuses();
    
    console.log('🔄 Game state reset');
  }
}

module.exports = new GameStateService(); 