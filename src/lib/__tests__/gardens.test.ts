import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensurePersonalGardenForUser, personalGardenIdForUser } from '../gardens';

const supabaseMock = vi.hoisted(() => {
  const calls: Array<{
    table: string;
    operation: string;
    payload?: unknown;
    options?: unknown;
    filters?: Array<[string, unknown]>;
  }> = [];
  const results = new Map<string, Array<unknown>>();

  function nextResult(key: string, fallback: unknown) {
    return results.get(key)?.shift() ?? fallback;
  }

  return {
    calls,
    results,
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => nextResult(`${table}.maybeSingle`, { data: null, error: null })),
        })),
      })),
      insert: vi.fn((payload: unknown) => {
        calls.push({ table, operation: 'insert', payload });
        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => nextResult(`${table}.insert`, { data: null, error: null })),
          })),
        };
      }),
      upsert: vi.fn(async (payload: unknown, options: unknown) => {
        calls.push({ table, operation: 'upsert', payload, options });
        return nextResult(`${table}.upsert`, { error: null });
      }),
      update: vi.fn((payload: unknown) => ({
        eq: vi.fn((column: string, value: unknown) => ({
          is: vi.fn(async (nullColumn: string, nullValue: unknown) => {
            calls.push({
              table,
              operation: 'update',
              payload,
              filters: [[column, value], [nullColumn, nullValue]],
            });
            return nextResult(`${table}.update`, { error: null });
          }),
        })),
      })),
    })),
    reset() {
      calls.length = 0;
      results.clear();
      this.from.mockClear();
    },
  };
});

vi.mock('../supabase', () => ({
  supabase: {
    from: supabaseMock.from,
  },
}));

describe('personal Garden provisioning', () => {
  beforeEach(() => {
    supabaseMock.reset();
  });

  it('uses the authenticated uid as the deterministic personal Garden id', () => {
    expect(personalGardenIdForUser('550e8400-e29b-41d4-a716-446655440000'))
      .toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('provisions the Garden, owner membership, and only null-garden legacy plants', async () => {
    supabaseMock.results.set('gardens.insert', [{
      data: { id: 'user-id', owner_id: 'user-id', name: 'Mi jardín' },
      error: null,
    }]);

    await expect(ensurePersonalGardenForUser('user-id')).resolves.toMatchObject({
      id: 'user-id',
      ownerId: 'user-id',
      name: 'Mi jardín',
    });

    expect(supabaseMock.calls).toEqual(expect.arrayContaining([
      expect.objectContaining({
        table: 'gardens',
        operation: 'insert',
        payload: { id: 'user-id', owner_id: 'user-id', name: 'Mi jardín' },
      }),
      expect.objectContaining({
        table: 'garden_members',
        operation: 'upsert',
        payload: { garden_id: 'user-id', user_id: 'user-id', role: 'owner' },
        options: { onConflict: 'garden_id,user_id' },
      }),
      expect.objectContaining({
        table: 'plants',
        operation: 'update',
        payload: { garden_id: 'user-id' },
        filters: [['owner_id', 'user-id'], ['garden_id', null]],
      }),
    ]));
  });

  it('keeps an existing Garden configuration and recovers a same-id insert race', async () => {
    supabaseMock.results.set('gardens.maybeSingle', [
      { data: null, error: null },
      { data: { id: 'user-id', owner_id: 'user-id', name: 'Terraza' }, error: null },
    ]);
    supabaseMock.results.set('gardens.insert', [{
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    }]);

    await expect(ensurePersonalGardenForUser('user-id')).resolves.toMatchObject({ name: 'Terraza' });

    expect(supabaseMock.calls.filter((call) => call.table === 'gardens' && call.operation === 'insert'))
      .toHaveLength(1);
    expect(supabaseMock.calls.some((call) => call.table === 'gardens' && call.operation === 'update'))
      .toBe(false);
  });
});
