import { BoardState, Position, Cell } from '../types';

/**
 * Serializes board state to JSON string for storage
 */
export function serializeBoard(board: BoardState): string {
  return JSON.stringify(board);
}

/**
 * Deserializes board state from JSON string
 */
export function deserializeBoard(data: string): BoardState | null {
  try {
    const board = JSON.parse(data) as BoardState;
    
    // Validate the board structure
    if (!isValidBoardStructure(board)) {
      return null;
    }
    
    return board;
  } catch (error) {
    console.error('Failed to deserialize board:', error);
    return null;
  }
}

/**
 * Validates that a board has the correct structure
 */
function isValidBoardStructure(board: any): board is BoardState {
  return (
    board &&
    typeof board.width === 'number' &&
    typeof board.height === 'number' &&
    typeof board.mineCount === 'number' &&
    typeof board.revealedCount === 'number' &&
    typeof board.flaggedCount === 'number' &&
    typeof board.firstClick === 'boolean' &&
    ['playing', 'won', 'lost'].includes(board.gameStatus) &&
    Array.isArray(board.cells) &&
    board.cells.length === board.height &&
    board.cells.every((row: any) => 
      Array.isArray(row) && 
      row.length === board.width &&
      row.every((cell: any) => isValidCell(cell))
    )
  );
}

/**
 * Validates that a cell has the correct structure
 */
function isValidCell(cell: any): cell is Cell {
  return (
    cell &&
    ['hidden', 'revealed', 'flagged', 'mine', 'exploded'].includes(cell.state) &&
    typeof cell.hasMine === 'boolean' &&
    typeof cell.adjacentMines === 'number' &&
    cell.position &&
    typeof cell.position.row === 'number' &&
    typeof cell.position.col === 'number'
  );
}

/**
 * Calculates the completion percentage of the board
 */
export function getBoardProgress(board: BoardState): number {
  const totalNonMineCells = board.width * board.height - board.mineCount;
  return totalNonMineCells > 0 ? (board.revealedCount / totalNonMineCells) * 100 : 0;
}

/**
 * Gets statistics about the current board state
 */
export function getBoardStats(board: BoardState) {
  const totalCells = board.width * board.height;
  const hiddenCells = getCellCount(board, 'hidden');
  const revealedCells = board.revealedCount;
  const flaggedCells = board.flaggedCount;
  const mineCells = board.mineCount;
  
  return {
    totalCells,
    hiddenCells,
    revealedCells,
    flaggedCells,
    mineCells,
    progress: getBoardProgress(board),
    remainingMines: Math.max(0, mineCells - flaggedCells)
  };
}

/**
 * Counts cells with a specific state
 */
function getCellCount(board: BoardState, state: Cell['state']): number {
  let count = 0;
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      if (board.cells[row][col].state === state) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Finds all cells that match a predicate function
 */
export function findCells(board: BoardState, predicate: (cell: Cell) => boolean): Position[] {
  const positions: Position[] = [];
  
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      const cell = board.cells[row][col];
      if (predicate(cell)) {
        positions.push({ row, col });
      }
    }
  }
  
  return positions;
}

/**
 * Gets the cell at a specific position
 */
export function getCellAt(board: BoardState, position: Position): Cell | null {
  const { row, col } = position;
  
  if (row < 0 || row >= board.height || col < 0 || col >= board.width) {
    return null;
  }
  
  return board.cells[row][col];
}

/**
 * Checks if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * Calculates Manhattan distance between two positions
 */
export function manhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

/**
 * Calculates Euclidean distance between two positions
 */
export function euclideanDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.col - pos2.col;
  const dy = pos1.row - pos2.row;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Gets all positions within a certain radius of a center position
 */
export function getPositionsInRadius(board: BoardState, center: Position, radius: number): Position[] {
  const positions: Position[] = [];
  
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      const pos = { row, col };
      if (euclideanDistance(center, pos) <= radius) {
        positions.push(pos);
      }
    }
  }
  
  return positions;
}

/**
 * Checks if the board is in a solvable state (for AI analysis)
 */
export function isBoardSolvable(board: BoardState): boolean {
  // A board is solvable if there are logical moves available
  // This is a simplified check - a full implementation would be more complex
  
  if (board.gameStatus !== 'playing') {
    return false;
  }
  
  // If it's the first click, it's always solvable
  if (board.firstClick) {
    return true;
  }
  
  // Check if there are any obvious safe moves
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      const cell = board.cells[row][col];
      
      if (cell.state === 'revealed' && cell.adjacentMines > 0) {
        // Count adjacent flags and hidden cells
        const adjacent = getAdjacentCells(board, { row, col });
        const flaggedCount = adjacent.filter(c => c.state === 'flagged').length;
        const hiddenCount = adjacent.filter(c => c.state === 'hidden').length;
        
        // If all mines are flagged, remaining hidden cells are safe
        if (flaggedCount === cell.adjacentMines && hiddenCount > 0) {
          return true;
        }
        
        // If hidden + flagged equals adjacent mines, all hidden are mines
        if (flaggedCount + hiddenCount === cell.adjacentMines && hiddenCount > 0) {
          return true;
        }
      }
    }
  }
  
  return false; // No obvious moves found
}

/**
 * Gets all adjacent cells to a position
 */
function getAdjacentCells(board: BoardState, position: Position): Cell[] {
  const { row, col } = position;
  const adjacent: Cell[] = [];
  
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < board.height && c >= 0 && c < board.width) {
        if (r !== row || c !== col) {
          adjacent.push(board.cells[r][c]);
        }
      }
    }
  }
  
  return adjacent;
}