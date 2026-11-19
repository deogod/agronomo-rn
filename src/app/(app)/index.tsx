import { useMutation } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { signOut, useSessionUser } from '@/features/auth/session-store';
import { FarmCard } from '@/features/farms/farm-card';
import { useMyFarms } from '@/features/farms/use-my-farms';
import { NotificationPermissionCard } from '@/features/notifications/notification-permission-card';
import { usePendingOccurrenceCount } from '@/features/occurrences/occurrence-queue';
import { AppText, Button, QueryState, Screen, usePullToRefresh, useTheme, type Theme } from '@/ui';

/** Home: the user's places (Flutter: HomePage + HomeBloc). */
export default function Home() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const user = useSessionUser();
  const farms = useMyFarms();
  const pull = usePullToRefresh(farms.refetch);
  const logout = useMutation({ mutationFn: signOut });
  const pendingOccurrences = usePendingOccurrenceCount();

  function confirmLogout() {
    if (pendingOccurrences === 0) {
      logout.mutate();
      return;
    }
    // Signing out erases what is saved on the device, including the queue.
    Alert.alert('Sair e descartar envios?', 'As ocorrências que aguardam conexão serão perdidas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout.mutate() },
    ]);
  }

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      {/* Screen options set from inside the screen (Flutter: the page's own AppBar). */}
      <Stack.Screen
        options={{
          title: 'Meus lugares',
          headerRight: () => (
            <View style={styles.headerActions}>
              <Button title="Avisos" variant="text" onPress={() => router.push('/notifications')} />
              <Button
                title="Sair"
                variant="text"
                loading={logout.isPending}
                onPress={confirmLogout}
              />
            </View>
          ),
        }}
      />
      <QueryState query={farms}>
        {(items) => (
          // FlatList renders only what is near the screen (Flutter: ListView.builder).
          <FlatList
            // iOS 26+: the header is translucent and floats over the screen; this makes
            // the list start below it (RN default is "never"). No effect on Android.
            contentInsetAdjustmentBehavior="automatic"
            data={items}
            keyExtractor={(member) => String(member.id)}
            renderItem={({ item }) => (
              <FarmCard
                member={item}
                onPress={() =>
                  router.push({ pathname: '/farm/[farmId]', params: { farmId: item.farm.id } })
                }
              />
            )}
            ListHeaderComponent={
              <>
                <AppText variant="subtitle" style={styles.greeting}>
                  Olá, {user?.displayName || 'produtor'}
                </AppText>
                {user ? <NotificationPermissionCard userId={user.userId} /> : null}
              </>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText variant="subtitle">Nenhum lugar ainda</AppText>
                <AppText tone="muted" style={styles.centerText}>
                  Cadastre sua fazenda ou sua casa no app Meu Agrônomo Digital para vê-la aqui.
                </AppText>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                // Spins only for the user's pull (see usePullToRefresh).
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
    headerActions: {
      flexDirection: 'row',
    },
    list: {
      flexGrow: 1,
      padding: theme.spacing.md,
    },
    greeting: {
      marginBottom: theme.spacing.md,
    },
    separator: {
      height: theme.spacing.md,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xl,
    },
    centerText: {
      textAlign: 'center',
    },
  });
