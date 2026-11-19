import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

/** The connection state TanStack Query is using (see connectQueryClientToDevice). */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
  );
}
