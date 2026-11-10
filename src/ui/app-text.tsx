import { Text, type TextProps } from 'react-native';

import type { Theme, TypographyVariant } from './theme';
import { useTheme } from './use-theme';

type Tone = 'default' | 'muted' | 'primary' | 'error';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  tone?: Tone;
};

function toneColor(theme: Theme, tone: Tone): string {
  switch (tone) {
    case 'muted':
      return theme.colors.onSurfaceVariant;
    case 'primary':
      return theme.colors.primary;
    case 'error':
      return theme.colors.error;
    default:
      return theme.colors.onSurface;
  }
}

/**
 * Text with the app typography and theme colors.
 * In React Native text color does not inherit from a parent View (only from a
 * parent Text), so every screen text goes through this component.
 */
export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text style={[theme.typography[variant], { color: toneColor(theme, tone) }, style]} {...rest} />
  );
}
