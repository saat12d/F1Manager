class Team {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.fullName = data.fullName;
    this.nationality = data.nationality;
    this.teamColor = data.teamColor;
    this.drivers = data.drivers || []; // Array of driver IDs
    this.carStats = data.carStats || {
      pace: 75,        // Overall car performance (0-100)
      reliability: 80, // How often the car finishes races
      development: 70  // Base for R&D (future versions)
    };
    this.budget = data.budget || 100000000; // Starting budget in dollars
    this.seasonsActive = data.seasonsActive || [];
    this.championships = data.championships || [];
  }

  // Method to get team's overall rating based on car stats
  getOverallRating() {
    const { pace, reliability, development } = this.carStats;
    return Math.round((pace + reliability + development) / 3);
  }

  // Method to update budget
  updateBudget(amount) {
    this.budget += amount;
    return this.budget;
  }

  // Method to check if team can afford something
  canAfford(amount) {
    return this.budget >= amount;
  }

  // Method to get team summary for API responses
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      fullName: this.fullName,
      nationality: this.nationality,
      teamColor: this.teamColor,
      drivers: this.drivers,
      carStats: this.carStats,
      budget: this.budget,
      overallRating: this.getOverallRating(),
      seasonsActive: this.seasonsActive,
      championships: this.championships
    };
  }
}

module.exports = Team; 