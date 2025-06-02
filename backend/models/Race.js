class Race {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.round = data.round; // Race number in season (1-24)
    this.date = data.date;
    this.circuit = data.circuit || {
      id: data.circuitId,
      name: data.circuitName,
      location: data.location,
      country: data.country,
      laps: data.laps || 50,
      length: data.length || 5.0 // km
    };
    this.status = data.status || 'upcoming'; // upcoming, completed, in-progress
    this.results = data.results || []; // Array of race results
    this.weather = data.weather || 'dry'; // dry, wet, mixed
    this.season = data.season || new Date().getFullYear();
  }

  // Method to check if race is completed
  isCompleted() {
    return this.status === 'completed';
  }

  // Method to check if race is upcoming
  isUpcoming() {
    return this.status === 'upcoming';
  }

  // Method to set race results
  setResults(results) {
    this.results = results;
    this.status = 'completed';
  }

  // Method to get podium finishers
  getPodium() {
    if (!this.isCompleted()) return [];
    return this.results.slice(0, 3);
  }

  // Method to get points finishers (top 10)
  getPointsFinishers() {
    if (!this.isCompleted()) return [];
    return this.results.slice(0, 10);
  }

  // Method to get race winner
  getWinner() {
    if (!this.isCompleted() || this.results.length === 0) return null;
    return this.results[0];
  }

  // Method to get race summary for API responses
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      round: this.round,
      date: this.date,
      circuit: this.circuit,
      status: this.status,
      results: this.results,
      weather: this.weather,
      season: this.season,
      isCompleted: this.isCompleted(),
      isUpcoming: this.isUpcoming(),
      winner: this.getWinner(),
      podium: this.getPodium()
    };
  }
}

module.exports = Race; 