// Team Types
export interface Team {
  id: string;
  name: string;
  fullName: string;
  nationality: string;
  teamColor: string;
  drivers: string[];
  carStats: {
    pace: number;
    reliability: number;
    development: number;
  };
  budget: number;
  overallRating: number;
  seasonsActive: string[];
  championships: number[];
  driverDetails?: Driver[];
}

// Driver Types
export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationality: string;
  teamId: string;
  rating: number;
  age: number;
  number: number;
  championships: number[];
  careerStats: DriverStats;
  currentSeasonStats: DriverStats;
}

export interface DriverStats {
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  points: number;
  position?: number;
}

// Race Types
export interface Race {
  id: string;
  name: string;
  round: number;
  date: string;
  circuit: Circuit;
  status: 'upcoming' | 'completed' | 'in-progress';
  results: RaceResult[];
  weather: string;
  season: number;
  isCompleted: boolean;
  isUpcoming: boolean;
  winner?: RaceResult;
  podium: RaceResult[];
}

export interface Circuit {
  id: string;
  name: string;
  location: string;
  country: string;
  laps: number;
  length: number;
}

export interface RaceResult {
  driverId: string;
  driverName: string;
  teamId: string;
  teamName: string;
  position: number;
  points: number;
  status: string;
  raceTime?: number;
  fastestLap: boolean;
  pole: boolean;
}

// Standings Types
export interface Standings {
  season: number;
  driverStandings: DriverStanding[];
  constructorStandings: ConstructorStanding[];
  lastUpdated: string;
  championshipLeader?: DriverStanding;
}

export interface DriverStanding {
  position: number;
  driverId: string;
  driverName: string;
  teamId: string;
  teamName: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
  races: number;
}

export interface ConstructorStanding {
  position: number;
  teamId: string;
  teamName: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps: number;
}

// Game State Types
export interface GameState {
  isInitialized: boolean;
  selectedTeam: string;
  selectedTeamData: Team;
  season: number;
  currentRound: number;
  standings: Standings;
  nextRace?: Race;
  seasonStats: SeasonStats;
  objectives?: ObjectivesStatus;
  raceFinancials?: {
    raceWeekendCost: number;
    prizeMoney: number;
    netChange: number;
    breakdown: {
      operationalCosts: number;
      positionBonus: number;
      fastestLapBonus: number;
    };
  };
}

export interface SeasonStats {
  totalRaces: number;
  completedRaces: number;
  upcomingRaces: number;
  nextRace?: Race;
  lastCompletedRace?: Race;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reward: number;
  isCompleted?: boolean;
  progress?: number;
}

export interface ObjectivesStatus {
  objectives: Objective[];
  totalCompleted: number;
  totalObjectives: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  count?: number;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

// Navigation Types
export type NavigationPage = 
  | 'team-selection'
  | 'dashboard'
  | 'standings'
  | 'races'
  | 'objectives'
  | 'financial';

// Team Color Mapping
export const TEAM_COLORS: Record<string, string> = {
  'red-bull': '#3671C6',
  'mercedes': '#00D2BE',
  'ferrari': '#DC143C',
  'mclaren': '#FF8700',
  'aston-martin': '#006F62',
  'alpine': '#0093CC',
  'williams': '#005AFF',
  'alpha-tauri': '#6692FF',
  'haas': '#FFFFFF',
  'kick-sauber': '#52E252',
};

// Utility Types
export type TeamId = string;
export type DriverId = string;
export type RaceId = string; 