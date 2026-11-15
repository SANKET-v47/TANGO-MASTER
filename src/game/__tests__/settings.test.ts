/**
 * Unit Tests for Settings Persistence and Management in TANGO MASTER
 */

import {
  DEFAULT_SETTINGS,
  loadStoredSettings,
  resetStoredSettings,
  sanitizeSettings,
  saveStoredSettings,
  type SettingsState,
} from '../settings';

let passCount = 0;
let failCount = 0;

interface TestTask {
  name: string;
  fn: () => void | Promise<void>;
}

const testQueue: TestTask[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  testQueue.push({ name, fn });
}

interface AssertType {
  strictEqual(actual: unknown, expected: unknown, message?: string): void;
  deepStrictEqual(actual: unknown, expected: unknown, message?: string): void;
  ok(value: unknown, message?: string): asserts value;
}

const assert: AssertType = {
  strictEqual(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) {
      throw new Error(
        message ?? `Assertion failed: expected ${String(expected)}, got ${String(actual)}`
      );
    }
  },
  deepStrictEqual(actual: unknown, expected: unknown, message?: string) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error(message ?? `Assertion failed: expected ${b}, got ${a}`);
    }
  },
  ok(value: unknown, message?: string): asserts value {
    if (!value) {
      throw new Error(message ?? `Assertion failed: expected truthy value, got ${String(value)}`);
    }
  },
};

// ============================================================================
// TEST SUITES
// ============================================================================

test('1. Default Settings: Verifies initial default preferences', () => {
  assert.strictEqual(DEFAULT_SETTINGS.soundEnabled, true);
  assert.strictEqual(DEFAULT_SETTINGS.hapticEnabled, true);
  assert.strictEqual(DEFAULT_SETTINGS.appearance, 'dark');
  assert.strictEqual(DEFAULT_SETTINGS.defaultDifficulty, 'Medium');
});

test('2. Sanitization: Gracefully handles null, undefined, and corrupt storage values', () => {
  const nullResult = sanitizeSettings(null);
  assert.deepStrictEqual(nullResult, DEFAULT_SETTINGS);

  const undefinedResult = sanitizeSettings(undefined);
  assert.deepStrictEqual(undefinedResult, DEFAULT_SETTINGS);

  // Corrupt field types
  const corruptData = {
    soundEnabled: 'yes', // should be boolean
    hapticEnabled: 123, // should be boolean
    appearance: 'neon-cyberpunk', // invalid mode
    defaultDifficulty: 'GodMode', // invalid difficulty
  };
  const sanitized = sanitizeSettings(corruptData);
  assert.strictEqual(sanitized.soundEnabled, true);
  assert.strictEqual(sanitized.hapticEnabled, true);
  assert.strictEqual(sanitized.appearance, 'dark');
  assert.strictEqual(sanitized.defaultDifficulty, 'Medium');
});

test('3. Sanitization: Preserves valid partial and custom configurations', () => {
  const customData: SettingsState = {
    soundEnabled: false,
    hapticEnabled: false,
    appearance: 'light',
    defaultDifficulty: 'Expert',
  };
  const sanitized = sanitizeSettings(customData);
  assert.deepStrictEqual(sanitized, customData);
});

test('4. Persistence Cycle: Save, load, and verify preference state', async () => {
  const customSettings: SettingsState = {
    soundEnabled: false,
    hapticEnabled: true,
    appearance: 'system',
    defaultDifficulty: 'Hard',
  };

  await saveStoredSettings(customSettings);
  const loaded = await loadStoredSettings();

  assert.strictEqual(loaded.soundEnabled, false);
  assert.strictEqual(loaded.hapticEnabled, true);
  assert.strictEqual(loaded.appearance, 'system');
  assert.strictEqual(loaded.defaultDifficulty, 'Hard');
});

test('5. Reset Preferences: Restores default settings after custom changes', async () => {
  // Alter settings first
  await saveStoredSettings({
    soundEnabled: false,
    hapticEnabled: false,
    appearance: 'light',
    defaultDifficulty: 'Easy',
  });

  // Execute reset
  const resetResult = await resetStoredSettings();
  assert.deepStrictEqual(resetResult, DEFAULT_SETTINGS);

  // Reload from storage to verify persistent reset
  const reloaded = await loadStoredSettings();
  assert.deepStrictEqual(reloaded, DEFAULT_SETTINGS);
});

// Run all tests sequentially
for (const t of testQueue) {
  const start = performance.now();
  try {
    await t.fn();
    const elapsed = (performance.now() - start).toFixed(2);
    console.log(`✔ ${t.name} (${elapsed}ms)`);
    passCount++;
  } catch (err) {
    failCount++;
    console.error(`✖ ${t.name} FAILED:`, err);
    throw err;
  }
}

console.log(`\n🎉 All ${passCount} settings tests passed successfully! (${failCount} failures)\n`);
