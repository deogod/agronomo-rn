import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { FieldDto } from '@/api/generated/model';
import { areaLabel } from '@/features/farms/labels';
import { AppText, useTheme, type Theme } from '@/ui';

type FieldItemProps = {
  field: FieldDto;
};

/**
 * One field in the list (Flutter: FieldItem). Opening and deleting come
 * with the form in step 8.
 *
 * memo(): when a new page arrives the list renders again; an item whose
 * `field` object did not change skips rendering. renderItem is called by
 * FlatList itself, outside the code the React Compiler memoizes for us.
 */
export const FieldItem = memo(function FieldItem({ field }: FieldItemProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const details = [areaLabel(field.areaHa), field.soilType].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <AppText variant="subtitle" numberOfLines={1}>
        {field.name}
      </AppText>
      <AppText tone="muted">{details}</AppText>
      {field.notes ? (
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {field.notes}
        </AppText>
      ) : null}
    </View>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
  });
