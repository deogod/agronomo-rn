import type { FieldDto, ResponseListFieldDto } from '@/api/generated/model';

import { FIELDS_PAGE_SIZE, nextFieldsPage } from '../use-farm-fields';

const field = (id: number): FieldDto => ({ id, farmId: 1, name: `Talhão ${id}`, areaHa: 10 });

const page = (count: number, totalPages?: number): ResponseListFieldDto => ({
  data: Array.from({ length: count }, (_, i) => field(i)),
  status: { code: 200, message: 'success' },
  totalPages,
});

describe('nextFieldsPage', () => {
  it('follows totalPages from the API envelope', () => {
    expect(nextFieldsPage(page(FIELDS_PAGE_SIZE, 3), 0)).toBe(1);
    expect(nextFieldsPage(page(FIELDS_PAGE_SIZE, 3), 1)).toBe(2);
    expect(nextFieldsPage(page(5, 3), 2)).toBeUndefined();
  });

  it('stops on an empty result', () => {
    expect(nextFieldsPage(page(0, 0), 0)).toBeUndefined();
  });

  it('falls back to "short page means the end" without totalPages', () => {
    expect(nextFieldsPage(page(FIELDS_PAGE_SIZE), 0)).toBe(1);
    expect(nextFieldsPage(page(FIELDS_PAGE_SIZE - 1), 4)).toBeUndefined();
  });
});
