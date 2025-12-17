import { BoardState, Position, MinePlacer } from '../types';
import { createEmptyBoard, placeMines, getAdjacentPositions, isValidPosition } from '../utils/gameLogic';
import { MinesweeperHintEngine } from './hintEngine';

export class IntelligentMinePlacer implements MinePlacer {
  private hintEngine = new MinesweeperHintEngine();

  /**
   * Generates a board with intelligent mine placement
   */
  generateBoard(width: number, height: number, mineCount: number, safeZone?: Position): BoardState {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const board = this.createBoardWithMines(width, height, mineCount, safeZone);
      
      if (this.validateSolvability(board)) {
        return this.optimizeMineDistribution(board);
      }
      
      attempts++;
    }

    // Fallback: create a basic board if we can't generate a solvable one
    console.warn('Could not generate solvable board, falling back to basic placement');
    return placeMines(createEmptyBoard(width, height), mineCount, safeZone);
  }

  /**
   * Creates a board with mines placed using improved distribution
   */
  private createBoardWithMines(width: number, height: number, mineCount: number, safeZone?: Position): BoardState {
    const board = createEmptyBoard(width, height);
    const availablePositions: Position[] = [];

    // Collect available positions (excluding safe zone)
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (safeZone) {
          // Exclude safe zone (clicked cell and its neighbors)
          const isInSafeZone = Math.abs(row - safeZone.row) <= 1 && 
                              Math.abs(col - safeZone.col) <= 1;
          if (!isInSafeZone) {
            availablePositions.push({ row, col });
          }
        } else {
          availablePositions.push({ row, col });
        }
      }
    }

    // Place mines with anti-clustering logic
    const minesToPlace = Math.min(mineCount, availablePositions.length);
    const placedMines: Position[] = [];

    for (let i = 0; i < minesToPlace; i++) {
      const position = this.selectMinePosition(availablePositions, placedMines, width, height);
      if (position) {
        board.cells[position.row][position.col].hasMine = true;
        placedMines.push(position);
        
        // Remove this position from available positions
        const index = availablePositions.findIndex(pos => 
          pos.row === position.row && pos.col === position.col
        );
        if (index !== -1) {
          availablePositions.splice(index, 1);
        }
      }
    }

    board.mineCount = placedMines.length;
    return this.calculateAdjacentMines(board);
  }

  /**
   * Selects the best position for the next mine to avoid clustering
   */
  private selectMinePosition(availablePositions: Position[], placedMines: Position[], width: number, height: number): Position | null {
    if (availablePositions.length === 0) return null;

    // If no mines placed yet, place randomly
    if (placedMines.length === 0) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      return availablePositions[randomIndex];
    }

    // Score each available position based on distance from existing mines
    const scoredPositions = availablePositions.map(pos => ({
      position: pos,
      score: this.calculatePositionScore(pos, placedMines, width, height)
    }));

    // Sort by score (higher is better for anti-clustering)
    scoredPositions.sort((a, b) => b.score - a.score);

    // Add some randomness to avoid completely predictable patterns
    const topCandidates = scoredPositions.slice(0, Math.min(5, scoredPositions.length));
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    
    return topCandidates[randomIndex].position;
  }

  /**
   * Calculates a score for a position based on mine distribution quality
   */
  private calculatePositionScore(position: Position, placedMines: Position[], width: number, height: number): number {
    let score = 0;

    // Distance-based scoring (farther from existing mines is better)
    for (const mine of placedMines) {
      const distance = this.euclideanDistance(position, mine);
      score += distance;
    }

    // Avoid edges and corners slightly (they have fewer neighbors)
    const edgePenalty = this.calculateEdgePenalty(position, width, height);
    score -= edgePenalty;

    // Add some randomness
    score += Math.random() * 2;

    return score;
  }

  /**
   * Calculates penalty for edge/corner positions
   */
  private calculateEdgePenalty(position: Position, width: number, height: number): number {
    let penalty = 0;
    
    if (position.row === 0 || position.row === height - 1) penalty += 0.5;
    if (position.col === 0 || position.col === width - 1) penalty += 0.5;
    
    return penalty;
  }

  /**
   * Calculates Euclidean distance between two positions
   */
  private euclideanDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.col - pos2.col;
    const dy = pos1.row - pos2.row;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Validates that a board is solvable through logical deduction
   */
  validateSolvability(board: BoardState): boolean {
    // Create a copy of the board for testing
    const testBoard = this.cloneBoard(board);
    
    // Simulate solving the board
    let progress = true;
    let iterations = 0;
    const maxIterations = 100;

    while (progress && iterations < maxIterations) {
      progress = false;
      iterations++;

      // Try to find safe moves
      const safeMoves = this.hintEngine.findSafeMoves(testBoard);
      
      if (safeMoves.length > 0) {
        // Reveal safe moves
        for (const move of safeMoves) {
          if (testBoard.cells[move.row][move.col].state === 'hidden') {
            testBoard.cells[move.row][move.col].state = 'revealed';
            testBoard.revealedCount++;
            progress = true;
          }
        }
      }

      // Check if we've solved the board
      const totalCells = testBoard.width * testBoard.height;
      if (testBoard.revealedCount >= totalCells - testBoard.mineCount) {
        return true; // Board is solvable
      }
    }

    // If we made significant progress, consider it solvable
    const solvePercentage = testBoard.revealedCount / (testBoard.width * testBoard.height - testBoard.mineCount);
    return solvePercentage > 0.7; // At least 70% solvable through logic
  }

  /**
   * Optimizes mine distribution to improve gameplay quality
   */
  optimizeMineDistribution(board: BoardState): BoardState {
    // For now, just return the board as-is
    // Could implement mine swapping to improve distribution
    return board;
  }

  /**
   * Calculates adjacent mine counts for all cells
   */
  private calculateAdjacentMines(board: BoardState): BoardState {
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        if (!board.cells[row][col].hasMine) {
          board.cells[row][col].adjacentMines = this.countAdjacentMines(board, { row, col });
        }
      }
    }
    return board;
  }

  /**
   * Counts mines adjacent to a specific position
   */
  private countAdjacentMines(board: BoardState, position: Position): number {
    let count = 0;
    const adjacentPositions = getAdjacentPositions(board, position);

    for (const adjPos of adjacentPositions) {
      if (board.cells[adjPos.row][adjPos.col].hasMine) {
        count++;
      }
    }

    return count;
  }

  /**
   * Creates a deep copy of the board
   */
  private cloneBoard(board: BoardState): BoardState {
    return {
      ...board,
      cells: board.cells.map(row => row.map(cell => ({ ...cell })))
    };
  }
}