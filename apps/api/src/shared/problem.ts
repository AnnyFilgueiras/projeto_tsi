/**
 * RFC 9457 Problem Details contracts and helpers matching docs/fase2/04-contratos/openapi.yaml.
 *
 * A13 / A05: Problem payloads must never include dietary restriction codes,
 * tokens, passwords, or encryption keys.
 */
export interface ProblemFieldError {
  readonly field: string;
  readonly message: string;
}

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly errors?: readonly ProblemFieldError[];
  readonly manualFlowAvailable?: boolean;
}

export class ProblemError extends Error {
  readonly problem: ProblemDetails;
  readonly headers?: Readonly<Record<string, string>>;

  constructor(problem: ProblemDetails, headers?: Readonly<Record<string, string>>) {
    super(problem.title);
    this.name = 'ProblemError';
    this.problem = problem;
    this.headers = headers;
  }
}

export function validationProblem(
  detail: string,
  errors?: readonly ProblemFieldError[],
): ProblemDetails {
  return {
    type: 'validation',
    title: 'Requisição inválida',
    status: 400,
    detail,
    ...(errors && errors.length > 0 ? { errors } : {}),
  };
}

export function unauthenticatedProblem(
  detail = 'Token de acesso ausente, inválido ou expirado.',
): ProblemDetails {
  return {
    type: 'unauthenticated',
    title: 'Não autenticado',
    status: 401,
    detail,
  };
}

export function invalidCredentialsProblem(detail = 'E-mail ou senha incorretos.'): ProblemDetails {
  return {
    type: 'invalid-credentials',
    title: 'Credenciais inválidas',
    status: 401,
    detail,
  };
}

export function invalidRefreshProblem(
  detail = 'Refresh token inválido, expirado ou revogado.',
): ProblemDetails {
  return {
    type: 'invalid-refresh',
    title: 'Sessão inválida',
    status: 401,
    detail,
  };
}

export function forbiddenRoleProblem(
  detail = 'Esta rota exige permissão de curador.',
): ProblemDetails {
  return {
    type: 'forbidden-role',
    title: 'Acesso negado',
    status: 403,
    detail,
  };
}

export function notFoundProblem(detail = 'Recurso não encontrado.'): ProblemDetails {
  return {
    type: 'not-found',
    title: 'Não encontrado',
    status: 404,
    detail,
  };
}

export function batchTooLargeProblem(maxItems: number): ProblemDetails {
  return {
    type: 'batch-too-large',
    title: 'Lote acima do limite permitido',
    status: 413,
    detail: `O lote aceita no máximo ${maxItems} operações por requisição.`,
  };
}

export function businessRuleProblem(detail: string): ProblemDetails {
  return {
    type: 'business-rule',
    title: 'Regra de negócio violada',
    status: 422,
    detail,
  };
}

export function keyReusedProblem(
  detail = 'O opId informado já foi processado com conteúdo diferente.',
): ProblemDetails {
  return {
    type: 'key-reused',
    title: 'Chave de idempotência reutilizada com conteúdo diferente',
    status: 422,
    detail,
  };
}

export function rateLimitExceededProblem(retryAfterSeconds: number): ProblemError {
  return new ProblemError(
    {
      type: 'rate-limit-exceeded',
      title: 'Limite de tentativas excedido',
      status: 429,
      detail: 'Aguarde antes de tentar novamente.',
    },
    { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))) },
  );
}
