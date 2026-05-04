import { summarizeGeminiUsage } from '../../server/index';

export default function handler(_request: any, response: any) {
  response.status(200).json(summarizeGeminiUsage());
}
