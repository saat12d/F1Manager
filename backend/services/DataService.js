const fs = require('fs');
const path = require('path');
const Team = require('../models/Team');
const Driver = require('../models/Driver');
const Race = require('../models/Race');

class DataService {
  constructor() {
    this.teams = [];
    this.drivers = [];
    this.races = [];
    this.loadData();
  }

  // Load all data from JSON files
  loadData() {
    try {
      // Load teams
      const teamsData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/teams.json'), 'utf8')
      );
      this.teams = teamsData.map(teamData => new Team(teamData));

      // Load drivers
      const driversData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/drivers.json'), 'utf8')
      );
      this.drivers = driversData.map(driverData => new Driver(driverData));

      // Load races
      const racesData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../data/races.json'), 'utf8')
      );
      this.races = racesData.map(raceData => new Race(raceData));

      // Assign drivers to teams
      this.assignDriversToTeams();

      console.log(`✅ Data loaded: ${this.teams.length} teams, ${this.drivers.length} drivers, ${this.races.length} races`);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  }

  // Assign drivers to their respective teams
  assignDriversToTeams() {
    this.teams.forEach(team => {
      const teamDrivers = this.drivers.filter(driver => driver.teamId === team.id);
      team.drivers = teamDrivers.map(driver => driver.id);
    });
  }

  // Get all teams
  getAllTeams() {
    return this.teams.map(team => team.toJSON());
  }

  // Get team by ID
  getTeamById(teamId) {
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.toJSON() : null;
  }

  // Get all drivers
  getAllDrivers() {
    return this.drivers.map(driver => driver.toJSON());
  }

  // Get driver by ID
  getDriverById(driverId) {
    const driver = this.drivers.find(d => d.id === driverId);
    return driver ? driver.toJSON() : null;
  }

  // Get drivers by team ID
  getDriversByTeam(teamId) {
    return this.drivers
      .filter(driver => driver.teamId === teamId)
      .map(driver => driver.toJSON());
  }

  // Get all races
  getAllRaces() {
    return this.races.map(race => race.toJSON());
  }

  // Get race by ID
  getRaceById(raceId) {
    const race = this.races.find(r => r.id === raceId);
    return race ? race.toJSON() : null;
  }

  // Get next upcoming race
  getNextRace() {
    const upcomingRaces = this.races.filter(race => race.isUpcoming());
    return upcomingRaces.length > 0 ? upcomingRaces[0].toJSON() : null;
  }

  // Get completed races
  getCompletedRaces() {
    return this.races
      .filter(race => race.isCompleted())
      .map(race => race.toJSON());
  }

  // Get upcoming races
  getUpcomingRaces() {
    return this.races
      .filter(race => race.isUpcoming())
      .map(race => race.toJSON());
  }

  // Update race results
  updateRaceResults(raceId, results) {
    const race = this.races.find(r => r.id === raceId);
    if (race) {
      race.setResults(results);
      return race.toJSON();
    }
    return null;
  }

  // Get team with driver details
  getTeamWithDrivers(teamId) {
    const team = this.getTeamById(teamId);
    if (!team) return null;

    const drivers = this.getDriversByTeam(teamId);
    return {
      ...team,
      driverDetails: drivers
    };
  }

  // Get grid (all teams with their drivers)
  getGrid() {
    return this.teams.map(team => {
      const teamData = team.toJSON();
      const drivers = this.getDriversByTeam(team.id);
      return {
        ...teamData,
        driverDetails: drivers
      };
    });
  }

  // Reset all race statuses (useful for new season)
  resetRaceStatuses() {
    this.races.forEach(race => {
      race.status = 'upcoming';
      race.results = [];
    });
  }

  // Get season statistics
  getSeasonStats() {
    const completedRaces = this.getCompletedRaces();
    const upcomingRaces = this.getUpcomingRaces();
    
    return {
      totalRaces: this.races.length,
      completedRaces: completedRaces.length,
      upcomingRaces: upcomingRaces.length,
      nextRace: this.getNextRace(),
      lastCompletedRace: completedRaces.length > 0 ? completedRaces[completedRaces.length - 1] : null
    };
  }
}

// Create singleton instance
const dataService = new DataService();

module.exports = dataService; 