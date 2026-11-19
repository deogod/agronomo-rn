/**
 * Saves the query cache on the device, so screens opened before still work
 * without a connection (Flutter had no equivalent in this app).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';

import { OFFLINE_MAX_AGE_MS, shouldPersistMutation, shouldPersistQuery } from './offline-rules';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'offline.queryCache',
});

/**
 * The buster discards a saved cache that does not match: another user's data,
 * or data saved by another app version, whose shape may have changed.
 */
export function offlinePersistOptions(
  userId: number | undefined,
): Omit<PersistQueryClientOptions, 'queryClient'> {
  return {
    persister,
    maxAge: OFFLINE_MAX_AGE_MS,
    buster: `${Constants.expoConfig?.version ?? 'dev'}:${userId ?? 'signed-out'}`,
    dehydrateOptions: {
      shouldDehydrateQuery: shouldPersistQuery,
      shouldDehydrateMutation: shouldPersistMutation,
    },
  };
}

export function clearOfflineCache(): Promise<void> {
  return Promise.resolve(persister.removeClient());
}
