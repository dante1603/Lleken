import { describe, expect, it } from 'vitest';
import { acceptedIdentificationFromProposal } from '../identification';

describe('acceptedIdentificationFromProposal', () => {
  it('does not turn a proposal without identity into a confirmation', () => {
    expect(acceptedIdentificationFromProposal({ provenance: 'ai_inferred' })).toBeNull();
  });

  it('marks a human acceptance with user_confirmed without changing the proposal itself', () => {
    const proposal = {
      nombre_comun: 'Albahaca',
      nombre_cientifico: 'Ocimum basilicum',
      species_key: 'ocimum-basilicum',
      provenance: 'ai_inferred' as const,
    };

    expect(acceptedIdentificationFromProposal(proposal)).toEqual({
      nombre_comun: 'Albahaca',
      nombre_cientifico: 'Ocimum basilicum',
      species_key: 'ocimum-basilicum',
      familia: undefined,
      provenance: 'user_confirmed',
    });
    expect(proposal.provenance).toBe('ai_inferred');
  });
});
