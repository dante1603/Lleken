import { describe, expect, it, vi } from 'vitest';
import { createAiCore } from '../core';
import type { AiCore } from '../core';
import { createAiHttpHandler } from '../http';

function responseDouble() {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    setHeader: vi.fn(),
    status(status: number) { response.statusCode = status; return response; },
    json(payload: unknown) { response.payload = payload; return response; },
  };
  return response;
}

function coreDouble(): AiCore {
  return {
    identifyPlantFromImage: vi.fn().mockResolvedValue({ nombre_comun: 'Test' }),
    generateCarePlan: vi.fn().mockResolvedValue({}),
    analyzeFollowUpImage: vi.fn().mockResolvedValue({}),
    refreshPlantFromPhoto: vi.fn().mockResolvedValue({}),
  };
}

describe('shared AI HTTP boundary', () => {
  it('returns 401 for a missing bearer before executing the core', async () => {
    const core = coreDouble();
    const response = responseDouble();
    await createAiHttpHandler('identify', { core })({ method: 'POST', headers: {}, body: {} }, response);
    expect(response.statusCode).toBe(401);
    expect(response.payload).toMatchObject({ code: 'MISSING_BEARER' });
    expect(core.identifyPlantFromImage).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid bearer before executing the core', async () => {
    const core = coreDouble();
    const response = responseDouble();
    await createAiHttpHandler('identify', { core, verifyAccessToken: vi.fn().mockResolvedValue(null) })(
      { method: 'POST', headers: { authorization: 'Bearer invalid' }, body: {} }, response,
    );
    expect(response.statusCode).toBe(401);
    expect(response.payload).toMatchObject({ code: 'INVALID_BEARER' });
    expect(core.identifyPlantFromImage).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid payload without calling Gemini', async () => {
    const gateway = { generateContent: vi.fn() };
    const response = responseDouble();
    await createAiHttpHandler('identify', {
      core: createAiCore(gateway),
      verifyAccessToken: vi.fn().mockResolvedValue({ id: 'user-1' }),
    })({ method: 'POST', headers: { authorization: 'Bearer valid' }, body: { image: 'not-an-image' } }, response);
    expect(response.statusCode).toBe(400);
    expect(response.payload).toMatchObject({ code: 'INVALID_IMAGE' });
    expect(gateway.generateContent).not.toHaveBeenCalled();
  });

  it('executes the shared core for an authenticated valid request', async () => {
    const core = coreDouble();
    const response = responseDouble();
    await createAiHttpHandler('carePlan', {
      core,
      verifyAccessToken: vi.fn().mockResolvedValue({ id: 'user-1' }),
    })({ method: 'POST', headers: { authorization: 'Bearer valid' }, body: { plantData: {} } }, response);
    expect(response.statusCode).toBe(200);
    expect(core.generateCarePlan).toHaveBeenCalledWith({ plantData: {} });
  });
});
