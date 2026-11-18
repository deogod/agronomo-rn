import type {
  OccurrenceDtoSeverity,
  OccurrenceDtoStatus,
  OccurrenceDtoType,
  OccurrenceSaveDto,
} from '@/api/generated/model';

export const typeLabel: Record<OccurrenceDtoType, string> = {
  PEST: 'Praga',
  DISEASE: 'Doença',
  WEED: 'Planta daninha',
  WEATHER_DAMAGE: 'Dano climático',
  NUTRITIONAL: 'Nutricional',
  ANIMAL_HEALTH: 'Saúde animal',
  OTHER: 'Outro',
};

export const severityLabel: Record<OccurrenceDtoSeverity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
};

export const statusLabel: Record<OccurrenceDtoStatus, string> = {
  OPEN: 'Aberta',
  MONITORING: 'Em acompanhamento',
  RESOLVED: 'Resolvida',
};

/** The database column is varchar(150) and the API does not validate it. */
export const TITLE_MAX_LENGTH = 150;

export type OccurrenceFormValues = {
  type: OccurrenceDtoType;
  title: string;
  description: string;
  severity: OccurrenceDtoSeverity;
  status: OccurrenceDtoStatus;
  /** As typed: DD/MM/AAAA. */
  date: string;
};

export type OccurrenceFormErrors = { title?: string; date?: string };

const pad = (value: number) => String(value).padStart(2, '0');

/** Today in the device's time zone, as DD/MM/AAAA. */
export function todayBr(now = new Date()): string {
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
}

export function initialOccurrenceValues(now = new Date()): OccurrenceFormValues {
  // Same defaults as the Flutter form.
  return {
    type: 'PEST',
    title: '',
    description: '',
    severity: 'LOW',
    status: 'OPEN',
    date: todayBr(now),
  };
}

/** Adds the slashes while typing: "1211" becomes "12/11". */
export function maskBrDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

/**
 * DD/MM/AAAA to the API's YYYY-MM-DD, or null when it is not a real date.
 * Date.UTC rolls 31/02 over to March, so the parts are compared afterwards.
 */
export function parseBrDate(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 2000 || year > 2100) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal = date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isReal ? `${year}-${pad(month)}-${pad(day)}` : null;
}

/**
 * YYYY-MM-DD to DD/MM/AAAA. Handled as text on purpose: new Date('2026-11-12')
 * means midnight UTC, which is still the 11th in Brazil.
 */
export function formatBrDate(iso: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

export function validateOccurrence(values: OccurrenceFormValues): OccurrenceFormErrors {
  const errors: OccurrenceFormErrors = {};
  if (!values.title.trim()) errors.title = 'Informe o título';
  if (!values.date.trim()) errors.date = 'Informe a data';
  else if (!parseBrDate(values.date)) errors.date = 'Data inválida';
  return errors;
}

export function hasOccurrenceErrors(errors: OccurrenceFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function toOccurrencePayload(
  values: OccurrenceFormValues,
  farmId: number,
): OccurrenceSaveDto {
  return {
    farmId,
    type: values.type,
    title: values.title.trim(),
    description: values.description.trim() || null,
    severity: values.severity,
    status: values.status,
    occurredAt: parseBrDate(values.date),
  };
}
