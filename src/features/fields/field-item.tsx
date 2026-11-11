import { router } from 'expo-router';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { FieldDto } from '@/api/generated/model';
import { areaLabel } from '@/features/farms/labels';
import { AppText, useTheme, type Theme } from '@/ui';

type FieldItemProps = {
  field: FieldDto;
};

/**
 * One field in the list (Flutter: FieldItem). Tapping opens the edit form.
 *
 * memo(): when a new page arrives the list renders again; an item whose
 * `field` object did not change skips rendering. renderItem is called by
 * FlatList itself, outside the code the React Compiler memoizes for us.
 * The item navigates by itself (field.farmId + field.id) instead of taking
 * an onPress prop: an arrow created in renderItem would be a new function on
 * every render and defeat memo.
 */
export const FieldItem = memo(function FieldItem({ field }: FieldItemProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const details = [areaLabel(field.areaHa), field.soilType].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/farm/[farmId]/fields/form',
            params: { farmId: field.farmId, fieldId: field.id },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Editar ${field.name}`}
        android_ripple={{ color: theme.colors.primaryContainer }}
        style={({ pressed }) => [
          styles.content,
          pressed && Platform.OS === 'ios' && styles.pressed,
        ]}
      >
        <AppText variant="subtitle" numberOfLines={1}>
          {field.name}
        </AppText>
        <AppText tone="muted">{details}</AppText>
        {field.notes ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {field.notes}
          </AppText>
        ) : null}
      </Pressable>
    </View>
  );
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Rounded View clips the Android ripple (same as Button and FarmCard).
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
