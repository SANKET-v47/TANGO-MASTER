/**
 * Responsive Puzzle Grid for TANGO MASTER
 *
 * Renders cells and accurately positions horizontal (=, ×) and vertical (=, ×)
 * constraint badges between adjacent cells.
 */

import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { GAME_COLORS } from '@/game/colors';
import type {
  CellCoord,
  GridSize,
  HorizontalConstraint,
  SymbolType,
  ValidationError,
  VerticalConstraint,
} from '@/game/types';

import { ConstraintBadge } from './ConstraintBadge';
import { PuzzleCell } from './PuzzleCell';

interface PuzzleGridProps {
  size: GridSize;
  grid: SymbolType[][];
  initialMask: boolean[][];
  horizontalConstraints: HorizontalConstraint[];
  verticalConstraints: VerticalConstraint[];
  errors: ValidationError[];
  hintedCell: CellCoord | null;
  onCellPress: (row: number, col: number) => void;
}

export function PuzzleGrid({
  size,
  grid,
  initialMask,
  horizontalConstraints,
  verticalConstraints,
  errors,
  hintedCell,
  onCellPress,
}: PuzzleGridProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Responsive sizing calculations
  const { cellSize, gap, badgeSize, boardWidth } = useMemo(() => {
    const maxBoardWidth = Math.min(windowWidth - 36, 440);
    const cellGap = size === 4 ? 8 : size === 6 ? 6 : 4;
    const computedCellSize = Math.floor(
      (maxBoardWidth - (size - 1) * cellGap) / size
    );
    const totalBoardWidth = size * computedCellSize + (size - 1) * cellGap;
    const badge = Math.max(14, Math.min(22, Math.round(computedCellSize * 0.38)));

    return {
      cellSize: computedCellSize,
      gap: cellGap,
      badgeSize: badge,
      boardWidth: totalBoardWidth,
    };
  }, [windowWidth, size]);

  // Index error cells for fast O(1) lookup
  const violatedCellsMap = useMemo(() => {
    const map = new Set<string>();
    for (const err of errors) {
      for (const c of err.cells) {
        map.add(`${c.row},${c.col}`);
      }
    }
    return map;
  }, [errors]);

  // Index violated constraints
  const violatedConstraintsMap = useMemo(() => {
    const map = new Set<string>();
    for (const err of errors) {
      if (err.edge) {
        map.add(`${err.edge.from.row},${err.edge.from.col}->${err.edge.to.row},${err.edge.to.col}`);
      }
    }
    return map;
  }, [errors]);

  return (
    <View style={[styles.container, { width: boardWidth }]}>
      {/* Cells Grid */}
      <View style={styles.grid}>
        {grid.map((row, r) => (
          <View
            key={`row-${r}`}
            style={[
              styles.row,
              { marginBottom: r < size - 1 ? gap : 0 },
            ]}
          >
            {row.map((val, c) => {
              const isViolated = violatedCellsMap.has(`${r},${c}`);
              const isHinted =
                hintedCell !== null &&
                hintedCell.row === r &&
                hintedCell.col === c;

              return (
                <View
                  key={`cell-${r}-${c}`}
                  style={{ marginRight: c < size - 1 ? gap : 0 }}
                >
                  <PuzzleCell
                    row={r}
                    col={c}
                    value={val}
                    isInitial={initialMask[r][c]}
                    isViolated={isViolated}
                    isHinted={isHinted}
                    cellSize={cellSize}
                    onPress={() => onCellPress(r, c)}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Horizontal Constraint Badges (overlayed between (r, c) and (r, c+1)) */}
      {horizontalConstraints.map((hc, idx) => {
        const x = hc.col * (cellSize + gap) + cellSize + gap / 2;
        const y = hc.row * (cellSize + gap) + cellSize / 2;
        const key = `${hc.row},${hc.col}->${hc.row},${hc.col + 1}`;
        const isViolated = violatedConstraintsMap.has(key);

        return (
          <View
            key={`hc-${idx}-${hc.row}-${hc.col}`}
            pointerEvents="none"
            style={[
              styles.absoluteBadge,
              {
                left: x - badgeSize / 2,
                top: y - badgeSize / 2,
              },
            ]}
          >
            <ConstraintBadge
              type={hc.type}
              size={badgeSize}
              isViolated={isViolated}
            />
          </View>
        );
      })}

      {/* Vertical Constraint Badges (overlayed between (r, c) and (r+1, c)) */}
      {verticalConstraints.map((vc, idx) => {
        const x = vc.col * (cellSize + gap) + cellSize / 2;
        const y = vc.row * (cellSize + gap) + cellSize + gap / 2;
        const key = `${vc.row},${vc.col}->${vc.row + 1},${vc.col}`;
        const isViolated = violatedConstraintsMap.has(key);

        return (
          <View
            key={`vc-${idx}-${vc.row}-${vc.col}`}
            pointerEvents="none"
            style={[
              styles.absoluteBadge,
              {
                left: x - badgeSize / 2,
                top: y - badgeSize / 2,
              },
            ]}
          >
            <ConstraintBadge
              type={vc.type}
              size={badgeSize}
              isViolated={isViolated}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: GAME_COLORS.cardDark,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GAME_COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  absoluteBadge: {
    position: 'absolute',
    zIndex: 20,
  },
});
