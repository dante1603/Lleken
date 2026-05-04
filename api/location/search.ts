import { searchOpenMeteoLocations } from '../../server/index';

export default async function handler(request: any, response: any) {
  try {
    const query = String(request.query.query || '').trim();
    const limit = Number(request.query.count || 6);
    if (query.length < 2) {
      return response.status(200).json({ results: [] });
    }
    return response.status(200).json({
      results: await searchOpenMeteoLocations(query, Number.isFinite(limit) ? limit : 6),
    });
  } catch (error) {
    console.error('location search failed:', error);
    return response.status(200).json({ results: [] });
  }
}
