import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { useTheme } from './use-theme';

/** Inline error message for a failed action (Flutter: showFailure snackbar). */
export function ErrorBanner({ message }: { message: string }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.box,
        { backgroundColor: colors.errorContainer, borderRadius: radius.sm, padding: spacing.md },
      ]}
    >
      <AppText style={{ color: colors.onErrorContainer }}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'stretch',
  },
});
