import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { Button, ChoiceChips, ErrorBanner, TextField, useTheme, type Theme } from '@/ui';

import {
  hasOccurrenceErrors,
  initialOccurrenceValues,
  maskBrDate,
  severityLabel,
  statusLabel,
  TITLE_MAX_LENGTH,
  typeLabel,
  validateOccurrence,
  type OccurrenceFormValues,
} from './occurrence-form-values';

type EnumChipsProps<K extends string> = {
  label: string;
  labels: Record<K, string>;
  value: K;
  onChange: (value: K) => void;
  disabled: boolean;
};

/** Chips for a required enum: tapping the selected chip keeps it selected. */
function EnumChips<K extends string>({
  label,
  labels,
  value,
  onChange,
  disabled,
}: EnumChipsProps<K>) {
  const entries = Object.entries(labels) as [K, string][];
  return (
    <ChoiceChips
      label={label}
      options={entries.map(([, text]) => text)}
      value={labels[value]}
      onChange={(text) => {
        const entry = entries.find(([, candidate]) => candidate === text);
        if (entry) onChange(entry[0]);
      }}
      disabled={disabled}
    />
  );
}

type OccurrenceFormProps = {
  pending: boolean;
  error: Error | null;
  onSubmit: (values: OccurrenceFormValues) => void;
};

/** New occurrence form (Flutter: OccurrenceFormPage). */
export function OccurrenceForm({ pending, error, onSubmit }: OccurrenceFormProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [values, setValues] = useState(() => initialOccurrenceValues());
  const [submitted, setSubmitted] = useState(false);

  const errors = validateOccurrence(values);
  const shown = submitted ? errors : {};

  function set<K extends keyof OccurrenceFormValues>(key: K, value: OccurrenceFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    setSubmitted(true);
    if (hasOccurrenceErrors(errors) || pending) return;
    onSubmit(values);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        // Starts below the translucent iOS header (see the fields list).
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <EnumChips
          label="Tipo"
          labels={typeLabel}
          value={values.type}
          onChange={(value) => set('type', value)}
          disabled={pending}
        />
        <TextField
          label="Título"
          value={values.title}
          onChangeText={(value) => set('title', value)}
          error={shown.title}
          placeholder="Ex.: Lagarta na soja"
          maxLength={TITLE_MAX_LENGTH}
          editable={!pending}
        />
        <TextField
          label="Descrição"
          value={values.description}
          onChangeText={(value) => set('description', value)}
          multiline
          numberOfLines={3}
          style={styles.description}
          textAlignVertical="top"
          editable={!pending}
        />
        <EnumChips
          label="Gravidade"
          labels={severityLabel}
          value={values.severity}
          onChange={(value) => set('severity', value)}
          disabled={pending}
        />
        <EnumChips
          label="Situação"
          labels={statusLabel}
          value={values.status}
          onChange={(value) => set('status', value)}
          disabled={pending}
        />
        <TextField
          label="Data"
          value={values.date}
          onChangeText={(value) => set('date', maskBrDate(value))}
          error={shown.date}
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          maxLength={10}
          editable={!pending}
        />

        {error ? <ErrorBanner message={error.message} /> : null}

        <Button title="Cadastrar" onPress={submit} loading={pending} />
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
    description: {
      minHeight: 96,
    },
  });
