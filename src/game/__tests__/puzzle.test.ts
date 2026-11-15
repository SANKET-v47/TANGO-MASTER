/**
 * Comprehensive Unit Tests for TANGO MASTER Puzzle Engine
 *
 * Covers:
 * 1. Row symbol count (invalid rows with > N/2 Suns or Moons)
 * 2. Column symbol count (invalid columns with > N/2 Suns or Moons)
 * 3. Three consecutive identical symbols (horizontal and vertical violations)
 * 4. Equal (=) constraint validation
 * 5. Cross (×) constraint validation
 * 6. Multi-size board validation (4x4, 6x6, 8x8)
 * 7. Procedural puzzle generation & guaranteed solution verification
 * 8. Solver and hint engine logic
 */

import { generateFullSolution, generatePuzzle } from '../generator';
import { getNextHint, solvePuzzle } from '../solver';
import type { GridSize, HorizontalConstraint, SymbolType, VerticalConstraint } from '../types';
import {
  isBoardCompleteAndValid,
  validateAllConstraints,
  validateBoard,
  validateColCounts,
  validateConsecutiveCol,
  validateConsecutiveRow,
  validateRowCounts,
} from '../validation';

// Standalone, portable test runner functions (zero external dependencies)
let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
  const start = performance.now();
  try {
    fn();
    const elapsed = (performance.now() - start).toFixed(2);
    console.log(`✔ ${name} (${elapsed}ms)`);
    passCount++;
  } catch (err: unknown) {
    failCount++;
    console.error(`✖ ${name} FAILED:`, err);
    throw err;
  }
}

interface AssertType {
  strictEqual(actual: unknown, expected: unknown, message?: string): void;
  deepStrictEqual(actual: unknown, expected: unknown, message?: string): void;
  ok(value: unknown, message?: string): asserts value;
}

const assert: AssertType = {
  strictEqual(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) {
      throw new Error(
        message ?? `Assertion failed: expected ${String(expected)}, got ${String(actual)}`
      );
    }
  },
  deepStrictEqual(actual: unknown, expected: unknown, message?: string) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error(message ?? `Assertion failed: expected ${b}, got ${a}`);
    }
  },
  ok(value: unknown, message?: string): asserts value {
    if (!value) {
      throw new Error(message ?? `Assertion failed: expected truthy value, got ${String(value)}`);
    }
  },
};

// ============================================================================
// TEST SUITES
// ============================================================================

test('1. Row Symbol Count Constraint: Invalid row with > N/2 Suns or Moons', () => {
  const size: GridSize = 4; // Max allowed Suns/Moons is 2
  const gridWithTooManySuns: SymbolType[][] = [
    ['sun', 'sun', 'sun', null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];

  const sunErrors = validateRowCounts(gridWithTooManySuns, 0, size);
  assert.strictEqual(sunErrors.length, 1);
  assert.strictEqual(sunErrors[0].type, 'row_count_exceeded');
  assert.ok(sunErrors[0].message.includes('3 Suns'));

  const gridWithTooManyMoons: SymbolType[][] = [
    ['moon', 'moon', 'moon', null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];

  const moonErrors = validateRowCounts(gridWithTooManyMoons, 0, size);
  assert.strictEqual(moonErrors.length, 1);
  assert.strictEqual(moonErrors[0].type, 'row_count_exceeded');
  assert.ok(moonErrors[0].message.includes('3 Moons'));

  // Valid row with 2 Suns and 2 Moons
  const validRowGrid: SymbolType[][] = [
    ['sun', 'moon', 'sun', 'moon'],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const noErrors = validateRowCounts(validRowGrid, 0, size, true);
  assert.strictEqual(noErrors.length, 0);
});

test('2. Column Symbol Count Constraint: Invalid column with > N/2 Suns or Moons', () => {
  const size: GridSize = 6; // Max allowed Suns/Moons is 3
  const gridWithTooManyColSuns: SymbolType[][] = [
    ['sun', null, null, null, null, null],
    ['sun', null, null, null, null, null],
    ['sun', null, null, null, null, null],
    ['sun', null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
  ];

  const colErrors = validateColCounts(gridWithTooManyColSuns, 0, size);
  assert.strictEqual(colErrors.length, 1);
  assert.strictEqual(colErrors[0].type, 'col_count_exceeded');
  assert.ok(colErrors[0].message.includes('4 Suns'));

  // Valid column with exactly 3 Suns and 3 Moons
  const validColGrid: SymbolType[][] = [
    ['sun', null, null, null, null, null],
    ['moon', null, null, null, null, null],
    ['sun', null, null, null, null, null],
    ['moon', null, null, null, null, null],
    ['sun', null, null, null, null, null],
    ['moon', null, null, null, null, null],
  ];
  const noErrors = validateColCounts(validColGrid, 0, size, true);
  assert.strictEqual(noErrors.length, 0);
});

test('3. Consecutive Constraint: No three identical symbols horizontally or vertically', () => {
  const size: GridSize = 6;

  // Horizontal 3-in-a-row
  const rowViolationGrid: SymbolType[][] = [
    ['moon', 'sun', 'sun', 'sun', 'moon', null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
  ];
  const hErrors = validateConsecutiveRow(rowViolationGrid, 0, size);
  assert.strictEqual(hErrors.length, 1);
  assert.strictEqual(hErrors[0].type, 'consecutive_row');
  assert.strictEqual(hErrors[0].cells.length, 3);
  assert.deepStrictEqual(hErrors[0].cells, [
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
  ]);

  // Vertical 3-in-a-row
  const colViolationGrid: SymbolType[][] = [
    [null, null, 'moon', null, null, null],
    [null, null, 'moon', null, null, null],
    [null, null, 'moon', null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
  ];
  const vErrors = validateConsecutiveCol(colViolationGrid, 2, size);
  assert.strictEqual(vErrors.length, 1);
  assert.strictEqual(vErrors[0].type, 'consecutive_col');
  assert.deepStrictEqual(vErrors[0].cells, [
    { row: 0, col: 2 },
    { row: 1, col: 2 },
    { row: 2, col: 2 },
  ]);

  // Two identical symbols in a row is ALLOWED
  const twoInRowGrid: SymbolType[][] = [
    ['sun', 'sun', 'moon', 'moon', 'sun', 'moon'],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
  ];
  assert.strictEqual(validateConsecutiveRow(twoInRowGrid, 0, size).length, 0);
});

test('4. Equal (=) Constraint: Requires identical adjacent symbols', () => {
  const hConstraints: HorizontalConstraint[] = [{ row: 0, col: 0, type: 'equal' }];
  const vConstraints: VerticalConstraint[] = [{ row: 1, col: 1, type: 'equal' }];

  // Satisfied equal constraints
  const validGrid: SymbolType[][] = [
    ['sun', 'sun', null, null],
    [null, 'moon', null, null],
    [null, 'moon', null, null],
    [null, null, null, null],
  ];
  assert.strictEqual(validateAllConstraints(validGrid, hConstraints, vConstraints).length, 0);

  // Violated horizontal equal constraint
  const invalidHGrid: SymbolType[][] = [
    ['sun', 'moon', null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const hErrors = validateAllConstraints(invalidHGrid, hConstraints, []);
  assert.strictEqual(hErrors.length, 1);
  assert.strictEqual(hErrors[0].type, 'equal_constraint_violated');

  // Violated vertical equal constraint
  const invalidVGrid: SymbolType[][] = [
    [null, null, null, null],
    [null, 'sun', null, null],
    [null, 'moon', null, null],
    [null, null, null, null],
  ];
  const vErrors = validateAllConstraints(invalidVGrid, [], vConstraints);
  assert.strictEqual(vErrors.length, 1);
  assert.strictEqual(vErrors[0].type, 'equal_constraint_violated');
});

test('5. Cross (×) Constraint: Requires opposite adjacent symbols', () => {
  const hConstraints: HorizontalConstraint[] = [{ row: 0, col: 1, type: 'cross' }];
  const vConstraints: VerticalConstraint[] = [{ row: 0, col: 0, type: 'cross' }];

  // Satisfied cross constraints
  const validGrid: SymbolType[][] = [
    ['sun', 'sun', 'moon', null],
    ['moon', null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  assert.strictEqual(validateAllConstraints(validGrid, hConstraints, vConstraints).length, 0);

  // Violated horizontal cross constraint (both same)
  const invalidHGrid: SymbolType[][] = [
    [null, 'sun', 'sun', null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const hErrors = validateAllConstraints(invalidHGrid, hConstraints, []);
  assert.strictEqual(hErrors.length, 1);
  assert.strictEqual(hErrors[0].type, 'cross_constraint_violated');

  // Violated vertical cross constraint (both same)
  const invalidVGrid: SymbolType[][] = [
    ['moon', null, null, null],
    ['moon', null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];
  const vErrors = validateAllConstraints(invalidVGrid, [], vConstraints);
  assert.strictEqual(vErrors.length, 1);
  assert.strictEqual(vErrors[0].type, 'cross_constraint_violated');
});

test('6. Multi-Size Grid Validation: 4x4, 6x6, and 8x8 complete valid boards', () => {
  for (const size of [4, 6, 8] as GridSize[]) {
    const solution = generateFullSolution(size);

    // Validate that the generated solution has no violations
    const validation = validateBoard(solution, size, [], []);
    assert.strictEqual(validation.isValid, true, `Size ${size} solution must be valid`);
    assert.strictEqual(validation.isComplete, true, `Size ${size} solution must be complete`);
    assert.strictEqual(validation.errors.length, 0);

    // Check row counts
    for (let r = 0; r < size; r++) {
      const suns = solution[r].filter((x) => x === 'sun').length;
      assert.strictEqual(suns, size / 2, `Row ${r} must have size/2 suns`);
    }

    // Check col counts
    for (let c = 0; c < size; c++) {
      let suns = 0;
      for (let r = 0; r < size; r++) {
        if (solution[r][c] === 'sun') suns++;
      }
      assert.strictEqual(suns, size / 2, `Col ${c} must have size/2 suns`);
    }
  }
});

test('7. Procedural Puzzle Generation with Guaranteed Solutions across all difficulties', () => {
  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'] as const;
  const sizes: GridSize[] = [4, 6, 8];

  for (const size of sizes) {
    for (const diff of difficulties) {
      const puzzle = generatePuzzle(size, diff);

      assert.strictEqual(puzzle.size, size);
      assert.strictEqual(puzzle.difficulty, diff);

      // Verify initial grid matches solution where non-null
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const init = puzzle.initialGrid[r][c];
          if (init !== null) {
            assert.strictEqual(init, puzzle.solution[r][c]);
          }
        }
      }

      // Verify guaranteed solution satisfies all puzzle constraints
      const isComplete = isBoardCompleteAndValid(
        puzzle.solution,
        puzzle.size,
        puzzle.horizontalConstraints,
        puzzle.verticalConstraints
      );
      assert.strictEqual(isComplete, true, `Puzzle ${size}x${size} ${diff} solution must be valid`);

      // Verify solver finds at least 1 solution
      const solveResult = solvePuzzle(
        puzzle.initialGrid,
        puzzle.size,
        puzzle.horizontalConstraints,
        puzzle.verticalConstraints,
        2
      );
      assert.ok(
        solveResult.solutionCount >= 1,
        `Puzzle ${size}x${size} ${diff} must have a valid solution`
      );
    }
  }
});

test('8. Hint Engine: Accurately identifies consecutive symbol and count deductions', () => {
  const size: GridSize = 4;
  const solution: ('sun' | 'moon')[][] = [
    ['sun', 'sun', 'moon', 'moon'],
    ['moon', 'moon', 'sun', 'sun'],
    ['sun', 'moon', 'sun', 'moon'],
    ['moon', 'sun', 'moon', 'sun'],
  ];

  // Grid with 'sun', 'sun' in row 0 -> col 2 must be 'moon'
  const partialGrid: SymbolType[][] = [
    ['sun', 'sun', null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];

  const hint = getNextHint(partialGrid, size, [], [], solution);
  assert.ok(hint !== null);
  assert.strictEqual(hint.cell.row, 0);
  assert.strictEqual(hint.cell.col, 2);
  assert.strictEqual(hint.value, 'moon');
  assert.ok(hint.reason.includes('consecutive'));
});

console.log(`\n🎉 All ${passCount} tests passed successfully! (${failCount} failures)\n`);
