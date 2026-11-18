import { router } from 'expo-router';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { OccurrenceDto } from '@/api/generated/model';
import { AppText, useTheme, type Theme } from '@/ui';

import { formatBrDate, severityLabel, statusLabel, typeLabel } from './occurrence-form-values';

/** One occurrence in the list. Navigates by itself so memo stays effective. */
export const OccurrenceItem = memo(function OccurrenceItem({
  occurrence,
}: {
  occurrence: OccurrenceDto;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const details = [
    typeLabel[occurrence.type],
    `Gravidade ${severityLabel[occurrence.severity].toLowerCase()}`,
    statusLabel[occurrence.status],
  ].join(' · ');

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${occurrence.title}`}
        onPress={() =>
          router.push({
            pathname: '/farm/[farmId]/occurrences/[occurrenceId]',
            params: { farmId: occurrence.farmId, occurrenceId: occurrence.id },
          })
        }
        android_ripple={{ color: theme.colors.primaryContainer }}
        style={({ pressed }) => [
          styles.content,
          pressed && Platform.OS === 'ios' && styles.pressed,
        ]}
      >
        <AppText variant="subtitle" numberOfLines={1}>
          {occurrence.title}
        </AppText>
        <AppText tone="muted" numberOfLines={2}>
          {details}
        </AppText>
        <AppText variant="caption" tone="muted">
          {formatBrDate(occurrence.occurredAt)}
        </AppText>
      </Pressable>
    </View>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Rounded View clips the Android ripple (same as the other cards).
    card: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    content: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
    },
    pressed: {
      opacity: 0.85,
    },
  });
