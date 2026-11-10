/**
 * Orval mutator: every generated function calls httpClient(url, init), where
 * url is the path with the query string already built.
 * Port of HttpApiImpl (agronomo-mobile/core/lib/src/core/http):
 * - adds the base URL, JSON headers and the Bearer token;
 * - refreshes the access token before it expires and once more when the API
 *   rejects it (401, or 403 with an empty body), then repeats the request;
 * - only one refresh runs at a time: concurrent requests wait for the same one;
 * - unwraps nothing: returns the envelope {data, status, totalPages, ...} when
 *   status is "success" and throws ApiError otherwise.
 */
import { env } from '@/config/env';

import { ApiError, errorMessages } from './errors';

/**
 * Orval uses this as the error type (TError) of every generated hook. It
 * must be generic (Orval passes the spec's error schema), but the client
 * always throws ApiError, so the parameter is ignored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_Error> = ApiError;

export type SessionTokens = { accessToken: string; refreshToken: string };

export type StoredSession = SessionTokens & {
  /** Access token expiry (epoch ms), read from the JWT by the session store. */
  expiresAt?: number;
};

/**
 * How the client reads and updates the session. Implemented by the session
 * store and registered once at startup with configureAuth().
 */
export type AuthAdapter = {
  getSession(): Promise<StoredSession | null>;
  saveTokens(tokens: SessionTokens): Promise<void>;
  clearSession(): Promise<void>;
};

const noSession: AuthAdapter = {
  getSession: async () => null,
  saveTokens: async () => {},
  clearSession: async () => {},
};

let auth: AuthAdapter = noSession;

export function configureAuth(adapter: AuthAdapter): void {
  auth = adapter;
}

const TIMEOUT_MS = 30_000;
/** Refresh when the access token (15 min) has less than this left. */
const REFRESH_MARGIN_MS = 60_000;
const REFRESH_PATH = '/auth/refresh';
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/firebase',
  REFRESH_PATH,
  '/auth/recover',
  '/auth/change-password',
];

let refreshing: Promise<boolean> | null = null;

export async function httpClient<T>(url: string, init: RequestInit = {}): Promise<T> {
  const isPublic = PUBLIC_PATHS.includes(url.split('?')[0] ?? url);

  if (!isPublic) await refreshIfExpiring();

  let response = await send(url, init);

  if (!isPublic && (await isAuthRejection(response))) {
    if (await refresh()) {
      response = await send(url, init);
    }
  }

  return readEnvelope<T>(response);
}

async function send(url: string, init: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  // TanStack Query passes its own signal to cancel stale requests.
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;

  try {
    return await fetch(env.apiUrl + url, { ...init, headers: await buildHeaders(init), signal });
  } catch (error) {
    // Cancelled by the caller: not a failure, TanStack ignores it.
    if (init.signal?.aborted) throw error;
    if (timeout.aborted) throw new ApiError(errorMessages.timeout, { kind: 'timeout' });
    throw new ApiError(errorMessages.network, { kind: 'network' });
  }
}

async function buildHeaders(init: RequestInit): Promise<Headers> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const session = await auth.getSession();
  if (session) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  return headers;
}

/** The API rejects an expired access token with 401, or 403 without a body. */
async function isAuthRejection(response: Response): Promise<boolean> {
  if (response.status === 401) return true;
  if (response.status !== 403) return false;
  // clone(): reading the body here must not consume it for readEnvelope.
  return (await response.clone().text()).length === 0;
}

async function refreshIfExpiring(): Promise<void> {
  const session = await auth.getSession();
  if (session?.expiresAt !== undefined && session.expiresAt - Date.now() < REFRESH_MARGIN_MS) {
    await refresh();
  }
}

function refresh(): Promise<boolean> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function doRefresh(): Promise<boolean> {
  const session = await auth.getSession();
  if (!session) return false;

  let response: Response;
  try {
    response = await fetch(env.apiUrl + REFRESH_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Offline is not logged out: keep the session, the request fails as network.
    return false;
  }

  const tokens = response.ok ? readTokens(await response.text()) : null;
  if (!tokens) {
    // Refresh token rejected or expired: the session is over.
    await auth.clearSession();
    return false;
  }
  await auth.saveTokens(tokens);
  return true;
}

function readTokens(text: string): SessionTokens | null {
  try {
    const data: unknown = (JSON.parse(text) as { data?: unknown }).data;
    if (
      isRecord(data) &&
      typeof data.accessToken === 'string' &&
      typeof data.refreshToken === 'string'
    ) {
      return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    }
  } catch {
    // falls through: not a token payload
  }
  return null;
}

type Envelope = {
  data?: unknown;
  status: { code: number; message: string };
  errors?: string[] | null;
};

async function readEnvelope<T>(response: Response): Promise<T> {
  const httpStatus = response.status;
  const text = await response.text();

  if (text.length === 0) {
    if (httpStatus === 401 || httpStatus === 403) {
      throw new ApiError(errorMessages.sessionExpired, { kind: 'unauthorized', httpStatus });
    }
    if (httpStatus === 429) {
      throw new ApiError(errorMessages.tooManyRequests, { kind: 'api', httpStatus });
    }
    throw new ApiError(errorMessages.apiFailure, { kind: 'invalid-response', httpStatus });
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  if (!isEnvelope(body)) {
    throw new ApiError(`Resposta inesperada da API (${httpStatus})`, {
      kind: 'invalid-response',
      httpStatus,
    });
  }

  if (body.status.message !== 'success') {
    const code =
      isRecord(body.data) && typeof body.data.code === 'string' ? body.data.code : undefined;
    throw new ApiError(body.errors?.join('\n') || errorMessages.apiFailure, {
      kind: httpStatus === 401 ? 'unauthorized' : 'api',
      httpStatus,
      code,
    });
  }

  return body as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    isRecord(value) &&
    isRecord(value.status) &&
    typeof value.status.message === 'string' &&
    typeof value.status.code === 'number'
  );
}
