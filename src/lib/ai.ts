import type { CarePlan } from '../types';
import { supabase } from './supabase';
import {
  GenerateCarePlanInput,
  FollowUpAnalysisInput,
  getAiErrorMessage,
  normalizeFollowUpResult,
  normalizePlantIdentification,
} from './aiSchema';
import { normalizeCarePlanWithProvenance } from '../domain/carePlanNormalization';
import type { FollowUpAssessment } from '../domain/assessment';
import type { IdentificationProposal } from '../domain/identification';

async function postAiRequest<T>(path: string, body: unknown, normalize: (value: unknown) => T): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) {
    throw new Error('Debes iniciar sesion para usar las funciones de IA.');
  }

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `AI request failed with status ${response.status}`);
  }

  return normalize(payload);
}

export { getAiErrorMessage };
export type { GenerateCarePlanInput, FollowUpAnalysisInput };

export async function identifyPlantFromImage(image: string): Promise<IdentificationProposal> {
  return postAiRequest('/api/ai/identify-plant', { image }, normalizePlantIdentification);
}

export async function generateCarePlan(input: GenerateCarePlanInput): Promise<CarePlan> {
  return postAiRequest('/api/ai/care-plan', input, normalizeCarePlanWithProvenance);
}

export async function analyzeFollowUpImage(input: FollowUpAnalysisInput): Promise<FollowUpAssessment> {
  return postAiRequest('/api/ai/follow-up', input, normalizeFollowUpResult);
}

export interface RefreshPlantFromPhotoInput extends GenerateCarePlanInput {
  image: string;
}

export interface RefreshPlantFromPhotoResult {
  plantData: IdentificationProposal;
  carePlan: CarePlan;
  updateFields: IdentificationProposal & { plan_cuidados?: CarePlan };
}

export async function refreshPlantFromPhoto(input: RefreshPlantFromPhotoInput): Promise<RefreshPlantFromPhotoResult> {
  return postAiRequest('/api/ai/refresh-plant-from-photo', input, (payload) => {
    const data = payload && typeof payload === 'object' ? payload as RefreshPlantFromPhotoResult : null;
    return {
      plantData: normalizePlantIdentification(data?.plantData),
      carePlan: normalizeCarePlanWithProvenance(data?.carePlan),
      updateFields: {
        ...data?.updateFields,
        ...normalizePlantIdentification(data?.updateFields),
        plan_cuidados: normalizeCarePlanWithProvenance(data?.updateFields?.plan_cuidados),
      },
    };
  });
}
