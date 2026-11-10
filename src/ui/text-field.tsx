import { useState, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { AppText } from './app-text';
import type { Theme } from './theme';
import { useTheme } from './use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  /** Message shown below the field; also paints the border red. */
  error?: string;
  /**
   * React 19: `ref` is a regular prop on function components (no forwardRef).
   * Used to move focus to the next field (Flutter: FocusNode.requestFocus).
   */
  ref?: Ref<TextInputInstance>;
};

/**
 * Labeled input (Flutter: TextField with InputDecoration).
 * Uncontrolled by default; pass value + onChangeText to control it.
 * With secureTextEntry it gets a show/hide toggle (Flutter: PasswordTextField).
 */
export function TextField({
  label,
  error,
  ref,
  secureTextEntry,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.outline;

  return (
    <View style={styles.container}>
      <AppText variant="label" tone={error ? 'error' : 'muted'}>
        {label}
      </AppText>
      <View style={[styles.inputRow, { borderColor }, focused && styles.focused]}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          selectionColor={theme.colors.primary}
          secureTextEntry={secureTextEntry && hidden}
          accessibilityLabel={label}
          // Keep the caller's handlers working while tracking focus here.
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            hitSlop={8}
            style={styles.toggle}
          >
            <AppText variant="label" tone="primary">
              {hidden ? 'Mostrar' : 'Ocultar'}
            </AppText>
          </Pressable>
        )}
      </View>
      {error ? (
        <AppText variant="caption" tone="error">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      borderWidth: 1,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surface,
    },
    focused: {
      borderWidth: 2,
    },
    input: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      color: theme.colors.onSurface,
      ...theme.typography.body,
    },
    toggle: {
      paddingHorizontal: theme.spacing.md,
    },
  });
