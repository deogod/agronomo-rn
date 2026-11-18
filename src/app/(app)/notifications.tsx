import { Stack } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { NotificationItem } from '@/features/notifications/notification-item';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/use-notifications';
import { AppText, Button, QueryState, Screen, usePullToRefresh, useTheme, type Theme } from '@/ui';

/**
 * The user's notifications (Flutter: NotificationsPage). Push taps land here.
 * The Flutter app also opened the screen in each notification's redirectUrl
 * (post, occurrence, price...); those screens are not part of this port.
 */
export default function NotificationsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const notifications = useNotifications();
  const pull = usePullToRefresh(notifications.refetch);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = notifications.data?.some((item) => !item.read) ?? false;

  function loadMore() {
    if (notifications.hasNextPage && !notifications.isFetchingNextPage) {
      void notifications.fetchNextPage();
    }
  }

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Avisos',
          headerRight: hasUnread
            ? () => (
                <Button
                  title="Ler todas"
                  variant="text"
                  loading={markAllRead.isPending}
                  onPress={() => markAllRead.mutate()}
                />
              )
            : undefined,
        }}
      />
      <QueryState query={notifications}>
        {(items) => (
          <FlatList
            // Starts below the translucent iOS header (see the fields list).
            contentInsetAdjustmentBehavior="automatic"
            data={items}
            keyExtractor={(item) => String(item.id)}
            // markRead.mutate is stable across renders, so memo on the item holds.
            renderItem={({ item }) => (
              <NotificationItem notification={item} onRead={markRead.mutate} />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              notifications.isFetchingNextPage ? (
                <ActivityIndicator style={styles.footer} color={theme.colors.primary} />
              ) : undefined
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText variant="subtitle">Nenhum aviso</AppText>
                <AppText tone="muted">
                  Os avisos de preços, diagnósticos e da comunidade aparecem aqui.
                </AppText>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={pull.refreshing}
                onRefresh={pull.onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
      </QueryState>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: {
      paddingHorizontal: 0,
    },
    list: {
      flexGrow: 1,
      padding: theme.spacing.md,
    },
    separator: {
      height: theme.spacing.sm,
    },
    footer: {
      paddingVertical: theme.spacing.lg,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
  });
