// Simple AI: finds safe cells based on basic Minesweeper logic
export function findSafeCells(board) {
  const BOARD_SIZE = board.length;
  const safeCells = [];

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (!cell.revealed || cell.value === 0 || cell.value === "M") continue;

      // Count flagged neighbors
      let flagged = 0;
      let hiddenNeighbors = [];

      directions.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
          const neighbor = board[newRow][newCol];
          if (!neighbor.revealed && neighbor.flagged) flagged++;
          if (!neighbor.revealed && !neighbor.flagged) hiddenNeighbors.push([newRow, newCol]);
        }
      });

      // If flagged neighbors equal number → remaining hidden neighbors are safe
      if (flagged === cell.value) {
        hiddenNeighbors.forEach(([r, c]) => {
          safeCells.push([r, c]);
        });
      }
    }
  }

  return safeCells;
}