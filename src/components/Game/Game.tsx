import React, { useState, useCallback } from 'react';
import { GameBoard } from '../Board/GameBoard';
import { GameControls } from '../GameControls/GameControls';
import { DifficultyLevel, GameResult, GAME_CONFIG } from '../../types';
import { updatePlayerStats, loadPlayerStats } from '../../utils/storage';
import './Game.css';

const Game: React.FC = () => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [gameKey, setGameKey] = useState(0); // Force re-render of GameBoard
  const [currentGameStats, setCurrentGameStats] = useState<{
    timeElapsed: number;
    hintsUsed: number;
    gameStatus: 'playing' | 'won' | 'lost';
  }>({
    timeElapsed: 0,
    hintsUsed: 0,
    gameStatus: 'playing'
  });

  const gameConfig = GAME_CONFIG[difficulty as keyof typeof GAME_CONFIG];

  const handleNewGame = useCallback(() => {
    setGameKey(prev => prev + 1);
    setCurrentGameStats({
      timeElapsed: 0,
      hintsUsed: 0,
      gameStatus: 'playing'
    });
  }, []);

  const handleGameComplete = useCallback((result: GameResult) => {
    // Update player statistics
    updatePlayerStats(result);
    
    setCurrentGameStats({
      timeElapsed: result.timeElapsed,
      hintsUsed: result.hintsUsed,
      gameStatus: result.won ? 'won' : 'lost'
    });
  }, []);

  const handleHintRequest = useCallback(() => {
    // This will be handled by the GameBoard component
    // We're just tracking it here for the controls display
    setCurrentGameStats(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }));
  }, []);

  const handleDifficultyChange = (newDifficulty: DifficultyLevel) => {
    setDifficulty(newDifficulty);
    handleNewGame();
  };

  return (
    <div className="minesweeper-game">
      <div className="game-header">
        <h1 className="game-title">AI-Enhanced Retro Minesweeper</h1>
        
        <div className="difficulty-selector">
          <label htmlFor="difficulty">Difficulty:</label>
          <select 
            id="difficulty"
            className="win95-select"
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value as DifficultyLevel)}
          >
            <option value="beginner">Beginner (9×9, 10 mines)</option>
            <option value="intermediate">Intermediate (16×16, 40 mines)</option>
            <option value="expert">Expert (30×16, 99 mines)</option>
          </select>
        </div>
      </div>

      <GameControls
        onNewGame={handleNewGame}
        onHintRequest={handleHintRequest}
        gameStatus={currentGameStats.gameStatus}
        mineCount={gameConfig.mines}
        flaggedCount={0} // This will be updated by GameBoard
        timeElapsed={currentGameStats.timeElapsed}
        hintsUsed={currentGameStats.hintsUsed}
      />

      <GameBoard
        key={gameKey}
        width={gameConfig.width}
        height={gameConfig.height}
        mineCount={gameConfig.mines}
        onGameComplete={handleGameComplete}
      />

      <div className="game-footer">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Games Played:</span>
            <span className="stat-value">{loadPlayerStats().gamesPlayed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Win Rate:</span>
            <span className="stat-value">
              {loadPlayerStats().gamesPlayed > 0 
                ? Math.round((loadPlayerStats().gamesWon / loadPlayerStats().gamesPlayed) * 100)
                : 0}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Current Streak:</span>
            <span className="stat-value">{loadPlayerStats().currentStreak}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Game };