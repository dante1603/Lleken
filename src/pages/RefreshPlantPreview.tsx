import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DataOperationType, handleDataError } from '../lib/dataErrors';
import { refreshPlantFromPhoto, type RefreshPlantFromPhotoResult } from '../lib/ai';
import { compressImageBlob } from '../lib/images';
import { canCareForPlant, listenToPlant } from '../lib/plants';
import { cn } from '../lib/utils';
import { getWeatherForPlant } from '../lib/weather';
import type { Plant, PlantContext, WeatherConditions } from '../types';
import { homeNavigation, readNavigation, toPlantNavigation, withNavigation } from '../lib/navigation';

function buildContextSummary(context?: PlantContext) {
  if (!context) return undefined;

  return [
    `Ubicacion de cultivo: ${context.ubicacion_tipo || 'sin dato'}`,
    `Maceta con drenaje: ${context.maceta_con_drenaje === true ? 'si' : context.maceta_con_drenaje === false ? 'no' : 'sin dato'}`,
    `Tamano de maceta: ${context.tamano_maceta || 'sin dato'}`,
    `Luz habitual indicada: ${context.luz_usuario || 'sin dato'}`,
  ].join('\n');
}

function buildWeatherSummary(weather?: WeatherConditions) {
  if (!weather) {
    return 'No hay clima guardado. Genera un plan conservador y pide revisar humedad manualmente.';
  }

  return [
    weather.temp_actual !== undefined ? `Temperatura actual: ${weather.temp_actual}C` : null,
    weather.temp_min !== undefined ? `Minima: ${weather.temp_min}C` : null,
    weather.temp_max !== undefined ? `Maxima: ${weather.temp_max}C` : null,
    weather.humedad_relativa !== undefined ? `Humedad relativa: ${weather.humedad_relativa}%` : null,
    weather.lluvia !== undefined ? `Lluvia estimada: ${weather.lluvia} mm` : null,
  ].filter(Boolean).join('\n') || 'Clima incompleto. Ajusta el plan de forma conservadora.';
}

function valueOrDash(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? 'Sin dato' : String(value);
}

async function imageUrlToCompressedDataUrl(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la foto guardada (${response.status}).`);
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('La foto guardada no tiene un formato de imagen valido.');
  }

  return compressImageBlob(blob);
}

export default function RefreshPlantPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const navigation = readNavigation(location.state) || homeNavigation();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [result, setResult] = useState<RefreshPlantFromPhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weatherSummary, setWeatherSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    return listenToPlant(id, (plantData) => {
      if (plantData && canCareForPlant(plantData, user?.uid)) {
        setPlant(plantData);
      } else {
        navigate('/home');
      }
    }, (listenError) => {
      handleDataError(listenError, DataOperationType.GET, `plants/${id}`);
    });
  }, [id, navigate, user?.uid]);

  const comparisonRows = useMemo(() => {
    if (!plant || !result) return [];
    const next = result.updateFields;

    return [
      { label: 'Nombre comun', before: plant.nombre_comun, after: next.nombre_comun },
      { label: 'Nombre cientifico', before: plant.nombre_cientifico, after: next.nombre_cientifico },
      { label: 'Familia', before: plant.familia, after: next.familia },
      { label: 'Assessment visual', before: undefined, after: next.estado },
      { label: 'Puntaje visual', before: undefined, after: next.puntuacion_salud },
      { label: 'Riego', before: plant.plan_cuidados?.riego_frecuencia_dias, after: next.plan_cuidados?.riego_frecuencia_dias },
      { label: 'Luz', before: plant.plan_cuidados?.exposicion_sol, after: next.plan_cuidados?.exposicion_sol },
      { label: 'Regla humedad', before: plant.plan_cuidados?.regla_humedad_sustrato, after: next.plan_cuidados?.regla_humedad_sustrato },
      { label: 'Fuente', before: plant.knowledge_source?.source, after: next.knowledge_source?.source },
    ];
  }, [plant, result]);

  const handleRefreshPreview = async () => {
    if (!plant) return;

    setError(null);
    setIsRefreshing(true);
    try {
      if (!plant.fotoUrl) {
        throw new Error('La planta no tiene una foto guardada para analizar.');
      }

      const image = await imageUrlToCompressedDataUrl(plant.fotoUrl);
      const weather = await getWeatherForPlant(
        plant.ciudad || '',
        plant.lat !== undefined && plant.lon !== undefined ? { lat: plant.lat, lon: plant.lon } : null,
      );
      const summary = weather?.summary || buildWeatherSummary(plant.clima_actual);
      setWeatherSummary(summary);
      const preview = await refreshPlantFromPhoto({
        image,
        city: weather?.city || plant.ciudad || '',
        weatherSummary: summary,
        weather: weather?.weather || plant.clima_actual,
        contextSummary: buildContextSummary(plant.contexto),
        plantData: {
          nombre_comun: plant.nombre_comun,
          nombre_cientifico: plant.nombre_cientifico,
          familia: plant.familia,
        },
      });
      setResult(preview);
    } catch (refreshError) {
      console.error('Refresh preview failed:', refreshError);
      setError(refreshError instanceof Error ? refreshError.message : 'No se pudo generar la vista previa.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!plant) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-[#f6f8f5] text-gray-600">Cargando...</div>;
  }

  const displayName = plant.nombrePersonalizado || plant.nombre_comun || 'Planta';
  const canPreview = Boolean(plant.fotoUrl);
  const navigateBackToPlant = () => {
    if (id) navigate(`/planta/${id}`, { state: withNavigation({}, toPlantNavigation(navigation)) });
    else navigate('/home');
  };

  return (
    <div className="min-h-[100dvh] bg-[#f6f8f5] pb-12 font-sans text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <button
            onClick={navigateBackToPlant}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold uppercase tracking-wide text-gray-400">Vista previa</p>
            <h1 className="truncate text-[18px] font-bold">{displayName}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-5 pt-5">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {plant.fotoUrl ? (
            <img src={plant.fotoUrl} alt={displayName} className="h-48 w-full object-cover" />
          ) : (
            <div className="flex h-48 items-center justify-center bg-gray-100 text-gray-400">
              <span className="material-symbols-outlined text-[48px]">image_not_supported</span>
            </div>
          )}
          <div className="p-4">
            <h2 className="text-[16px] font-semibold">Reprocesar desde foto</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              Genera nuevos datos con clima actual sin guardar cambios todavia.
            </p>
            <button
              onClick={handleRefreshPreview}
              disabled={!canPreview || isRefreshing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2e5c3a] px-4 py-3 text-[14px] font-semibold text-white active:scale-[0.99] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">{isRefreshing ? 'hourglass_empty' : 'auto_awesome'}</span>
              {isRefreshing ? 'Generando vista previa...' : 'Generar vista previa'}
            </button>
            {!canPreview && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-800">
                Esta planta no tiene foto guardada para reprocesar.
              </p>
            )}
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-100 bg-red-50 p-4 text-[13px] leading-relaxed text-red-700">
            {error}
          </section>
        )}

        {result && (
          <>
            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                  <span className="material-symbols-outlined">fact_check</span>
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold">Resultado nuevo</h2>
                  <p className="mt-1 text-[13px] text-gray-600">
                    {valueOrDash(result.updateFields.nombre_comun)} · {valueOrDash(result.updateFields.nombre_cientifico)}
                  </p>
                  <p className="mt-1 text-[12px] text-gray-500">
                    Fuente: {valueOrDash(result.updateFields.knowledge_source?.source)}
                  </p>
                </div>
              </div>
              {weatherSummary && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-[#edf3ef] p-3 text-[12px] leading-relaxed text-[#245333]">
                  {weatherSummary}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="text-[16px] font-semibold">Comparacion</h2>
              <div className="mt-3 space-y-2">
                {comparisonRows.map((row) => {
                  const changed = valueOrDash(row.before) !== valueOrDash(row.after);
                  return (
                    <article key={row.label} className="rounded-xl border border-gray-100 bg-[#fafafa] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold text-gray-900">{row.label}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', changed ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700')}>
                          {changed ? 'Cambia' : 'Igual'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                        <div className="rounded-lg bg-white p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Actual</p>
                          <p className="mt-1 break-words text-gray-700">{valueOrDash(row.before)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Nuevo</p>
                          <p className="mt-1 break-words text-gray-900">{valueOrDash(row.after)}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="text-[16px] font-semibold">Plan propuesto</h2>
              <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-gray-700">
                <p><span className="font-semibold text-gray-900">Riego:</span> cada {result.carePlan.riego_frecuencia_dias || 7} dias.</p>
                <p><span className="font-semibold text-gray-900">Luz:</span> {result.carePlan.exposicion_sol || 'Sin dato'}</p>
                <p><span className="font-semibold text-gray-900">Instrucciones:</span> {result.carePlan.instrucciones || 'Sin dato'}</p>
                {result.carePlan.senales_alerta && result.carePlan.senales_alerta.length > 0 && (
                  <p><span className="font-semibold text-gray-900">Senales:</span> {result.carePlan.senales_alerta.slice(0, 3).join(' · ')}</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-100 bg-[#fff8eb] p-4 text-[13px] leading-relaxed text-amber-900">
              Esta vista previa no guarda cambios. El boton para aplicar la actualizacion lo agregamos cuando estemos conformes con los resultados.
            </section>
          </>
        )}
      </main>
    </div>
  );
}
