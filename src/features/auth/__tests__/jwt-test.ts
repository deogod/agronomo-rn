import { decodeJwtPayload, sessionFromTokens } from '../jwt';
import { fakeJwt, testTokens, userClaims } from '@/test/tokens';

describe('decodeJwtPayload', () => {
  it('decodes UTF-8 claims (accents) from base64url', () => {
    expect(decodeJwtPayload(fakeJwt({ displayName: 'João Ávila – ç' }))).toEqual({
      displayName: 'João Ávila – ç',
    });
  });

  it('rejects something that is not a JWT', () => {
    expect(() => decodeJwtPayload('not-a-jwt')).toThrow();
    expect(() => decodeJwtPayload('a.b$c.d')).toThrow();
  });
});

describe('sessionFromTokens', () => {
  it('maps the claims like the Flutter AuthenticatedModel', () => {
    const tokens = testTokens();

    expect(sessionFromTokens(tokens)).toEqual({
      ...tokens,
      user: { userId: 42, email: 'joao@fazenda.com', displayName: 'João Ávila' },
      expiresAt: userClaims.exp * 1000,
    });
  });

  it('fails without the user claims', () => {
    expect(() => sessionFromTokens(testTokens(1, { sub: 'x@y.z' }))).toThrow(
      'Token without user claims',
    );
  });
});
