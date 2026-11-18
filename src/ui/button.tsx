import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Theme } from './theme';
import { useTheme } from './use-theme';

type ButtonVariant = 'filled' | 'outlined' | 'text';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses (Flutter: FilledPersistentButton while persisting). */
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'filled',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const inactive = disabled || loading;
  const contentColor = variant === 'filled' ? theme.colors.onPrimary : theme.colors.primary;

  return (
    // The Android ripple is drawn over the Pressable and ignores its own
    // borderRadius/overflow, so a wrapping View does the rounded clipping.
    <View style={[styles.clip, styles[variant], inactive && styles.inactive]}>
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        // Explicit because the spinner replaces the text while loading, and
        // without a label Android keeps announcing "busy" after loading ends.
        accessibilityLabel={title}
        accessibilityState={{ disabled: inactive, busy: loading }}
        android_ripple={{ color: theme.colors.primaryContainer }}
        style={({ pressed }) => [
          styles.pressable,
          variant === 'text' && styles.pressableText,
          // Android shows the ripple; iOS has no ripple, so dim on press instead.
          pressed && Platform.OS === 'ios' && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={contentColor} />
        ) : (
          <Text style={[styles.title, { color: contentColor }]}>{title}</Text>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    clip: {
      borderRadius: theme.radius.full,
      overflow: 'hidden',
    },
    pressable: {
      minHeight: 48,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressableText: {
      paddingHorizontal: theme.spacing.sm,
    },
    filled: {
      backgroundColor: theme.colors.primary,
    },
    outlined: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    text: {},
    inactive: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.7,
    },
    title: {
      ...theme.typography.label,
      fontSize: 16,
    },
  });
