/**
 * Game state management hook for TANGO MASTER
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { generatePuzzle } from './generator';
import { getNextHint, type HintResult } from './solver';
import type {
  Difficulty,
  GridSize,
  MoveRecord,
  PuzzleDefinition,
  SymbolType,
  ValidationError,
  ValidationResult,
} from './types';
import { validateBoard } from './validation';

export interface UseGameStateReturn {
  puzzle: PuzzleDefinition;
  grid: SymbolType[][];
  initialMask: boolean[][];
  timer: number;
  isPaused: boolean;
  isCompleted: boolean;
  validationResult: ValidationResult;
  hintsUsed: number;
  undoCount: number;
  lastHint: HintResult | null;
  toggleCell: (row: number, col: number) => void;
  setCell: (row: number, col: number, value: SymbolType) => void;
  undo: () => void;
  restart: () => void;
  newGame: (size?: GridSize, difficulty?: Difficulty) => void;
  applyHint: () => HintResult | null;
  pauseTimer: () => void;
  resumeTimer: () => void;
  clearHint: () => void;
}

export function useGameState(
  initialSize: GridSize = 6,
  initialDifficulty: Difficulty = 'Medium'
): UseGameStateReturn {
  const [puzzle, setPuzzle] = useState<PuzzleDefinition>(() =>
    generatePuzzle(initialSize, initialDifficulty)
  );

  const [grid, setGrid] = useState<SymbolType[][]>(() =>
    puzzle.initialGrid.map((row) => [...row])
  );

  const [initialMask, setInitialMask] = useState<boolean[][]>(() =>
    puzzle.initialGrid.map((row) => row.map((cell) => cell !== null))
  );

  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [undoCount, setUndoCount] = useState<number>(0);
  const [lastHint, setLastHint] = useState<HintResult | null>(null);

  // Timer interval ref
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Run validation whenever grid changes
  const validationResult = validateBoard(
    grid,
    puzzle.size,
    puzzle.horizontalConstraints,
    puzzle.verticalConstraints
  );

  // Check for completion
  useEffect(() => {
    if (validationResult.isComplete && !isCompleted) {
      setIsCompleted(true);
      setIsPaused(true);
    }
  }, [validationResult.isComplete, isCompleted]);

  // Timer tick
  useEffect(() => {
    if (isCompleted || isPaused) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isCompleted, isPaused]);

  // Cell toggle: null -> sun -> moon -> null
  const toggleCell = useCallback(
    (row: number, col: number) => {
      if (isCompleted) return;
      if (initialMask[row][col]) return; // Cannot modify fixed initial clues

      const currentVal = grid[row][col];
      let nextVal: SymbolType = null;
      if (currentVal === null) nextVal = 'sun';
      else if (currentVal === 'sun') nextVal = 'moon';
      else nextVal = null;

      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = nextVal;
        return next;
      });

      setHistory((prev) => [
        ...prev,
        {
          row,
          col,
          previousValue: currentVal,
          newValue: nextVal,
          timestamp: Date.now(),
        },
      ]);
    },
    [grid, initialMask, isCompleted]
  );

  // Directly set cell value
  const setCell = useCallback(
    (row: number, col: number, value: SymbolType) => {
      if (isCompleted) return;
      if (initialMask[row][col]) return;

      const currentVal = grid[row][col];
      if (currentVal === value) return;

      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = value;
        return next;
      });

      setHistory((prev) => [
        ...prev,
        {
          row,
          col,
          previousValue: currentVal,
          newValue: value,
          timestamp: Date.now(),
        },
      ]);
    },
    [grid, initialMask, isCompleted]
  );

  // Undo last move
  const undo = useCallback(() => {
    if (history.length === 0 || isCompleted) return;

    const lastMove = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));

    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[lastMove.row][lastMove.col] = lastMove.previousValue;
      return next;
    });

    setUndoCount((c) => c + 1);
  }, [history, isCompleted]);

  // Restart current puzzle
  const restart = useCallback(() => {
    setGrid(puzzle.initialGrid.map((row) => [...row]));
    setHistory([]);
    setTimer(0);
    setIsCompleted(false);
    setIsPaused(false);
    setLastHint(null);
  }, [puzzle]);

  // Generate and start a brand new game
  const newGame = useCallback(
    (size?: GridSize, difficulty?: Difficulty) => {
      const targetSize = size ?? puzzle.size;
      const targetDifficulty = difficulty ?? puzzle.difficulty;
      const newPuz = generatePuzzle(targetSize, targetDifficulty);

      setPuzzle(newPuz);
      setGrid(newPuz.initialGrid.map((row) => [...row]));
      setInitialMask(newPuz.initialGrid.map((row) => row.map((c) => c !== null)));
      setHistory([]);
      setTimer(0);
      setIsCompleted(false);
      setIsPaused(false);
      setLastHint(null);
      setHintsUsed(0);
      setUndoCount(0);
    },
    [puzzle.size, puzzle.difficulty]
  );

  // Apply hint
  const applyHint = useCallback(() => {
    if (isCompleted) return null;

    const hint = getNextHint(
      grid,
      puzzle.size,
      puzzle.horizontalConstraints,
      puzzle.verticalConstraints,
      puzzle.solution
    );

    if (hint) {
      setLastHint(hint);
      setHintsUsed((h) => h + 1);

      // Auto-fill the cell with the hint
      const { row, col } = hint.cell;
      const previousValue = grid[row][col];

      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = hint.value;
        return next;
      });

      setHistory((prev) => [
        ...prev,
        {
          row,
          col,
          previousValue,
          newValue: hint.value,
          timestamp: Date.now(),
        },
      ]);
    }

    return hint;
  }, [grid, isCompleted, puzzle]);

  const pauseTimer = useCallback(() => setIsPaused(true), []);
  const resumeTimer = useCallback(() => setIsPaused(false), []);
  const clearHint = useCallback(() => setLastHint(null), []);

  return {
    puzzle,
    grid,
    initialMask,
    timer,
    isPaused,
    isCompleted,
    validationResult,
    hintsUsed,
    undoCount,
    lastHint,
    toggleCell,
    setCell,
    undo,
    restart,
    newGame,
    applyHint,
    pauseTimer,
    resumeTimer,
    clearHint,
  };
}
