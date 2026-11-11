import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { FarmMemberDto } from '@/api/generated/model';
import { AppText, Chip, useTheme, type Theme } from '@/ui';

import { activityLabel, areaLabel, farmTypeLabel, locationLabel, roleLabel } from './labels';

type FarmCardProps = {
  member: FarmMemberDto;
  onPress: () => void;
};

/** One place in the home list (Flutter: ListFarmCard). */
export function FarmCard({ member, onPress }: FarmCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { farm } = member;
  const location = locationLabel(member);
  const area = areaLabel(farm.totalAreaHa);

  return (
    // Same ripple clipping as Button: the rounded View clips, the Pressable fills it.
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${farm.name}`}
        android_ripple={{ color: theme.colors.primaryContainer }}
        style={({ pressed }) => [
          styles.content,
          pressed && Platform.OS === 'ios' && styles.pressed,
        ]}
      >
        <View style={styles.titleRow}>
          <AppText variant="subtitle" numberOfLines={1} style={styles.title}>
            {farm.name}
          </AppText>
          <Chip label={farmTypeLabel[farm.type]} tone="primary" />
        </View>

        {location ? <AppText tone="muted">{location}</AppText> : null}

        <View style={styles.chips}>
          {farm.activities.map((activity) => (
            <Chip key={activity} label={activityLabel[activity]} />
          ))}
          {area ? <Chip label={area} /> : null}
        </View>

        <AppText variant="caption" tone="muted">
          {roleLabel[member.role]}
        </AppText>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    content: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    pressed: {
      opacity: 0.85,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    title: {
      // Lets the name shrink (and ellipsize) instead of pushing the chip out.
      flexShrink: 1,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
  });
