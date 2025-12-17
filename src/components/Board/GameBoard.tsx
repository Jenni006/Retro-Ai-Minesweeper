import React, { useState, useEffect, useCallback } from 'react';
import { Cell } from '../Cell/Cell';
import { BoardState, Position, GameBoardProps, GameResult } from '../../types';
import { createEmptyBoard, revealCell, toggleFlag } from '../../utils/gameLogic';
import { saveGameState, loadGameState, clearGameState } from '../../utils/storage';
import { IntelligentMinePlacer } from '../../ai/minePlacer';
import { MinesweeperHintEngine } from '../../ai/hintEngine';
import './Board.css';

const GameBoard: React.FC<GameBoardProps> = ({ 
  width, 
  height, 
  mineCount, 
  onGameComplete 
}) => {
  const [board, setBoard] = useState<BoardState>(() => {
    // Try to load saved game state, otherwise create new board
    const savedBoard = loadGameState();
    if (savedBoard && 
        savedBoard.width === width && 
        savedBoard.height === height && 
        savedBoard.mineCount === mineCount) {
      return savedBoard;
    }
    return createEmptyBoard(width, height);
  });

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [hintedPosition, setHintedPosition] = useState<Position | null>(null);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [minePlacer] = useState(() => new IntelligentMinePlacer());
  const [hintEngine] = useState(() => new MinesweeperHintEngine());

  // Auto-save game state when board changes
  useEffect(() => {
    if (board.gameStatus === 'playing' && !board.firstClick) {
      saveGameState(board);
    } else if (board.gameStatus !== 'playing') {
      clearGameState();
    }
  }, [board]);

  // Handle game completion
  useEffect(() => {
    if (board.gameStatus !== 'playing' && onGameComplete) {
      const timeElapsed = Date.now() - startTime;
      const gameResult: GameResult = {
        won: board.gameStatus === 'won',
        timeElapsed,
        hintsUsed,
        boardSize: { width: board.width, height: board.height },
        mineCount: board.mineCount
      };
      onGameComplete(gameResult);
    }
  }, [board.gameStatus, onGameComplete, startTime, hintsUsed, board.width, board.height, board.mineCount]);

  const handleCellClick = useCallback((position: Position) => {
    if (board.gameStatus !== 'playing') return;

    let newBoard = board;

    // If it's the first click, place mines avoiding this position
    if (board.firstClick) {
      newBoard = minePlacer.generateBoard(board.width, board.height, mineCount, position);
      setStartTime(Date.now()); // Reset timer on first actual click
    }

    // Reveal the cell
    newBoard = revealCell(newBoard, position);
    setBoard(newBoard);

    // Clear hint highlight
    if (hintedPosition) {
      setHintedPosition(null);
    }
  }, [board, mineCount, hintedPosition]);

  const handleCellRightClick = useCallback((position: Position) => {
    if (board.gameStatus !== 'playing') return;

    const newBoard = toggleFlag(board, position);
    setBoard(newBoard);
  }, [board]);

  const newGame = useCallback(() => {
    const newBoard = createEmptyBoard(width, height);
    setBoard(newBoard);
    setStartTime(Date.now());
    setHintedPosition(null);
    setHintsUsed(0);
    clearGameState();
  }, [width, height]);

  const requestHint = useCallback(() => {
    if (board.gameStatus !== 'playing' || board.firstClick) return;

    const hint = hintEngine.analyzeBoard(board);
    if (hint) {
      setHintedPosition(hint.suggestedMove);
      setHintsUsed(prev => prev + 1);
      
      // Show hint reasoning (could be displayed in UI)
      console.log('AI Hint:', hint.reasoning);
    }
  }, [board, hintEngine]);

  // Calculate grid template columns for CSS Grid
  const gridStyle = {
    gridTemplateColumns: `repeat(${width}, 20px)`,
    gridTemplateRows: `repeat(${height}, 20px)`
  };

  return (
    <div className="game-board-container">
      <div className="game-controls-header">
        <button className="win95-button" onClick={newGame}>
          New Game
        </button>
        <button 
          className="win95-button" 
          onClick={requestHint}
          disabled={board.gameStatus !== 'playing' || board.firstClick}
        >
          💡 Hint ({hintsUsed})
        </button>
        <div className="game-status">
          <span className={`smiley-icon ${board.gameStatus}`}></span>
        </div>
      </div>

      <div className="minesweeper-board" style={gridStyle}>
        {board.cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              onClick={handleCellClick}
              onRightClick={handleCellRightClick}
              isHinted={
                hintedPosition?.row === rowIndex && 
                hintedPosition?.col === colIndex
              }
            />
          ))
        )}
      </div>

      {board.gameStatus === 'won' && (
        <div className="game-message win95-panel">
          🎉 Congratulations! You won! 🎉
        </div>
      )}

      {board.gameStatus === 'lost' && (
        <div className="game-message win95-panel">
          💥 Game Over! Better luck next time! 💥
        </div>
      )}
    </div>
  );
};

export { GameBoard };