import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock('../supabase', () => ({ supabase: { auth: { getSession } } }));

import { identifyPlantFromImage } from '../ai';

describe('AI client authentication', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getSession.mockReset();
  });

  it('fails explicitly without a valid session and does not fetch', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(identifyPlantFromImage('image')).rejects.toThrow('Debes iniciar sesion');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('adds the Supabase access token at the single request boundary', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'token-123' } }, error: null });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      nombre_comun: 'Monstera',
      nombre_cientifico: 'Monstera deliciosa',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await identifyPlantFromImage('image');
    expect(fetchSpy).toHaveBeenCalledWith('/api/ai/identify-plant', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
    }));
  });
});
