import type { TextStyle } from 'react-native';

// Colors ported from the Flutter app (agronomo-mobile/app/lib/app/theme.dart),
// keeping the Material 3 token names so both codebases can be compared.
type ColorTokens = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  /** Screen background (Flutter: scaffoldBackgroundColor). */
  background: string;
  /** Cards, inputs and sheets drawn on top of the background. */
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
};

const lightColors: ColorTokens = {
  primary: '#2E5E4E',
  onPrimary: '#FFFFFF',
  primaryContainer: '#DDE9E3',
  onPrimaryContainer: '#1C352B',
  secondaryContainer: '#EAF3EF',
  onSecondaryContainer: '#2E5E4E',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  onSurface: '#1B1C1C',
  onSurfaceVariant: '#444746',
  outline: '#737373',
  outlineVariant: '#C4C7C5',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
};

const darkColors: ColorTokens = {
  primary: '#8AC6AD',
  onPrimary: '#003322',
  primaryContainer: '#2E5E4E',
  onPrimaryContainer: '#DDE9E3',
  secondaryContainer: '#2E5E4E',
  onSecondaryContainer: '#DDE9E3',
  // Flutter uses darkColorScheme.tertiary as the scaffold background.
  background: '#212E3E',
  surface: '#121212',
  onSurface: '#EDEDED',
  onSurfaceVariant: '#B0B0B0',
  outline: '#737373',
  outlineVariant: '#3D3D3D',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

const radius = {
  /** Inputs (Flutter: OutlineInputBorder radius 8). */
  sm: 8,
  /** Cards (Flutter: cardTheme radius 10). */
  md: 10,
  /** Pill-shaped buttons (Material 3 default). */
  full: 999,
} as const;

const typography = {
  title: { fontSize: 28, fontWeight: '600', letterSpacing: -0.2 },
  subtitle: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  label: { fontSize: 14, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

// Module-level constants: the same object is returned on every render, so
// anything derived from it (styles) can be memoized by reference.
export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  spacing,
  radius,
  typography,
};
export const darkTheme: Theme = { scheme: 'dark', colors: darkColors, spacing, radius, typography };
