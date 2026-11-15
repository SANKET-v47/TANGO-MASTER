/**
 * Core type definitions for TANGO MASTER puzzle engine
 */

export type SymbolType = 'sun' | 'moon' | null;

export type GridSize = 4 | 6 | 8;

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type ConstraintType = 'equal' | 'cross';

export interface HorizontalConstraint {
  row: number;
  col: number; // Applies between (row, col) and (row, col + 1)
  type: ConstraintType;
}

export interface VerticalConstraint {
  row: number; // Applies between (row, col) and (row + 1, col)
  col: number;
  type: ConstraintType;
}

export interface CellCoord {
  row: number;
  col: number;
}

export interface PuzzleDefinition {
  id: string;
  size: GridSize;
  difficulty: Difficulty;
  initialGrid: SymbolType[][];
  solution: ('sun' | 'moon')[][];
  horizontalConstraints: HorizontalConstraint[];
  verticalConstraints: VerticalConstraint[];
  createdAt?: number;
}

export type ValidationErrorType =
  | 'consecutive_row'
  | 'consecutive_col'
  | 'row_count_exceeded'
  | 'col_count_exceeded'
  | 'row_incomplete'
  | 'col_incomplete'
  | 'equal_constraint_violated'
  | 'cross_constraint_violated';

export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  cells: CellCoord[];
  edge?: {
    from: CellCoord;
    to: CellCoord;
    constraintType: ConstraintType;
  };
}

export interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  errors: ValidationError[];
}

export interface MoveRecord {
  row: number;
  col: number;
  previousValue: SymbolType;
  newValue: SymbolType;
  timestamp: number;
}

export interface GameStats {
  size: GridSize;
  difficulty: Difficulty;
  timeElapsed: number; // in seconds
  hintsUsed: number;
  undoCount: number;
  completedAt: number;
}
