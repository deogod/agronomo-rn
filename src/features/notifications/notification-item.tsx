import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { NotificationDto } from '@/api/generated/model';
import { AppText, useTheme, type Theme } from '@/ui';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatNotificationDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}

type NotificationItemProps = {
  notification: NotificationDto;
  /** Stable function (from useMutation's mutate), so memo still works. */
  onRead: (id: number) => void;
};

/** One notification; unread ones are bold with a dot. Tapping marks it as read. */
export const NotificationItem = memo(function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const unread = !notification.read;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${unread ? 'Não lida: ' : ''}${notification.title}`}
        disabled={!unread}
        onPress={() => onRead(notification.id)}
        android_ripple={{ color: theme.colors.primaryContainer }}
        style={({ pressed }) => [
          styles.content,
          pressed && Platform.OS === 'ios' && styles.pressed,
        ]}
      >
        <View style={styles.titleRow}>
          {unread ? <View style={styles.dot} /> : null}
          <AppText variant="subtitle" style={!unread && styles.read} numberOfLines={1}>
            {notification.title}
          </AppText>
        </View>
        <AppText tone="muted">{notification.message}</AppText>
        <AppText variant="caption" tone="muted">
          {formatNotificationDate(notification.createdAt)}
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    read: {
      fontWeight: '400',
    },
    pressed: {
      opacity: 0.85,
    },
  });
