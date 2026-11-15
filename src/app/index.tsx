
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GameView } from "@/components/game/GameView";
import { SettingsView } from "@/components/settings/SettingsView";
import { useSettings } from "@/game/settings";
import type { Difficulty, GridSize } from "@/game/types";

const COLORS = {
  background: "#0B1020",
  card: "#151D30",
  cardLight: "#1C2940",
  orange: "#FFB52E",
  blue: "#4D9DFF",
  white: "#FFFFFF",
  muted: "#9AA8BD",
  border: "#28364E",
};

const gridSizes: GridSize[] = [4, 6, 8];
const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];

export default function HomeScreen() {
  const { settings } = useSettings();
  const [gridSize, setGridSize] = useState<GridSize>(6);
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.defaultDifficulty);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isViewingSettings, setIsViewingSettings] = useState<boolean>(false);

  // Sync difficulty when default preference changes
  useEffect(() => {
    setDifficulty(settings.defaultDifficulty);
  }, [settings.defaultDifficulty]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleDailyPlay = () => {
    setGridSize(6);
    setDifficulty("Medium");
    setIsPlaying(true);
  };

  if (isViewingSettings) {
    return <SettingsView onBack={() => setIsViewingSettings(false)} />;
  }

  if (isPlaying) {
    return (
      <GameView
        initialSize={gridSize}
        initialDifficulty={difficulty}
        onBackToMenu={() => setIsPlaying(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              TANGO<Text style={styles.logoAccent}> MASTER</Text>
            </Text>
            <Text style={styles.tagline}>Think. Solve. Master.</Text>
          </View>

          <Pressable
            style={styles.settingsButton}
            onPress={() => setIsViewingSettings(true)}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.symbolRow}>
            <Text style={styles.sun}>☀</Text>
            <Text style={styles.moon}>☾</Text>
            <Text style={styles.sun}>☀</Text>
          </View>

          <Text style={styles.heroTitle}>
            Challenge Your{"\n"}
            <Text style={styles.heroAccent}>Mind.</Text>
          </Text>

          <Text style={styles.heroDescription}>
            Every puzzle is a new challenge.
            Think logically and find the solution.
          </Text>
        </View>

        {/* Daily Challenge */}
        <View style={styles.dailyCard}>
          <View style={styles.dailyInfo}>
            <Text style={styles.dailyLabel}>✦ DAILY CHALLENGE</Text>
            <Text style={styles.dailyTitle}>Today's Puzzle</Text>
            <Text style={styles.dailyDescription}>
              A fresh challenge awaits you.
            </Text>
          </View>

          <Pressable
            style={styles.dailyButton}
            onPress={handleDailyPlay}
          >
            <Text style={styles.dailyButtonText}>PLAY →</Text>
          </Pressable>
        </View>

        {/* Grid Selection */}
        <Text style={styles.sectionTitle}>Choose Grid Size</Text>
        <Text style={styles.sectionSubtitle}>
          Select your puzzle dimensions
        </Text>

        <View style={styles.optionsRow}>
          {gridSizes.map((size) => (
            <Pressable
              key={size}
              onPress={() => setGridSize(size)}
              style={[
                styles.sizeCard,
                gridSize === size && styles.selectedCard,
              ]}
            >
              <Text
                style={[
                  styles.sizeNumber,
                  gridSize === size && styles.selectedText,
                ]}
              >
                {size}×{size}
              </Text>

              <Text style={styles.sizeDescription}>
                {size === 4
                  ? "Beginner"
                  : size === 6
                    ? "Standard"
                    : "Advanced"}
              </Text>

              {gridSize === size && (
                <Text style={styles.selectedLabel}>✓ Selected</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Difficulty */}
        <Text style={styles.sectionTitle}>Difficulty Level</Text>

        <View style={styles.difficultyContainer}>
          {difficulties.map((level) => (
            <Pressable
              key={level}
              onPress={() => setDifficulty(level)}
              style={[
                styles.difficultyButton,
                difficulty === level && styles.selectedDifficulty,
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  difficulty === level && styles.selectedText,
                ]}
              >
                {level}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Play Button */}
        <Pressable style={styles.playButton} onPress={handlePlay}>
          <Text style={styles.playButtonText}>PLAY GAME  →</Text>
        </Pressable>

        {/* Game Rules */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>HOW TO PLAY</Text>

          <View style={styles.ruleRow}>
            <Text style={styles.ruleSymbol}>☀</Text>
            <Text style={styles.ruleText}>
              Fill every cell with a Sun or Moon.
            </Text>
          </View>

          <View style={styles.ruleRow}>
            <Text style={styles.ruleSymbol}>☾</Text>
            <Text style={styles.ruleText}>
              Never place three identical symbols together.
            </Text>
          </View>

          <View style={styles.ruleRow}>
            <Text style={styles.ruleSymbol}>=</Text>
            <Text style={styles.ruleText}>
              Equal signs mean identical symbols.
            </Text>
          </View>

          <View style={styles.ruleRow}>
            <Text style={styles.ruleSymbol}>×</Text>
            <Text style={styles.ruleText}>
              Cross signs mean opposite symbols.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          TANGO MASTER • VERSION 1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 35,
  },
  logo: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  logoAccent: {
    color: COLORS.orange,
  },
  tagline: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },
  settingsButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    color: COLORS.white,
    fontSize: 23,
  },
  hero: {
    backgroundColor: COLORS.card,
    padding: 23,
    borderRadius: 24,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  symbolRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  sun: {
    color: COLORS.orange,
    fontSize: 36,
  },
  moon: {
    color: COLORS.blue,
    fontSize: 36,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 42,
  },
  heroAccent: {
    color: COLORS.orange,
  },
  heroDescription: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  dailyCard: {
    backgroundColor: "#18365B",
    padding: 19,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  dailyInfo: {
    flex: 1,
  },
  dailyLabel: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
  },
  dailyTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "800",
  },
  dailyDescription: {
    color: "#C2D4EA",
    fontSize: 12,
    marginTop: 5,
  },
  dailyButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  dailyButtonText: {
    color: "#20202A",
    fontWeight: "900",
    fontSize: 12,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 15,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  sizeCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCard: {
    borderColor: COLORS.orange,
    backgroundColor: "#332B20",
  },
  sizeNumber: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "900",
  },
  selectedText: {
    color: COLORS.orange,
  },
  sizeDescription: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },
  selectedLabel: {
    color: COLORS.orange,
    fontSize: 9,
    marginTop: 7,
    fontWeight: "700",
  },
  difficultyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 25,
  },
  difficultyButton: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedDifficulty: {
    borderColor: COLORS.orange,
    backgroundColor: "#332B20",
  },
  difficultyText: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  playButton: {
    backgroundColor: COLORS.orange,
    padding: 19,
    borderRadius: 17,
    alignItems: "center",
    marginBottom: 28,
  },
  playButtonText: {
    color: "#191919",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },
  rulesCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rulesTitle: {
    color: COLORS.orange,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 17,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  ruleSymbol: {
    color: COLORS.orange,
    fontSize: 21,
    fontWeight: "900",
    width: 25,
    textAlign: "center",
  },
  ruleText: {
    color: COLORS.white,
    fontSize: 12,
    flex: 1,
    lineHeight: 19,
  },
  footer: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 25,
    letterSpacing: 2,
  },
});
