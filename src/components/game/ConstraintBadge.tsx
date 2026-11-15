/**
 * Visual badge for Equal (=) and Cross (×) constraints
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GAME_COLORS } from '@/game/colors';
import type { ConstraintType } from '@/game/types';

interface ConstraintBadgeProps {
  type: ConstraintType;
  isViolated?: boolean;
  size?: number;
}

export function ConstraintBadge({
  type,
  isViolated = false,
  size = 18,
}: ConstraintBadgeProps) {
  const isEqual = type === 'equal';
  const symbol = isEqual ? '=' : '×';

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        isViolated && styles.badgeViolated,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: Math.max(10, Math.round(size * 0.72)) },
          isEqual ? styles.textEqual : styles.textCross,
          isViolated && styles.textViolated,
        ]}
      >
        {symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: GAME_COLORS.cardLight,
    borderWidth: 1,
    borderColor: GAME_COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 10,
  },
  badgeViolated: {
    backgroundColor: GAME_COLORS.errorSoft,
    borderColor: GAME_COLORS.error,
  },
  text: {
    fontWeight: '900',
    lineHeight: 14,
    textAlign: 'center',
  },
  textEqual: {
    color: GAME_COLORS.orange,
  },
  textCross: {
    color: GAME_COLORS.blue,
  },
  textViolated: {
    color: GAME_COLORS.error,
  },
});
