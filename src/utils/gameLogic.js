// src/utils/gameLogic.js

export const BOARD_SIZE = 8;
export const MINES_COUNT = 10;

// Generate empty board
export function createEmptyBoard() {
  const board = Array(BOARD_SIZE)
    .fill(null)
    .map(() =>
      Array(BOARD_SIZE).fill({
        value: 0,
        revealed: false,
        flagged: false,
        aiHighlight: ""
      })
    );
  return board;
}

// Place mines randomly
export function placeMines(board) {
  let minesPlaced = 0;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  while (minesPlaced < MINES_COUNT) {
    const row = Math.floor(Math.random() * BOARD_SIZE);
    const col = Math.floor(Math.random() * BOARD_SIZE);

    if (!newBoard[row][col].value) {
      newBoard[row][col].value = "M"; // M for mine
      minesPlaced++;
    }
  }

  return newBoard;
}

// Calculate neighbor mine counts
export function calculateNeighborCounts(board) {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], /*cell*/ [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (newBoard[row][col].value === "M") continue;

      let count = 0;
      directions.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        if (
          newRow >= 0 &&
          newRow < BOARD_SIZE &&
          newCol >= 0 &&
          newCol < BOARD_SIZE &&
          newBoard[newRow][newCol].value === "M"
        ) {
          count++;
        }
      });

      newBoard[row][col].value = count;
    }
  }

  return newBoard;
}
