export class AiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly safeMessage: string,
    options?: { cause?: unknown },
  ) {
    super(safeMessage, options);
    this.name = 'AiHttpError';
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isResourceExhausted(error: unknown) {
  const message = errorMessage(error);
  const status = error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  return status === 429
    || message.includes('RESOURCE_EXHAUSTED')
    || message.includes('"code":429')
    || message.includes('credits are depleted');
}

export function isTemporaryAiUnavailable(error: unknown) {
  const message = errorMessage(error);
  const status = error && typeof error === 'object' && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  const lower = message.toLowerCase();
  return status === 503
    || message.includes('"code":503')
    || lower.includes('unavailable')
    || lower.includes('high demand')
    || lower.includes('try again later');
}

export function toAiHttpError(error: unknown) {
  if (error instanceof AiHttpError) return error;
  if (isResourceExhausted(error)) {
    return new AiHttpError(429, 'AI_QUOTA_EXHAUSTED', 'El servicio de IA alcanzo temporalmente su limite.', { cause: error });
  }
  if (isTemporaryAiUnavailable(error)) {
    return new AiHttpError(503, 'AI_TEMPORARILY_UNAVAILABLE', 'El servicio de IA no esta disponible temporalmente.', { cause: error });
  }
  if (errorMessage(error).includes('Missing Gemini API key')) {
    return new AiHttpError(503, 'AI_NOT_CONFIGURED', 'El servicio de IA no esta configurado.', { cause: error });
  }
  return new AiHttpError(500, 'AI_REQUEST_FAILED', 'No pudimos completar la solicitud de IA.', { cause: error });
}
