import React from 'react';
import { CellProps } from '../../types';
import './Cell.css';

const Cell: React.FC<CellProps> = ({ cell, onClick, onRightClick, isHinted = false }) => {
  const handleClick = () => {
    if (cell.state === 'hidden') {
      onClick(cell.position);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cell.state === 'hidden' || cell.state === 'flagged') {
      onRightClick(cell.position);
    }
  };

  const getCellContent = () => {
    switch (cell.state) {
      case 'flagged':
        return '🚩';
      case 'mine':
        return '💣';
      case 'exploded':
        return '💥';
      case 'revealed':
        return cell.adjacentMines > 0 ? cell.adjacentMines : '';
      default:
        return '';
    }
  };

  const getCellClass = () => {
    let className = 'minesweeper-cell';
    
    if (cell.state === 'revealed') {
      className += ' revealed';
      if (cell.adjacentMines > 0) {
        className += ` cell-number-${cell.adjacentMines}`;
      }
    }
    
    if (cell.state === 'flagged') className += ' flagged';
    if (cell.state === 'mine') className += ' mine';
    if (cell.state === 'exploded') className += ' exploded';
    if (isHinted) className += ' hinted';
    
    return className;
  };

  return (
    <div
      className={getCellClass()}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      {getCellContent()}
    </div>
  );
};

export { Cell };
