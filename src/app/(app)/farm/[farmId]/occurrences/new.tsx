import { router, Stack, useLocalSearchParams } from 'expo-router';

import { OccurrenceForm } from '@/features/occurrences/occurrence-form';
import { toOccurrencePayload } from '@/features/occurrences/occurrence-form-values';
import { useCreateOccurrence } from '@/features/occurrences/use-occurrences';
import { Screen } from '@/ui';

export default function NewOccurrenceScreen() {
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const create = useCreateOccurrence(Number(farmId));

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Nova ocorrência' }} />
      <OccurrenceForm
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(toOccurrencePayload(values, Number(farmId)), {
            onSuccess: () => router.back(),
          })
        }
      />
    </Screen>
  );
}
