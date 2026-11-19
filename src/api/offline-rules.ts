/**
 * What may be saved on the device for offline use. AsyncStorage is not
 * encrypted, so this is an allowlist: anything new stays off the disk until it
 * is added here on purpose.
 */
export const OFFLINE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const OFFLINE_PATHS = [/^\/farm-member$/, /^\/field\//, /^\/occurrence\//];

type QueryLike = {
  queryKey: readonly unknown[];
  state: { status: string };
};

type MutationLike = {
  options: { meta?: Record<string, unknown> };
  state: { isPaused: boolean };
};

/** Generated keys hold the API path, e.g. ['infinite', '/field/farm/17', params]. */
export function shouldPersistQuery(query: QueryLike): boolean {
  if (query.state.status !== 'success') return false;
  const path = query.queryKey.find(
    (part): part is string => typeof part === 'string' && part.startsWith('/'),
  );
  return path !== undefined && OFFLINE_PATHS.some((allowed) => allowed.test(path));
}

/**
 * Only mutations that opted in. A paused login, for example, holds the password
 * in its variables and must never reach the disk.
 */
export function shouldPersistMutation(mutation: MutationLike): boolean {
  return mutation.state.isPaused && mutation.options.meta?.offlineQueue === true;
}
