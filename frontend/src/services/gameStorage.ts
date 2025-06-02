import type { GameState } from '../types';

const GAME_STATE_KEY = 'f1_manager_game_state';
const BACKUP_KEY = 'f1_manager_game_state_backup';

export class GameStorageService {
  // Save game state to localStorage
  static saveGameState(gameState: GameState): void {
    try {
      // Create backup of current state before saving new one
      const currentState = localStorage.getItem(GAME_STATE_KEY);
      if (currentState) {
        localStorage.setItem(BACKUP_KEY, currentState);
      }

      // Save new state
      const serializedState = JSON.stringify({
        ...gameState,
        lastSaved: new Date().toISOString(),
      });
      localStorage.setItem(GAME_STATE_KEY, serializedState);
      
      console.log('✅ Game state saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save game state:', error);
      throw new Error('Failed to save game state to localStorage');
    }
  }

  // Load game state from localStorage
  static loadGameState(): GameState | null {
    try {
      const serializedState = localStorage.getItem(GAME_STATE_KEY);
      if (!serializedState) {
        console.log('No saved game state found');
        return null;
      }

      const gameState = JSON.parse(serializedState) as GameState & { lastSaved?: string };
      
      // Validate the loaded state has required properties
      if (!this.isValidGameState(gameState)) {
        console.warn('Invalid game state found, removing from storage');
        this.clearGameState();
        return null;
      }

      console.log('✅ Game state loaded from localStorage', {
        team: gameState.selectedTeamData?.name,
        season: gameState.season,
        lastSaved: gameState.lastSaved,
      });

      return gameState;
    } catch (error) {
      console.error('❌ Failed to load game state:', error);
      
      // Try to restore from backup
      return this.restoreFromBackup();
    }
  }

  // Restore from backup if main state is corrupted
  private static restoreFromBackup(): GameState | null {
    try {
      const backupState = localStorage.getItem(BACKUP_KEY);
      if (!backupState) {
        return null;
      }

      const gameState = JSON.parse(backupState) as GameState;
      if (this.isValidGameState(gameState)) {
        console.log('✅ Game state restored from backup');
        // Save the backup as the current state
        this.saveGameState(gameState);
        return gameState;
      }
    } catch (error) {
      console.error('❌ Failed to restore from backup:', error);
    }
    
    return null;
  }

  // Validate game state structure
  private static isValidGameState(state: any): state is GameState {
    return (
      state &&
      typeof state.isInitialized === 'boolean' &&
      typeof state.selectedTeam === 'string' &&
      state.selectedTeamData &&
      typeof state.selectedTeamData.id === 'string' &&
      typeof state.selectedTeamData.name === 'string' &&
      typeof state.season === 'number' &&
      typeof state.currentRound === 'number'
    );
  }

  // Clear game state from localStorage
  static clearGameState(): void {
    try {
      localStorage.removeItem(GAME_STATE_KEY);
      localStorage.removeItem(BACKUP_KEY);
      
      // Also clear all race results
      this.clearRaceResults();
      
      console.log('✅ Game state and race results cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear game state:', error);
    }
  }

  // Clear all race results from localStorage
  static clearRaceResults(): void {
    try {
      const keys = Object.keys(localStorage);
      const raceKeys = keys.filter(key => key.startsWith('race_') && key.endsWith('_results'));
      
      raceKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`✅ Cleared ${raceKeys.length} race results from localStorage`);
    } catch (error) {
      console.error('❌ Failed to clear race results:', error);
    }
  }

  // Get race results for a specific race
  static getRaceResults(raceId: string): any | null {
    try {
      const raceKey = `race_${raceId}_results`;
      const savedResults = localStorage.getItem(raceKey);
      return savedResults ? JSON.parse(savedResults) : null;
    } catch (error) {
      console.error('❌ Failed to get race results:', error);
      return null;
    }
  }

  // Save race results for persistence
  static saveRaceResults(raceId: string, resultsData: any): void {
    try {
      const raceKey = `race_${raceId}_results`;
      localStorage.setItem(raceKey, JSON.stringify(resultsData));
      console.log(`✅ Race results saved for race ${raceId}`);
    } catch (error) {
      console.error('❌ Failed to save race results:', error);
    }
  }

  // Check if game state exists
  static hasGameState(): boolean {
    return localStorage.getItem(GAME_STATE_KEY) !== null;
  }

  // Get game state summary for display
  static getGameStateSummary(): { teamName: string; season: number; lastSaved: string } | null {
    try {
      const serializedState = localStorage.getItem(GAME_STATE_KEY);
      if (!serializedState) return null;

      const state = JSON.parse(serializedState);
      return {
        teamName: state.selectedTeamData?.name || 'Unknown Team',
        season: state.season || 2024,
        lastSaved: state.lastSaved || 'Unknown',
      };
    } catch (error) {
      return null;
    }
  }

  // Export game state for sharing/backup
  static exportGameState(): string | null {
    try {
      const gameState = this.loadGameState();
      if (!gameState) return null;

      return JSON.stringify({
        ...gameState,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      }, null, 2);
    } catch (error) {
      console.error('❌ Failed to export game state:', error);
      return null;
    }
  }

  // Import game state from backup
  static importGameState(stateData: string): boolean {
    try {
      const gameState = JSON.parse(stateData);
      
      if (!this.isValidGameState(gameState)) {
        throw new Error('Invalid game state format');
      }

      this.saveGameState(gameState);
      return true;
    } catch (error) {
      console.error('❌ Failed to import game state:', error);
      return false;
    }
  }
}

export default GameStorageService; 