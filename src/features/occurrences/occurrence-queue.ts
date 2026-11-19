import {
  onlineManager,
  useIsMutating,
  useMutation,
  useMutationState,
  type QueryClient,
} from '@tanstack/react-query';
import { Alert } from 'react-native';

import {
  getOccurrenceFindAllByFarmIdInfiniteQueryKey,
  occurrenceSave,
} from '@/api/generated/endpoints/occurrence/occurrence';
import type { OccurrenceSaveDto } from '@/api/generated/model';

const CREATE_OCCURRENCE_KEY = ['occurrence', 'create'];

type QueueContext = { queued: boolean };

/**
 * Occurrences registered without a connection wait on the device and are sent
 * when it comes back, even after the app restarts. A saved mutation cannot hold
 * functions, so they are registered here, before the saved cache is restored.
 */
export function registerOccurrenceQueue(client: QueryClient): void {
  client.setMutationDefaults(CREATE_OCCURRENCE_KEY, {
    mutationFn: (payload: OccurrenceSaveDto) => occurrenceSave(payload),
    // Waits for the connection instead of failing (the app default).
    networkMode: 'online',
    // One at a time, in the order they were registered.
    scope: { id: 'occurrence-create' },
    meta: { offlineQueue: true },
    onMutate: (): QueueContext => ({ queued: !onlineManager.isOnline() }),
    onSuccess: (_response, payload: OccurrenceSaveDto) =>
      client.invalidateQueries({
        queryKey: getOccurrenceFindAllByFarmIdInfiniteQueryKey(payload.farmId as number),
      }),
    onError: (error, payload: OccurrenceSaveDto, context) => {
      // The form shows the error when it is still open; a queued item has no screen.
      if (!(context as QueueContext | undefined)?.queued) return;
      Alert.alert(`"${payload.title}" não foi enviada`, `${error.message} Registre de novo.`);
    },
  });
}

export function useCreateOccurrence() {
  return useMutation<unknown, Error, OccurrenceSaveDto>({ mutationKey: CREATE_OCCURRENCE_KEY });
}

/** The farm's occurrences still waiting to be sent. */
export function usePendingOccurrences(farmId: number) {
  return useMutationState({
    filters: { mutationKey: CREATE_OCCURRENCE_KEY, status: 'pending' },
    select: (mutation) => ({
      id: mutation.mutationId,
      payload: mutation.state.variables as OccurrenceSaveDto,
    }),
  }).filter((pending) => pending.payload.farmId === farmId);
}

export function usePendingOccurrenceCount(): number {
  return useIsMutating({ mutationKey: CREATE_OCCURRENCE_KEY });
}
