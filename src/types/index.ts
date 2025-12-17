// Core Game Types
export type CellState = 'hidden' | 'revealed' | 'flagged' | 'mine' | 'exploded';

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  state: CellState;
  hasMine: boolean;
  adjacentMines: number;
  position: Position;
}

export interface BoardState {
  cells: Cell[][];
  width: number;
  height: number;
  mineCount: number;
  revealedCount: number;
  flaggedCount: number;
  gameStatus: 'playing' | 'won' | 'lost';
  firstClick: boolean;
}

// AI System Types
export type MoveType = 'safe' | 'logical' | 'probability';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'expert';

export interface HintResult {
  suggestedMove: Position;
  moveType: MoveType;
  confidence: number;
  reasoning: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  averageTime: number;
  hintsUsed: number;
  currentStreak: number;
  preferredDifficulty: DifficultyLevel;
}

export interface GameResult {
  won: boolean;
  timeElapsed: number;
  hintsUsed: number;
  boardSize: { width: number; height: number };
  mineCount: number;
}

// Component Props Types
export interface GameBoardProps {
  width: number;
  height: number;
  mineCount: number;
  onGameComplete?: (result: GameResult) => void;
}

export interface CellProps {
  cell: Cell;
  onClick: (position: Position) => void;
  onRightClick: (position: Position) => void;
  isHinted?: boolean;
}

export interface GameControlsProps {
  onNewGame: () => void;
  onHintRequest: () => void;
  gameStatus: BoardState['gameStatus'];
  mineCount: number;
  flaggedCount: number;
  timeElapsed: number;
  hintsUsed: number;
}

// AI Interface Types
export interface HintEngine {
  analyzeBoard(board: BoardState): HintResult | null;
  findSafeMoves(board: BoardState): Position[];
  explainReasoning(hint: HintResult): string;
}

export interface DifficultyAdapter {
  calculateMineCount(playerStats: PlayerStats): number;
  adjustDifficulty(gameResult: GameResult): void;
  validateBoardBalance(board: BoardState): boolean;
}

export interface MinePlacer {
  generateBoard(width: number, height: number, mineCount: number, safeZone?: Position): BoardState;
  validateSolvability(board: BoardState): boolean;
  optimizeMineDistribution(board: BoardState): BoardState;
}

// Game Configuration
export const GAME_CONFIG = {
  beginner: { width: 9, height: 9, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 }
} as const;