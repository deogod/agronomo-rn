import { nextPageParam, PAGE_SIZE } from '../pagination';

const page = (count: number, totalPages?: number) => ({
  data: Array.from({ length: count }, (_, i) => i),
  totalPages,
});

describe('nextPageParam', () => {
  it('follows totalPages from the API envelope', () => {
    expect(nextPageParam(page(PAGE_SIZE, 3), 0)).toBe(1);
    expect(nextPageParam(page(PAGE_SIZE, 3), 1)).toBe(2);
    expect(nextPageParam(page(5, 3), 2)).toBeUndefined();
  });

  it('stops on an empty result', () => {
    expect(nextPageParam(page(0, 0), 0)).toBeUndefined();
  });

  it('falls back to "short page means the end" without totalPages', () => {
    expect(nextPageParam(page(PAGE_SIZE), 0)).toBe(1);
    expect(nextPageParam(page(PAGE_SIZE - 1), 4)).toBeUndefined();
  });

  it('starts from page 0 when there is no previous param', () => {
    expect(nextPageParam(page(PAGE_SIZE, 2), undefined)).toBe(1);
  });
});
