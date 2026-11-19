import { StyleSheet, View } from 'react-native';

import type { OccurrenceSaveDto } from '@/api/generated/model';
import { AppText, useTheme, type Theme } from '@/ui';

import { formatBrDate } from './occurrence-form-values';

/** An occurrence saved on the device, not on the server yet: it cannot be opened. */
export function PendingOccurrenceItem({ occurrence }: { occurrence: OccurrenceSaveDto }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <AppText variant="subtitle" numberOfLines={1}>
        {occurrence.title}
      </AppText>
      <AppText tone="muted">Aguardando conexão para enviar</AppText>
      <AppText variant="caption" tone="muted">
        {formatBrDate(occurrence.occurredAt ?? null)}
      </AppText>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.secondaryContainer,
    },
  });
