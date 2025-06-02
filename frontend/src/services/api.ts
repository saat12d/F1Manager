import axios from 'axios';
import type { 
  Team, 
  Driver, 
  Race, 
  Standings, 
  GameState, 
  ObjectivesStatus,
  ApiResponse 
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Teams API
export const teamsApi = {
  // Get all teams
  getAll: async (): Promise<Team[]> => {
    const response = await api.get<ApiResponse<Team[]>>('/teams');
    return response.data.data;
  },

  // Get team by ID
  getById: async (teamId: string): Promise<Team> => {
    const response = await api.get<ApiResponse<Team>>(`/teams/${teamId}`);
    return response.data.data;
  },

  // Get team with driver details
  getWithDrivers: async (teamId: string): Promise<Team> => {
    const response = await api.get<ApiResponse<Team>>(`/teams/${teamId}/details`);
    return response.data.data;
  },

  // Get team drivers
  getDrivers: async (teamId: string): Promise<Driver[]> => {
    const response = await api.get<ApiResponse<Driver[]>>(`/teams/${teamId}/drivers`);
    return response.data.data;
  },
};

// Drivers API
export const driversApi = {
  // Get all drivers
  getAll: async (): Promise<Driver[]> => {
    const response = await api.get<ApiResponse<Driver[]>>('/drivers');
    return response.data.data;
  },

  // Get driver by ID
  getById: async (driverId: string): Promise<Driver> => {
    const response = await api.get<ApiResponse<Driver>>(`/drivers/${driverId}`);
    return response.data.data;
  },

  // Get drivers by team
  getByTeam: async (teamId: string): Promise<Driver[]> => {
    const response = await api.get<ApiResponse<Driver[]>>(`/drivers/team/${teamId}`);
    return response.data.data;
  },
};

// Races API
export const racesApi = {
  // Get all races
  getAll: async (): Promise<Race[]> => {
    const response = await api.get<ApiResponse<Race[]>>('/races');
    return response.data.data;
  },

  // Get race by ID
  getById: async (raceId: string): Promise<Race> => {
    const response = await api.get<ApiResponse<Race>>(`/races/${raceId}`);
    return response.data.data;
  },

  // Get next race
  getNext: async (): Promise<Race> => {
    const response = await api.get<ApiResponse<Race>>('/races/next');
    return response.data.data;
  },

  // Get upcoming races
  getUpcoming: async (): Promise<Race[]> => {
    const response = await api.get<ApiResponse<Race[]>>('/races/status/upcoming');
    return response.data.data;
  },

  // Get completed races
  getCompleted: async (): Promise<Race[]> => {
    const response = await api.get<ApiResponse<Race[]>>('/races/status/completed');
    return response.data.data;
  },

  // Simulate a race
  simulate: async (raceId: string): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/races/${raceId}/simulate`);
    return response.data.data;
  },

  // Get season stats
  getSeasonStats: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/races/season/stats');
    return response.data.data;
  },
};

// Standings API
export const standingsApi = {
  // Get current standings
  getCurrent: async (): Promise<Standings> => {
    const response = await api.get<ApiResponse<Standings>>('/standings');
    return response.data.data;
  },

  // Get driver standings
  getDrivers: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/standings/drivers');
    return response.data.data;
  },

  // Get constructor standings
  getConstructors: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/standings/constructors');
    return response.data.data;
  },

  // Get championship leader
  getLeader: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/standings/leader');
    return response.data.data;
  },
};

// Game API
export const gameApi = {
  // Get current game state
  getState: async (): Promise<GameState> => {
    const response = await api.get<ApiResponse<GameState>>('/game/state');
    return response.data.data;
  },

  // Initialize game with team selection
  initialize: async (teamId: string): Promise<GameState> => {
    const response = await api.post<ApiResponse<GameState>>('/game/initialize', {
      teamId,
    });
    return response.data.data;
  },

  // Get objectives
  getObjectives: async (): Promise<ObjectivesStatus> => {
    const response = await api.get<ApiResponse<ObjectivesStatus>>('/game/objectives');
    return response.data.data;
  },

  // Get grid (all teams with drivers)
  getGrid: async (): Promise<Team[]> => {
    const response = await api.get<ApiResponse<Team[]>>('/game/grid');
    return response.data.data;
  },

  // Reset game
  reset: async (): Promise<void> => {
    await api.post('/game/reset');
  },

  // Get budget info
  getBudget: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/game/budget');
    return response.data.data;
  },

  // Get dashboard data
  getDashboard: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/game/dashboard');
    return response.data.data;
  },

  // Check if season is complete
  checkSeasonComplete: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/game/season/complete');
    return response.data.data;
  },
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'OK';
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    return false;
  }
};

// Export the base api instance for custom requests
export default api; 