import { getClientError, getHttpStatus, identifyPlantFromImage } from '../../server/index';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return response.status(200).json(await identifyPlantFromImage(String(request.body?.image || '')));
  } catch (error) {
    console.error('identify-plant failed:', error);
    return response.status(getHttpStatus(error)).json({ error: getClientError(error) });
  }
}
