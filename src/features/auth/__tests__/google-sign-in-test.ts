import { ApiError } from '@/api/errors';

// jest hoists the jest.mock calls below above these imports.
import { signInWithGoogle, SocialSignInError } from '../google-sign-in';

// Native modules replaced by plain fakes (names start with "mock" so the
// jest.mock factories may reference them).
const mockGoogleSignIn = jest.fn();
const mockGoogleSignOut = jest.fn(async () => null);
const mockFirebaseSignIn = jest.fn();
const mockFirebaseSignOut = jest.fn(async () => undefined);
const mockAuthenticationFirebase = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: () => mockGoogleSignIn(),
    signOut: () => mockGoogleSignOut(),
  },
  isCancelledResponse: (response: { type: string }) => response.type === 'cancelled',
  isErrorWithCode: (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error,
  statusCodes: { IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES' },
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({}),
  GoogleAuthProvider: { credential: (idToken: string) => ({ idToken }) },
  signInWithCredential: (...args: unknown[]) => mockFirebaseSignIn(...args),
  getIdToken: async () => 'firebase-id-token',
  signOut: () => mockFirebaseSignOut(),
}));

jest.mock('@/api/generated/endpoints/authentication/authentication', () => ({
  authenticationFirebase: (...args: unknown[]) => mockAuthenticationFirebase(...args),
}));

const tokens = { accessToken: 'access', refreshToken: 'refresh' };

beforeEach(() => {
  jest.clearAllMocks();
  mockGoogleSignIn.mockResolvedValue({ type: 'success', data: { idToken: 'google-id-token' } });
  mockFirebaseSignIn.mockResolvedValue({ user: { uid: 'u1' } });
  mockAuthenticationFirebase.mockResolvedValue({ data: tokens });
});

describe('signInWithGoogle', () => {
  it('exchanges the Google token through Firebase and returns the API tokens', async () => {
    await expect(signInWithGoogle()).resolves.toEqual(tokens);

    expect(mockFirebaseSignIn).toHaveBeenCalledWith({}, { idToken: 'google-id-token' });
    // The API receives the Firebase token, not the Google one.
    expect(mockAuthenticationFirebase).toHaveBeenCalledWith({ idToken: 'firebase-id-token' });
    expect(mockGoogleSignOut).not.toHaveBeenCalled();
  });

  it('resolves to null when the user closes the Google sheet', async () => {
    mockGoogleSignIn.mockResolvedValue({ type: 'cancelled', data: null });

    await expect(signInWithGoogle()).resolves.toBeNull();
    expect(mockAuthenticationFirebase).not.toHaveBeenCalled();
  });

  it('ignores a second tap while the sheet is already open', async () => {
    mockGoogleSignIn.mockRejectedValue({ code: 'IN_PROGRESS' });

    await expect(signInWithGoogle()).resolves.toBeNull();
    expect(mockGoogleSignOut).not.toHaveBeenCalled();
  });

  it('wraps Google/Firebase failures in a message for the screen and signs out', async () => {
    mockFirebaseSignIn.mockRejectedValue(new Error('auth/network-request-failed'));

    const error = await signInWithGoogle().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SocialSignInError);
    expect((error as Error).message).toBe('Não foi possível entrar com o Google. Tente de novo.');
    expect(mockGoogleSignOut).toHaveBeenCalled();
    expect(mockFirebaseSignOut).toHaveBeenCalled();
  });

  it('keeps the API error and leaves no Google/Firebase session behind', async () => {
    const apiError = new ApiError('E-mail não verificado.', { kind: 'api', httpStatus: 403 });
    mockAuthenticationFirebase.mockRejectedValue(apiError);

    await expect(signInWithGoogle()).rejects.toBe(apiError);
    expect(mockGoogleSignOut).toHaveBeenCalled();
    expect(mockFirebaseSignOut).toHaveBeenCalled();
  });
});
