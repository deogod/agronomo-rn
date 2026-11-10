import type { SessionTokens } from '@/api/http-client';

export type SessionUser = {
  userId: number;
  email: string;
  displayName: string;
};

export type Session = SessionTokens & {
  user: SessionUser;
  /** Access token expiry (epoch ms), from the JWT `exp` claim. */
  expiresAt?: number;
};

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * base64url -> UTF-8 text. Written by hand instead of atob/TextDecoder,
 * whose availability in Hermes is not documented by React Native.
 */
function decodeBase64Url(input: string): string {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of input.replace(/=+$/, '')) {
    const value = BASE64URL.indexOf(char === '+' ? '-' : char === '/' ? '_' : char);
    if (value < 0) throw new Error('Invalid base64url');
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  // Percent-encode each byte and let decodeURIComponent assemble UTF-8
  // sequences ("Jo%C3%A3o" -> "João").
  return decodeURIComponent(bytes.map((b) => '%' + b.toString(16).padStart(2, '0')).join(''));
}

/** Payload of a JWT, without verifying the signature (the API does that). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  if (!payload || token.split('.').length !== 3) throw new Error('Invalid token');
  const parsed: unknown = JSON.parse(decodeBase64Url(payload));
  if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid token payload');
  return parsed as Record<string, unknown>;
}

/**
 * Builds the session from /auth/login or /auth/refresh tokens.
 * Flutter: SessionModel.fromTokens + AuthenticatedModel.fromJwtToken
 * (claims: id, sub = e-mail, displayName, exp).
 */
export function sessionFromTokens(tokens: SessionTokens): Session {
  const claims = decodeJwtPayload(tokens.accessToken);
  if (typeof claims.id !== 'number' || typeof claims.sub !== 'string') {
    throw new Error('Token without user claims');
  }
  return {
    ...tokens,
    user: {
      userId: claims.id,
      email: claims.sub,
      displayName: typeof claims.displayName === 'string' ? claims.displayName : '',
    },
    expiresAt: typeof claims.exp === 'number' ? claims.exp * 1000 : undefined,
  };
}
