import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { Button } from './button';
import { useTheme } from './use-theme';

type QueryStateProps<T> = {
  query: UseQueryResult<T, Error>;
  children: (data: T) => ReactNode;
};

/**
 * Loading / error / data for a query (Flutter: ScreenStateBuilder with
 * onLoading / onError / onStable). Empty lists are left to the caller
 * (e.g. FlatList's ListEmptyComponent), since "empty" depends on the data.
 *
 * Data wins over error: if a background refetch fails while there is cached
 * data, the screen keeps showing it instead of an error page.
 */
export function QueryState<T>({ query, children }: QueryStateProps<T>) {
  const theme = useTheme();

  if (query.data !== undefined) return <>{children(query.data)}</>;

  if (query.isError) {
    return (
      <View style={[styles.center, { gap: theme.spacing.md }]}>
        <AppText variant="subtitle">Não foi possível carregar</AppText>
        <AppText tone="muted" style={styles.text}>
          {query.error.message}
        </AppText>
        <Button title="Tentar de novo" variant="outlined" onPress={() => void query.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    textAlign: 'center',
  },
});
