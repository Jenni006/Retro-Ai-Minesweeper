import { PlayerStats, GameResult, BoardState, DifficultyAdapter, DifficultyLevel } from '../types';
import { loadPlayerStats, savePlayerStats } from '../utils/storage';

export class AdaptiveDifficultySystem implements DifficultyAdapter {
  private readonly difficultySettings = {
    beginner: { baseWidth: 9, baseHeight: 9, baseMines: 10, maxMines: 15 },
    intermediate: { baseWidth: 16, baseHeight: 16, baseMines: 40, maxMines: 60 },
    expert: { baseWidth: 30, baseHeight: 16, baseMines: 99, maxMines: 150 }
  };

  /**
   * Calculates appropriate mine count based on player performance
   */
  calculateMineCount(playerStats: PlayerStats): number {
    const difficulty = playerStats.preferredDifficulty;
    const settings = this.difficultySettings[difficulty as keyof typeof this.difficultySettings];
    
    if (playerStats.gamesPlayed < 3) {
      // New players get base difficulty
      return settings.baseMines;
    }

    const winRate = playerStats.gamesWon / playerStats.gamesPlayed;
    const recentPerformance = this.analyzeRecentPerformance(playerStats);
    
    // Calculate adjustment based on performance
    let adjustment = 0;
    
    // Win rate adjustments
    if (winRate > 0.8) {
      adjustment += 3; // Increase difficulty for high win rate
    } else if (winRate > 0.6) {
      adjustment += 1; // Slight increase for good performance
    } else if (winRate < 0.3) {
      adjustment -= 3; // Decrease difficulty for poor performance
    } else if (winRate < 0.5) {
      adjustment -= 1; // Slight decrease for below average
    }

    // Recent performance adjustments
    if (recentPerformance.trend === 'improving' && recentPerformance.confidence > 0.7) {
      adjustment += 1; // Increase for improving performance
    } else if (recentPerformance.trend === 'declining' && recentPerformance.confidence > 0.7) {
      adjustment -= 1; // Decrease for declining performance
    }
    
    // Recent streak adjustments
    if (playerStats.currentStreak >= 5) {
      adjustment += 2; // Increase for long win streaks
    } else if (playerStats.currentStreak <= -3) {
      adjustment -= 2; // Decrease for losing streaks
    }

    // Hint usage adjustments
    const avgHintsPerGame = playerStats.hintsUsed / playerStats.gamesPlayed;
    if (avgHintsPerGame > 3) {
      adjustment -= 1; // Decrease difficulty for heavy hint users
    }

    // Apply adjustment with bounds
    const adjustedMines = Math.max(
      Math.floor(settings.baseMines * 0.7), // Minimum 70% of base
      Math.min(
        settings.maxMines,
        settings.baseMines + adjustment
      )
    );

    return adjustedMines;
  }

  /**
   * Adjusts difficulty based on game result
   */
  adjustDifficulty(gameResult: GameResult): void {
    const currentStats = loadPlayerStats();
    
    // Update performance tracking
    const updatedStats = this.updatePerformanceMetrics(currentStats, gameResult);
    
    // Save updated stats
    savePlayerStats(updatedStats);
  }

  /**
   * Validates that a board configuration is balanced
   */
  validateBoardBalance(board: BoardState): boolean {
    const totalCells = board.width * board.height;
    const mineRatio = board.mineCount / totalCells;
    
    // Check mine density is reasonable
    if (mineRatio < 0.1 || mineRatio > 0.4) {
      return false; // Too easy or too hard
    }

    // Check for mine clustering
    if (this.hasExcessiveClustering(board)) {
      return false;
    }

    // Check that there are enough numbered cells for logical solving
    const numberedCells = this.countNumberedCells(board);
    const minNumberedCells = Math.floor(totalCells * 0.3); // At least 30% should be numbered
    
    return numberedCells >= minNumberedCells;
  }

  /**
   * Analyzes recent performance trends
   */
  private analyzeRecentPerformance(playerStats: PlayerStats): {
    trend: 'improving' | 'declining' | 'stable';
    confidence: number;
  } {
    // This is a simplified analysis
    // In a full implementation, we'd track game history
    
    if (playerStats.currentStreak > 2) {
      return { trend: 'improving', confidence: 0.8 };
    } else if (playerStats.currentStreak < -2) {
      return { trend: 'declining', confidence: 0.8 };
    } else {
      return { trend: 'stable', confidence: 0.6 };
    }
  }

  /**
   * Updates performance metrics with new game result
   */
  private updatePerformanceMetrics(stats: PlayerStats, result: GameResult): PlayerStats {
    const newGamesPlayed = stats.gamesPlayed + 1;
    const newGamesWon = stats.gamesWon + (result.won ? 1 : 0);
    const newHintsUsed = stats.hintsUsed + result.hintsUsed;
    
    // Update average time
    const newAverageTime = stats.gamesPlayed > 0 
      ? (stats.averageTime * stats.gamesPlayed + result.timeElapsed) / newGamesPlayed
      : result.timeElapsed;

    // Update streak
    const newStreak = result.won ? Math.max(0, stats.currentStreak) + 1 : Math.min(0, stats.currentStreak) - 1;

    return {
      ...stats,
      gamesPlayed: newGamesPlayed,
      gamesWon: newGamesWon,
      averageTime: newAverageTime,
      hintsUsed: newHintsUsed,
      currentStreak: newStreak
    };
  }

  /**
   * Checks if the board has excessive mine clustering
   */
  private hasExcessiveClustering(board: BoardState): boolean {
    let clusterCount = 0;
    const visited = new Set<string>();

    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const key = `${row},${col}`;
        
        if (board.cells[row][col].hasMine && !visited.has(key)) {
          const clusterSize = this.getClusterSize(board, { row, col }, visited);
          
          if (clusterSize >= 4) { // Clusters of 4+ mines are problematic
            clusterCount++;
          }
        }
      }
    }

    // Allow some clustering, but not too much
    const maxAllowedClusters = Math.floor(board.mineCount / 8);
    return clusterCount > maxAllowedClusters;
  }

  /**
   * Gets the size of a mine cluster starting from a position
   */
  private getClusterSize(board: BoardState, start: Position, visited: Set<string>): number {
    const stack = [start];
    let size = 0;

    while (stack.length > 0) {
      const pos = stack.pop()!;
      const key = `${pos.row},${pos.col}`;

      if (visited.has(key)) continue;
      if (!board.cells[pos.row][pos.col].hasMine) continue;

      visited.add(key);
      size++;

      // Check adjacent cells
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const newRow = pos.row + dr;
          const newCol = pos.col + dc;
          
          if (newRow >= 0 && newRow < board.height && 
              newCol >= 0 && newCol < board.width) {
            stack.push({ row: newRow, col: newCol });
          }
        }
      }
    }

    return size;
  }

  /**
   * Counts cells with numbers (adjacent mines > 0)
   */
  private countNumberedCells(board: BoardState): number {
    let count = 0;
    
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const cell = board.cells[row][col];
        if (!cell.hasMine && cell.adjacentMines > 0) {
          count++;
        }
      }
    }
    
    return count;
  }

  /**
   * Gets difficulty recommendation based on player stats
   */
  getDifficultyRecommendation(playerStats: PlayerStats): {
    recommended: DifficultyLevel;
    reason: string;
  } {
    const winRate = playerStats.gamesPlayed > 0 ? playerStats.gamesWon / playerStats.gamesPlayed : 0;
    const avgHintsPerGame = playerStats.gamesPlayed > 0 ? playerStats.hintsUsed / playerStats.gamesPlayed : 0;

    if (playerStats.gamesPlayed < 5) {
      return {
        recommended: 'beginner',
        reason: 'Start with beginner difficulty to learn the game mechanics.'
      };
    }

    if (winRate > 0.8 && avgHintsPerGame < 1 && playerStats.preferredDifficulty === 'beginner') {
      return {
        recommended: 'intermediate',
        reason: 'You\'re doing great! Try intermediate difficulty for more challenge.'
      };
    }

    if (winRate > 0.7 && avgHintsPerGame < 2 && playerStats.preferredDifficulty === 'intermediate') {
      return {
        recommended: 'expert',
        reason: 'Excellent performance! You\'re ready for expert level.'
      };
    }

    if (winRate < 0.3 && playerStats.preferredDifficulty !== 'beginner') {
      return {
        recommended: 'beginner',
        reason: 'Consider trying beginner difficulty to build confidence.'
      };
    }

    return {
      recommended: playerStats.preferredDifficulty,
      reason: 'Your current difficulty level suits your skill level well.'
    };
  }
}

// Type for Position (should be imported from types, but defining here for completeness)
interface Position {
  row: number;
  col: number;
}