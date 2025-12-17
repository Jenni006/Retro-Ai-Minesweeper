import React, { useState, useEffect } from "react";
import Cell from "../Cell/Cell";
import { createEmptyBoard, placeMines, calculateNeighborCounts, BOARD_SIZE } from "../../utils/gameLogic";
import { findSafeCells } from "../../utils/aiLogic";
import "./Board.css";

const Board = () => {
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  const [aiHintCells, setAiHintCells] = useState([]);

  const handleAiHint = () => {
    const safe = findSafeCells(board);
    const newBoard = board.map(row => row.map(c => ({ ...c })));

    safe.forEach(([r, c]) => {
      newBoard[r][c].aiHighlight = "safe";
    });

    setBoard(newBoard);
    setAiHintCells(safe);
  };

  useEffect(() => {
    let newBoard = createEmptyBoard();
    newBoard = placeMines(newBoard);
    newBoard = calculateNeighborCounts(newBoard);
    setBoard(newBoard);
  }, []);

  const revealCell = (row, col) => {
    if (gameOver) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));

    const cell = newBoard[row][col];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;

    // Game over if mine
    if (cell.value === "M") {
      setGameOver(true);
      alert("💥 Game Over!");
    }

    setBoard(newBoard);
  };

  const toggleFlag = (row, col) => {
    if (gameOver) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    const cell = newBoard[row][col];
    if (!cell.revealed) cell.flagged = !cell.flagged;
    setBoard(newBoard);
  };

  return (
    <div>
      {gameOver && <h2>Game Over 💥</h2>}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={handleAiHint}>🤖 AI Hint</button>
      </div>
      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={cell.value}
              revealed={cell.revealed}
              flagged={cell.flagged} 
              aiHighlight={cell.aiHighlight}
              onClick={() => revealCell(rowIndex, colIndex)}
              onRightClick={() => toggleFlag(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Board;
