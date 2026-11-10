import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import type { Theme } from './theme';
import { useTheme } from './use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Sides that respect the notch / home indicator. Screens with a header drop 'top'. */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

/** Screen root: safe area, theme background and horizontal padding (Flutter: Scaffold + SafeArea). */
export function Screen({ children, edges = ['top', 'bottom'], style }: ScreenProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.md,
    },
  });
