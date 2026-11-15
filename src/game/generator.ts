/**
 * Puzzle Generator for TANGO MASTER
 *
 * Generates valid Tango puzzles with guaranteed solutions.
 * Supports 4x4, 6x6, and 8x8 grids across Easy, Medium, Hard, and Expert difficulties.
 */

import type {
  Difficulty,
  GridSize,
  HorizontalConstraint,
  PuzzleDefinition,
  SymbolType,
  VerticalConstraint,
} from './types';
import { solvePuzzle } from './solver';

/**
 * Precomputes valid binary row patterns for grid dimension N
 * (Length N, exactly N/2 ones and N/2 zeros, no three consecutive ones or zeros)
 */
export function getValidRowPatterns(n: GridSize): ('sun' | 'moon')[][] {
  const result: ('sun' | 'moon')[][] = [];
  const total = 1 << n;
  const half = n / 2;

  for (let mask = 0; mask < total; mask++) {
    const pattern: ('sun' | 'moon')[] = [];
    let sunCount = 0;

    for (let i = 0; i < n; i++) {
      const bit = (mask >> (n - 1 - i)) & 1;
      if (bit === 1) {
        pattern.push('sun');
        sunCount++;
      } else {
        pattern.push('moon');
      }
    }

    if (sunCount !== half) continue;

    let hasThreeConsecutive = false;
    for (let i = 0; i <= n - 3; i++) {
      if (pattern[i] === pattern[i + 1] && pattern[i + 1] === pattern[i + 2]) {
        hasThreeConsecutive = true;
        break;
      }
    }

    if (!hasThreeConsecutive) {
      result.push(pattern);
    }
  }

  return result;
}

/**
 * Generates a full, 100% valid N x N solution grid
 */
export function generateFullSolution(size: GridSize): ('sun' | 'moon')[][] {
  const validRows = getValidRowPatterns(size);
  const grid: ('sun' | 'moon')[][] = [];
  const colSunCounts = new Array(size).fill(0);
  const half = size / 2;

  function backtrack(rowIdx: number): boolean {
    if (rowIdx === size) return true;

    // Randomize candidates to generate varied solutions
    const candidates = [...validRows].sort(() => Math.random() - 0.5);

    for (const row of candidates) {
      let valid = true;

      for (let c = 0; c < size; c++) {
        const val = row[c];
        const isSun = val === 'sun';
        const currentSun = colSunCounts[c];
        const currentMoon = rowIdx - currentSun;

        if (isSun && currentSun + 1 > half) {
          valid = false;
          break;
        }
        if (!isSun && currentMoon + 1 > half) {
          valid = false;
          break;
        }

        // Col consecutive 3 check
        if (
          rowIdx >= 2 &&
          grid[rowIdx - 1][c] === val &&
          grid[rowIdx - 2][c] === val
        ) {
          valid = false;
          break;
        }
      }

      if (!valid) continue;

      grid.push(row);
      for (let c = 0; c < size; c++) {
        if (row[c] === 'sun') colSunCounts[c]++;
      }

      if (backtrack(rowIdx + 1)) return true;

      grid.pop();
      for (let c = 0; c < size; c++) {
        if (row[c] === 'sun') colSunCounts[c]--;
      }
    }

    return false;
  }

  backtrack(0);

  return grid;
}

interface DifficultyConfig {
  clueRatio: number; // Percentage of cells initially revealed (0.0 to 1.0)
  constraintCount: number; // Approximate number of = and × constraints
}

const DIFFICULTY_CONFIGS: Record<GridSize, Record<Difficulty, DifficultyConfig>> = {
  4: {
    Easy: { clueRatio: 0.45, constraintCount: 3 },
    Medium: { clueRatio: 0.35, constraintCount: 4 },
    Hard: { clueRatio: 0.25, constraintCount: 5 },
    Expert: { clueRatio: 0.15, constraintCount: 6 },
  },
  6: {
    Easy: { clueRatio: 0.40, constraintCount: 8 },
    Medium: { clueRatio: 0.30, constraintCount: 11 },
    Hard: { clueRatio: 0.22, constraintCount: 14 },
    Expert: { clueRatio: 0.15, constraintCount: 16 },
  },
  8: {
    Easy: { clueRatio: 0.38, constraintCount: 16 },
    Medium: { clueRatio: 0.28, constraintCount: 22 },
    Hard: { clueRatio: 0.20, constraintCount: 26 },
    Expert: { clueRatio: 0.14, constraintCount: 30 },
  },
};

/**
 * Procedurally generates a puzzle with guaranteed valid solution and tuned difficulty
 */
export function generatePuzzle(
  size: GridSize,
  difficulty: Difficulty,
  seedId?: string
): PuzzleDefinition {
  const solution = generateFullSolution(size);
  const config = DIFFICULTY_CONFIGS[size][difficulty];

  // 1. Gather all potential horizontal and vertical constraints from solution
  const allHConstraints: HorizontalConstraint[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const type = solution[r][c] === solution[r][c + 1] ? 'equal' : 'cross';
      allHConstraints.push({ row: r, col: c, type });
    }
  }

  const allVConstraints: VerticalConstraint[] = [];
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      const type = solution[r][c] === solution[r + 1][c] ? 'equal' : 'cross';
      allVConstraints.push({ row: r, col: c, type });
    }
  }

  // Shuffle candidate constraints
  const shuffledH = [...allHConstraints].sort(() => Math.random() - 0.5);
  const shuffledV = [...allVConstraints].sort(() => Math.random() - 0.5);

  const halfConstraints = Math.floor(config.constraintCount / 2);
  const selectedH = shuffledH.slice(0, halfConstraints);
  const selectedV = shuffledV.slice(0, config.constraintCount - halfConstraints);

  // 2. Select initial revealed cells
  const totalCells = size * size;
  const targetClues = Math.max(2, Math.round(totalCells * config.clueRatio));

  const allCoords: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      allCoords.push({ row: r, col: c });
    }
  }
  allCoords.sort(() => Math.random() - 0.5);

  const initialGrid: SymbolType[][] = Array.from({ length: size }, () =>
    new Array(size).fill(null)
  );

  // Reveal target number of initial clues
  for (let i = 0; i < targetClues; i++) {
    const { row, col } = allCoords[i];
    initialGrid[row][col] = solution[row][col];
  }

  // 3. Verify uniqueness and guarantee solution with solver
  let solveCheck = solvePuzzle(initialGrid, size, selectedH, selectedV, 2);

  // If there are multiple solutions, add clues or constraints until unique
  let clueIndex = targetClues;
  let hIndex = halfConstraints;
  let vIndex = config.constraintCount - halfConstraints;

  while (solveCheck.solutionCount > 1 && (clueIndex < allCoords.length || hIndex < shuffledH.length)) {
    if (clueIndex < allCoords.length) {
      const { row, col } = allCoords[clueIndex++];
      if (initialGrid[row][col] === null) {
        initialGrid[row][col] = solution[row][col];
      }
    } else if (hIndex < shuffledH.length) {
      selectedH.push(shuffledH[hIndex++]);
    } else if (vIndex < shuffledV.length) {
      selectedV.push(shuffledV[vIndex++]);
    }

    solveCheck = solvePuzzle(initialGrid, size, selectedH, selectedV, 2);
  }

  return {
    id: seedId ?? `tango_${size}x${size}_${difficulty.toLowerCase()}_${Date.now()}`,
    size,
    difficulty,
    initialGrid,
    solution,
    horizontalConstraints: selectedH,
    verticalConstraints: selectedV,
    createdAt: Date.now(),
  };
}
