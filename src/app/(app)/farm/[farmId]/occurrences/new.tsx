import { onlineManager } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { OccurrenceForm } from '@/features/occurrences/occurrence-form';
import { toOccurrencePayload } from '@/features/occurrences/occurrence-form-values';
import { useCreateOccurrence } from '@/features/occurrences/occurrence-queue';
import { Screen } from '@/ui';

export default function NewOccurrenceScreen() {
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const create = useCreateOccurrence();

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Nova ocorrência' }} />
      <OccurrenceForm
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) => {
          const payload = toOccurrencePayload(values, Number(farmId));
          if (onlineManager.isOnline()) {
            create.mutate(payload, { onSuccess: () => router.back() });
            return;
          }
          // Saved on the device: the list shows it until the connection returns.
          create.mutate(payload);
          router.back();
        }}
      />
    </Screen>
  );
}
