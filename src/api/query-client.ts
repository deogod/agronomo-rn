/**
 * TanStack Query setup: the cache of server data shared by every screen.
 * Flutter had no equivalent (each BLoC fetched again on open); here a list
 * fetched once is reused by other screens until it goes stale.
 */
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState } from 'react-native';

import { ApiError } from './errors';

const MAX_RETRIES = 2;

/**
 * Retry only what may succeed on a second try: no connection, timeout or a
 * server error. A validation error or a 404 fails the same way every time.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES || !(error instanceof ApiError)) return false;
  return (
    error.kind === 'network' ||
    error.kind === 'timeout' ||
    (error.httpStatus !== undefined && error.httpStatus >= 500)
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data younger than this is served from cache without refetching.
      staleTime: 30_000,
      retry: shouldRetry,
    },
    mutations: {
      // A save must not run twice on its own.
      retry: false,
    },
  },
});

let connected = false;

/**
 * Tells TanStack Query about the device: on mobile it cannot see the network
 * or app focus by itself (on the web it uses browser events).
 * - offline: queries pause and resume when the connection comes back;
 * - app back to foreground: stale queries on screen refetch.
 */
export function connectQueryClientToDevice(): void {
  if (connected) return;
  connected = true;

  // https://tanstack.com/query/latest/docs/framework/react/react-native
  onlineManager.setEventListener((setOnline) => {
    let initialized = false;
    const subscription = Network.addNetworkStateListener((state) => {
      initialized = true;
      setOnline(!!state.isConnected);
    });
    Network.getNetworkStateAsync()
      .then((state) => {
        if (!initialized) setOnline(!!state.isConnected);
      })
      .catch(() => undefined);
    return subscription.remove;
  });

  // App lifetime subscription, so module level instead of a component effect.
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
}
