import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './theme';

/**
 * Current theme, following the system light/dark setting.
 * Flutter equivalent: Theme.of(context) with themeMode: ThemeMode.system.
 */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
