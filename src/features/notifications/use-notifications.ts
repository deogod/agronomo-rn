import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getNotificationFindAllInfiniteQueryKey,
  notificationRead,
  notificationReadAll,
  useNotificationFindAllInfinite,
} from '@/api/generated/endpoints/notification/notification';
import { nextPageParam, PAGE_SIZE } from '@/api/pagination';

/** The user's notifications, newest first (the API fixes the order), page by page. */
export function useNotifications() {
  return useNotificationFindAllInfinite(
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

/** Prefix key: matches the list whatever its params. */
const listKey = getNotificationFindAllInfiniteQueryKey();

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationReadAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });
}
