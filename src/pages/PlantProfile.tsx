import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlantData } from '../contexts/PlantDataContext';
import { generateCarePlan } from '../lib/ai';
import { DataOperationType, handleDataError } from '../lib/dataErrors';
import {
  appendPlantAction,
  canCareForPlant,
  deletePlant,
  isPlantOwner,
  updatePlantFields,
} from '../lib/plants';
import { cn } from '../lib/utils';
import { getWeatherForPlant } from '../lib/weather';
import type { LightCategory, Plant, PlantContext, SoilMoistureRule, TargetHumidity } from '../types';

import {
  actionIcon,
  buildContextSummary,
  contextText,
  dateAgo,
  humidityText,
  knowledgeSourceText,
  lightText,
  nextWateringText,
  riskClass,
  soilRuleText,
} from '../lib/plantFormatters';

export default function PlantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCachedPlant, refreshPlant, removeCachedPlant } = usePlantData();
  const [plant, setPlant] = useState<Plant | null>(() => getCachedPlant(id));
  const [showAbout, setShowAbout] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false);
  const [weatherUpdateError, setWeatherUpdateError] = useState<string | null>(null);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const cachedPlant = getCachedPlant(id);
    if (cachedPlant && canCareForPlant(cachedPlant, user?.uid)) {
      setPlant(cachedPlant);
    }

    let cancelled = false;
    void refreshPlant(id).then((plantData) => {
      if (cancelled) return;
      if (plantData && canCareForPlant(plantData, user?.uid)) {
        setPlant(plantData);
      } else {
        navigate('/home');
      }
    }).catch((error) => {
      handleDataError(error, DataOperationType.GET, `plants/${id}`);
    });

    return () => {
      cancelled = true;
    };
  }, [getCachedPlant, id, navigate, refreshPlant, user?.uid]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deletePlant(id);
      removeCachedPlant(id);
      navigate('/home');
    } catch (error) {
      handleDataError(error, DataOperationType.DELETE, `plants/${id}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleWater = async () => {
    if (!id || !plant) return;
    setIsWatering(true);
    try {
      const now = Date.now();
      await appendPlantAction(plant, {
        tipo: 'riego',
        fecha: now,
        descripcion: 'Riego registrado',
      }, { fecha_ultimo_riego: now });
      const refreshed = await refreshPlant(id);
      if (refreshed) setPlant(refreshed);
    } catch (error) {
      handleDataError(error, DataOperationType.UPDATE, `plants/${id}`);
    } finally {
      setIsWatering(false);
    }
  };

  const handleQuickAction = async (tipo: string, descripcion: string) => {
    if (!id || !plant) return;
    setUpdatingAction(tipo);
    try {
      await appendPlantAction(plant, {
        tipo,
        fecha: Date.now(),
        descripcion,
      });
      const refreshed = await refreshPlant(id);
      if (refreshed) setPlant(refreshed);
    } catch (error) {
      handleDataError(error, DataOperationType.UPDATE, `plants/${id}`);
    } finally {
      setUpdatingAction(null);
    }
  };

  const handleUpdateWeather = async () => {
    if (!id || !plant) return;
    setIsUpdatingWeather(true);
    setWeatherUpdateError(null);

    try {
      const weather = await getWeatherForPlant(
        plant.ciudad || '',
        plant.lat !== undefined && plant.lon !== undefined ? { lat: plant.lat, lon: plant.lon } : null,
      );

      if (!weather) {
        setWeatherUpdateError('No pudimos obtener clima para esta ubicación. Revisa ciudad o geolocalización.');
        return;
      }

      const carePlan = await generateCarePlan({
        plantData: plant,
        city: weather.city,
        weatherSummary: weather.summary,
        weather: weather.weather,
        contextSummary: buildContextSummary(plant.contexto),
      });
      const now = Date.now();

      await updatePlantFields(id, {
        ciudad: weather.city,
        lat: weather.lat,
        lon: weather.lon,
        clima_actual: weather.weather,
        plan_cuidados: carePlan,
        historial_acciones: [
          {
            tipo: 'nota',
            fecha: now,
            descripcion: 'Clima y plan de cuidados actualizados',
          },
          ...(plant.historial_acciones || []),
        ].slice(0, 10),
      });
      const refreshed = await refreshPlant(id);
      if (refreshed) setPlant(refreshed);
    } catch (error) {
      console.error('Weather update failed:', error);
      setWeatherUpdateError('No pudimos actualizar el clima y el plan. Intenta de nuevo en unos minutos.');
    } finally {
      setIsUpdatingWeather(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !plant || !noteText.trim()) return;
    setIsAddingNote(true);
    try {
      await appendPlantAction(plant, {
        tipo: 'nota',
        fecha: Date.now(),
        descripcion: noteText.trim(),
      });
      const refreshed = await refreshPlant(id);
      if (refreshed) setPlant(refreshed);
      setNoteText('');
      setShowNoteModal(false);
    } catch (error) {
      handleDataError(error, DataOperationType.UPDATE, `plants/${id}`);
    } finally {
      setIsAddingNote(false);
    }
  };

  if (!plant) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-[#f6f8f5] text-gray-600">Cargando...</div>;
  }

  const displayName = plant.nombrePersonalizado || plant.nombre_comun || 'Planta';
  const isHealthy = !plant.estado || plant.estado === 'saludable';
  const frequency = plant.plan_cuidados?.riego_frecuencia_dias || 5;
  const lastWatered = plant.fecha_ultimo_riego || plant.fecha_creacion;
  const daysSinceWatered = Math.max(0, Math.floor((Date.now() - lastWatered) / (1000 * 60 * 60 * 24)));
  const nextWateringDays = frequency - daysSinceWatered;
  const waterDue = nextWateringDays <= 0;
  const substrateRule = soilRuleText(plant.plan_cuidados?.regla_humedad_sustrato);
  const locationContext = contextText(plant);
  const sourceText = knowledgeSourceText(plant);
  const latestFollowUp = plant.historial_acciones?.find((action) => action.seguimiento)?.seguimiento;
  const history = plant.historial_acciones || [];
  const tempText = [
    plant.clima_actual?.temp_actual !== undefined ? `${plant.clima_actual.temp_actual}C ahora` : null,
    plant.clima_actual?.humedad_relativa !== undefined ? `${plant.clima_actual.humedad_relativa}% humedad` : null,
  ].filter(Boolean).join(' · ');
  const drainageText = plant.contexto?.maceta_con_drenaje === false
    ? 'Sin drenaje: riego muy medido'
    : plant.plan_cuidados?.drenaje_requerido === false
      ? 'Drenaje no confirmado'
      : 'Drenaje recomendado';
  const weatherAlert = [
    plant.clima_actual?.temp_min !== undefined && plant.clima_actual.temp_min <= 10
      ? 'Hace frio: el sustrato seca mas lento. Reduce riego y evita corrientes.'
      : null,
    plant.clima_actual?.temp_max !== undefined && plant.clima_actual.temp_max >= 30
      ? 'Calor alto: revisa humedad antes de lo habitual, sin encharcar.'
      : null,
    plant.clima_actual?.lluvia !== undefined && plant.clima_actual.lluvia > 5
      ? 'Lluvia relevante: si esta fuera, revisa drenaje antes de regar.'
      : null,
    plant.contexto?.maceta_con_drenaje === false
      ? 'Maceta sin drenaje: confirma humedad y agua acumulada antes de regar.'
      : null,
    plant.plan_cuidados?.alertas_clima?.[0] || null,
  ].find(Boolean);
  const careCards = [
    { title: 'Riego', value: `Cada ${frequency} días`, detail: substrateRule, icon: 'water_drop', color: 'text-blue-600' },
    { title: 'Luz', value: lightText(plant.plan_cuidados?.luz_categoria, plant.plan_cuidados?.exposicion_sol), detail: plant.contexto?.luz_usuario ? `Usuario: ${plant.contexto.luz_usuario}` : 'Ubicación no confirmada', icon: 'light_mode', color: 'text-amber-500' },
    { title: 'Humedad', value: humidityText(plant.plan_cuidados?.humedad_objetivo), detail: tempText || 'Sin clima actualizado', icon: 'humidity_mid', color: 'text-cyan-600' },
    { title: 'Drenaje', value: drainageText, detail: plant.contexto?.tamano_maceta ? `Maceta ${plant.contexto.tamano_maceta}` : 'No indicado', icon: 'line_weight', color: 'text-green-700' },
  ];
  const topSignals = plant.plan_cuidados?.senales_alerta?.slice(0, 3) || [];

  return (
    <div className="min-h-[100dvh] bg-[#f6f8f5] pb-24 font-sans text-gray-900">
      <header className="relative min-h-[330px] bg-[#17221b] text-white">
        <img
          src={plant.fotoUrl || 'https://images.unsplash.com/photo-1628156107386-815e982167d4?q=80&w=900&auto=format&fit=crop'}
          alt={displayName}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-[#17221b]" />

        <div className="relative z-10 flex items-center justify-between px-5 pt-5">
          <button onClick={() => navigate('/home')} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md active:scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          {isPlantOwner(plant, user?.uid) && (
            <button onClick={() => setShowDeleteModal(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md active:scale-95">
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-6">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-white/70">{plant.familia || 'Ficha de cuidado'}</p>
              <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight">{displayName}</h1>
              <p className="mt-1 text-sm italic text-white/75">{plant.nombre_cientifico || 'Sin identificar'}</p>
            </div>
            <button
              onClick={() => document.getElementById('historial-reciente')?.scrollIntoView({ behavior: 'smooth' })}
              className={cn(
                'shrink-0 rounded-full px-3 py-2 text-[11px] font-semibold active:scale-95',
                isHealthy ? 'bg-white text-[#245333]' : 'bg-orange-500 text-white',
              )}
            >
              {isHealthy ? 'Sano' : 'Atención'}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-white/60">location_on</span>
              {plant.ciudad || 'Ubicación desconocida'}
            </span>
            {locationContext && (
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-white/60">potted_plant</span>
                {locationContext}
              </span>
            )}
            {sourceText && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2 py-1 text-white/90">
                <span className="material-symbols-outlined text-[15px] text-white/70">verified</span>
                {sourceText}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-5">
        <section className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Próximo riego', value: nextWateringText(nextWateringDays), icon: 'water_drop', color: waterDue ? 'text-red-600' : 'text-blue-600' },
            { label: 'Último riego', value: daysSinceWatered === 0 ? 'Hoy' : `${daysSinceWatered}d`, icon: 'history', color: 'text-green-700' },
            { label: 'Salud', value: `${plant.puntuacion_salud ?? 75}%`, icon: isHealthy ? 'favorite' : 'warning', color: isHealthy ? 'text-green-700' : 'text-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="min-h-[88px] rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <span className={cn('material-symbols-outlined text-[20px]', stat.color)}>{stat.icon}</span>
              <p className="mt-2 text-[18px] font-semibold leading-tight">{stat.value}</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">{stat.label}</p>
            </div>
          ))}
        </section>

        {weatherAlert && (
          <section className="rounded-2xl border border-amber-100 bg-[#fff8eb] p-4 shadow-sm">
            <div className="flex gap-3">
              <span className="material-symbols-outlined mt-0.5 text-amber-500">warning</span>
              <div>
                <h2 className="text-[14px] font-semibold text-gray-900">Atención contextual</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-700">{weatherAlert}</p>
              </div>
            </div>
          </section>
        )}

        {isPlantOwner(plant, user?.uid) && plant.fotoUrl && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold">Herramientas internas</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                  Recalcular datos desde la foto sin guardar cambios.
                </p>
              </div>
              <button
                onClick={() => navigate(`/planta/${plant.id}/actualizar-desde-foto`)}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-[#edf3ef] px-3 py-2 text-[12px] font-semibold text-[#245333] active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Vista previa
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold">Clima aplicado</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                {tempText || 'Sin clima guardado'}{plant.clima_actual?.lluvia !== undefined ? ` - lluvia ${plant.clima_actual.lluvia} mm` : ''}
              </p>
            </div>
            <button
              onClick={handleUpdateWeather}
              disabled={isUpdatingWeather || (!plant.ciudad && (plant.lat === undefined || plant.lon === undefined))}
              className="shrink-0 rounded-xl bg-[#edf3ef] px-3 py-2 text-[12px] font-semibold text-[#245333] active:scale-[0.99] disabled:opacity-50"
            >
              {isUpdatingWeather ? 'Actualizando...' : 'Actualizar clima'}
            </button>
          </div>
          {weatherUpdateError && (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-[12px] leading-relaxed text-red-700">
              {weatherUpdateError}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold">Panel de hoy</h2>
              <p className="mt-0.5 text-[12px] text-gray-500">{substrateRule}</p>
            </div>
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', waterDue ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700')}>
              {waterDue ? 'Revisar ahora' : 'Estable'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleWater}
              disabled={isWatering}
              className="rounded-xl bg-[#2e5c3a] px-3 py-3 text-left text-white active:scale-[0.99] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[21px]">{isWatering ? 'hourglass_empty' : 'water_drop'}</span>
              <p className="mt-1 text-[13px] font-semibold">{isWatering ? 'Guardando' : 'Registrar riego'}</p>
            </button>
            <button
              onClick={() => navigate(`/planta/${plant.id}/seguimiento`)}
              className="rounded-xl bg-[#edf3ef] px-3 py-3 text-left text-[#245333] active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[21px]">photo_camera</span>
              <p className="mt-1 text-[13px] font-semibold">Seguimiento</p>
            </button>
            <button
              onClick={() => handleQuickAction('revision_humedad', 'Revision de humedad registrada')}
              disabled={updatingAction === 'revision_humedad'}
              className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-left text-gray-800 active:scale-[0.99] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[21px] text-cyan-700">humidity_percentage</span>
              <p className="mt-1 text-[13px] font-semibold">Humedad</p>
            </button>
            <button
              onClick={() => handleQuickAction('revision_plagas', 'Revision de plagas registrada')}
              disabled={updatingAction === 'revision_plagas'}
              className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-left text-gray-800 active:scale-[0.99] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[21px] text-amber-700">pest_control</span>
              <p className="mt-1 text-[13px] font-semibold">Plagas</p>
            </button>
          </div>

          <button
            onClick={() => setShowNoteModal(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-3 text-[13px] font-semibold text-gray-700 active:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">edit_document</span>
            Agregar nota
          </button>
        </section>

        {latestFollowUp && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-semibold">Último análisis</h2>
              {latestFollowUp.riesgo && (
                <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', riskClass(latestFollowUp.riesgo))}>
                  Riesgo {latestFollowUp.riesgo}
                </span>
              )}
            </div>
            {latestFollowUp.descripcion_estado && <p className="text-[13px] leading-relaxed text-gray-700">{latestFollowUp.descripcion_estado}</p>}
            {latestFollowUp.causas_probables && latestFollowUp.causas_probables.length > 0 && (
              <p className="mt-2 text-[12px] leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-900">Causas probables:</span> {latestFollowUp.causas_probables.slice(0, 3).join(', ')}
              </p>
            )}
            {(latestFollowUp.accion_segura_inmediata || latestFollowUp.recomendacion_inmediata) && (
              <p className="mt-2 rounded-xl bg-green-50 p-3 text-[12px] leading-relaxed text-green-800">
                {latestFollowUp.accion_segura_inmediata || latestFollowUp.recomendacion_inmediata}
              </p>
            )}
          </section>
        )}

        {plant.plan_cuidados && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-[16px] font-semibold">Plan de cuidado</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {careCards.map((card) => (
                <div key={card.title} className="min-h-[132px] rounded-xl border border-gray-100 bg-[#fafafa] p-3">
                  <span className={cn('material-symbols-outlined text-[22px]', card.color)}>{card.icon}</span>
                  <h3 className="mt-2 text-[13px] font-semibold">{card.title}</h3>
                  <p className="mt-1 text-[12px] font-medium text-gray-800">{card.value}</p>
                  <p className="mt-1 text-[11px] leading-snug text-gray-500">{card.detail}</p>
                </div>
              ))}
            </div>
            {topSignals.length > 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Senales a vigilar</p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-700">{topSignals.join(' · ')}</p>
              </div>
            )}
          </section>
        )}

        <section id="historial-reciente" className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm scroll-mt-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">Historial</h2>
            <span className="text-[12px] text-gray-400">{history.length} registros</span>
          </div>
          <div className="space-y-3">
            {history.length > 0 ? history.slice(0, 6).map((action, index) => {
              const followUp = action.seguimiento;
              return (
                <article key={`${action.fecha}-${index}`} className="flex gap-3 rounded-xl border border-gray-100 bg-[#fafafa] p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#2e5c3a]">
                    <span className="material-symbols-outlined text-[19px]">{actionIcon(action.tipo)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-gray-900">
                      <span className="font-semibold">{dateAgo(action.fecha)}</span> · {action.tipo === 'riego' ? 'Riego registrado' : action.descripcion || 'Accion'}
                    </p>
                    {followUp && (
                      <div className="mt-2 space-y-1.5">
                        {followUp.sintomas_observados && followUp.sintomas_observados.length > 0 && (
                          <p className="text-[11px] leading-snug text-gray-600"><span className="font-semibold text-gray-800">Sintomas:</span> {followUp.sintomas_observados.slice(0, 3).join(', ')}</p>
                        )}
                        {followUp.preguntas_de_confirmacion && followUp.preguntas_de_confirmacion.length > 0 && (
                          <p className="text-[11px] leading-snug text-gray-600"><span className="font-semibold text-gray-800">Confirmar:</span> {followUp.preguntas_de_confirmacion.slice(0, 2).join(' · ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            }) : (
              <p className="rounded-xl bg-gray-50 p-4 text-center text-[13px] text-gray-500">Aun no hay acciones registradas.</p>
            )}
          </div>
        </section>

        {plant.info_general?.descripcion && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <button onClick={() => setShowAbout(!showAbout)} className="flex w-full items-start justify-between gap-3 text-left">
              <div>
                <h2 className="text-[16px] font-semibold">Sobre esta planta</h2>
                <p className={cn('mt-2 text-[13px] leading-relaxed text-gray-600', !showAbout && 'line-clamp-3')}>
                  {plant.info_general.descripcion}
                </p>
              </div>
              <span className={cn('material-symbols-outlined text-gray-400 transition-transform', showAbout && 'rotate-180')}>expand_more</span>
            </button>
          </section>
        )}
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-500">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="text-[20px] font-bold text-gray-900">Eliminar planta</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Estas seguro de que quieres eliminar <strong>{displayName}</strong>? Esta accion no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-sm sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#2e5c3a]">
                <span className="material-symbols-outlined">edit_document</span>
                <h3 className="text-[18px] font-bold text-gray-900">Agregar nota</h3>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="p-1 text-gray-400">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Como esta tu planta hoy?"
              className="mt-4 min-h-[120px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:ring-2 focus:ring-[#a3c7af]"
              autoFocus
            />
            <button
              onClick={handleAddNote}
              disabled={isAddingNote || !noteText.trim()}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#2e5c3a] px-5 py-3 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              {isAddingNote ? 'Guardando...' : 'Guardar nota'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
