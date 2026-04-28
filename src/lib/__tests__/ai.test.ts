import { describe, it, expect } from 'vitest';
import { normalizePlantIdentification, normalizeCarePlan } from '../aiSchema';

describe('AI Normalization logic', () => {
  describe('normalizePlantIdentification', () => {
    it('debería asignar fallbacks correctos a datos vacíos', () => {
      const result = normalizePlantIdentification({});
      expect(result.nombre_comun).toBe('Planta sin identificar');
      expect(result.nombre_cientifico).toBe('Especie no confirmada');
      expect(result.estado).toBe('saludable');
      expect(result.puntuacion_salud).toBe(75);
    });

    it('debería sanitizar strings y extraer datos válidos', () => {
      const raw = {
        nombre_comun: ' Ficus ',
        puntuacion_salud: '90',
        estado: 'en_riesgo',
      };
      const result = normalizePlantIdentification(raw);
      expect(result.nombre_comun).toBe('Ficus');
      expect(result.estado).toBe('en_riesgo');
      expect(result.puntuacion_salud).toBe(90);
    });
  });

  describe('normalizeCarePlan', () => {
    it('debería derivar reglas por defecto basadas en el arquetipo', () => {
      const raw = {
        arquetipo_cuidado: 'suculenta_cactus',
      };
      const result = normalizeCarePlan(raw);
      expect(result.regla_humedad_sustrato).toBe('secar_completo');
      expect(result.luz_categoria).toBe('media_alta');
      expect(result.humedad_objetivo).toBe('baja');
    });

    it('debería restringir frecuencias a límites seguros', () => {
      const raw = {
        riego_frecuencia_dias: 100, // Demasiado alto
        seguimiento_foto_dias: -5, // Invalido
      };
      const result = normalizeCarePlan(raw);
      expect(result.riego_frecuencia_dias).toBe(30); // max is 30
      expect(result.seguimiento_foto_dias).toBe(1); // min is 1
    });
  });
});
