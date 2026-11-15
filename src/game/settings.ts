/**
 * Settings persistence and state management for TANGO MASTER
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

import type { Difficulty } from './types';

export type AppearanceMode = 'dark' | 'light' | 'system';

export interface SettingsState {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  appearance: AppearanceMode;
  defaultDifficulty: Difficulty;
}

export const DEFAULT_SETTINGS: SettingsState = {
  soundEnabled: true,
  hapticEnabled: true,
  appearance: 'dark',
  defaultDifficulty: 'Medium',
};

const STORAGE_KEY = 'tango_master_settings_v1';
const FILE_NAME = 'tango_settings.json';

// In-memory fallback
let memoryStorage: SettingsState = { ...DEFAULT_SETTINGS };

/**
 * Validates and sanitizes settings objects (guards against corrupt storage)
 */
export function sanitizeSettings(data: unknown): SettingsState {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const obj = data as Partial<SettingsState>;

  const soundEnabled =
    typeof obj.soundEnabled === 'boolean'
      ? obj.soundEnabled
      : DEFAULT_SETTINGS.soundEnabled;

  const hapticEnabled =
    typeof obj.hapticEnabled === 'boolean'
      ? obj.hapticEnabled
      : DEFAULT_SETTINGS.hapticEnabled;

  const appearance: AppearanceMode =
    obj.appearance === 'dark' ||
    obj.appearance === 'light' ||
    obj.appearance === 'system'
      ? obj.appearance
      : DEFAULT_SETTINGS.appearance;

  const defaultDifficulty: Difficulty =
    obj.defaultDifficulty === 'Easy' ||
    obj.defaultDifficulty === 'Medium' ||
    obj.defaultDifficulty === 'Hard' ||
    obj.defaultDifficulty === 'Expert'
      ? obj.defaultDifficulty
      : DEFAULT_SETTINGS.defaultDifficulty;

  return {
    soundEnabled,
    hapticEnabled,
    appearance,
    defaultDifficulty,
  };
}

/**
 * Low-level storage adapter (supports Web localStorage and native FileSystem)
 */
export async function loadStoredSettings(): Promise<SettingsState> {
  // 1. Try Web localStorage
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    try {
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated = sanitizeSettings(parsed);
        memoryStorage = { ...validated };
        return validated;
      }
    } catch {
      // Fall through to file system or memory
    }
  }

  // 2. Try native Expo FileSystem if on iOS/Android
  if (process.env.EXPO_OS !== 'web') {
    try {
      const FileSystem = await import('expo-file-system/legacy');
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${FILE_NAME}`;
        const info = await FileSystem.getInfoAsync(fileUri);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri);
          const parsed = JSON.parse(content);
          const validated = sanitizeSettings(parsed);
          memoryStorage = { ...validated };
          return validated;
        }
      }
    } catch {
      // Fall through to memory storage
    }
  }

  // 3. Fallback to memory
  return { ...memoryStorage };
}

/**
 * Persists settings to storage
 */
export async function saveStoredSettings(
  settings: SettingsState
): Promise<void> {
  const sanitized = sanitizeSettings(settings);
  memoryStorage = { ...sanitized };

  // 1. Web localStorage
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // Continue to try native or memory
    }
  }

  // 2. Native FileSystem
  if (process.env.EXPO_OS !== 'web') {
    try {
      const FileSystem = await import('expo-file-system/legacy');
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${FILE_NAME}`;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(sanitized));
      }
    } catch {
      // Silently handled by in-memory persistence
    }
  }
}

/**
 * Resets settings to defaults and saves
 */
export async function resetStoredSettings(): Promise<SettingsState> {
  const defaults = { ...DEFAULT_SETTINGS };
  await saveStoredSettings(defaults);
  return defaults;
}

// ============================================================================
// React Context & Provider
// ============================================================================

interface SettingsContextType {
  settings: SettingsState;
  isLoaded: boolean;
  updateSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  updateSetting: async () => {},
  resetSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadStoredSettings().then((loaded) => {
      if (mounted) {
        setSettings(loaded);
        setIsLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateSetting = async <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    const updated = {
      ...settings,
      [key]: value,
    };
    setSettings(updated);
    await saveStoredSettings(updated);
  };

  const resetSettings = async () => {
    const defaults = await resetStoredSettings();
    setSettings(defaults);
  };

  return React.createElement(
    SettingsContext.Provider,
    {
      value: {
        settings,
        isLoaded,
        updateSetting,
        resetSettings,
      },
    },
    children
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
