import { BoardState, Position, HintResult, HintEngine } from '../types';
import { getAdjacentPositions, getCellsByState } from '../utils/gameLogic';

export class MinesweeperHintEngine implements HintEngine {
  /**
   * Analyzes the board and provides the best hint available
   */
  analyzeBoard(board: BoardState): HintResult | null {
    if (board.gameStatus !== 'playing' || board.firstClick) {
      return null;
    }

    // First, try to find guaranteed safe moves
    const safeMoves = this.findSafeMoves(board);
    if (safeMoves.length > 0) {
      const bestMove = this.selectBestSafeMove(board, safeMoves);
      return {
        suggestedMove: bestMove,
        moveType: 'safe',
        confidence: 1.0,
        reasoning: this.explainSafeMove(board, bestMove)
      };
    }

    // If no safe moves, try logical deduction
    const logicalMoves = this.findLogicalMoves(board);
    if (logicalMoves.length > 0) {
      const bestMove = this.selectBestLogicalMove(board, logicalMoves);
      return {
        suggestedMove: bestMove,
        moveType: 'logical',
        confidence: 0.9,
        reasoning: this.explainLogicalMove(board, bestMove)
      };
    }

    // If no logical moves, use probability analysis
    const probabilityMoves = this.findProbabilityMoves(board);
    if (probabilityMoves.length > 0) {
      const bestMove = probabilityMoves[0];
      return {
        suggestedMove: bestMove.position,
        moveType: 'probability',
        confidence: bestMove.probability,
        reasoning: `This cell has a ${Math.round(bestMove.probability * 100)}% chance of being safe based on probability analysis.`
      };
    }

    return null; // No moves available
  }

  /**
   * Finds cells that are guaranteed to be safe
   */
  findSafeMoves(board: BoardState): Position[] {
    const safeMoves: Position[] = [];

    // Check all revealed numbered cells
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const cell = board.cells[row][col];
        
        if (cell.state === 'revealed' && cell.adjacentMines > 0) {
          const adjacentPositions = getAdjacentPositions(board, { row, col });
          const adjacentCells = adjacentPositions.map(pos => board.cells[pos.row][pos.col]);
          
          const flaggedCount = adjacentCells.filter(c => c.state === 'flagged').length;
          const hiddenCells = adjacentPositions.filter(pos => 
            board.cells[pos.row][pos.col].state === 'hidden'
          );

          // If all mines around this cell are flagged, remaining hidden cells are safe
          if (flaggedCount === cell.adjacentMines && hiddenCells.length > 0) {
            safeMoves.push(...hiddenCells);
          }
        }
      }
    }

    return this.removeDuplicatePositions(safeMoves);
  }

  /**
   * Finds cells that can be determined through logical deduction
   */
  findLogicalMoves(board: BoardState): Position[] {
    const logicalMoves: Position[] = [];

    // Check all revealed numbered cells for mine placement logic
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const cell = board.cells[row][col];
        
        if (cell.state === 'revealed' && cell.adjacentMines > 0) {
          const adjacentPositions = getAdjacentPositions(board, { row, col });
          const adjacentCells = adjacentPositions.map(pos => board.cells[pos.row][pos.col]);
          
          const flaggedCount = adjacentCells.filter(c => c.state === 'flagged').length;
          const hiddenPositions = adjacentPositions.filter(pos => 
            board.cells[pos.row][pos.col].state === 'hidden'
          );

          // If hidden + flagged equals adjacent mines, all hidden cells must be mines
          if (flaggedCount + hiddenPositions.length === cell.adjacentMines && hiddenPositions.length > 0) {
            // These should be flagged, but for hint purposes, we'll suggest revealing safe cells instead
            // This is a logical deduction that these are mines
            continue;
          }
        }
      }
    }

    // Advanced pattern recognition could go here
    // For now, return empty array as we handle most logic in safeMoves
    return logicalMoves;
  }

  /**
   * Finds moves based on probability analysis when no certain moves exist
   */
  findProbabilityMoves(board: BoardState): Array<{ position: Position; probability: number }> {
    const probabilityMoves: Array<{ position: Position; probability: number }> = [];
    const hiddenCells = getCellsByState(board, 'hidden');

    for (const position of hiddenCells) {
      const probability = this.calculateSafeProbability(board, position);
      probabilityMoves.push({ position, probability });
    }

    // Sort by highest probability (safest moves first)
    return probabilityMoves.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calculates the probability that a cell is safe
   */
  private calculateSafeProbability(board: BoardState, position: Position): number {
    // Simple probability calculation based on adjacent revealed cells
    const adjacentPositions = getAdjacentPositions(board, position);
    let totalConstraints = 0;
    let totalMinesNeeded = 0;

    for (const adjPos of adjacentPositions) {
      const adjCell = board.cells[adjPos.row][adjPos.col];
      
      if (adjCell.state === 'revealed' && adjCell.adjacentMines > 0) {
        const adjAdjacent = getAdjacentPositions(board, adjPos);
        const flaggedCount = adjAdjacent.filter(pos => 
          board.cells[pos.row][pos.col].state === 'flagged'
        ).length;
        const hiddenCount = adjAdjacent.filter(pos => 
          board.cells[pos.row][pos.col].state === 'hidden'
        ).length;

        if (hiddenCount > 0) {
          totalConstraints++;
          totalMinesNeeded += (adjCell.adjacentMines - flaggedCount) / hiddenCount;
        }
      }
    }

    if (totalConstraints === 0) {
      // No constraints, use global mine density
      const totalCells = board.width * board.height;
      const revealedCells = board.revealedCount;
      const flaggedCells = board.flaggedCount;
      const remainingCells = totalCells - revealedCells - flaggedCells;
      const remainingMines = board.mineCount - flaggedCells;
      
      return remainingCells > 0 ? 1 - (remainingMines / remainingCells) : 0;
    }

    // Average mine probability from constraints
    const avgMineProbability = totalMinesNeeded / totalConstraints;
    return Math.max(0, Math.min(1, 1 - avgMineProbability));
  }

  /**
   * Selects the best safe move based on information gain
   */
  private selectBestSafeMove(board: BoardState, safeMoves: Position[]): Position {
    if (safeMoves.length === 1) return safeMoves[0];

    // Prioritize moves that reveal the most information
    let bestMove = safeMoves[0];
    let maxInformationGain = 0;

    for (const move of safeMoves) {
      const informationGain = this.calculateInformationGain(board, move);
      if (informationGain > maxInformationGain) {
        maxInformationGain = informationGain;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Selects the best logical move
   */
  private selectBestLogicalMove(_board: BoardState, logicalMoves: Position[]): Position {
    // For now, just return the first logical move
    // Could be enhanced with more sophisticated selection criteria
    return logicalMoves[0];
  }

  /**
   * Calculates how much information a move would reveal
   */
  private calculateInformationGain(board: BoardState, position: Position): number {
    const cell = board.cells[position.row][position.col];
    
    // If it's an empty cell (no adjacent mines), it will likely reveal more cells
    if (cell.adjacentMines === 0) {
      return 10; // High value for empty cells
    }

    // Count how many hidden cells are adjacent
    const adjacentPositions = getAdjacentPositions(board, position);
    const hiddenAdjacentCount = adjacentPositions.filter(pos => 
      board.cells[pos.row][pos.col].state === 'hidden'
    ).length;

    return hiddenAdjacentCount;
  }

  /**
   * Explains why a safe move is safe
   */
  explainSafeMove(board: BoardState, position: Position): string {
    // Find which numbered cell makes this move safe
    const adjacentPositions = getAdjacentPositions(board, position);
    
    for (const adjPos of adjacentPositions) {
      const adjCell = board.cells[adjPos.row][adjPos.col];
      
      if (adjCell.state === 'revealed' && adjCell.adjacentMines > 0) {
        const adjAdjacent = getAdjacentPositions(board, adjPos);
        const flaggedCount = adjAdjacent.filter(pos => 
          board.cells[pos.row][pos.col].state === 'flagged'
        ).length;

        if (flaggedCount === adjCell.adjacentMines) {
          return `This cell is safe because the ${adjCell.adjacentMines} at (${adjPos.row + 1}, ${adjPos.col + 1}) already has all its mines flagged.`;
        }
      }
    }

    return 'This cell is safe based on logical deduction from surrounding numbers.';
  }

  /**
   * Explains why a logical move is recommended
   */
  explainLogicalMove(_board: BoardState, _position: Position): string {
    return `This cell can be determined through logical deduction from the surrounding numbered cells.`;
  }

  /**
   * Provides reasoning for a hint
   */
  explainReasoning(hint: HintResult): string {
    return hint.reasoning;
  }

  /**
   * Removes duplicate positions from an array
   */
  private removeDuplicatePositions(positions: Position[]): Position[] {
    const seen = new Set<string>();
    return positions.filter(pos => {
      const key = `${pos.row},${pos.col}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}