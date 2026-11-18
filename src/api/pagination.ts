/** Default page size for the paginated lists (fields, notifications). */
export const PAGE_SIZE = 20;

/**
 * Next page index for useInfiniteQuery's getNextPageParam, or undefined when
 * there is none (TanStack stops there). The API sends totalPages in the
 * envelope; without it, a short page means the end
 * (Flutter: reachMax = list.length < page.size).
 */
export function nextPageParam(
  lastPage: { data: unknown[]; totalPages?: number | null },
  lastPageParam: number | undefined,
  pageSize = PAGE_SIZE,
): number | undefined {
  const current = lastPageParam ?? 0;
  if (lastPage.totalPages != null) {
    return current + 1 < lastPage.totalPages ? current + 1 : undefined;
  }
  return lastPage.data.length < pageSize ? undefined : current + 1;
}
