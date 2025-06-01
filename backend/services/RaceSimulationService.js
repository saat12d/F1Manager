const dataService = require('./DataService');

class RaceSimulationService {
  constructor() {
    this.pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]; // F1 points system
  }

  // Simulate a race and return results
  simulateRace(raceId) {
    const race = dataService.getRaceById(raceId);
    if (!race) {
      throw new Error('Race not found');
    }

    if (race.isCompleted) {
      throw new Error('Race already completed');
    }

    console.log(`🏁 Simulating ${race.name}...`);

    // Get all drivers and their teams
    const grid = this.prepareGrid();
    
    // Simulate qualifying (simplified - affects starting positions)
    const qualifyingResults = this.simulateQualifying(grid);
    
    // Simulate race
    const raceResults = this.simulateRaceResults(qualifyingResults, race);
    
    // Update race with results
    dataService.updateRaceResults(raceId, raceResults);
    
    // Apply race costs to team budgets
    this.applyRaceCosts();
    
    console.log(`✅ ${race.name} completed! Winner: ${raceResults[0].driverName}`);
    
    return {
      race: dataService.getRaceById(raceId),
      results: raceResults,
      qualifying: qualifyingResults
    };
  }

  // Prepare the grid with all drivers and their performance ratings
  prepareGrid() {
    const grid = [];
    const teams = dataService.getAllTeams();
    
    teams.forEach(team => {
      const drivers = dataService.getDriversByTeam(team.id);
      drivers.forEach(driver => {
        const performanceRating = this.calculatePerformanceRating(team, driver);
        grid.push({
          driverId: driver.id,
          driverName: driver.fullName,
          teamId: team.id,
          teamName: team.name,
          driverRating: driver.rating,
          carRating: team.overallRating,
          performanceRating: performanceRating
        });
      });
    });
    
    return grid;
  }

  // Calculate combined performance rating for driver + car
  calculatePerformanceRating(team, driver) {
    const driverWeight = 0.3; // 30% driver skill
    const carWeight = 0.7;    // 70% car performance
    
    const combined = (driver.rating * driverWeight) + (team.overallRating * carWeight);
    
    // Add some randomness (±5 points)
    const randomFactor = (Math.random() - 0.5) * 10;
    
    return Math.max(0, Math.min(100, combined + randomFactor));
  }

  // Simulate qualifying session
  simulateQualifying(grid) {
    console.log('🔥 Simulating qualifying...');
    
    const qualifyingResults = grid.map(entry => {
      // Add qualifying-specific randomness
      const qualifyingRating = entry.performanceRating + (Math.random() - 0.5) * 8;
      
      return {
        ...entry,
        qualifyingTime: this.generateLapTime(qualifyingRating),
        qualifyingRating: qualifyingRating
      };
    });
    
    // Sort by qualifying time (fastest first)
    qualifyingResults.sort((a, b) => a.qualifyingTime - b.qualifyingTime);
    
    // Assign grid positions
    qualifyingResults.forEach((result, index) => {
      result.gridPosition = index + 1;
    });
    
    return qualifyingResults;
  }

  // Simulate race results
  simulateRaceResults(qualifyingResults, race) {
    console.log('🏎️ Simulating race...');
    
    const raceResults = qualifyingResults.map(entry => {
      // Race performance can be different from qualifying
      const raceRating = entry.performanceRating + (Math.random() - 0.5) * 12;
      
      // Factor in reliability (chance of DNF)
      const team = dataService.getTeamById(entry.teamId);
      const reliabilityRoll = Math.random() * 100;
      const isReliabilityFailure = reliabilityRoll > team.carStats.reliability;
      
      // Factor in driver error chance
      const driverErrorRoll = Math.random() * 100;
      const isDriverError = driverErrorRoll > entry.driverRating;
      
      const status = isReliabilityFailure ? 'DNF - Mechanical' : 
                    isDriverError && Math.random() < 0.1 ? 'DNF - Accident' : 
                    'Finished';
      
      return {
        ...entry,
        raceRating: raceRating,
        status: status,
        raceTime: status === 'Finished' ? this.generateRaceTime(raceRating, race) : null,
        fastestLap: status === 'Finished' && Math.random() < 0.1, // 10% chance for fastest lap
        pole: entry.gridPosition === 1
      };
    });
    
    // Sort by race performance (only finished cars)
    const finishedCars = raceResults.filter(result => result.status === 'Finished');
    const dnfCars = raceResults.filter(result => result.status !== 'Finished');
    
    finishedCars.sort((a, b) => a.raceTime - b.raceTime);
    
    // Assign finishing positions
    let position = 1;
    finishedCars.forEach(result => {
      result.position = position++;
      result.points = this.getPointsForPosition(result.position);
    });
    
    // DNF cars get positions after finished cars
    dnfCars.forEach(result => {
      result.position = position++;
      result.points = 0;
    });
    
    // Assign fastest lap point (if applicable)
    if (finishedCars.length > 0) {
      const fastestLapDriver = finishedCars.find(result => result.fastestLap);
      if (fastestLapDriver && fastestLapDriver.position <= 10) {
        fastestLapDriver.points += 1;
      }
    }
    
    return [...finishedCars, ...dnfCars];
  }

  // Generate realistic lap time based on performance rating
  generateLapTime(performanceRating) {
    // Base lap time around 90 seconds, adjusted by performance
    const baseTime = 90000; // milliseconds
    const performanceFactor = (100 - performanceRating) / 100;
    const variation = performanceFactor * 5000; // Up to 5 seconds slower
    
    return baseTime + variation + (Math.random() * 1000); // Add random variation
  }

  // Generate race time based on performance and race distance
  generateRaceTime(performanceRating, race) {
    const baseLapTime = this.generateLapTime(performanceRating);
    const totalTime = baseLapTime * race.circuit.laps;
    
    // Add pit stop time (assuming 1-2 stops)
    const pitStops = Math.floor(Math.random() * 2) + 1;
    const pitStopTime = pitStops * 25000; // 25 seconds per stop
    
    return totalTime + pitStopTime;
  }

  // Get points for finishing position
  getPointsForPosition(position) {
    if (position <= 10) {
      return this.pointsSystem[position - 1] || 0;
    }
    return 0;
  }

  // Apply race weekend costs to all team budgets
  applyRaceCosts() {
    const teams = dataService.getAllTeams();
    const baseCost = 500000; // $500k base cost per race weekend
    
    teams.forEach(team => {
      const teamObj = dataService.teams.find(t => t.id === team.id);
      if (teamObj) {
        const cost = baseCost + (Math.random() * 200000); // Add some variation
        teamObj.updateBudget(-cost);
      }
    });
  }

  // Get prize money based on constructor championship position (simplified)
  calculatePrizeMoney(position) {
    const prizeMoneyScale = [
      50000000, // 1st place
      45000000, // 2nd place
      40000000, // 3rd place
      35000000, // 4th place
      30000000, // 5th place
      25000000, // 6th place
      20000000, // 7th place
      15000000, // 8th place
      10000000, // 9th place
      5000000   // 10th place
    ];
    
    return prizeMoneyScale[position - 1] || 0;
  }

  // Method to simulate multiple races (for testing or fast-forward)
  simulateMultipleRaces(numberOfRaces) {
    const results = [];
    const upcomingRaces = dataService.getUpcomingRaces();
    
    const racesToSimulate = Math.min(numberOfRaces, upcomingRaces.length);
    
    for (let i = 0; i < racesToSimulate; i++) {
      const race = upcomingRaces[i];
      const result = this.simulateRace(race.id);
      results.push(result);
    }
    
    return results;
  }
}

module.exports = new RaceSimulationService(); 