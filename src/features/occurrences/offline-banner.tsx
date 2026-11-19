import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/api/use-is-online';
import { AppText, useTheme, type Theme } from '@/ui';

import { usePendingOccurrenceCount } from './occurrence-queue';

function pendingText(count: number): string {
  if (count === 0) return 'Mostrando os dados salvos.';
  return count === 1 ? '1 ocorrência aguarda envio.' : `${count} ocorrências aguardam envio.`;
}

/** Shown on every signed-in screen while the device has no connection. */
export function OfflineBanner() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const online = useIsOnline();
  const pending = usePendingOccurrenceCount();

  if (online) return null;

  return (
    // "none": it only informs, so taps reach the buttons underneath.
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { bottom: insets.bottom + theme.spacing.sm }]}
    >
      <AppText variant="caption" style={styles.text}>
        Sem conexão. {pendingText(pending)}
      </AppText>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    banner: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.onSurface,
    },
    text: {
      color: theme.colors.background,
      textAlign: 'center',
    },
  });
