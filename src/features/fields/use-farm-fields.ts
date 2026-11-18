import { useFieldFindAllByFarmIdInfinite } from '@/api/generated/endpoints/field/field';
import { nextPageParam, PAGE_SIZE } from '@/api/pagination';

/**
 * Fields of a farm, page by page (Flutter: FieldsBloc with Pageable,
 * reachMax and the items list grown by hand). TanStack keeps the pages;
 * fetchNextPage() loads the next one.
 */
export function useFarmFields(farmId: number) {
  return useFieldFindAllByFarmIdInfinite(
    farmId,
    // No sort param: the API query is fixed to newest first (ORDER BY createdAt DESC).
    { size: PAGE_SIZE },
    {
      query: {
        initialPageParam: 0,
        // Receives the raw pages (envelopes), before select.
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          nextPageParam(lastPage, lastPageParam),
        // Pages -> one flat list for the FlatList. The cache keeps the pages.
        select: (data) => data.pages.flatMap((page) => page.data),
      },
    },
  );
  // Returned as is: spreading the result ({ ...query }) would read every
  // property and turn off TanStack's tracked-properties render optimization.
}
