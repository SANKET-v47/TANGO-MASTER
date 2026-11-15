import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { SettingsProvider, useSettings } from '@/game/settings';

SplashScreen.preventAutoHideAsync();

function LayoutContent() {
  const systemScheme = useColorScheme();
  const { settings } = useSettings();

  const effectiveScheme =
    settings.appearance === 'system'
      ? systemScheme
      : settings.appearance;

  return (
    <ThemeProvider value={effectiveScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <SettingsProvider>
      <LayoutContent />
    </SettingsProvider>
  );
}
