import type { FieldDto, FieldUpdateDto } from '@/api/generated/model';

/** Soil texture as farmers say it; anything else goes as free text in "Outro". */
export const SOIL_TYPES = [
  'Arenoso',
  'Textura média (misto)',
  'Argiloso',
  'Muito argiloso',
  'Siltoso',
  'Orgânico',
] as const;
export const SOIL_OTHER = 'Outro';

/** What the inputs hold: always strings, converted on submit. */
export type FieldFormValues = {
  name: string;
  area: string;
  /** Selected chip: one of SOIL_TYPES, SOIL_OTHER or null (none). */
  soilChoice: string | null;
  /** Free text when soilChoice is SOIL_OTHER. */
  soilOther: string;
  notes: string;
};

export type FieldFormErrors = Partial<Record<'name' | 'area', string>>;

/** "1.250,5" or "1250.5" -> 1250.5; null when it is not a number. */
export function parseBrNumber(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, '');
  if (!normalized) return null;
  // With a comma, dots are thousand separators; without one, a dot is decimal.
  const value = Number(
    normalized.includes(',') ? normalized.replace(/\./g, '').replace(',', '.') : normalized,
  );
  return Number.isFinite(value) ? value : null;
}

/** 12.5 -> "12,5" for the input (Flutter: BrNumber.forInput). */
export function formatForInput(value: number | null | undefined): string {
  return value == null ? '' : String(value).replace('.', ',');
}

/** Initial values: empty for a new field, the saved data when editing. */
export function toFormValues(field?: FieldDto): FieldFormValues {
  const soil = field?.soilType?.trim() ?? '';
  const known = SOIL_TYPES.find((option) => option.toLowerCase() === soil.toLowerCase());
  return {
    name: field?.name ?? '',
    area: formatForInput(field?.areaHa),
    // A saved value outside the list stays editable as "Outro".
    soilChoice: soil ? (known ?? SOIL_OTHER) : null,
    soilOther: soil && !known ? soil : '',
    notes: field?.notes ?? '',
  };
}

export function validateField(values: FieldFormValues): FieldFormErrors {
  const area = parseBrNumber(values.area);
  return {
    name: values.name.trim() ? undefined : 'Informe o nome',
    area: !values.area.trim()
      ? 'Informe a área'
      : area === null || area <= 0
        ? 'Área inválida'
        : undefined,
  };
}

export function hasErrors(errors: FieldFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Body for POST/PUT /field (farmId is added for creation). */
export function toFieldPayload(values: FieldFormValues): FieldUpdateDto & {
  name: string;
  areaHa: number;
} {
  const soilType =
    values.soilChoice === SOIL_OTHER ? values.soilOther.trim() || null : values.soilChoice;
  return {
    name: values.name.trim(),
    areaHa: parseBrNumber(values.area) ?? 0,
    soilType,
    notes: values.notes.trim() || null,
  };
}
