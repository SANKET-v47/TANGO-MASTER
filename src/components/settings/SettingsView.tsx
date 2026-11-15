/**
 * Complete Settings Screen for TANGO MASTER
 *
 * Implements:
 * 1. Sound effects: ON / OFF
 * 2. Haptic feedback: ON / OFF
 * 3. Appearance: Dark, Light, System
 * 4. Default difficulty: Easy, Medium, Hard, Expert
 * 5. About Tango Master: Name, version, description
 * 6. Reset preferences: Restores defaults after confirmation
 */

import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { triggerHaptic } from '@/game/audio';
import { GAME_COLORS } from '@/game/colors';
import { AppearanceMode, useSettings } from '@/game/settings';
import type { Difficulty } from '@/game/types';

interface SettingsViewProps {
  onBack: () => void;
}

const DIFFICULTY_LEVELS: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];
const APPEARANCE_OPTIONS: { id: AppearanceMode; label: string; icon: string }[] = [
  { id: 'dark', label: 'Dark', icon: '☾' },
  { id: 'light', label: 'Light', icon: '☀' },
  { id: 'system', label: 'System', icon: '⚙' },
];

export function SettingsView({ onBack }: SettingsViewProps) {
  const { settings, updateSetting, resetSettings } = useSettings();

  const handleToggleSound = (value: boolean) => {
    triggerHaptic('switch', settings.hapticEnabled);
    updateSetting('soundEnabled', value);
  };

  const handleToggleHaptic = (value: boolean) => {
    triggerHaptic('switch', value);
    updateSetting('hapticEnabled', value);
  };

  const handleSelectAppearance = (mode: AppearanceMode) => {
    triggerHaptic('tap', settings.hapticEnabled);
    updateSetting('appearance', mode);
  };

  const handleSelectDifficulty = (diff: Difficulty) => {
    triggerHaptic('tap', settings.hapticEnabled);
    updateSetting('defaultDifficulty', diff);
  };

  const handleResetPress = () => {
    triggerHaptic('error', settings.hapticEnabled);

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to restore all settings to default values?'
      );
      if (confirmed) {
        resetSettings();
      }
    } else {
      Alert.alert(
        'Reset Preferences',
        'Are you sure you want to restore all settings to default values? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore Defaults',
            style: 'destructive',
            onPress: () => resetSettings(),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← BACK</Text>
          </Pressable>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>SETTINGS</Text>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>

        {/* Section 1: Audio & Haptics */}
        <Text style={styles.sectionHeader}>AUDIO & FEEDBACK</Text>
        <View style={styles.card}>
          {/* Sound Effects */}
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Sound Effects</Text>
              <Text style={styles.rowSubtitle}>
                Chimes and tones on moves and victory
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={handleToggleSound}
              trackColor={{
                false: GAME_COLORS.border,
                true: 'rgba(255, 181, 46, 0.45)',
              }}
              thumbColor={
                settings.soundEnabled ? GAME_COLORS.orange : GAME_COLORS.muted
              }
            />
          </View>

          <View style={styles.separator} />

          {/* Haptic Feedback */}
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Haptic Feedback</Text>
              <Text style={styles.rowSubtitle}>
                Vibration on cell taps and game events
              </Text>
            </View>
            <Switch
              value={settings.hapticEnabled}
              onValueChange={handleToggleHaptic}
              trackColor={{
                false: GAME_COLORS.border,
                true: 'rgba(255, 181, 46, 0.45)',
              }}
              thumbColor={
                settings.hapticEnabled ? GAME_COLORS.orange : GAME_COLORS.muted
              }
            />
          </View>
        </View>

        {/* Section 2: Appearance */}
        <Text style={styles.sectionHeader}>APPEARANCE</Text>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((opt) => {
            const isSelected = settings.appearance === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={[
                  styles.appearanceCard,
                  isSelected && styles.appearanceCardSelected,
                ]}
                onPress={() => handleSelectAppearance(opt.id)}
              >
                <Text
                  style={[
                    styles.appearanceIcon,
                    isSelected && styles.appearanceIconSelected,
                  ]}
                >
                  {opt.icon}
                </Text>
                <Text
                  style={[
                    styles.appearanceLabel,
                    isSelected && styles.appearanceLabelSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {isSelected && <Text style={styles.selectedPill}>✓ Active</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Section 3: Default Difficulty */}
        <Text style={styles.sectionHeader}>DEFAULT DIFFICULTY</Text>
        <Text style={styles.sectionSubtitle}>
          Preferred difficulty pre-selected on the home screen
        </Text>
        <View style={styles.difficultyContainer}>
          {DIFFICULTY_LEVELS.map((level) => {
            const isSelected = settings.defaultDifficulty === level;
            return (
              <Pressable
                key={level}
                style={[
                  styles.difficultyPill,
                  isSelected && styles.difficultyPillSelected,
                ]}
                onPress={() => handleSelectDifficulty(level)}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    isSelected && styles.difficultyTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Section 4: About */}
        <Text style={styles.sectionHeader}>ABOUT TANGO MASTER</Text>
        <View style={styles.card}>
          <View style={styles.aboutHeader}>
            <View>
              <Text style={styles.aboutAppName}>
                TANGO<Text style={styles.aboutAppAccent}> MASTER</Text>
              </Text>
              <Text style={styles.aboutTagline}>Think. Solve. Master.</Text>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </View>

          <Text style={styles.aboutDescription}>
            Tango Master is an elegant logic puzzle game inspired by binary grid
            challenges. Fill each cell with Sun or Moon following strict
            equality, non-consecutive, and line-parity constraints. Every puzzle
            is procedurally generated with a guaranteed unique solution.
          </Text>

          <View style={styles.aboutMetaRow}>
            <Text style={styles.metaLabel}>ENGINE</Text>
            <Text style={styles.metaValue}>React Native 0.88 & Expo 58</Text>
          </View>
          <View style={styles.aboutMetaRow}>
            <Text style={styles.metaLabel}>GRIDS</Text>
            <Text style={styles.metaValue}>4×4, 6×6, and 8×8 Puzzles</Text>
          </View>
        </View>

        {/* Section 5: Reset Preferences */}
        <View style={styles.resetContainer}>
          <Pressable style={styles.resetButton} onPress={handleResetPress}>
            <Text style={styles.resetButtonText}>Restore Default Preferences</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          TANGO MASTER • SETTINGS & PREFERENCES
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GAME_COLORS.background,
  },
  container: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
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
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: GAME_COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerRightSpacer: {
    width: 60,
  },
  sectionHeader: {
    color: GAME_COLORS.orange,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 12,
  },
  sectionSubtitle: {
    color: GAME_COLORS.muted,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
  card: {
    backgroundColor: GAME_COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowInfo: {
    flex: 1,
    marginRight: 16,
  },
  rowTitle: {
    color: GAME_COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  rowSubtitle: {
    color: GAME_COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },
  separator: {
    height: 1,
    backgroundColor: GAME_COLORS.border,
    marginVertical: 12,
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  appearanceCard: {
    flex: 1,
    backgroundColor: GAME_COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  appearanceCardSelected: {
    borderColor: GAME_COLORS.orange,
    backgroundColor: '#332B20',
  },
  appearanceIcon: {
    fontSize: 22,
    color: GAME_COLORS.muted,
    marginBottom: 6,
  },
  appearanceIconSelected: {
    color: GAME_COLORS.orange,
  },
  appearanceLabel: {
    color: GAME_COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  appearanceLabelSelected: {
    color: GAME_COLORS.orange,
    fontWeight: '900',
  },
  selectedPill: {
    color: GAME_COLORS.orange,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 6,
  },
  difficultyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 20,
  },
  difficultyPill: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    backgroundColor: GAME_COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
    alignItems: 'center',
  },
  difficultyPillSelected: {
    borderColor: GAME_COLORS.orange,
    backgroundColor: '#332B20',
  },
  difficultyText: {
    color: GAME_COLORS.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  difficultyTextSelected: {
    color: GAME_COLORS.orange,
    fontWeight: '900',
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutAppName: {
    color: GAME_COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aboutAppAccent: {
    color: GAME_COLORS.orange,
  },
  aboutTagline: {
    color: GAME_COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  versionBadge: {
    backgroundColor: GAME_COLORS.cardLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GAME_COLORS.border,
  },
  versionText: {
    color: GAME_COLORS.orange,
    fontSize: 11,
    fontWeight: '800',
  },
  aboutDescription: {
    color: '#C2D4EA',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  aboutMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    color: GAME_COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metaValue: {
    color: GAME_COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  resetContainer: {
    marginTop: 6,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: GAME_COLORS.error,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: 'center',
    color: GAME_COLORS.muted,
    fontSize: 10,
    marginTop: 15,
    letterSpacing: 1.5,
  },
});
