import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { useFieldFindById } from '@/api/generated/endpoints/field/field';
import { FieldForm } from '@/features/fields/field-form';
import { useDeleteField, useSaveField } from '@/features/fields/use-field-mutations';
import { Button, QueryState, Screen } from '@/ui';

/**
 * New field: /farm/17/fields/form. Edit: /farm/17/fields/form?fieldId=42.
 * Two components instead of one with `if`s: hooks cannot be called
 * conditionally, and each mode needs different ones.
 */
export default function FieldFormScreen() {
  const { farmId, fieldId } = useLocalSearchParams<{ farmId: string; fieldId?: string }>();
  return (
    <Screen edges={['bottom']}>
      {fieldId ? (
        <EditField farmId={Number(farmId)} fieldId={Number(fieldId)} />
      ) : (
        <NewField farmId={Number(farmId)} />
      )}
    </Screen>
  );
}

function NewField({ farmId }: { farmId: number }) {
  const save = useSaveField(farmId);
  return (
    <>
      <Stack.Screen options={{ title: 'Novo talhão' }} />
      <FieldForm
        submitLabel="Cadastrar"
        pending={save.isPending}
        error={save.error}
        onEdit={save.reset}
        // Per-call onSuccess runs after the hook's (list already refreshed).
        onSubmit={(values) => save.mutate(values, { onSuccess: () => router.back() })}
      />
    </>
  );
}

function EditField({ farmId, fieldId }: { farmId: number; fieldId: number }) {
  const field = useFieldFindById(fieldId, { query: { select: (response) => response.data } });
  const save = useSaveField(farmId, fieldId);
  const remove = useDeleteField(farmId, fieldId);
  const busy = save.isPending || remove.isPending;

  function confirmDelete(name: string) {
    // Native dialog (Flutter: showDialog with AlertDialog).
    Alert.alert('Excluir talhão?', `"${name}" será excluído. Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => remove.mutate(undefined, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editar talhão' }} />
      <QueryState query={field}>
        {(data) => (
          <FieldForm
            key={data.id}
            initial={data}
            submitLabel="Salvar alterações"
            pending={busy}
            error={save.error ?? remove.error}
            onEdit={save.reset}
            onSubmit={(values) => save.mutate(values, { onSuccess: () => router.back() })}
            footer={
              <Button
                title="Excluir talhão"
                variant="text"
                loading={remove.isPending}
                disabled={busy}
                onPress={() => confirmDelete(data.name)}
              />
            }
          />
        )}
      </QueryState>
    </>
  );
}
