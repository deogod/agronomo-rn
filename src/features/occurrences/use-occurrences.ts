import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getMediaFindAllByOccurrenceQueryKey,
  mediaAttachToOccurrence,
  mediaUpload,
  useMediaFindAllByOccurrence,
} from '@/api/generated/endpoints/media/media';
import {
  getOccurrenceFindAllByFarmIdInfiniteQueryKey,
  occurrenceSave,
  useOccurrenceFindAllByFarmIdInfinite,
  useOccurrenceFindById,
} from '@/api/generated/endpoints/occurrence/occurrence';
import type { OccurrenceSaveDto } from '@/api/generated/model';
import { nextPageParam, PAGE_SIZE } from '@/api/pagination';

import { pickPhoto, preparePhoto, type PhotoSource } from './occurrence-photo';

/** A farm's occurrences, newest first (the API fixes the order), page by page. */
export function useFarmOccurrences(farmId: number) {
  return useOccurrenceFindAllByFarmIdInfinite(
    farmId,
    { size: PAGE_SIZE },
    {
      query: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          nextPageParam(lastPage, lastPageParam),
        select: (data) => data.pages.flatMap((page) => page.data),
      },
    },
  );
}

export function useOccurrence(occurrenceId: number) {
  return useOccurrenceFindById(occurrenceId, { query: { select: (response) => response.data } });
}

export function useOccurrencePhotos(occurrenceId: number) {
  return useMediaFindAllByOccurrence(occurrenceId, {
    query: { select: (response) => response.data },
  });
}

export function useCreateOccurrence(farmId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OccurrenceSaveDto) => occurrenceSave(payload),
    // Returning the promise keeps isPending true until the list is fresh.
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getOccurrenceFindAllByFarmIdInfiniteQueryKey(farmId),
      }),
  });
}

/**
 * The whole "add photo" flow: pick, shrink, upload, attach. Resolves to false
 * when the user cancelled. farmId is required here: the API refuses to attach
 * a photo that was not uploaded to the occurrence's farm.
 */
export function useAddOccurrencePhoto(farmId: number, occurrenceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (source: PhotoSource) => {
      const asset = await pickPhoto(source);
      if (!asset) return false;

      const file = await preparePhoto(asset);
      const media = await mediaUpload({ file }, { farmId });
      await mediaAttachToOccurrence(occurrenceId, media.data.id);
      return true;
    },
    onSuccess: (added) =>
      added
        ? queryClient.invalidateQueries({
            queryKey: getMediaFindAllByOccurrenceQueryKey(occurrenceId),
          })
        : undefined,
  });
}
