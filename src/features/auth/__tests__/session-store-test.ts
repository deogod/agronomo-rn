import { testTokens } from '@/test/tokens';

// In-memory stand-ins for the native storages. Names start with "mock" so
// jest.mock factories may reference them.
const mockSecure = new Map<string, string>();
const mockAsync = new Map<string, string>();
const mockLogout = jest.fn();

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
  getItemAsync: async (key: string) => mockSecure.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => void mockSecure.set(key, value),
  deleteItemAsync: async (key: string) => void mockSecure.delete(key),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (key: string) => mockAsync.get(key) ?? null,
  setItem: async (key: string, value: string) => void mockAsync.set(key, value),
}));

jest.mock('@/api/generated/endpoints/authentication/authentication', () => ({
  authenticationLogout: (...args: unknown[]) => mockLogout(...args),
}));

type Store = typeof import('../session-store');

/** Fresh module per test: the store and the hydration promise are module state. */
function loadStore(): Store {
  let store!: Store;
  jest.isolateModules(() => {
    // require (not import) so the module is evaluated inside the isolated registry.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    store = require('../session-store');
  });
  return store;
}

function storeTokens(tokens: { accessToken: string; refreshToken: string }) {
  mockSecure.set('session.accessToken', tokens.accessToken);
  mockSecure.set('session.refreshToken', tokens.refreshToken);
}

beforeEach(() => {
  mockSecure.clear();
  mockAsync.clear();
  mockLogout.mockReset().mockResolvedValue(undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('session store', () => {
  it('starts as loading', () => {
    expect(loadStore().useSessionStore.getState().status).toBe('loading');
  });

  it('restores a stored session on an existing install', async () => {
    mockAsync.set('session.installMarker', '1');
    storeTokens(testTokens());
    const store = loadStore();

    await store.hydrateSession();

    const state = store.useSessionStore.getState();
    expect(state.status).toBe('signedIn');
    expect(state.session?.user).toEqual({
      userId: 42,
      email: 'joao@fazenda.com',
      displayName: 'João Ávila',
    });
  });

  it('discards Keychain leftovers on a fresh install', async () => {
    storeTokens(testTokens()); // left by a previous install (iOS)
    const store = loadStore();

    await store.hydrateSession();

    expect(store.useSessionStore.getState().status).toBe('signedOut');
    expect(mockSecure.size).toBe(0);
    expect(mockAsync.get('session.installMarker')).toBe('1');
  });

  it('signs out when the stored token is malformed', async () => {
    mockAsync.set('session.installMarker', '1');
    storeTokens({ accessToken: 'garbage', refreshToken: 'r' });
    const store = loadStore();

    await store.hydrateSession();

    expect(store.useSessionStore.getState().status).toBe('signedOut');
    expect(mockSecure.size).toBe(0);
  });

  it('signIn persists the tokens and signOut clears them even if the API fails', async () => {
    const store = loadStore();
    await store.hydrateSession();
    const tokens = testTokens();

    await store.signIn(tokens);
    expect(store.useSessionStore.getState().status).toBe('signedIn');
    expect(mockSecure.get('session.refreshToken')).toBe(tokens.refreshToken);

    mockLogout.mockRejectedValueOnce(new Error('offline'));
    await store.signOut();

    expect(mockLogout).toHaveBeenCalledWith({ refreshToken: tokens.refreshToken });
    expect(store.useSessionStore.getState()).toMatchObject({ status: 'signedOut', session: null });
    expect(mockSecure.size).toBe(0);
  });

  it('adapter: getSession hydrates on first use; saveTokens keeps the user signed in', async () => {
    mockAsync.set('session.installMarker', '1');
    storeTokens(testTokens(1));
    const store = loadStore();

    const session = await store.sessionAuthAdapter.getSession();
    expect(session?.refreshToken).toBe('refresh-1');

    await store.sessionAuthAdapter.saveTokens(testTokens(2));
    expect(store.useSessionStore.getState()).toMatchObject({
      status: 'signedIn',
      session: { refreshToken: 'refresh-2' },
    });
    expect(mockSecure.get('session.refreshToken')).toBe('refresh-2');

    await store.sessionAuthAdapter.clearSession();
    expect(store.useSessionStore.getState().status).toBe('signedOut');
  });
});
