import { GoogleGenAI } from '@google/genai';

function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing Gemini API key');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function parseJson(text?: string) {
  if (!text) throw new Error('No response from AI');
  return JSON.parse(text);
}

function fallbackCarePlan(input: any) {
  return {
    riego_frecuencia_dias: 7,
    instrucciones: 'Revisa la humedad del sustrato antes de regar. Si aun esta humedo, espera aunque toque por calendario.',
    alertas_clima: ['Plan conservador usado porque la IA no esta disponible.', input?.weatherSummary || 'Sin clima real disponible.'],
    riego_ajuste_clima: 'Reduce riego con frio, lluvia o baja luz; revisa antes con calor.',
    exposicion_sol: 'Luz indirecta brillante, evitando sol fuerte de tarde si la planta no esta aclimatada.',
    seguimiento_foto_dias: 10,
    tareas_adicionales: ['Revisar drenaje y peso de la maceta antes de regar'],
    arquetipo_cuidado: 'aroide_tropical',
    regla_humedad_sustrato: 'top_5cm_seco',
    luz_categoria: 'brillante_indirecta',
    humedad_objetivo: 'media',
    temp_min_segura_c: 10,
    temp_max_confort_c: 30,
    drenaje_requerido: true,
    fertilizacion_temporada: 'minima',
    toxicidad: { humanos: false, mascotas: false, irritante_piel: false },
    senales_alerta: ['Hojas amarillas', 'Marchitez persistente', 'Sustrato con mal olor o siempre mojado'],
  };
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const input = request.body || {};
    const ai = getAiClient();
    const prompt = `Genera un plan de cuidados JSON para ${input?.plantData?.nombre_comun || 'esta planta'} (${input?.plantData?.nombre_cientifico || 'especie no confirmada'}). Ciudad: ${input?.city || 'desconocida'}. Clima: ${input?.weatherSummary || 'sin clima'}. Devuelve riego_frecuencia_dias, instrucciones, alertas_clima, riego_ajuste_clima, exposicion_sol, seguimiento_foto_dias, tareas_adicionales, arquetipo_cuidado, regla_humedad_sustrato, luz_categoria, humedad_objetivo, temp_min_segura_c, temp_max_confort_c, drenaje_requerido, fertilizacion_temporada, toxicidad y senales_alerta.`;
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt],
      config: { responseMimeType: 'application/json' },
    });
    return response.status(200).json(parseJson(aiResponse.text));
  } catch (error) {
    console.error('ai-care-plan failed; using fallback:', error);
    return response.status(200).json(fallbackCarePlan(request.body));
  }
}
