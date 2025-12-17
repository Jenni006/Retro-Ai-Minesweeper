import { BoardState, PlayerStats, GameResult, DifficultyLevel } from '../types';
import { serializeBoard, deserializeBoard } from './boardUtils';

const STORAGE_KEYS = {
  CURRENT_GAME: 'minesweeper_current_game',
  PLAYER_STATS: 'minesweeper_player_stats',
  GAME_HISTORY: 'minesweeper_game_history',
  PREFERENCES: 'minesweeper_preferences'
} as const;

/**
 * Saves the current game state to localStorage
 */
export function saveGameState(board: BoardState): boolean {
  try {
    const serialized = serializeBoard(board);
    localStorage.setItem(STORAGE_KEYS.CURRENT_GAME, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save game state:', error);
    return false;
  }
}

/**
 * Loads the current game state from localStorage
 */
export function loadGameState(): BoardState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
    if (!data) return null;
    
    return deserializeBoard(data);
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

/**
 * Clears the saved game state
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_GAME);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

/**
 * Saves player statistics
 */
export function savePlayerStats(stats: PlayerStats): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(stats));
    return true;
  } catch (error) {
    console.error('Failed to save player stats:', error);
    return false;
  }
}

/**
 * Loads player statistics
 */
export function loadPlayerStats(): PlayerStats {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
    if (!data) return getDefaultPlayerStats();
    
    const stats = JSON.parse(data) as PlayerStats;
    
    // Validate and merge with defaults to handle missing fields
    return {
      ...getDefaultPlayerStats(),
      ...stats
    };
  } catch (error) {
    console.error('Failed to load player stats:', error);
    return getDefaultPlayerStats();
  }
}

/**
 * Returns default player statistics
 */
function getDefaultPlayerStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    averageTime: 0,
    hintsUsed: 0,
    currentStreak: 0,
    preferredDifficulty: 'beginner'
  };
}

/**
 * Updates player statistics with a new game result
 */
export function updatePlayerStats(gameResult: GameResult): PlayerStats {
  const currentStats = loadPlayerStats();
  
  const newStats: PlayerStats = {
    gamesPlayed: currentStats.gamesPlayed + 1,
    gamesWon: currentStats.gamesWon + (gameResult.won ? 1 : 0),
    hintsUsed: currentStats.hintsUsed + gameResult.hintsUsed,
    currentStreak: gameResult.won ? currentStats.currentStreak + 1 : 0,
    preferredDifficulty: currentStats.preferredDifficulty,
    averageTime: calculateNewAverageTime(currentStats, gameResult.timeElapsed)
  };
  
  savePlayerStats(newStats);
  return newStats;
}

/**
 * Calculates new average time including the latest game
 */
function calculateNewAverageTime(stats: PlayerStats, newTime: number): number {
  if (stats.gamesPlayed === 0) return newTime;
  
  const totalTime = stats.averageTime * stats.gamesPlayed + newTime;
  return totalTime / (stats.gamesPlayed + 1);
}

/**
 * Saves a completed game to history
 */
export function saveGameResult(gameResult: GameResult): boolean {
  try {
    const history = loadGameHistory();
    history.push({
      ...gameResult,
      timestamp: Date.now()
    });
    
    // Keep only the last 100 games
    const trimmedHistory = history.slice(-100);
    
    localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(trimmedHistory));
    return true;
  } catch (error) {
    console.error('Failed to save game result:', error);
    return false;
  }
}

/**
 * Loads game history
 */
export function loadGameHistory(): (GameResult & { timestamp: number })[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
    if (!data) return [];
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load game history:', error);
    return [];
  }
}

/**
 * Player preferences interface
 */
export interface PlayerPreferences {
  difficulty: DifficultyLevel;
  aiAssistanceLevel: 'none' | 'minimal' | 'moderate' | 'full';
  showHintReasons: boolean;
  autoSave: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
}

/**
 * Saves player preferences
 */
export function savePreferences(preferences: PlayerPreferences): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return false;
  }
}

/**
 * Loads player preferences
 */
export function loadPreferences(): PlayerPreferences {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!data) return getDefaultPreferences();
    
    const preferences = JSON.parse(data) as PlayerPreferences;
    
    // Validate and merge with defaults
    return {
      ...getDefaultPreferences(),
      ...preferences
    };
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return getDefaultPreferences();
  }
}

/**
 * Returns default player preferences
 */
function getDefaultPreferences(): PlayerPreferences {
  return {
    difficulty: 'beginner',
    aiAssistanceLevel: 'moderate',
    showHintReasons: true,
    autoSave: true,
    soundEnabled: false,
    animationsEnabled: true
  };
}

/**
 * Clears all stored data (for reset functionality)
 */
export function clearAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear all data:', error);
  }
}

/**
 * Checks if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets storage usage statistics
 */
export function getStorageStats() {
  if (!isStorageAvailable()) {
    return { available: false, usage: 0, total: 0 };
  }
  
  try {
    let usage = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        usage += data.length;
      }
    });
    
    return {
      available: true,
      usage,
      total: 5 * 1024 * 1024, // Approximate localStorage limit (5MB)
      percentage: (usage / (5 * 1024 * 1024)) * 100
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return { available: false, usage: 0, total: 0 };
  }
}