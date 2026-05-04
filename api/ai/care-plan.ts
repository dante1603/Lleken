import { generateCarePlan, getClientError, getHttpStatus } from '../../server/index';
import type { GenerateCarePlanInput } from '../../src/lib/aiSchema';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return response.status(200).json(await generateCarePlan(request.body as GenerateCarePlanInput));
  } catch (error) {
    console.error('care-plan failed:', error);
    return response.status(getHttpStatus(error)).json({ error: getClientError(error) });
  }
}
