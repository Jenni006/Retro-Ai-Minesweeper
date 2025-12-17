import React, { useState, useEffect } from 'react';
import { GameControlsProps } from '../../types';
import './GameControls.css';

const GameControls: React.FC<GameControlsProps> = ({
  onNewGame,
  onHintRequest,
  gameStatus,
  mineCount,
  flaggedCount,
  timeElapsed,
  hintsUsed
}) => {
  const [displayTime, setDisplayTime] = useState(0);

  // Update display time every second when game is playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setDisplayTime(Math.floor(timeElapsed / 1000));
      }, 1000);
    } else {
      setDisplayTime(Math.floor(timeElapsed / 1000));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus, timeElapsed]);

  const formatTime = (seconds: number): string => {
    return Math.min(999, seconds).toString().padStart(3, '0');
  };

  const formatMineCount = (): string => {
    const remaining = Math.max(0, mineCount - flaggedCount);
    return remaining.toString().padStart(3, '0');
  };

  const getSmileyClass = (): string => {
    let className = 'smiley-icon';
    if (gameStatus === 'won') className += ' won';
    if (gameStatus === 'lost') className += ' lost';
    return className;
  };

  return (
    <div className="game-controls win95-panel">
      <div className="controls-top">
        <div className="mine-counter">
          {formatMineCount()}
        </div>
        
        <button 
          className="smiley-button win95-button"
          onClick={onNewGame}
          title="New Game"
        >
          <span className={getSmileyClass()}></span>
        </button>
        
        <div className="timer-display">
          {formatTime(displayTime)}
        </div>
      </div>

      <div className="controls-bottom">
        <button 
          className="win95-button"
          onClick={onHintRequest}
          disabled={gameStatus !== 'playing'}
          title="Request AI Hint"
        >
          💡 Hint
        </button>
        
        <div className="stats-display">
          <span className="hint-counter">
            Hints: {hintsUsed}
          </span>
        </div>
        
        <button 
          className="win95-button"
          onClick={onNewGame}
          title="Start New Game"
        >
          New Game
        </button>
      </div>
    </div>
  );
};

export { GameControls };