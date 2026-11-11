import { useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type TextInputInstance,
} from 'react-native';

import type { FieldDto } from '@/api/generated/model';
import { Button, ChoiceChips, ErrorBanner, TextField, useTheme, type Theme } from '@/ui';

import {
  hasErrors,
  SOIL_OTHER,
  SOIL_TYPES,
  toFormValues,
  validateField,
  type FieldFormValues,
} from './field-form-values';

const SOIL_CHOICES = [...SOIL_TYPES, SOIL_OTHER];

type FieldFormProps = {
  /** The saved field when editing; undefined for a new one. */
  initial?: FieldDto;
  submitLabel: string;
  pending: boolean;
  error: Error | null;
  onSubmit: (values: FieldFormValues) => void;
  /** Called when the user edits after a failed submit (to clear the error). */
  onEdit?: () => void;
  /** Extra actions below the submit button (e.g. delete). */
  footer?: ReactNode;
};

/**
 * Field form (Flutter: _FieldForm with TextEditingControllers).
 * Values start from `initial` once, when the component mounts. The screen
 * only renders it after the field has loaded and passes key={field.id}, so a
 * different field mounts a fresh form (Flutter: initState with data.current).
 */
export function FieldForm({
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
  onEdit,
  footer,
}: FieldFormProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const areaRef = useRef<TextInputInstance>(null);

  // Lazy initializer: toFormValues runs on the first render only.
  const [startValues] = useState(() => toFormValues(initial));
  const [values, setValues] = useState(startValues);
  const [submitted, setSubmitted] = useState(false);

  const errors = validateField(values);
  const shown = submitted ? errors : {};

  function set<K extends keyof FieldFormValues>(key: K) {
    return (value: FieldFormValues[K]) => {
      // Functional update: always starts from the latest state.
      setValues((current) => ({ ...current, [key]: value }));
      if (error) onEdit?.();
    };
  }

  function submit() {
    setSubmitted(true);
    if (hasErrors(errors) || pending) return;
    onSubmit(values);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Nome"
          value={values.name}
          onChangeText={set('name')}
          error={shown.name}
          placeholder="Ex.: Talhão da baixada"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => areaRef.current?.focus()}
          editable={!pending}
        />
        <TextField
          ref={areaRef}
          label="Área (ha)"
          value={values.area}
          onChangeText={set('area')}
          error={shown.area}
          placeholder="Ex.: 12,5"
          keyboardType="decimal-pad"
          editable={!pending}
        />
        <ChoiceChips
          label="Tipo de solo"
          options={SOIL_CHOICES}
          value={values.soilChoice}
          onChange={set('soilChoice')}
          disabled={pending}
        />
        {values.soilChoice === SOIL_OTHER ? (
          <TextField
            label="Qual tipo de solo?"
            value={values.soilOther}
            onChangeText={set('soilOther')}
            maxLength={100}
            // Focus when the user picks "Outro" (the input mounts then), but
            // not when an existing "Outro" value opens the form.
            autoFocus={startValues.soilChoice !== SOIL_OTHER}
            editable={!pending}
          />
        ) : null}
        <TextField
          label="Observações"
          value={values.notes}
          onChangeText={set('notes')}
          multiline
          numberOfLines={3}
          style={styles.notes}
          textAlignVertical="top"
          editable={!pending}
        />

        {error ? <ErrorBanner message={error.message} /> : null}

        <Button title={submitLabel} onPress={submit} loading={pending} />
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
    notes: {
      minHeight: 96,
    },
  });
