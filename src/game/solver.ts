/**
 * Constraint-satisfaction solver and hint engine for TANGO MASTER
 */

import type {
  CellCoord,
  ConstraintType,
  GridSize,
  HorizontalConstraint,
  SymbolType,
  VerticalConstraint,
} from './types';
import { isPlacementLocallyValid } from './validation';

export interface HintResult {
  cell: CellCoord;
  value: 'sun' | 'moon';
  reason: string;
}

/**
 * Pre-indexes constraints for O(1) lookups
 */
export function buildConstraintMaps(
  hConstraints: HorizontalConstraint[],
  vConstraints: VerticalConstraint[]
) {
  const hMap = new Map<string, ConstraintType>();
  for (const c of hConstraints) {
    hMap.set(`${c.row},${c.col}`, c.type);
  }

  const vMap = new Map<string, ConstraintType>();
  for (const c of vConstraints) {
    vMap.set(`${c.row},${c.col}`, c.type);
  }

  return { hMap, vMap };
}

/**
 * Backtracking solver: finds solutions to an N x N Tango board.
 * Returns the count of found solutions (up to maxSolutions).
 * Optionally populates `firstSolution` if found.
 */
export function solvePuzzle(
  grid: SymbolType[][],
  size: GridSize,
  hConstraints: HorizontalConstraint[],
  vConstraints: VerticalConstraint[],
  maxSolutions = 2
): { solutionCount: number; solution: ('sun' | 'moon')[][] | null } {
  const workGrid: SymbolType[][] = grid.map((r) => [...r]);
  const rowCounts = Array.from({ length: size }, () => ({ sun: 0, moon: 0 }));
  const colCounts = Array.from({ length: size }, () => ({ sun: 0, moon: 0 }));

  // Identify empty cells and initial counts
  const emptyCells: CellCoord[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = workGrid[r][c];
      if (val === 'sun') {
        rowCounts[r].sun++;
        colCounts[c].sun++;
      } else if (val === 'moon') {
        rowCounts[r].moon++;
        colCounts[c].moon++;
      } else {
        emptyCells.push({ row: r, col: c });
      }
    }
  }

  let solutions = 0;
  let solvedGrid: ('sun' | 'moon')[][] | null = null;

  function backtrack(index: number) {
    if (solutions >= maxSolutions) return;

    if (index === emptyCells.length) {
      solutions++;
      if (!solvedGrid) {
        solvedGrid = workGrid.map((row) => [...(row as ('sun' | 'moon')[])]);
      }
      return;
    }

    const { row: r, col: c } = emptyCells[index];

    for (const val of ['sun', 'moon'] as const) {
      if (
        isPlacementLocallyValid(
          workGrid,
          size,
          hConstraints,
          vConstraints,
          r,
          c,
          val
        )
      ) {
        workGrid[r][c] = val;
        rowCounts[r][val]++;
        colCounts[c][val]++;

        backtrack(index + 1);

        workGrid[r][c] = null;
        rowCounts[r][val]--;
        colCounts[c][val]--;
      }
    }
  }

  backtrack(0);

  return {
    solutionCount: solutions,
    solution: solvedGrid,
  };
}

/**
 * Intelligent Hint Engine:
 * Analyzes the board for deterministic logical deductions.
 * If multiple logical deductions exist, returns the most instructive one.
 * Falls back to the guaranteed solution if needed.
 */
export function getNextHint(
  currentGrid: SymbolType[][],
  size: GridSize,
  hConstraints: HorizontalConstraint[],
  vConstraints: VerticalConstraint[],
  solution: ('sun' | 'moon')[][]
): HintResult | null {
  const maxAllowed = size / 2;

  // 1. Direct rule deduction: 2 identical adjacent symbols requires opposite on ends
  // Check rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 2; c++) {
      const a = currentGrid[r][c];
      const b = currentGrid[r][c + 1];
      if (a !== null && a === b) {
        const opposite = a === 'sun' ? 'moon' : 'sun';
        // Check left neighbor
        if (c > 0 && currentGrid[r][c - 1] === null) {
          return {
            cell: { row: r, col: c - 1 },
            value: opposite,
            reason: `Avoid three consecutive ${a === 'sun' ? 'Suns' : 'Moons'} in row ${r + 1}.`,
          };
        }
        // Check right neighbor
        if (c + 2 < size && currentGrid[r][c + 2] === null) {
          return {
            cell: { row: r, col: c + 2 },
            value: opposite,
            reason: `Avoid three consecutive ${a === 'sun' ? 'Suns' : 'Moons'} in row ${r + 1}.`,
          };
        }
      }
    }
    // Check sandwich: A _ A -> middle must be opposite
    for (let c = 0; c <= size - 3; c++) {
      const a = currentGrid[r][c];
      const b = currentGrid[r][c + 2];
      if (a !== null && a === b && currentGrid[r][c + 1] === null) {
        const opposite = a === 'sun' ? 'moon' : 'sun';
        return {
          cell: { row: r, col: c + 1 },
          value: opposite,
          reason: `Avoid three consecutive ${a === 'sun' ? 'Suns' : 'Moons'} in row ${r + 1}.`,
        };
      }
    }
  }

  // Check columns for 2-in-a-row and sandwich
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 2; r++) {
      const a = currentGrid[r][c];
      const b = currentGrid[r + 1][c];
      if (a !== null && a === b) {
        const opposite = a === 'sun' ? 'moon' : 'sun';
        if (r > 0 && currentGrid[r - 1][c] === null) {
          return {
            cell: { row: r - 1, col: c },
            value: opposite,
            reason: `Avoid three consecutive ${a === 'sun' ? 'Suns' : 'Moons'} in column ${c + 1}.`,
          };
        }
        if (r + 2 < size && currentGrid[r + 2][c] === null) {
          return {
            cell: { row: r + 2, col: c },
            value: opposite,
            reason: `Avoid three consecutive ${a === 'sun' ? 'Suns' : 'Moons'} in column ${c + 1}.`,
          };
        }
      }
    }
    // Sandwich in col
    for (let r = 0; r <= size - 3; r++) {
      const a = currentGrid[r][c];
      const b = currentGrid[r + 2][c];
      if (a !== null && a === b && currentGrid[r + 1][c] === null) {
        const opposite = a === 'sun' ? 'moon' : 'sun';
        return {
          cell: { row: r + 1, col: c },
          value: opposite,
          reason: `Avoid three consecutive ${a === 'sun' ? 'Suns' : 'Moons'} in column ${c + 1}.`,
        };
      }
    }
  }

  // 2. Direct rule deduction: Row or Col reached count of N/2
  for (let r = 0; r < size; r++) {
    let sunCount = 0;
    let moonCount = 0;
    for (let c = 0; c < size; c++) {
      if (currentGrid[r][c] === 'sun') sunCount++;
      if (currentGrid[r][c] === 'moon') moonCount++;
    }
    if (sunCount === maxAllowed && moonCount < maxAllowed) {
      for (let c = 0; c < size; c++) {
        if (currentGrid[r][c] === null) {
          return {
            cell: { row: r, col: c },
            value: 'moon',
            reason: `Row ${r + 1} already has all ${maxAllowed} Suns; remaining cells must be Moons.`,
          };
        }
      }
    }
    if (moonCount === maxAllowed && sunCount < maxAllowed) {
      for (let c = 0; c < size; c++) {
        if (currentGrid[r][c] === null) {
          return {
            cell: { row: r, col: c },
            value: 'sun',
            reason: `Row ${r + 1} already has all ${maxAllowed} Moons; remaining cells must be Suns.`,
          };
        }
      }
    }
  }

  for (let c = 0; c < size; c++) {
    let sunCount = 0;
    let moonCount = 0;
    for (let r = 0; r < size; r++) {
      if (currentGrid[r][c] === 'sun') sunCount++;
      if (currentGrid[r][c] === 'moon') moonCount++;
    }
    if (sunCount === maxAllowed && moonCount < maxAllowed) {
      for (let r = 0; r < size; r++) {
        if (currentGrid[r][c] === null) {
          return {
            cell: { row: r, col: c },
            value: 'moon',
            reason: `Column ${c + 1} already has all ${maxAllowed} Suns; remaining cells must be Moons.`,
          };
        }
      }
    }
    if (moonCount === maxAllowed && sunCount < maxAllowed) {
      for (let r = 0; r < size; r++) {
        if (currentGrid[r][c] === null) {
          return {
            cell: { row: r, col: c },
            value: 'sun',
            reason: `Column ${c + 1} already has all ${maxAllowed} Moons; remaining cells must be Suns.`,
          };
        }
      }
    }
  }

  // 3. Direct rule deduction: Constraint edge where one cell is filled
  for (const hc of hConstraints) {
    const left = currentGrid[hc.row][hc.col];
    const right = currentGrid[hc.row][hc.col + 1];
    if (left !== null && right === null) {
      const val = hc.type === 'equal' ? left : left === 'sun' ? 'moon' : 'sun';
      return {
        cell: { row: hc.row, col: hc.col + 1 },
        value: val,
        reason: `${hc.type === 'equal' ? 'Equal (=)' : 'Cross (×)'} constraint with left neighbor.`,
      };
    }
    if (right !== null && left === null) {
      const val = hc.type === 'equal' ? right : right === 'sun' ? 'moon' : 'sun';
      return {
        cell: { row: hc.row, col: hc.col },
        value: val,
        reason: `${hc.type === 'equal' ? 'Equal (=)' : 'Cross (×)'} constraint with right neighbor.`,
      };
    }
  }

  for (const vc of vConstraints) {
    const top = currentGrid[vc.row][vc.col];
    const bottom = currentGrid[vc.row + 1][vc.col];
    if (top !== null && bottom === null) {
      const val = vc.type === 'equal' ? top : top === 'sun' ? 'moon' : 'sun';
      return {
        cell: { row: vc.row + 1, col: vc.col },
        value: val,
        reason: `${vc.type === 'equal' ? 'Equal (=)' : 'Cross (×)'} constraint with upper neighbor.`,
      };
    }
    if (bottom !== null && top === null) {
      const val = vc.type === 'equal' ? bottom : bottom === 'sun' ? 'moon' : 'sun';
      return {
        cell: { row: vc.row, col: vc.col },
        value: val,
        reason: `${vc.type === 'equal' ? 'Equal (=)' : 'Cross (×)'} constraint with lower neighbor.`,
      };
    }
  }

  // 4. Fallback: Find first empty cell and reveal solution
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (currentGrid[r][c] === null) {
        return {
          cell: { row: r, col: c },
          value: solution[r][c],
          reason: 'Logical deduction from overall puzzle constraints.',
        };
      }
    }
  }

  return null;
}
