/**
 * GameView Component for TANGO MASTER
 *
 * Full playable game screen with Header, Timer, Interactive Puzzle Grid,
 * Hint System, Move Validation, Undo/Restart actions, and Victory Modal.
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  playCellSound,
  playHintSound,
  playVictorySound,
  triggerHaptic,
} from '@/game/audio';
import { GAME_COLORS } from '@/game/colors';
import { useSettings } from '@/game/settings';
import { useGameState } from '@/game/use-game-state';
import type { Difficulty, GridSize, SymbolType } from '@/game/types';

import { CompletionModal } from './CompletionModal';
import { PuzzleGrid } from './PuzzleGrid';

interface GameViewProps {
  initialSize: GridSize;
  initialDifficulty: Difficulty;
  onBackToMenu: () => void;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function GameView({
  initialSize,
  initialDifficulty,
  onBackToMenu,
}: GameViewProps) {
  const {
    puzzle,
    grid,
    initialMask,
    timer,
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
    clearHint,
  } = useGameState(initialSize, initialDifficulty);

  const { settings } = useSettings();

  // Quick tool selection: 'cycle' (default tap), 'sun', 'moon', 'clear'
  const [selectedTool, setSelectedTool] = useState<'cycle' | 'sun' | 'moon' | 'clear'>('cycle');
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  // Victory feedback
  useEffect(() => {
    if (isCompleted) {
      playVictorySound(settings.soundEnabled);
      triggerHaptic('victory', settings.hapticEnabled);
    }
  }, [isCompleted, settings.soundEnabled, settings.hapticEnabled]);

  const handleCellPress = (r: number, c: number) => {
    if (initialMask[r][c] || isCompleted) return;
    clearHint();

    let targetValue: SymbolType = null;
    const current = grid[r][c];

    if (selectedTool === 'cycle') {
      targetValue = current === null ? 'sun' : current === 'sun' ? 'moon' : null;
      toggleCell(r, c);
    } else if (selectedTool === 'sun') {
      targetValue = 'sun';
      setCell(r, c, 'sun');
    } else if (selectedTool === 'moon') {
      targetValue = 'moon';
      setCell(r, c, 'moon');
    } else if (selectedTool === 'clear') {
      targetValue = null;
      setCell(r, c, null);
    }

    playCellSound(targetValue, settings.soundEnabled);
    triggerHaptic('tap', settings.hapticEnabled);
  };

  const handleHintPress = () => {
    const hint = applyHint();
    if (hint) {
      playHintSound(settings.soundEnabled);
      triggerHaptic('switch', settings.hapticEnabled);
    }
  };

  const handleUndoPress = () => {
    triggerHaptic('tap', settings.hapticEnabled);
    undo();
  };

  const handleRestartPress = () => {
    Alert.alert(
      'Restart Puzzle',
      'Are you sure you want to reset this puzzle back to the beginning?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restart', style: 'destructive', onPress: restart },
      ]
    );
  };

  const handleNewPuzzlePress = () => {
    Alert.alert(
      'New Puzzle',
      `Generate a new ${puzzle.size}×${puzzle.size} ${puzzle.difficulty} puzzle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'New Puzzle', onPress: () => newGame() },
      ]
    );
  };

  const filledCount = grid.reduce(
    (acc, row) => acc + row.filter((c) => c !== null).length,
    0
  );
  const totalCells = puzzle.size * puzzle.size;
  const progressPercent = Math.round((filledCount / totalCells) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation & Status Bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={onBackToMenu}>
            <Text style={styles.backButtonText}>← MENU</Text>
          </Pressable>

          {/* Difficulty & Size Badge */}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {puzzle.size}×{puzzle.size} • {puzzle.difficulty.toUpperCase()}
            </Text>
          </View>

          {/* Timer Display */}
          <View style={styles.timerBox}>
            <Text style={styles.timerIcon}>⏱</Text>
            <Text style={styles.timerText}>{formatTimer(timer)}</Text>
          </View>
        </View>

        {/* Progress & Rule Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusLabel}>PROGRESS</Text>
            <Text style={styles.statusValue}>
              {filledCount}/{totalCells} ({progressPercent}%)
            </Text>
          </View>

          {/* Validation Feedback Indicator */}
          <Pressable
            style={[
              styles.validationPill,
              validationResult.isValid ? styles.pillValid : styles.pillInvalid,
            ]}
            onPress={() => setShowErrorBanner((prev) => !prev)}
          >
            <Text
              style={[
                styles.validationPillText,
                validationResult.isValid ? styles.textSuccess : styles.textError,
              ]}
            >
              {validationResult.isValid
                ? '✓ All Rules OK'
                : `⚠ ${validationResult.errors.length} Conflict${validationResult.errors.length > 1 ? 's' : ''}`}
            </Text>
          </Pressable>
        </View>

        {/* Hint Banner */}
        {lastHint && (
          <View style={styles.hintBanner}>
            <View style={styles.hintContent}>
              <Text style={styles.hintIcon}>💡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.hintTitle}>
                  HINT ({lastHint.value === 'sun' ? '☀ Sun' : '☾ Moon'} at {lastHint.cell.row + 1},{lastHint.cell.col + 1})
                </Text>
                <Text style={styles.hintReason}>{lastHint.reason}</Text>
              </View>
            </View>
            <Pressable onPress={clearHint} style={styles.hintClose}>
              <Text style={styles.hintCloseText}>✕</Text>
            </Pressable>
          </View>
        )}

        {/* Error Details Banner */}
        {showErrorBanner && !validationResult.isValid && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>Current Violations:</Text>
            {validationResult.errors.slice(0, 3).map((err, idx) => (
              <Text key={`err-${idx}`} style={styles.errorBannerText}>
                • {err.message}
              </Text>
            ))}
          </View>
        )}

        {/* The Puzzle Grid */}
        <View style={styles.gridWrapper}>
          <PuzzleGrid
            size={puzzle.size}
            grid={grid}
            initialMask={initialMask}
            horizontalConstraints={puzzle.horizontalConstraints}
            verticalConstraints={puzzle.verticalConstraints}
            errors={validationResult.errors}
            hintedCell={lastHint ? lastHint.cell : null}
            onCellPress={handleCellPress}
          />
        </View>

        {/* Tool Selector: Tap mode or Direct Sun/Moon placement */}
        <View style={styles.toolSelectorRow}>
          <Pressable
            style={[
              styles.toolButton,
              selectedTool === 'cycle' && styles.toolButtonActive,
            ]}
            onPress={() => setSelectedTool('cycle')}
          >
            <Text style={[styles.toolIcon, selectedTool === 'cycle' && styles.toolTextActive]}>
              ↺
            </Text>
            <Text style={[styles.toolLabel, selectedTool === 'cycle' && styles.toolTextActive]}>
              Cycle
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toolButton,
              selectedTool === 'sun' && styles.toolButtonActiveSun,
            ]}
            onPress={() => setSelectedTool(selectedTool === 'sun' ? 'cycle' : 'sun')}
          >
            <Text style={[styles.toolIcon, styles.sunColor]}>☀</Text>
            <Text style={[styles.toolLabel, selectedTool === 'sun' && styles.sunColor]}>
              Sun
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toolButton,
              selectedTool === 'moon' && styles.toolButtonActiveMoon,
            ]}
            onPress={() => setSelectedTool(selectedTool === 'moon' ? 'cycle' : 'moon')}
          >
            <Text style={[styles.toolIcon, styles.moonColor]}>☾</Text>
            <Text style={[styles.toolLabel, selectedTool === 'moon' && styles.moonColor]}>
              Moon
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toolButton,
              selectedTool === 'clear' && styles.toolButtonActive,
            ]}
            onPress={() => setSelectedTool(selectedTool === 'clear' ? 'cycle' : 'clear')}
          >
            <Text style={[styles.toolIcon, selectedTool === 'clear' && styles.toolTextActive]}>
              ⌫
            </Text>
            <Text style={[styles.toolLabel, selectedTool === 'clear' && styles.toolTextActive]}>
              Erase
            </Text>
          </Pressable>
        </View>

        {/* Action Controls Bar */}
        <View style={styles.actionControlsRow}>
          <Pressable style={styles.actionBtn} onPress={handleUndoPress}>
            <Text style={styles.actionBtnIcon}>↶</Text>
            <Text style={styles.actionBtnText}>
              Undo{undoCount > 0 ? ` (${undoCount})` : ''}
            </Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleHintPress}>
            <Text style={styles.actionBtnIcon}>💡</Text>
            <Text style={styles.actionBtnText}>
              Hint{hintsUsed > 0 ? ` (${hintsUsed})` : ''}
            </Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleRestartPress}>
            <Text style={styles.actionBtnIcon}>🔄</Text>
            <Text style={styles.actionBtnText}>Reset</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleNewPuzzlePress}>
            <Text style={styles.actionBtnIcon}>✦</Text>
            <Text style={styles.actionBtnText}>New</Text>
          </Pressable>
        </View>

        {/* Legend / Reminder */}
        <View style={styles.legendCard}>
          <Text style={styles.legendText}>
            <Text style={styles.legendBold}>Rules: </Text>
            {puzzle.size / 2} ☀ & {puzzle.size / 2} ☾ per line • No 3 in a row • = same • × opposite
          </Text>
        </View>
      </ScrollView>

      {/* Victory Completion Modal */}
      <CompletionModal
        visible={isCompleted}
        timeElapsed={timer}
        size={puzzle.size}
        difficulty={puzzle.difficulty}
        hintsUsed={hintsUsed}
        undoCount={undoCount}
        onPlayAgain={() => newGame()}
        onBackToMenu={onBackToMenu}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
  },
  container: {
    padding: 18,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: GAME_COLORS.card,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  backButtonText: {
    color: GAME_COLORS.orange,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  badgeContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: GAME_COLORS.cardLight,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  badgeText: {
    color: GAME_COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: GAME_COLORS.card,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
    gap: 6,
  },
  timerIcon: {
    fontSize: 14,
  },
  timerText: {
    color: GAME_COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: GAME_COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  statusLeft: {
    flexDirection: 'column',
  },
  statusLabel: {
    color: GAME_COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusValue: {
    color: GAME_COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  validationPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillValid: {
    backgroundColor: GAME_COLORS.successSoft,
    borderColor: GAME_COLORS.success,
  },
  pillInvalid: {
    backgroundColor: GAME_COLORS.errorSoft,
    borderColor: GAME_COLORS.error,
  },
  validationPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textSuccess: {
    color: GAME_COLORS.success,
  },
  textError: {
    color: GAME_COLORS.error,
  },
  hintBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 181, 46, 0.14)',
    borderWidth: 1,
    borderColor: GAME_COLORS.orange,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hintContent: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    alignItems: 'center',
  },
  hintIcon: {
    fontSize: 20,
  },
  hintTitle: {
    color: GAME_COLORS.orange,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  hintReason: {
    color: GAME_COLORS.white,
    fontSize: 11,
    lineHeight: 16,
  },
  hintClose: {
    padding: 6,
    marginLeft: 8,
  },
  hintCloseText: {
    color: GAME_COLORS.orange,
    fontSize: 13,
    fontWeight: '900',
  },
  errorBanner: {
    backgroundColor: GAME_COLORS.errorSoft,
    borderWidth: 1,
    borderColor: GAME_COLORS.error,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerTitle: {
    color: GAME_COLORS.error,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  errorBannerText: {
    color: GAME_COLORS.white,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 2,
  },
  gridWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  toolSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
  },
  toolButton: {
    flex: 1,
    maxWidth: 82,
    backgroundColor: GAME_COLORS.card,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GAME_COLORS.border,
  },
  toolButtonActive: {
    borderColor: GAME_COLORS.orange,
    backgroundColor: GAME_COLORS.cardLight,
  },
  toolButtonActiveSun: {
    borderColor: GAME_COLORS.orange,
    backgroundColor: GAME_COLORS.orangeSoft,
  },
  toolButtonActiveMoon: {
    borderColor: GAME_COLORS.blue,
    backgroundColor: GAME_COLORS.blueSoft,
  },
  toolIcon: {
    fontSize: 18,
    color: GAME_COLORS.muted,
    marginBottom: 2,
  },
  toolLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: GAME_COLORS.muted,
  },
  toolTextActive: {
    color: GAME_COLORS.orange,
  },
  sunColor: {
    color: GAME_COLORS.orange,
  },
  moonColor: {
    color: GAME_COLORS.blue,
  },
  actionControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: GAME_COLORS.card,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  actionBtnIcon: {
    fontSize: 16,
    marginBottom: 2,
    color: GAME_COLORS.white,
  },
  actionBtnText: {
    color: GAME_COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  legendCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: GAME_COLORS.cardLight,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
    alignItems: 'center',
  },
  legendText: {
    color: GAME_COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  legendBold: {
    color: GAME_COLORS.orange,
    fontWeight: '800',
  },
});
