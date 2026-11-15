/**
 * Interactive Cell Component for TANGO MASTER
 *
 * Renders Sun (☀), Moon (☾), or empty state with responsive sizing,
 * error state highlighting, and fixed-clue indicators.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME_COLORS } from '@/game/colors';
import type { SymbolType } from '@/game/types';

interface PuzzleCellProps {
  row: number;
  col: number;
  value: SymbolType;
  isInitial: boolean;
  isViolated?: boolean;
  isHinted?: boolean;
  isSelected?: boolean;
  cellSize: number;
  onPress: () => void;
}

export function PuzzleCell({
  value,
  isInitial,
  isViolated = false,
  isHinted = false,
  isSelected = false,
  cellSize,
  onPress,
}: PuzzleCellProps) {
  const isSun = value === 'sun';
  const isMoon = value === 'moon';
  const fontSize = Math.max(16, Math.round(cellSize * 0.52));

  return (
    <Pressable
      onPress={onPress}
      disabled={isInitial}
      style={({ pressed }) => [
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          borderRadius: Math.max(6, Math.round(cellSize * 0.18)),
        },
        isSun && styles.cellSun,
        isMoon && styles.cellMoon,
        isInitial && styles.cellInitial,
        isSelected && styles.cellSelected,
        isHinted && styles.cellHinted,
        isViolated && styles.cellViolated,
        pressed && !isInitial && styles.cellPressed,
      ]}
    >
      {/* Symbol */}
      {isSun && (
        <Text style={[styles.symbol, styles.sunText, { fontSize }]}>☀</Text>
      )}

      {isMoon && (
        <Text style={[styles.symbol, styles.moonText, { fontSize }]}>☾</Text>
      )}

      {/* Fixed initial clue indicator */}
      {isInitial && (
        <View style={styles.initialDot} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: GAME_COLORS.card,
    borderWidth: 1.5,
    borderColor: GAME_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellSun: {
    backgroundColor: GAME_COLORS.orangeSoft,
    borderColor: 'rgba(255, 181, 46, 0.45)',
  },
  cellMoon: {
    backgroundColor: GAME_COLORS.blueSoft,
    borderColor: 'rgba(77, 157, 255, 0.45)',
  },
  cellInitial: {
    backgroundColor: GAME_COLORS.cardDark,
    borderColor: GAME_COLORS.borderLight,
  },
  cellSelected: {
    borderColor: GAME_COLORS.orange,
    borderWidth: 2,
  },
  cellHinted: {
    borderColor: GAME_COLORS.gold,
    borderWidth: 2.5,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  cellViolated: {
    borderColor: GAME_COLORS.error,
    backgroundColor: GAME_COLORS.errorSoft,
    borderWidth: 2,
  },
  cellPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  symbol: {
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  sunText: {
    color: GAME_COLORS.orange,
  },
  moonText: {
    color: GAME_COLORS.blue,
  },
  initialDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GAME_COLORS.muted,
  },
});
