import { useFieldFindAllByFarmIdInfinite } from '@/api/generated/endpoints/field/field';
import type { ResponseListFieldDto } from '@/api/generated/model';

export const FIELDS_PAGE_SIZE = 20;

/**
 * Next page index, or undefined when there is none (TanStack stops there).
 * The API sends totalPages in the envelope; without it, a short page means
 * the end (Flutter: reachMax = list.length < page.size).
 */
export function nextFieldsPage(
  lastPage: ResponseListFieldDto,
  lastPageParam: number | undefined,
): number | undefined {
  const current = lastPageParam ?? 0;
  if (lastPage.totalPages != null) {
    return current + 1 < lastPage.totalPages ? current + 1 : undefined;
  }
  return lastPage.data.length < FIELDS_PAGE_SIZE ? undefined : current + 1;
}

/**
 * Fields of a farm, page by page (Flutter: FieldsBloc with Pageable,
 * reachMax and the items list grown by hand). TanStack keeps the pages;
 * fetchNextPage() loads the next one.
 */
export function useFarmFields(farmId: number) {
  return useFieldFindAllByFarmIdInfinite(
    farmId,
    // No sort param: the API query is fixed to newest first (ORDER BY createdAt DESC).
    { size: FIELDS_PAGE_SIZE },
    {
      query: {
        initialPageParam: 0,
        // Receives the raw pages (envelopes), before select.
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          nextFieldsPage(lastPage, lastPageParam),
        // Pages -> one flat list for the FlatList. The cache keeps the pages.
        select: (data) => data.pages.flatMap((page) => page.data),
      },
    },
  );
  // Returned as is: spreading the result ({ ...query }) would read every
  // property and turn off TanStack's tracked-properties render optimization.
}
