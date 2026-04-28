import type { CarePlan, Plant } from '../types';
import type { FollowUpResult } from './plants';
import {
  GenerateCarePlanInput,
  FollowUpAnalysisInput,
  getAiErrorMessage,
  normalizeCarePlan,
  normalizeFollowUpResult,
  normalizePlantIdentification,
} from './aiSchema';

async function postAiRequest<T>(path: string, body: unknown, normalize: (value: unknown) => T): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

export async function identifyPlantFromImage(image: string): Promise<Partial<Plant>> {
  return postAiRequest('/api/ai/identify-plant', { image }, normalizePlantIdentification);
}

export async function generateCarePlan(input: GenerateCarePlanInput): Promise<CarePlan> {
  return postAiRequest('/api/ai/care-plan', input, normalizeCarePlan);
}

export async function analyzeFollowUpImage(input: FollowUpAnalysisInput): Promise<FollowUpResult> {
  return postAiRequest('/api/ai/follow-up', input, normalizeFollowUpResult);
}
