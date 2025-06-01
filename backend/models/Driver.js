class Driver {
  constructor(data) {
    this.id = data.id;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.fullName = `${data.firstName} ${data.lastName}`;
    this.nationality = data.nationality;
    this.teamId = data.teamId;
    this.rating = data.rating || 75; // Overall driver rating (0-100)
    this.age = data.age;
    this.number = data.number; // Racing number
    this.championships = data.championships || [];
    this.careerStats = data.careerStats || {
      races: 0,
      wins: 0,
      podiums: 0,
      poles: 0,
      fastestLaps: 0,
      points: 0
    };
    this.currentSeasonStats = data.currentSeasonStats || {
      races: 0,
      wins: 0,
      podiums: 0,
      poles: 0,
      fastestLaps: 0,
      points: 0,
      position: 0 // Championship position
    };
  }

  // Method to get driver's full name
  getFullName() {
    return this.fullName;
  }

  // Method to update career statistics
  updateCareerStats(newStats) {
    Object.keys(newStats).forEach(key => {
      if (this.careerStats.hasOwnProperty(key)) {
        this.careerStats[key] += newStats[key];
      }
    });
  }

  // Method to update current season statistics
  updateSeasonStats(newStats) {
    Object.keys(newStats).forEach(key => {
      if (this.currentSeasonStats.hasOwnProperty(key)) {
        this.currentSeasonStats[key] += newStats[key];
      }
    });
  }

  // Method to reset season stats (for new season)
  resetSeasonStats() {
    this.currentSeasonStats = {
      races: 0,
      wins: 0,
      podiums: 0,
      poles: 0,
      fastestLaps: 0,
      points: 0,
      position: 0
    };
  }

  // Method to get driver summary for API responses
  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      nationality: this.nationality,
      teamId: this.teamId,
      rating: this.rating,
      age: this.age,
      number: this.number,
      championships: this.championships,
      careerStats: this.careerStats,
      currentSeasonStats: this.currentSeasonStats
    };
  }
}

module.exports = Driver; 