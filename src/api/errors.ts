export type ApiErrorKind =
  /** The API answered with status "failure" (validation, not found, forbidden...). */
  | 'api'
  /** No connection / DNS / server down. */
  | 'network'
  | 'timeout'
  /** Access token rejected and refresh failed: the user must sign in again. */
  | 'unauthorized'
  /** Body missing or not the expected envelope. */
  | 'invalid-response';

/**
 * The only error the http-client throws (besides request cancellation).
 * Flutter equivalent: RemoteException -> RemoteFailure, without Either:
 * TanStack Query catches it and exposes it as `error` on the hook.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status code, when there was a response. */
  readonly httpStatus?: number;
  /** API error code from `data.code` (e.g. DIAGNOSIS_DAILY_LIMIT, AUTH_RATE_LIMIT). */
  readonly code?: string;

  constructor(
    message: string,
    options: { kind: ApiErrorKind; httpStatus?: number; code?: string },
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = options.kind;
    this.httpStatus = options.httpStatus;
    this.code = options.code;
  }
}

export const errorMessages = {
  network: 'Sem conexão com o servidor. Confira sua internet e tente de novo.',
  timeout: 'A resposta demorou demais. Confira sua internet e tente de novo.',
  sessionExpired: 'Sua sessão expirou. Entre novamente.',
  tooManyRequests: 'Muitas tentativas. Aguarde um instante.',
  apiFailure: 'Falha na API',
  generic: 'Não foi possível completar a ação. Tente de novo.',
} as const;
