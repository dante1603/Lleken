import type { CarePlan, Plant } from '../src/types';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const input = request.body || {};
  const plantData = input.plantData || {};
  const carePlan: CarePlan = plantData.plan_cuidados || {
    riego_frecuencia_dias: 7,
    instrucciones: 'Vista previa conservadora: revisa humedad del sustrato antes de regar.',
    alertas_clima: ['Refresh temporal en Vercel: usa seguimiento manual hasta estabilizar IA avanzada.'],
    riego_ajuste_clima: 'Ajusta con clima y luz real.',
    exposicion_sol: 'Luz indirecta brillante si no hay informacion mas precisa.',
    seguimiento_foto_dias: 10,
    tareas_adicionales: ['Registrar foto de seguimiento'],
  };
  const updateFields: Partial<Plant> = {
    ...plantData,
    plan_cuidados: carePlan,
  };

  return response.status(200).json({
    plantData,
    carePlan,
    updateFields,
  });
}
