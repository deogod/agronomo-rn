import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { OccurrenceItem } from '@/features/occurrences/occurrence-item';
import { usePendingOccurrences } from '@/features/occurrences/occurrence-queue';
import { PendingOccurrenceItem } from '@/features/occurrences/pending-occurrence-item';
import { useFarmOccurrences } from '@/features/occurrences/use-occurrences';
import { AppText, Button, QueryState, Screen, usePullToRefresh, useTheme, type Theme } from '@/ui';

/** A farm's occurrences, loaded page by page (Flutter: OccurrencesPage). */
export default function OccurrencesScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const occurrences = useFarmOccurrences(Number(farmId));
  const pending = usePendingOccurrences(Number(farmId));
  const pull = usePullToRefresh(occurrences.refetch);

  function loadMore() {
    if (occurrences.hasNextPage && !occurrences.isFetchingNextPage) {
      void occurrences.fetchNextPage();
    }
  }

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Ocorrências',
          headerRight: () => (
            <Button
              title="Nova"
              variant="text"
              onPress={() =>
                router.push({ pathname: '/farm/[farmId]/occurrences/new', params: { farmId } })
              }
            />
          ),
        }}
      />
      <QueryState query={occurrences}>
        {(items) => (
          <FlatList
            // Starts below the translucent iOS header (see the fields list).
            contentInsetAdjustmentBehavior="automatic"
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <OccurrenceItem occurrence={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <>
                {pending.map(({ id, payload }) => (
                  <PendingOccurrenceItem key={id} occurrence={payload} />
                ))}
              </>
            }
            ListFooterComponent={
              occurrences.isFetchingNextPage ? (
                <ActivityIndicator style={styles.footer} color={theme.colors.primary} />
              ) : undefined
            }
            ListEmptyComponent={
              pending.length > 0 ? undefined : (
                <View style={styles.empty}>
                  <AppText variant="subtitle">Nenhuma ocorrência ainda</AppText>
                  <AppText tone="muted">Toque em “Nova” para registrar a primeira.</AppText>
                </View>
              )
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
    },
  });
