import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { FieldItem } from '@/features/fields/field-item';
import { useFarmFields } from '@/features/fields/use-farm-fields';
import { AppText, Button, QueryState, Screen, useTheme, type Theme } from '@/ui';

/** Fields of a farm, loaded page by page while scrolling (Flutter: FieldsPage). */
export default function FieldsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const fields = useFarmFields(Number(farmId));

  function loadMore() {
    // onEndReached can fire several times near the end: guard it.
    if (fields.hasNextPage && !fields.isFetchingNextPage) void fields.fetchNextPage();
  }

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Talhões',
          headerRight: () => (
            <Button
              title="Novo"
              variant="text"
              onPress={() =>
                router.push({ pathname: '/farm/[farmId]/fields/form', params: { farmId } })
              }
            />
          ),
        }}
      />
      <QueryState query={fields}>
        {(items) => (
          <FlatList
            data={items}
            keyExtractor={(field) => String(field.id)}
            renderItem={({ item }) => <FieldItem field={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            // Flutter's PaginationComponent did this with a ScrollController listener.
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              fields.isFetchingNextPage ? (
                <ActivityIndicator style={styles.footer} color={theme.colors.primary} />
              ) : undefined
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText variant="subtitle">Nenhum talhão cadastrado</AppText>
                <AppText tone="muted">Toque em “Novo” para cadastrar o primeiro.</AppText>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={fields.isRefetching && !fields.isFetchingNextPage}
                onRefresh={() => void fields.refetch()}
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
