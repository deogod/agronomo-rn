/**
 * Google login (Flutter: LoginRemoteDataSource.signInWithGoogle + SocialSignIn).
 *
 * Three hops, same as the Flutter app:
 * 1. Google Sign-In (native sheet) gives a Google idToken;
 * 2. Firebase Auth exchanges it for a Firebase user;
 * 3. the API verifies that user's Firebase ID token (POST /auth/firebase) and
 *    answers with our own access/refresh tokens, like the e-mail login.
 */
import {
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as signOutOfFirebase,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { authenticationFirebase } from '@/api/generated/endpoints/authentication/authentication';
import type { SessionTokens } from '@/api/http-client';
import { env } from '@/config/env';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  // webClientId is what makes Google return an idToken Firebase accepts.
  // The iOS client id comes from GoogleService-Info.plist automatically.
  GoogleSignin.configure({ webClientId: env.googleWebClientId });
  configured = true;
}

/** Google or Firebase failure, with a message the login screen can show. */
export class SocialSignInError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SocialSignInError';
  }
}

/**
 * Runs the whole flow. Resolves to the API tokens, or to null when the user
 * closed the Google sheet (not an error: the Flutter app ignored it too).
 */
export async function signInWithGoogle(): Promise<SessionTokens | null> {
  ensureConfigured();

  let firebaseIdToken: string;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    if (isCancelledResponse(result)) return null;

    const googleIdToken = result.data.idToken;
    if (!googleIdToken) throw new Error('Google returned no idToken (check webClientId)');

    const credential = GoogleAuthProvider.credential(googleIdToken);
    const { user } = await signInWithCredential(getAuth(), credential);
    firebaseIdToken = await getIdToken(user);
  } catch (error) {
    // A second tap while the sheet is open: the first call is still running.
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    await signOutOfProviders();
    throw new SocialSignInError(googleErrorMessage(error), { cause: error });
  }

  try {
    const response = await authenticationFirebase({ idToken: firebaseIdToken });
    return response.data;
  } catch (error) {
    // The API refused (e.g. unverified e-mail): leave no half-open session
    // behind in Google/Firebase, or the next tap would skip the account picker.
    await signOutOfProviders();
    throw error;
  }
}

/** Best effort: called on logout and after a failed login. */
export async function signOutOfProviders(): Promise<void> {
  await Promise.allSettled([GoogleSignin.signOut(), signOutOfFirebase(getAuth())]);
}

function googleErrorMessage(error: unknown): string {
  if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'O Google Play Services não está disponível neste aparelho.';
  }
  return 'Não foi possível entrar com o Google. Tente de novo.';
}
