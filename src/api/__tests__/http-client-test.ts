import { env } from '@/config/env';

import { ApiError } from '../errors';
import { configureAuth, httpClient, type AuthAdapter, type StoredSession } from '../http-client';

// --- helpers ---------------------------------------------------------------

const success = (data: unknown, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ data, status: { code: 200, message: 'success' }, ...extra }), {
    status: 200,
  });

const failure = (httpStatus: number, errors: string[], data?: unknown) =>
  new Response(JSON.stringify({ data, errors, status: { code: httpStatus, message: 'failure' } }), {
    status: httpStatus,
  });

const empty = (httpStatus: number) => new Response(null, { status: httpStatus });

const tokens = (n: number) => ({ accessToken: `access-${n}`, refreshToken: `refresh-${n}` });

/** In-memory session, standing in for the session store of step 3. */
function memoryAuth(initial: StoredSession | null) {
  let session = initial;
  const adapter = {
    getSession: jest.fn(async () => session),
    saveTokens: jest.fn(async (t: { accessToken: string; refreshToken: string }) => {
      session = { ...t, expiresAt: Date.now() + 15 * 60_000 };
    }),
    clearSession: jest.fn(async () => {
      session = null;
    }),
  } satisfies AuthAdapter;
  configureAuth(adapter);
  return adapter;
}

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();

function calls() {
  return fetchMock.mock.calls.map(([url, init]) => ({
    url,
    auth: new Headers(init.headers).get('Authorization'),
  }));
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  memoryAuth(null);
});

// --- tests -----------------------------------------------------------------

describe('httpClient', () => {
  it('returns the envelope and sends base URL, JSON and Bearer headers', async () => {
    memoryAuth({ ...tokens(1), expiresAt: Date.now() + 10 * 60_000 });
    fetchMock.mockResolvedValueOnce(success([{ id: 1 }], { totalPages: 3 }));

    const result = await httpClient<{ data: { id: number }[]; totalPages: number }>(
      '/field/farm/7?page=0',
      { method: 'GET' },
    );

    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.totalPages).toBe(3);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${env.apiUrl}/field/farm/7?page=0`);
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer access-1');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('throws ApiError with the API messages and data.code on status "failure"', async () => {
    fetchMock.mockResolvedValueOnce(
      failure(429, ['Limite diário atingido'], { code: 'DIAGNOSIS_DAILY_LIMIT' }),
    );

    const error = await httpClient('/diagnosis', { method: 'POST', body: '{}' }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'api',
      httpStatus: 429,
      code: 'DIAGNOSIS_DAILY_LIMIT',
      message: 'Limite diário atingido',
    });
  });

  it('refreshes once and repeats the request when the token is rejected', async () => {
    const auth = memoryAuth({ ...tokens(1), expiresAt: Date.now() + 10 * 60_000 });
    fetchMock
      .mockResolvedValueOnce(empty(403)) // expired access token
      .mockResolvedValueOnce(success(tokens(2))) // /auth/refresh
      .mockResolvedValueOnce(success({ id: 1 })); // retry

    await httpClient('/farm/1', { method: 'GET' });

    expect(calls()).toEqual([
      { url: `${env.apiUrl}/farm/1`, auth: 'Bearer access-1' },
      { url: `${env.apiUrl}/auth/refresh`, auth: null },
      { url: `${env.apiUrl}/farm/1`, auth: 'Bearer access-2' },
    ]);
    expect(auth.saveTokens).toHaveBeenCalledWith(tokens(2));
  });

  it('shares one refresh between concurrent rejected requests', async () => {
    memoryAuth({ ...tokens(1), expiresAt: Date.now() + 10 * 60_000 });
    fetchMock.mockImplementation(async (url, init) => {
      if (url.endsWith('/auth/refresh')) return success(tokens(2));
      const token = new Headers(init.headers).get('Authorization');
      return token === 'Bearer access-2' ? success({ ok: true }) : empty(401);
    });

    await Promise.all([
      httpClient('/farm/1', { method: 'GET' }),
      httpClient('/farm/2', { method: 'GET' }),
      httpClient('/farm/3', { method: 'GET' }),
    ]);

    const refreshCalls = calls().filter((c) => c.url.endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('refreshes before the request when the token is about to expire', async () => {
    memoryAuth({ ...tokens(1), expiresAt: Date.now() + 30_000 });
    fetchMock
      .mockResolvedValueOnce(success(tokens(2))) // /auth/refresh
      .mockResolvedValueOnce(success({ id: 1 }));

    await httpClient('/farm/1', { method: 'GET' });

    expect(calls()).toEqual([
      { url: `${env.apiUrl}/auth/refresh`, auth: null },
      { url: `${env.apiUrl}/farm/1`, auth: 'Bearer access-2' },
    ]);
  });

  it('clears the session when the refresh token is rejected', async () => {
    const auth = memoryAuth({ ...tokens(1), expiresAt: Date.now() + 10 * 60_000 });
    fetchMock
      .mockResolvedValueOnce(empty(401)) // request
      .mockResolvedValueOnce(empty(401)) // /auth/refresh rejected
      .mockResolvedValueOnce(empty(401)); // never reached

    const error = await httpClient('/farm/1', { method: 'GET' }).catch((e) => e);

    expect(auth.clearSession).toHaveBeenCalled();
    expect(error).toMatchObject({ kind: 'unauthorized', httpStatus: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the session when the refresh fails for lack of connection', async () => {
    const auth = memoryAuth({ ...tokens(1), expiresAt: Date.now() + 10 * 60_000 });
    fetchMock
      .mockResolvedValueOnce(empty(401))
      .mockRejectedValueOnce(new TypeError('Network request failed'));

    await httpClient('/farm/1', { method: 'GET' }).catch(() => undefined);

    expect(auth.clearSession).not.toHaveBeenCalled();
  });

  it('does not try to refresh on public auth routes', async () => {
    memoryAuth({ ...tokens(1), expiresAt: Date.now() + 10 * 60_000 });
    fetchMock.mockResolvedValueOnce(failure(401, ['E-mail ou senha inválidos']));

    const error = await httpClient('/auth/login', { method: 'POST', body: '{}' }).catch((e) => e);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(error).toMatchObject({ message: 'E-mail ou senha inválidos' });
  });

  it('maps a network failure to ApiError "network"', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    const error = await httpClient('/farm', { method: 'GET' }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'network' });
  });

  it('rethrows cancellation from the caller signal untouched', async () => {
    const controller = new AbortController();
    const abort = new DOMException('Aborted', 'AbortError');
    fetchMock.mockImplementationOnce(async () => {
      controller.abort();
      throw abort;
    });

    const error = await httpClient('/farm', { method: 'GET', signal: controller.signal }).catch(
      (e) => e,
    );

    expect(error).toBe(abort);
  });

  it('rejects a body that is not the API envelope', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>502</html>', { status: 502 }));

    const error = await httpClient('/farm', { method: 'GET' }).catch((e) => e);

    expect(error).toMatchObject({ kind: 'invalid-response', httpStatus: 502 });
  });
});
