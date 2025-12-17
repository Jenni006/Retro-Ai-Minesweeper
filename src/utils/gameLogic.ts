import { BoardState, Cell, Position, CellState } from '../types';

/**
 * Creates an empty board with the specified dimensions
 */
export function createEmptyBoard(width: number, height: number): BoardState {
  const cells: Cell[][] = [];
  
  for (let row = 0; row < height; row++) {
    cells[row] = [];
    for (let col = 0; col < width; col++) {
      cells[row][col] = {
        state: 'hidden',
        hasMine: false,
        adjacentMines: 0,
        position: { row, col }
      };
    }
  }

  return {
    cells,
    width,
    height,
    mineCount: 0,
    revealedCount: 0,
    flaggedCount: 0,
    gameStatus: 'playing',
    firstClick: true
  };
}

/**
 * Places mines randomly on the board, avoiding the safe zone
 */
export function placeMines(board: BoardState, mineCount: number, safeZone?: Position): BoardState {
  const newBoard = { ...board };
  newBoard.cells = board.cells.map(row => row.map(cell => ({ ...cell })));
  newBoard.mineCount = mineCount;

  const availablePositions: Position[] = [];
  
  // Collect all available positions (excluding safe zone)
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
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

  // Randomly place mines
  const minesToPlace = Math.min(mineCount, availablePositions.length);
  const shuffled = [...availablePositions].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < minesToPlace; i++) {
    const { row, col } = shuffled[i];
    newBoard.cells[row][col].hasMine = true;
  }

  // Calculate adjacent mine counts
  return calculateAdjacentMines(newBoard);
}

/**
 * Calculates the number of adjacent mines for each cell
 */
export function calculateAdjacentMines(board: BoardState): BoardState {
  const newBoard = { ...board };
  newBoard.cells = board.cells.map(row => row.map(cell => ({ ...cell })));

  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      if (!newBoard.cells[row][col].hasMine) {
        newBoard.cells[row][col].adjacentMines = countAdjacentMines(newBoard, { row, col });
      }
    }
  }

  return newBoard;
}

/**
 * Counts mines adjacent to a specific position
 */
export function countAdjacentMines(board: BoardState, position: Position): number {
  let count = 0;
  const { row, col } = position;

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < board.height && c >= 0 && c < board.width) {
        if (r !== row || c !== col) { // Don't count the cell itself
          if (board.cells[r][c].hasMine) {
            count++;
          }
        }
      }
    }
  }

  return count;
}

/**
 * Gets all adjacent positions to a given position
 */
export function getAdjacentPositions(board: BoardState, position: Position): Position[] {
  const { row, col } = position;
  const adjacent: Position[] = [];

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < board.height && c >= 0 && c < board.width) {
        if (r !== row || c !== col) { // Don't include the cell itself
          adjacent.push({ row: r, col: c });
        }
      }
    }
  }

  return adjacent;
}

/**
 * Reveals a cell and handles flood fill for empty cells
 */
export function revealCell(board: BoardState, position: Position): BoardState {
  const { row, col } = position;
  
  // Validate position
  if (row < 0 || row >= board.height || col < 0 || col >= board.width) {
    return board;
  }

  const cell = board.cells[row][col];
  
  // Can't reveal already revealed or flagged cells
  if (cell.state === 'revealed' || cell.state === 'flagged') {
    return board;
  }

  const newBoard = { ...board };
  newBoard.cells = board.cells.map(row => row.map(cell => ({ ...cell })));
  newBoard.firstClick = false;

  // If it's a mine, game over
  if (cell.hasMine) {
    newBoard.cells[row][col].state = 'exploded';
    newBoard.gameStatus = 'lost';
    // Reveal all mines
    for (let r = 0; r < board.height; r++) {
      for (let c = 0; c < board.width; c++) {
        if (newBoard.cells[r][c].hasMine && newBoard.cells[r][c].state !== 'exploded') {
          newBoard.cells[r][c].state = 'mine';
        }
      }
    }
    return newBoard;
  }

  // Reveal the cell
  newBoard.cells[row][col].state = 'revealed';
  newBoard.revealedCount++;

  // If it's an empty cell (no adjacent mines), flood fill
  if (cell.adjacentMines === 0) {
    const toReveal = [position];
    const visited = new Set<string>();

    while (toReveal.length > 0) {
      const current = toReveal.pop()!;
      const key = `${current.row},${current.col}`;
      
      if (visited.has(key)) continue;
      visited.add(key);

      const adjacentPositions = getAdjacentPositions(newBoard, current);
      
      for (const adjPos of adjacentPositions) {
        const adjCell = newBoard.cells[adjPos.row][adjPos.col];
        
        if (adjCell.state === 'hidden' && !adjCell.hasMine) {
          newBoard.cells[adjPos.row][adjPos.col].state = 'revealed';
          newBoard.revealedCount++;
          
          // If this adjacent cell is also empty, add it to the queue
          if (adjCell.adjacentMines === 0) {
            toReveal.push(adjPos);
          }
        }
      }
    }
  }

  // Check for win condition
  const totalCells = board.width * board.height;
  if (newBoard.revealedCount === totalCells - board.mineCount) {
    newBoard.gameStatus = 'won';
  }

  return newBoard;
}

/**
 * Toggles flag on a cell
 */
export function toggleFlag(board: BoardState, position: Position): BoardState {
  const { row, col } = position;
  
  // Validate position
  if (row < 0 || row >= board.height || col < 0 || col >= board.width) {
    return board;
  }

  const cell = board.cells[row][col];
  
  // Can't flag revealed cells
  if (cell.state === 'revealed' || cell.state === 'mine' || cell.state === 'exploded') {
    return board;
  }

  const newBoard = { ...board };
  newBoard.cells = board.cells.map(row => row.map(cell => ({ ...cell })));

  if (cell.state === 'flagged') {
    newBoard.cells[row][col].state = 'hidden';
    newBoard.flaggedCount--;
  } else {
    newBoard.cells[row][col].state = 'flagged';
    newBoard.flaggedCount++;
  }

  return newBoard;
}

/**
 * Checks if a position is valid on the board
 */
export function isValidPosition(board: BoardState, position: Position): boolean {
  return position.row >= 0 && position.row < board.height &&
         position.col >= 0 && position.col < board.width;
}

/**
 * Gets all cells with a specific state
 */
export function getCellsByState(board: BoardState, state: CellState): Position[] {
  const positions: Position[] = [];
  
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      if (board.cells[row][col].state === state) {
        positions.push({ row, col });
      }
    }
  }
  
  return positions;
}

/**
 * Creates a deep copy of the board state
 */
export function cloneBoard(board: BoardState): BoardState {
  return {
    ...board,
    cells: board.cells.map(row => row.map(cell => ({ ...cell })))
  };
}