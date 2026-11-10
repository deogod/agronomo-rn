import { ApiError } from '../errors';
import { queryClient } from '../query-client';

const retry = queryClient.getDefaultOptions().queries?.retry as (
  failureCount: number,
  error: unknown,
) => boolean;

describe('query retry policy', () => {
  it.each([
    ['network', new ApiError('x', { kind: 'network' }), true],
    ['timeout', new ApiError('x', { kind: 'timeout' }), true],
    ['server error', new ApiError('x', { kind: 'api', httpStatus: 503 }), true],
    ['validation', new ApiError('x', { kind: 'api', httpStatus: 400 }), false],
    ['session expired', new ApiError('x', { kind: 'unauthorized', httpStatus: 401 }), false],
    ['unknown error', new Error('bug'), false],
  ])('%s -> retry: %s', (_label, error, expected) => {
    expect(retry(0, error)).toBe(expected);
  });

  it('stops after two retries', () => {
    expect(retry(2, new ApiError('x', { kind: 'network' }))).toBe(false);
  });
});
