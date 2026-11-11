import { useMutation } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { signOut, useSessionUser } from '@/features/auth/session-store';
import { FarmCard } from '@/features/farms/farm-card';
import { useMyFarms } from '@/features/farms/use-my-farms';
import { AppText, Button, QueryState, Screen, useTheme, type Theme } from '@/ui';

/** Home: the user's places (Flutter: HomePage + HomeBloc). */
export default function Home() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const user = useSessionUser();
  const farms = useMyFarms();
  const logout = useMutation({ mutationFn: signOut });

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      {/* Screen options set from inside the screen (Flutter: the page's own AppBar). */}
      <Stack.Screen
        options={{
          title: 'Meus lugares',
          headerRight: () => (
            <Button
              title="Sair"
              variant="text"
              loading={logout.isPending}
              onPress={() => logout.mutate()}
            />
          ),
        }}
      />
      <QueryState query={farms}>
        {(items) => (
          // FlatList renders only what is near the screen (Flutter: ListView.builder).
          <FlatList
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
              <AppText variant="subtitle" style={styles.greeting}>
                Olá, {user?.displayName || 'produtor'}
              </AppText>
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
                // isRefetching: only the pull, not the first load (that one is QueryState's).
                refreshing={farms.isRefetching}
                onRefresh={() => void farms.refetch()}
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
