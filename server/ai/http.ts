import { aiCore } from './core';
import type { AiCore } from './core';
import { authenticateBearer } from './auth';
import type { AccessTokenVerifier } from './auth';
import { AiHttpError, toAiHttpError } from './errors';

export type AiOperation = 'identify' | 'carePlan' | 'followUp' | 'refresh';

interface HttpRequestLike {
  method?: string;
  headers: { authorization?: string | string[] };
  body?: unknown;
}

interface HttpResponseLike {
  setHeader(name: string, value: string): unknown;
  status(status: number): HttpResponseLike;
  json(body: unknown): unknown;
}

export interface AiHttpHandlerDependencies {
  core?: AiCore;
  verifyAccessToken?: AccessTokenVerifier;
}

async function runOperation(operation: AiOperation, core: AiCore, body: unknown) {
  if (operation === 'identify') {
    const image = body && typeof body === 'object' && 'image' in body
      ? (body as { image?: unknown }).image
      : undefined;
    return core.identifyPlantFromImage(image);
  }
  if (operation === 'carePlan') return core.generateCarePlan(body);
  if (operation === 'followUp') return core.analyzeFollowUpImage(body);
  return core.refreshPlantFromPhoto(body);
}

export function createAiHttpHandler(
  operation: AiOperation,
  dependencies: AiHttpHandlerDependencies = {},
) {
  const core = dependencies.core || aiCore;
  return async (request: HttpRequestLike, response: HttpResponseLike) => {
    if (request.method && request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return response.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
    }

    try {
      await authenticateBearer(request.headers.authorization, dependencies.verifyAccessToken);
      return response.status(200).json(await runOperation(operation, core, request.body));
    } catch (error) {
      const httpError = error instanceof AiHttpError ? error : toAiHttpError(error);
      console.error(`AI ${operation} request failed:`, error);
      return response.status(httpError.status).json({ error: httpError.safeMessage, code: httpError.code });
    }
  };
}
