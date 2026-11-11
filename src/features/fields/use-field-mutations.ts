import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  fieldDelete,
  fieldSave,
  fieldUpdate,
  getFieldFindAllByFarmIdInfiniteQueryKey,
  getFieldFindByIdQueryKey,
} from '@/api/generated/endpoints/field/field';

import { toFieldPayload, type FieldFormValues } from './field-form-values';

/**
 * Marks the farm's field list (and the edited field) as stale. The key
 * without params is a prefix: it matches the list whatever page size it uses.
 * Active queries refetch at once; returning the promise from onSuccess keeps
 * the mutation pending until the list is fresh.
 */
function invalidateFields(queryClient: QueryClient, farmId: number, fieldId?: number) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: getFieldFindAllByFarmIdInfiniteQueryKey(farmId) }),
    fieldId != null
      ? queryClient.invalidateQueries({ queryKey: getFieldFindByIdQueryKey(fieldId) })
      : undefined,
  ]);
}

/**
 * Create (no fieldId) or update a field (Flutter: FieldFormBloc with
 * SaveFieldUseCase / UpdateFieldUseCase). Instead of pop(result) patching the
 * list by hand, the list refetches from the cache invalidation.
 */
export function useSaveField(farmId: number, fieldId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FieldFormValues) => {
      const payload = toFieldPayload(values);
      return fieldId == null ? fieldSave({ ...payload, farmId }) : fieldUpdate(fieldId, payload);
    },
    onSuccess: () => invalidateFields(queryClient, farmId, fieldId),
  });
}

export function useDeleteField(farmId: number, fieldId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fieldDelete(fieldId),
    onSuccess: () => {
      // The deleted field must not be refetched (it would 404): drop it.
      queryClient.removeQueries({ queryKey: getFieldFindByIdQueryKey(fieldId) });
      return invalidateFields(queryClient, farmId);
    },
  });
}
