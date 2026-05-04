import { reverseOpenMeteoLocation } from '../../server/index';

export default async function handler(request: any, response: any) {
  try {
    const latitude = Number(request.query.latitude);
    const longitude = Number(request.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return response.status(400).json({ error: 'Invalid coordinates.' });
    }
    return response.status(200).json({ result: await reverseOpenMeteoLocation(latitude, longitude) });
  } catch (error) {
    console.error('location reverse failed:', error);
    return response.status(200).json({ result: null });
  }
}
