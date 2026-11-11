import {
  formatForInput,
  hasErrors,
  parseBrNumber,
  SOIL_OTHER,
  toFieldPayload,
  toFormValues,
  validateField,
} from '../field-form-values';

describe('parseBrNumber', () => {
  it.each([
    ['12,5', 12.5],
    ['1.250,5', 1250.5],
    ['1250.5', 1250.5],
    [' 7 ', 7],
    ['', null],
    ['abc', null],
    ['1,2,3', null],
  ])('%p -> %p', (text, expected) => {
    expect(parseBrNumber(text)).toBe(expected);
  });

  it('round-trips with formatForInput', () => {
    expect(parseBrNumber(formatForInput(135.5))).toBe(135.5);
  });
});

describe('toFormValues', () => {
  const field = { id: 1, farmId: 2, name: 'Talhão 1', areaHa: 12.5 };

  it('starts empty for a new field', () => {
    expect(toFormValues()).toEqual({
      name: '',
      area: '',
      soilChoice: null,
      soilOther: '',
      notes: '',
    });
  });

  it('selects a known soil type ignoring case', () => {
    expect(toFormValues({ ...field, soilType: 'argiloso' }).soilChoice).toBe('Argiloso');
  });

  it('keeps an unknown soil type as "Outro" text', () => {
    expect(toFormValues({ ...field, soilType: 'Latossolo roxo' })).toMatchObject({
      area: '12,5',
      soilChoice: SOIL_OTHER,
      soilOther: 'Latossolo roxo',
    });
  });
});

describe('validateField', () => {
  const valid = { name: 'A', area: '3', soilChoice: null, soilOther: '', notes: '' };

  it('accepts a valid form', () => {
    expect(hasErrors(validateField(valid))).toBe(false);
  });

  it('requires a name and a positive area', () => {
    expect(validateField({ ...valid, name: '  ', area: '' })).toEqual({
      name: 'Informe o nome',
      area: 'Informe a área',
    });
    expect(validateField({ ...valid, area: '0' }).area).toBe('Área inválida');
    expect(validateField({ ...valid, area: 'x' }).area).toBe('Área inválida');
  });
});

describe('toFieldPayload', () => {
  it('trims text, converts the area and sends nulls for empty optionals', () => {
    expect(
      toFieldPayload({
        name: ' Baixada ',
        area: '1.250,5',
        soilChoice: null,
        soilOther: '',
        notes: ' ',
      }),
    ).toEqual({ name: 'Baixada', areaHa: 1250.5, soilType: null, notes: null });
  });

  it('uses the free text for "Outro" and null when it is empty', () => {
    const base = { name: 'A', area: '1', notes: '' };
    expect(toFieldPayload({ ...base, soilChoice: SOIL_OTHER, soilOther: ' Roxo ' }).soilType).toBe(
      'Roxo',
    );
    expect(toFieldPayload({ ...base, soilChoice: SOIL_OTHER, soilOther: '' }).soilType).toBeNull();
  });
});
