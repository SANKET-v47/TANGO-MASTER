/**
 * Validation engine for TANGO MASTER
 *
 * Enforces all 5 mandatory constraints:
 * 1. Every row must contain exactly N/2 Suns and N/2 Moons.
 * 2. Every column must contain exactly N/2 Suns and N/2 Moons.
 * 3. No three identical symbols can appear consecutively horizontally or vertically.
 * 4. Equal (=) constraints require identical adjacent symbols.
 * 5. Cross (×) constraints require opposite adjacent symbols.
 */

import type {
  CellCoord,
  ConstraintType,
  GridSize,
  HorizontalConstraint,
  SymbolType,
  ValidationError,
  ValidationResult,
  VerticalConstraint,
} from './types';

/**
 * Checks if a specific cell coordinate is within grid bounds
 */
export function isInBounds(row: number, col: number, size: GridSize): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

/**
 * Validates row balance:
 * - Checks that non-null Suns <= N/2 and Moons <= N/2
 * - If requireComplete is true, checks that Suns === N/2 and Moons === N/2
 */
export function validateRowCounts(
  grid: SymbolType[][],
  row: number,
  size: GridSize,
  requireComplete = false
): ValidationError[] {
  const errors: ValidationError[] = [];
  const maxAllowed = size / 2;
  let sunCount = 0;
  let moonCount = 0;
  let emptyCount = 0;
  const sunCells: CellCoord[] = [];
  const moonCells: CellCoord[] = [];

  for (let c = 0; c < size; c++) {
    const val = grid[row][c];
    if (val === 'sun') {
      sunCount++;
      sunCells.push({ row, col: c });
    } else if (val === 'moon') {
      moonCount++;
      moonCells.push({ row, col: c });
    } else {
      emptyCount++;
    }
  }

  if (sunCount > maxAllowed) {
    errors.push({
      type: 'row_count_exceeded',
      message: `Row ${row + 1} has ${sunCount} Suns (maximum allowed is ${maxAllowed})`,
      cells: sunCells,
    });
  }

  if (moonCount > maxAllowed) {
    errors.push({
      type: 'row_count_exceeded',
      message: `Row ${row + 1} has ${moonCount} Moons (maximum allowed is ${maxAllowed})`,
      cells: moonCells,
    });
  }

  if (requireComplete && emptyCount === 0) {
    if (sunCount !== maxAllowed || moonCount !== maxAllowed) {
      errors.push({
        type: 'row_incomplete',
        message: `Row ${row + 1} must have exactly ${maxAllowed} Suns and ${maxAllowed} Moons`,
        cells: Array.from({ length: size }, (_, c) => ({ row, col: c })),
      });
    }
  }

  return errors;
}

/**
 * Validates column balance:
 * - Checks that non-null Suns <= N/2 and Moons <= N/2
 * - If requireComplete is true, checks that Suns === N/2 and Moons === N/2
 */
export function validateColCounts(
  grid: SymbolType[][],
  col: number,
  size: GridSize,
  requireComplete = false
): ValidationError[] {
  const errors: ValidationError[] = [];
  const maxAllowed = size / 2;
  let sunCount = 0;
  let moonCount = 0;
  let emptyCount = 0;
  const sunCells: CellCoord[] = [];
  const moonCells: CellCoord[] = [];

  for (let r = 0; r < size; r++) {
    const val = grid[r][col];
    if (val === 'sun') {
      sunCount++;
      sunCells.push({ row: r, col });
    } else if (val === 'moon') {
      moonCount++;
      moonCells.push({ row: r, col });
    } else {
      emptyCount++;
    }
  }

  if (sunCount > maxAllowed) {
    errors.push({
      type: 'col_count_exceeded',
      message: `Column ${col + 1} has ${sunCount} Suns (maximum allowed is ${maxAllowed})`,
      cells: sunCells,
    });
  }

  if (moonCount > maxAllowed) {
    errors.push({
      type: 'col_count_exceeded',
      message: `Column ${col + 1} has ${moonCount} Moons (maximum allowed is ${maxAllowed})`,
      cells: moonCells,
    });
  }

  if (requireComplete && emptyCount === 0) {
    if (sunCount !== maxAllowed || moonCount !== maxAllowed) {
      errors.push({
        type: 'col_incomplete',
        message: `Column ${col + 1} must have exactly ${maxAllowed} Suns and ${maxAllowed} Moons`,
        cells: Array.from({ length: size }, (_, r) => ({ row: r, col })),
      });
    }
  }

  return errors;
}

/**
 * Validates that no three identical symbols appear consecutively horizontally
 */
export function validateConsecutiveRow(
  grid: SymbolType[][],
  row: number,
  size: GridSize
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let c = 0; c <= size - 3; c++) {
    const a = grid[row][c];
    const b = grid[row][c + 1];
    const d = grid[row][c + 2];

    if (a !== null && a === b && b === d) {
      errors.push({
        type: 'consecutive_row',
        message: `Three identical symbols (${a === 'sun' ? 'Suns' : 'Moons'}) in a row at Row ${row + 1}`,
        cells: [
          { row, col: c },
          { row, col: c + 1 },
          { row, col: c + 2 },
        ],
      });
    }
  }

  return errors;
}

/**
 * Validates that no three identical symbols appear consecutively vertically
 */
export function validateConsecutiveCol(
  grid: SymbolType[][],
  col: number,
  size: GridSize
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let r = 0; r <= size - 3; r++) {
    const a = grid[r][col];
    const b = grid[r + 1][col];
    const d = grid[r + 2][col];

    if (a !== null && a === b && b === d) {
      errors.push({
        type: 'consecutive_col',
        message: `Three identical symbols (${a === 'sun' ? 'Suns' : 'Moons'}) in a row at Column ${col + 1}`,
        cells: [
          { row: r, col },
          { row: r + 1, col },
          { row: r + 2, col },
        ],
      });
    }
  }

  return errors;
}

/**
 * Validates adjacent constraint (= or ×) between two cells
 */
export function validateConstraintEdge(
  cellA: SymbolType,
  cellB: SymbolType,
  type: ConstraintType,
  from: CellCoord,
  to: CellCoord
): ValidationError | null {
  if (cellA === null || cellB === null) {
    return null;
  }

  if (type === 'equal' && cellA !== cellB) {
    return {
      type: 'equal_constraint_violated',
      message: `Equal (=) constraint between (${from.row + 1},${from.col + 1}) and (${to.row + 1},${to.col + 1}) requires identical symbols`,
      cells: [from, to],
      edge: { from, to, constraintType: 'equal' },
    };
  }

  if (type === 'cross' && cellA === cellB) {
    return {
      type: 'cross_constraint_violated',
      message: `Cross (×) constraint between (${from.row + 1},${from.col + 1}) and (${to.row + 1},${to.col + 1}) requires opposite symbols`,
      cells: [from, to],
      edge: { from, to, constraintType: 'cross' },
    };
  }

  return null;
}

/**
 * Validates all horizontal and vertical edge constraints
 */
export function validateAllConstraints(
  grid: SymbolType[][],
  hConstraints: HorizontalConstraint[],
  vConstraints: VerticalConstraint[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const hc of hConstraints) {
    const from: CellCoord = { row: hc.row, col: hc.col };
    const to: CellCoord = { row: hc.row, col: hc.col + 1 };
    const err = validateConstraintEdge(
      grid[from.row][from.col],
      grid[to.row][to.col],
      hc.type,
      from,
      to
    );
    if (err) errors.push(err);
  }

  for (const vc of vConstraints) {
    const from: CellCoord = { row: vc.row, col: vc.col };
    const to: CellCoord = { row: vc.row + 1, col: vc.col };
    const err = validateConstraintEdge(
      grid[from.row][from.col],
      grid[to.row][to.col],
      vc.type,
      from,
      to
    );
    if (err) errors.push(err);
  }

  return errors;
}

/**
 * Comprehensive board validation:
 * Checks row counts, col counts, consecutive 3s, and all edge constraints.
 * Also determines if board is 100% complete and valid.
 */
export function validateBoard(
  grid: SymbolType[][],
  size: GridSize,
  hConstraints: HorizontalConstraint[],
  vConstraints: VerticalConstraint[]
): ValidationResult {
  const errors: ValidationError[] = [];
  let emptyCount = 0;

  // 1. Check for empty cells and counts
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        emptyCount++;
      }
    }
  }

  const isFull = emptyCount === 0;

  // 2. Validate row counts & consecutive symbols
  for (let r = 0; r < size; r++) {
    errors.push(...validateRowCounts(grid, r, size, isFull));
    errors.push(...validateConsecutiveRow(grid, r, size));
  }

  // 3. Validate column counts & consecutive symbols
  for (let c = 0; c < size; c++) {
    errors.push(...validateColCounts(grid, c, size, isFull));
    errors.push(...validateConsecutiveCol(grid, c, size));
  }

  // 4. Validate all edge constraints
  errors.push(...validateAllConstraints(grid, hConstraints, vConstraints));

  const isValid = errors.length === 0;
  const isComplete = isFull && isValid;

  return {
    isValid,
    isComplete,
    errors,
  };
}

/**
 * Checks whether the current board is fully solved and valid
 */
export function isBoardCompleteAndValid(
  grid: SymbolType[][],
  size: GridSize,
  hConstraints: HorizontalConstraint[],
  vConstraints: VerticalConstraint[]
): boolean {
  return validateBoard(grid, size, hConstraints, vConstraints).isComplete;
}

/**
 * Fast check: determines if placing `value` at (row, col) is locally consistent
 */
export function isPlacementLocallyValid(
  grid: SymbolType[][],
  size: GridSize,
  hConstraints: HorizontalConstraint[],
  vConstraints: VerticalConstraint[],
  row: number,
  col: number,
  value: SymbolType
): boolean {
  if (value === null) return true;

  const maxAllowed = size / 2;

  // 1. Count checks
  let rowCount = 0;
  for (let c = 0; c < size; c++) {
    if (c === col) {
      rowCount++;
    } else if (grid[row][c] === value) {
      rowCount++;
    }
  }
  if (rowCount > maxAllowed) return false;

  let colCount = 0;
  for (let r = 0; r < size; r++) {
    if (r === row) {
      colCount++;
    } else if (grid[r][col] === value) {
      colCount++;
    }
  }
  if (colCount > maxAllowed) return false;

  // 2. Row consecutive check
  const rVal = (c: number) => (c === col ? value : grid[row][c]);
  if (col >= 2 && rVal(col - 1) === value && rVal(col - 2) === value) return false;
  if (col >= 1 && col + 1 < size && rVal(col - 1) === value && rVal(col + 1) === value)
    return false;
  if (col + 2 < size && rVal(col + 1) === value && rVal(col + 2) === value) return false;

  // 3. Col consecutive check
  const cVal = (r: number) => (r === row ? value : grid[r][col]);
  if (row >= 2 && cVal(row - 1) === value && cVal(row - 2) === value) return false;
  if (row >= 1 && row + 1 < size && cVal(row - 1) === value && cVal(row + 1) === value)
    return false;
  if (row + 2 < size && cVal(row + 1) === value && cVal(row + 2) === value) return false;

  // 4. Horizontal constraints
  for (const hc of hConstraints) {
    if (hc.row === row) {
      if (hc.col === col - 1 && grid[row][col - 1] !== null) {
        if (hc.type === 'equal' && grid[row][col - 1] !== value) return false;
        if (hc.type === 'cross' && grid[row][col - 1] === value) return false;
      }
      if (hc.col === col && grid[row][col + 1] !== null) {
        if (hc.type === 'equal' && grid[row][col + 1] !== value) return false;
        if (hc.type === 'cross' && grid[row][col + 1] === value) return false;
      }
    }
  }

  // 5. Vertical constraints
  for (const vc of vConstraints) {
    if (vc.col === col) {
      if (vc.row === row - 1 && grid[row - 1][col] !== null) {
        if (vc.type === 'equal' && grid[row - 1][col] !== value) return false;
        if (vc.type === 'cross' && grid[row - 1][col] === value) return false;
      }
      if (vc.row === row && grid[row + 1][col] !== null) {
        if (vc.type === 'equal' && grid[row + 1][col] !== value) return false;
        if (vc.type === 'cross' && grid[row + 1][col] === value) return false;
      }
    }
  }

  return true;
}
