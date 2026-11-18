import {
  formatBrDate,
  hasOccurrenceErrors,
  initialOccurrenceValues,
  maskBrDate,
  parseBrDate,
  todayBr,
  toOccurrencePayload,
  validateOccurrence,
} from '../occurrence-form-values';
import { photoResize } from '../photo-size';

describe('dates', () => {
  it('uses the local day for today', () => {
    expect(todayBr(new Date(2026, 10, 5, 23, 30))).toBe('05/11/2026');
  });

  it.each([
    ['1', '1'],
    ['1211', '12/11'],
    ['12112026', '12/11/2026'],
    ['12/11/2026999', '12/11/2026'],
    ['ab12', '12'],
  ])('masks %p as %p', (typed, expected) => {
    expect(maskBrDate(typed)).toBe(expected);
  });

  it.each([
    ['12/11/2026', '2026-11-12'],
    ['29/02/2028', '2028-02-29'],
    ['31/02/2026', null],
    ['29/02/2026', null],
    ['12/13/2026', null],
    ['00/11/2026', null],
    ['12/11/1999', null],
    ['12/11', null],
  ])('parses %p as %p', (text, expected) => {
    expect(parseBrDate(text)).toBe(expected);
  });

  it('formats the API date without shifting the day', () => {
    expect(formatBrDate('2026-11-12')).toBe('12/11/2026');
    expect(formatBrDate(null)).toBe('');
  });
});

describe('validateOccurrence', () => {
  const valid = initialOccurrenceValues(new Date(2026, 10, 12));

  it('requires a title, including one with only spaces', () => {
    expect(hasOccurrenceErrors(validateOccurrence({ ...valid, title: 'Lagarta' }))).toBe(false);
    expect(validateOccurrence({ ...valid, title: '   ' }).title).toBe('Informe o título');
  });

  it('requires a real date', () => {
    expect(validateOccurrence({ ...valid, title: 'A', date: '' }).date).toBe('Informe a data');
    expect(validateOccurrence({ ...valid, title: 'A', date: '31/02/2026' }).date).toBe(
      'Data inválida',
    );
  });
});

describe('toOccurrencePayload', () => {
  it('trims the text, converts the date and sends null for a blank description', () => {
    const values = initialOccurrenceValues(new Date(2026, 10, 12));
    expect(toOccurrencePayload({ ...values, title: ' Lagarta ', description: '  ' }, 17)).toEqual({
      farmId: 17,
      type: 'PEST',
      title: 'Lagarta',
      description: null,
      severity: 'LOW',
      status: 'OPEN',
      occurredAt: '2026-11-12',
    });
  });
});

describe('photoResize', () => {
  it('keeps photos that already fit', () => {
    expect(photoResize(1920, 1080)).toBeNull();
  });

  it('limits only the longest side', () => {
    expect(photoResize(4000, 3000)).toEqual({ width: 1920 });
    expect(photoResize(3000, 4000)).toEqual({ height: 1920 });
  });
});
