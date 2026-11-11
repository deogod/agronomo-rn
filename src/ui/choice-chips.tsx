import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import type { Theme } from './theme';
import { useTheme } from './use-theme';

type ChoiceChipsProps = {
  label: string;
  options: readonly string[];
  value: string | null;
  /** Tapping the selected chip again clears the choice (null). */
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

/**
 * Single choice among a few options (Flutter: SelectionField / ChoiceChip).
 * React Native has no built-in select; for a handful of options, chips are
 * faster than opening a picker.
 */
export function ChoiceChips({ label, options, value, onChange, disabled }: ChoiceChipsProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(selected ? null : option)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              hitSlop={4}
              style={[styles.chip, selected && styles.selected]}
            >
              <AppText variant="label" style={selected ? styles.selectedText : styles.text}>
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    chip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    selected: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    text: {
      color: theme.colors.onSurface,
    },
    selectedText: {
      color: theme.colors.onPrimaryContainer,
    },
  });
