// Test helpers (not a test suite: Jest runs every file under __tests__/).
/** Builds an unsigned JWT for tests (the app never verifies signatures). */
export function fakeJwt(claims: Record<string, unknown>): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
}

export const userClaims = {
  id: 42,
  sub: 'joao@fazenda.com',
  displayName: 'João Ávila',
  exp: 1_900_000_000,
};

export const testTokens = (n = 1, claims: Record<string, unknown> = userClaims) => ({
  accessToken: fakeJwt({ ...claims, n }),
  refreshToken: `refresh-${n}`,
});
