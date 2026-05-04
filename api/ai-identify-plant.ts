import { GoogleGenAI } from '@google/genai';

function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing Gemini API key');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function imageDataUrlToInlineData(image: string) {
  const [metadata, data] = image.split(',');
  const mimeType = metadata?.split(';')[0]?.split(':')[1];
  if (!data || !mimeType) {
    throw new Error('Invalid image data URL');
  }
  return { inlineData: { data, mimeType } };
}

function parseJson(text?: string) {
  if (!text) throw new Error('No response from AI');
  return JSON.parse(text);
}

function clientError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Missing Gemini API key')) return 'Missing Gemini API key.';
  return message || 'AI request failed.';
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const image = String(request.body?.image || '');
    const prompt = `Analiza esta imagen de planta y responde solo JSON valido con: nombre_comun, nombre_cientifico, nombre_sugerido, familia, estado, puntuacion_salud, info_general y contexto_inferido. Si no puedes confirmar especie, usa "Especie no confirmada".`;
    const ai = getAiClient();
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt, imageDataUrlToInlineData(image)],
      config: { responseMimeType: 'application/json' },
    });
    return response.status(200).json(parseJson(aiResponse.text));
  } catch (error) {
    console.error('ai-identify-plant failed:', error);
    return response.status(500).json({ error: clientError(error) });
  }
}
