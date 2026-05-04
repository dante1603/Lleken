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

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const input = request.body || {};
    const prompt = `Analiza esta foto de seguimiento de una planta y responde solo JSON valido con estado, puntuacion_salud, descripcion_estado, observaciones, recomendacion_inmediata, sintomas_observados, causas_probables, preguntas_de_confirmacion, accion_segura_inmediata y riesgo.`;
    const ai = getAiClient();
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt, imageDataUrlToInlineData(String(input.image || ''))],
      config: { responseMimeType: 'application/json' },
    });
    return response.status(200).json(parseJson(aiResponse.text));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('ai-follow-up failed:', error);
    return response.status(500).json({ error: message || 'AI request failed.' });
  }
}
