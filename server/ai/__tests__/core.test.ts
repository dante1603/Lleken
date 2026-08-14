import { describe, expect, it, vi } from 'vitest';
import { createAiCore } from '../core';
import type { AiGateway } from '../gemini';

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';

function gatewayWith(...responses: Array<unknown | Error>) {
  const generateContent = vi.fn<AiGateway['generateContent']>();
  for (const response of responses) {
    if (response instanceof Error) generateContent.mockRejectedValueOnce(response);
    else generateContent.mockResolvedValueOnce({ text: JSON.stringify(response) });
  }
  return { gateway: { generateContent } satisfies AiGateway, generateContent };
}

describe('shared AI core', () => {
  it('normalizes and enriches identification results', async () => {
    const { gateway, generateContent } = gatewayWith({
      nombre_comun: 'Monstera',
      nombre_cientifico: 'Monstera deliciosa',
      estado: 'saludable',
      puntuacion_salud: 91,
    });
    const result = await createAiCore(gateway).identifyPlantFromImage(PNG_DATA_URL);
    expect(result.nombre_cientifico).toBe('Monstera deliciosa');
    expect(result.knowledge_source?.source).toBe('static_catalog');
    expect(result.species_key).toBeTruthy();
    expect(result.info_general?.descripcion).toBeTruthy();
    const prompt = String(generateContent.mock.calls[0][0].contents[0]);
    expect(prompt).toContain('"nombre_sugerido"');
    expect(prompt).toContain('maceta_con_drenaje: true o false');
    expect(prompt).toContain('Si algun dato no se puede determinar');
    expect(prompt).toContain('"necesita_atencion" o "en_riesgo"');
  });

  it('uses the conservative fallback without claiming unknown toxicity is false', async () => {
    const unavailable = Object.assign(new Error('service unavailable'), { status: 503 });
    const { gateway, generateContent } = gatewayWith(unavailable);
    const result = await createAiCore(gateway).generateCarePlan({
      plantData: { nombre_comun: 'Planta desconocida', nombre_cientifico: 'Species incognita' },
      city: 'Santiago',
      weatherSummary: 'Templado',
    });
    expect(generateContent).toHaveBeenCalledOnce();
    expect(result.instrucciones).toContain('Plan local conservador');
    expect(result.toxicidad?.humanos).toBeUndefined();
    expect(result.toxicidad?.mascotas).toBeUndefined();
    expect(result.arquetipo_cuidado).toBeUndefined();
    const prompt = String(generateContent.mock.calls[0][0].contents[0]);
    expect(prompt).toContain('El JSON debe seguir esta estructura exacta');
    expect(prompt).toContain('Datos estructurados de clima');
    expect(prompt).toContain('Sin contexto de maceta/luz');
    expect(prompt).toContain('Chile o hemisferio sur');
    expect(prompt).toContain('frio seca mas lento');
  });

  it('preserves a confirmed static-catalog archetype', async () => {
    const { gateway, generateContent } = gatewayWith();
    const result = await createAiCore(gateway).generateCarePlan({
      plantData: { nombre_comun: 'Monstera', nombre_cientifico: 'Monstera deliciosa' },
      city: 'Santiago',
      weatherSummary: 'Templado',
    });
    expect(generateContent).not.toHaveBeenCalled();
    expect(result.arquetipo_cuidado).toBe('aroide_tropical');
    expect(result.toxicidad?.mascotas).toBe(true);
  });

  it('includes plant identity and care context in follow-up analysis', async () => {
    const { gateway, generateContent } = gatewayWith({
      estado: 'necesita_atencion',
      riesgo: 'medio',
      observaciones: 'Hojas amarillas',
    });
    await createAiCore(gateway).analyzeFollowUpImage({
      image: PNG_DATA_URL,
      plant: {
        id: 'plant-1',
        fecha_creacion: 1,
        nombre_comun: 'Monstera',
        nombre_cientifico: 'Monstera deliciosa',
        contexto: { ubicacion_tipo: 'interior', maceta_con_drenaje: true },
        plan_cuidados: { regla_humedad_sustrato: 'top_5cm_seco' },
      },
    });
    const prompt = String(generateContent.mock.calls[0][0].contents[0]);
    expect(prompt).toContain('Monstera deliciosa');
    expect(prompt).toContain('"descripcion_estado"');
    expect(prompt).toContain('"accion_segura_inmediata"');
    expect(prompt).toContain('maceta_con_drenaje');
    expect(prompt).toContain('top_5cm_seco');
  });

  it('consumes the refresh image and recomposes identification plus care plan', async () => {
    const { gateway, generateContent } = gatewayWith(
      { nombre_comun: 'Planta lunar', nombre_cientifico: 'Species incognita', estado: 'saludable' },
      { riego_frecuencia_dias: 9, instrucciones: 'Revisar antes de regar.' },
    );
    const result = await createAiCore(gateway).refreshPlantFromPhoto({
      image: PNG_DATA_URL,
      plantData: { nombre_comun: 'Identidad anterior' },
      city: 'Valparaiso',
      weatherSummary: 'Costa templada',
    });
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(generateContent.mock.calls[0][0].contents[1]).toMatchObject({ inlineData: { mimeType: 'image/png' } });
    expect(String(generateContent.mock.calls[1][0].contents[0])).toContain('Planta lunar');
    expect(result.updateFields.nombre_comun).toBe('Planta lunar');
    expect(result.updateFields.plan_cuidados?.riego_frecuencia_dias).toBe(9);
  });
});
