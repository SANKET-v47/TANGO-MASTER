/**
 * Audio synthesis and Haptic feedback engine for TANGO MASTER
 */

import { Platform, Vibration } from 'react-native';

import type { SymbolType } from './types';

// Web Audio API context singleton
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;

  try {
    if (typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!audioCtx && AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }
  } catch {
    // AudioContext not available or blocked
  }
  return audioCtx;
}

/**
 * Triggers haptic vibration if enabled
 */
export function triggerHaptic(
  type: 'tap' | 'switch' | 'error' | 'victory',
  hapticEnabled: boolean
) {
  if (!hapticEnabled) return;

  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const pattern =
          type === 'tap'
            ? 10
            : type === 'switch'
              ? 15
              : type === 'error'
                ? [30, 30, 30]
                : [40, 40, 80];
        navigator.vibrate(pattern);
      }
    } else {
      if (type === 'tap') {
        Vibration.vibrate(10);
      } else if (type === 'switch') {
        Vibration.vibrate(15);
      } else if (type === 'error') {
        Vibration.vibrate([0, 30, 30, 30]);
      } else if (type === 'victory') {
        Vibration.vibrate([0, 50, 40, 80]);
      }
    }
  } catch {
    // Silent fail if vibration unsupported
  }
}

/**
 * Synthesizes a tone using Web Audio API
 */
function playTone(
  frequency: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  gainLevel = 0.08
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + durationMs / 1000
    );

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Audio play fail ignored
  }
}

/**
 * Plays sound according to cell value
 */
export function playCellSound(value: SymbolType, soundEnabled: boolean) {
  if (!soundEnabled) return;

  if (value === 'sun') {
    // Sun: warm bright chime
    playTone(587.33, 75, 'triangle', 0.09); // D5
  } else if (value === 'moon') {
    // Moon: mellow deep bell
    playTone(440, 85, 'sine', 0.08); // A4
  } else {
    // Empty: light soft click
    playTone(329.63, 40, 'sine', 0.05); // E4
  }
}

/**
 * Plays sparkle hint tone
 */
export function playHintSound(soundEnabled: boolean) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 80, 'sine', 0.07);
      }, idx * 45);
    });
  } catch {}
}

/**
 * Plays victory triumph fanfare
 */
export function playVictorySound(soundEnabled: boolean) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const fanfare = [
      { f: 523.25, d: 90, delay: 0 },
      { f: 659.25, d: 90, delay: 100 },
      { f: 783.99, d: 110, delay: 200 },
      { f: 1046.5, d: 350, delay: 330 },
    ];

    fanfare.forEach(({ f, d, delay }) => {
      setTimeout(() => {
        playTone(f, d, 'triangle', 0.12);
      }, delay);
    });
  } catch {}
}
