const dataService = require('../services/DataService');

class Standings {
  constructor(season = new Date().getFullYear(), initializeWithAllDrivers = false) {
    this.season = season;
    this.driverStandings = []; // Array of driver standings
    this.constructorStandings = []; // Array of constructor standings
    this.lastUpdated = new Date();
    
    // Initialize with all drivers and teams if requested
    if (initializeWithAllDrivers) {
      this.initializeSeasonStandings();
    }
  }

  // Initialize standings with all drivers and teams at season start
  initializeSeasonStandings() {
    try {
      const teams = dataService.getAllTeams();
      
      teams.forEach((team, teamIndex) => {
        // Get drivers for this team
        const teamDrivers = dataService.getDriversByTeam(team.id);
        
        // Add drivers to standings
        teamDrivers.forEach((driver, driverIndex) => {
          this.driverStandings.push({
            position: (teamIndex * 2) + driverIndex + 1, // Initial positioning
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
        
        // Add team to constructor standings
        this.constructorStandings.push({
          position: teamIndex + 1,
          teamId: team.id,
          teamName: team.name,
          points: 0,
          wins: 0,
          podiums: 0,
          poles: 0,
          fastestLaps: 0
        });
      });
      
      console.log(`✅ Initialized standings with ${this.driverStandings.length} drivers and ${this.constructorStandings.length} teams`);
    } catch (error) {
      console.error('❌ Error initializing season standings:', error);
    }
  }

  // Method to update driver standings after a race
  updateDriverStandings(raceResults) {
    const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]; // F1 points system

    raceResults.forEach((result, index) => {
      const points = index < 10 ? pointsSystem[index] : 0;
      
      // Find existing driver in standings
      let driverStanding = this.driverStandings.find(d => d.driverId === result.driverId);
      
      if (!driverStanding) {
        // Create new driver standing
        driverStanding = {
          position: 0,
          driverId: result.driverId,
          driverName: result.driverName,
          teamId: result.teamId,
          teamName: result.teamName,
          points: 0,
          wins: 0,
          podiums: 0,
          poles: 0,
          fastestLaps: 0,
          races: 0
        };
        this.driverStandings.push(driverStanding);
      }

      // Update driver statistics
      driverStanding.points += points;
      driverStanding.races += 1;
      
      if (index === 0) driverStanding.wins += 1;
      if (index < 3) driverStanding.podiums += 1;
      if (result.pole) driverStanding.poles += 1;
      if (result.fastestLap) driverStanding.fastestLaps += 1;
    });

    // Sort drivers by points (descending)
    this.driverStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.podiums - a.podiums;
    });

    // Update positions
    this.driverStandings.forEach((driver, index) => {
      driver.position = index + 1;
    });

    this.lastUpdated = new Date();
  }

  // Method to update constructor standings
  updateConstructorStandings() {
    const teamPoints = {};

    // Aggregate points by team
    this.driverStandings.forEach(driver => {
      if (!teamPoints[driver.teamId]) {
        teamPoints[driver.teamId] = {
          teamId: driver.teamId,
          teamName: driver.teamName,
          points: 0,
          wins: 0,
          podiums: 0,
          poles: 0,
          fastestLaps: 0
        };
      }
      
      teamPoints[driver.teamId].points += driver.points;
      teamPoints[driver.teamId].wins += driver.wins;
      teamPoints[driver.teamId].podiums += driver.podiums;
      teamPoints[driver.teamId].poles += driver.poles;
      teamPoints[driver.teamId].fastestLaps += driver.fastestLaps;
    });

    // Convert to array and sort
    this.constructorStandings = Object.values(teamPoints).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.podiums - a.podiums;
    });

    // Update positions
    this.constructorStandings.forEach((team, index) => {
      team.position = index + 1;
    });
  }

  // Method to get driver by position
  getDriverByPosition(position) {
    return this.driverStandings.find(d => d.position === position);
  }

  // Method to get constructor by position
  getConstructorByPosition(position) {
    return this.constructorStandings.find(c => c.position === position);
  }

  // Method to get championship leader
  getChampionshipLeader() {
    return this.driverStandings.length > 0 ? this.driverStandings[0] : null;
  }

  // Method to get standings summary for API responses
  toJSON() {
    return {
      season: this.season,
      driverStandings: this.driverStandings,
      constructorStandings: this.constructorStandings,
      lastUpdated: this.lastUpdated,
      championshipLeader: this.getChampionshipLeader()
    };
  }
}

module.exports = Standings; 