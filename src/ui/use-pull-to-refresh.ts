import { useState } from 'react';

/**
 * State for a RefreshControl that spins only for the user's own pull.
 *
 * Passing `query.isRefetching` straight to `refreshing` also spins for
 * background refetches (screen focus, cache invalidation after a save). Those
 * often run while the list is hidden under another screen, and on iOS a
 * RefreshControl switched on and off off-screen stays stuck spinning.
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }

  return { refreshing, onRefresh };
}
