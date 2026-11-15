/**
 * Victory Completion Modal for TANGO MASTER
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME_COLORS } from '@/game/colors';
import type { Difficulty, GridSize } from '@/game/types';

interface CompletionModalProps {
  visible: boolean;
  timeElapsed: number; // in seconds
  size: GridSize;
  difficulty: Difficulty;
  hintsUsed: number;
  undoCount: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function CompletionModal({
  visible,
  timeElapsed,
  size,
  difficulty,
  hintsUsed,
  undoCount,
  onPlayAgain,
  onBackToMenu,
}: CompletionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Decorative Symbols */}
          <View style={styles.symbolRow}>
            <Text style={styles.sun}>☀</Text>
            <Text style={styles.crown}>🏆</Text>
            <Text style={styles.moon}>☾</Text>
          </View>

          <Text style={styles.congratsLabel}>✦ CONGRATULATIONS ✦</Text>
          <Text style={styles.title}>Puzzle Solved!</Text>
          <Text style={styles.subtitle}>
            You mastered the Sun and Moon balance.
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>GRID</Text>
              <Text style={styles.statValue}>
                {size}×{size}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LEVEL</Text>
              <Text style={styles.statValue}>{difficulty}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>HINTS</Text>
              <Text style={styles.statValue}>{hintsUsed}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <Pressable style={styles.primaryButton} onPress={onPlayAgain}>
            <Text style={styles.primaryButtonText}>PLAY NEXT PUZZLE →</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onBackToMenu}>
            <Text style={styles.secondaryButtonText}>Back to Menu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 16, 32, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: GAME_COLORS.card,
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GAME_COLORS.orange,
    shadowColor: GAME_COLORS.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  sun: {
    fontSize: 28,
    color: GAME_COLORS.orange,
  },
  crown: {
    fontSize: 34,
  },
  moon: {
    fontSize: 28,
    color: GAME_COLORS.blue,
  },
  congratsLabel: {
    color: GAME_COLORS.orange,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: GAME_COLORS.white,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: GAME_COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: GAME_COLORS.cardLight,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  statLabel: {
    color: GAME_COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 3,
  },
  statValue: {
    color: GAME_COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: GAME_COLORS.orange,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: GAME_COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#151D30',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: GAME_COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
