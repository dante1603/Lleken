import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { humidityText, lightText, soilRuleText } from '../lib/plantFormatters';
import {
  getResolvedSpeciesKnowledge,
  type ResolvedSpeciesKnowledge,
} from '../lib/speciesCatalog';
import { cn } from '../lib/utils';
import { readNavigation, toPlantNavigation, withNavigation, type FlowNavigation } from '../lib/navigation';

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1628156107386-815e982167d4?q=80&w=900&auto=format&fit=crop';

function problemTone(index: number) {
  if (index === 0) return 'bg-amber-50 text-amber-600';
  if (index === 1) return 'bg-orange-50 text-orange-700';
  return 'bg-green-50 text-green-700';
}

function problemIcon(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('amarill')) return 'eco';
  if (normalized.includes('borde') || normalized.includes('punta')) return 'spa';
  if (normalized.includes('crecimiento')) return 'psychiatry';
  return 'search_check';
}

function careTone(title: string) {
  if (title === 'Riego') return 'border-blue-100 bg-blue-50/70';
  if (title === 'Luz') return 'border-amber-100 bg-amber-50/70';
  if (title === 'Humedad') return 'border-cyan-100 bg-cyan-50/70';
  return 'border-green-100 bg-green-50/70';
}

function sourceLabel(source: ResolvedSpeciesKnowledge['source']) {
  if (source === 'reviewed') return 'Ficha revisada';
  if (source === 'static_catalog') return 'Catálogo curado';
  return 'IA pendiente de revisión';
}

function careNotice(careBasis: ResolvedSpeciesKnowledge['careBasis']) {
  if (careBasis === 'care_archetype') {
    return 'Esta especie aún no tiene una ficha botánica de cuidados revisada. Estas referencias vienen de un grupo de cuidado y deben ajustarse al estado real de la planta.';
  }
  if (careBasis === 'ai_species') return 'Cuidados generados por IA, pendientes de revisión.';
  return null;
}

function temperatureReference(min?: number, max?: number) {
  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);

  if (hasMin && hasMax) {
    return { value: `${min}–${max} °C`, detail: 'Rango de referencia de esta ficha.' };
  }
  if (hasMin) {
    return { value: `Sobre ${min} °C`, detail: 'Evita exposiciones prolongadas bajo esta referencia.' };
  }
  if (hasMax) {
    return { value: `Hasta ${max} °C`, detail: 'Referencia superior de confort de esta ficha.' };
  }
  return { value: 'Por confirmar', detail: 'Sin rango de temperatura específico.' };
}

function fertilizationReference(season: ResolvedSpeciesKnowledge['care']['fertilizacion_temporada']) {
  if (season === 'crecimiento_activo') return 'Durante crecimiento activo';
  if (season === 'minima') return 'Fertilización mínima';
  if (season === 'no_recomendada') return 'No recomendada';
  return 'Por confirmar';
}

function confidenceLabel(confidence: ResolvedSpeciesKnowledge['confidence']) {
  if (confidence === 'alta') return 'Alta';
  if (confidence === 'media') return 'Media';
  return 'Baja';
}

export default function SpeciesEncyclopedia() {
  const { speciesKey } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const plantId = searchParams.get('planta');
  const locationState = location.state as { plantPhotoUrl?: string; plantName?: string; navigation?: FlowNavigation } | null;
  const navigation = readNavigation(location.state);
  const heroImage = locationState?.plantPhotoUrl || HERO_FALLBACK;
  const navigateBack = () => {
    if (plantId && navigation) {
      navigate(`/planta/${plantId}`, { state: withNavigation({}, toPlantNavigation(navigation)) });
    } else {
      navigate('/home');
    }
  };
  const [entry, setEntry] = useState<ResolvedSpeciesKnowledge | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [speciesKey]);

  useEffect(() => {
    let cancelled = false;

    setEntry(null);
    if (!speciesKey) {
      setIsLoadingEntry(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingEntry(true);
    void getResolvedSpeciesKnowledge(speciesKey)
      .then((resolvedEntry) => {
        if (!cancelled) setEntry(resolvedEntry);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingEntry(false);
      });

    return () => {
      cancelled = true;
    };
  }, [speciesKey]);

  if (isLoadingEntry) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f8f5] px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-[#08752d]">
          <span className="material-symbols-outlined text-[38px]">eco</span>
        </div>
        <h1 className="mt-5 text-[28px] font-bold text-[#064822]">Buscando ficha de especie</h1>
        <p className="mt-2 max-w-[340px] text-gray-600">Revisando las especies registradas por la comunidad.</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f6f8f5] px-6 text-center">
        <h1 className="text-[28px] font-bold text-[#064822]">Especie no encontrada</h1>
        <p className="mt-2 max-w-[340px] text-gray-600">Todavía no hay una ficha de especie disponible.</p>
        <button onClick={navigateBack} className="mt-6 rounded-full bg-[#08752d] px-5 py-3 font-bold text-white">
          Volver
        </button>
      </div>
    );
  }

  const care = entry.care;
  const info = entry.info;
  const hasReviewReference = Number.isFinite(care.riego_frecuencia_dias) && (care.riego_frecuencia_dias || 0) > 0;
  const hasSoilRule = Boolean(care.regla_humedad_sustrato);
  const signals = care.senales_alerta || [];
  const notice = careNotice(entry.careBasis);
  const temperature = temperatureReference(care.temp_min_segura_c, care.temp_max_confort_c);
  const hasAdditionalTasks = (care.tareas_adicionales?.length ?? 0) > 0;
  const hasClimateAlerts = (care.alertas_clima?.length ?? 0) > 0;
  const practicalGuidance = Boolean(care.instrucciones || hasAdditionalTasks || care.riego_ajuste_clima || hasClimateAlerts);
  const precautions = care.toxicidad
    ? [
        care.toxicidad.humanos === true ? 'Puede ser tóxica para personas.' : care.toxicidad.humanos === false ? 'No está marcada como tóxica para personas en esta ficha.' : null,
        care.toxicidad.mascotas === true ? 'Puede ser tóxica para mascotas.' : care.toxicidad.mascotas === false ? 'No está marcada como tóxica para mascotas en esta ficha.' : null,
        care.toxicidad.irritante_piel === true ? 'Puede irritar la piel o contener savia irritante.' : care.toxicidad.irritante_piel === false ? 'No está marcada como irritante para la piel en esta ficha.' : null,
      ].filter((message): message is string => Boolean(message))
    : [];
  const careItems = [
    {
      title: 'Riego',
      icon: 'water_drop',
      color: 'text-blue-600',
      value: hasReviewReference
        ? `Referencia de revisión: cada ${care.riego_frecuencia_dias} días`
        : hasSoilRule
          ? 'Revisar según sustrato'
          : 'Por confirmar',
      detail: hasSoilRule
        ? soilRuleText(care.regla_humedad_sustrato)
        : hasReviewReference
          ? 'Confirma la humedad real del sustrato antes de regar.'
          : 'No hay una referencia específica revisada para esta especie.',
    },
    {
      title: 'Luz',
      icon: 'light_mode',
      color: 'text-amber-500',
      value: care.luz_categoria || care.exposicion_sol ? lightText(care.luz_categoria, care.exposicion_sol) : 'Por confirmar',
      detail: care.exposicion_sol || 'Sin orientación específica confirmada.',
    },
    {
      title: 'Humedad',
      icon: 'humidity_mid',
      color: 'text-blue-600',
      value: care.humedad_objetivo ? humidityText(care.humedad_objetivo) : 'Por confirmar',
      detail: care.humedad_objetivo ? 'Ajusta según clima local y ventilación.' : 'Sin orientación específica confirmada.',
    },
    {
      title: 'Sustrato',
      icon: 'landscape',
      color: 'text-amber-700',
      value: care.drenaje_requerido === true ? 'Drenaje requerido' : care.drenaje_requerido === false ? 'No marcado como requisito' : 'Por confirmar',
      detail: care.drenaje_requerido === true
        ? 'La ficha indica que el exceso de agua debe poder evacuar.'
        : care.drenaje_requerido === false
          ? 'La ficha no marca el drenaje como requisito específico.'
          : 'Sin orientación específica de drenaje.',
    },
    {
      title: 'Temperatura',
      icon: 'device_thermostat',
      color: 'text-rose-600',
      value: temperature.value,
      detail: temperature.detail,
    },
    {
      title: 'Fertilización',
      icon: 'science',
      color: 'text-green-700',
      value: fertilizationReference(care.fertilizacion_temporada),
      detail: 'Frecuencia y dosis dependen del cultivo y producto.',
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f6f8f5] pb-8 font-sans text-gray-900">
      <header className="relative overflow-hidden bg-[#15231a] text-white">
        <img src={heroImage} alt={entry.scientificName} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#122418]/92 via-[#122418]/48 to-black/5" />
        <div className="relative z-10 flex flex-col px-5 pb-9 pt-5">
          <div>
            <button onClick={navigateBack} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0f4b2b]/80 text-white shadow-lg backdrop-blur-md active:scale-95">
              <span className="material-symbols-outlined text-[34px]">arrow_back</span>
            </button>
          </div>
          <div className="mt-10 px-1">
            <h1 className="max-w-[760px] break-words text-[34px] font-bold leading-tight tracking-tight [overflow-wrap:anywhere] min-[420px]:text-[40px] min-[640px]:text-[48px]">{entry.scientificName}</h1>
            <p className="mt-2 text-[24px] font-semibold text-white/90">Guía de especie</p>
            <p className="mt-5 max-w-[560px] text-[20px] leading-relaxed text-white/90">Información general para conocer y cuidar mejor esta especie.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {[
                { label: entry.commonNames[0] || 'Nombre común por confirmar', icon: 'eco' },
                { label: sourceLabel(entry.source), icon: 'verified' },
                { label: `Familia: ${entry.family || 'Por confirmar'}`, icon: 'family_restroom' },
              ].map((chip) => (
                <span key={chip.label} className="inline-flex min-w-0 max-w-full items-center gap-3 rounded-full border border-white/45 bg-white/90 px-5 py-3 text-[18px] font-semibold text-[#163426]">
                  <span className="material-symbols-outlined shrink-0 text-[#08752d]">{chip.icon}</span>
                  <span className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">{chip.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="-mt-4 rounded-t-[24px] bg-[#f6f8f5] px-5 pt-5">
        <section className="rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-[26px] font-bold text-[#064822]">Descripción general</h2>
          <div className="mt-5 flex flex-col gap-5 min-[420px]:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#08752d]">
              <span className="material-symbols-outlined text-[54px]">eco</span>
            </div>
            <p className="min-w-0 break-words text-[19px] leading-relaxed text-gray-700 [overflow-wrap:anywhere]">{info.descripcion || 'Descripción por confirmar.'}</p>
          </div>
        </section>

        {notice && (
          <section className="mt-5 rounded-[22px] border border-amber-100 bg-amber-50 p-5 text-amber-950 shadow-sm">
            <h2 className="text-[19px] font-bold">{entry.careBasis === 'care_archetype' ? 'Guía general de cuidado' : 'Cuidados pendientes de revisión'}</h2>
            <p className="mt-2 text-[15px] leading-relaxed">{notice}</p>
          </section>
        )}

        <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-[26px] font-bold text-[#064822]">Cuidados ideales</h2>
          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3">
            {careItems.map((item) => (
              <article key={item.title} className={cn('min-w-0 rounded-[16px] border p-3.5 text-left', careTone(item.title))}>
                <div className="flex items-start gap-3">
                  <span className={cn('material-symbols-outlined mt-0.5 text-[28px]', item.color)}>{item.icon}</span>
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold leading-tight text-gray-900">{item.title}</h3>
                    <p className="mt-1 whitespace-normal break-words text-[14px] font-semibold leading-snug text-gray-700 [overflow-wrap:anywhere]">{item.value}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-snug text-gray-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {info.condiciones_ideales && (
          <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-[24px] font-bold text-[#064822]">Condiciones ideales</h2>
            <p className="mt-4 min-w-0 break-words text-[17px] leading-relaxed text-gray-700 [overflow-wrap:anywhere]">{info.condiciones_ideales}</p>
          </section>
        )}

        {practicalGuidance && (
          <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-[24px] font-bold text-[#064822]">Guía práctica</h2>
            <div className="mt-4 space-y-5">
              {care.instrucciones && (
                <div>
                  <h3 className="text-[18px] font-bold text-gray-900">Cómo manejar el riego</h3>
                  <p className="mt-2 min-w-0 break-words text-[16px] leading-relaxed text-gray-700 [overflow-wrap:anywhere]">{care.instrucciones}</p>
                </div>
              )}
              {hasAdditionalTasks && (
                <div>
                  <h3 className="text-[18px] font-bold text-gray-900">Tareas útiles</h3>
                  <ul className="mt-2 space-y-2">
                    {care.tareas_adicionales.map((task) => (
                      <li key={task} className="flex min-w-0 gap-3 text-[16px] leading-relaxed text-gray-700">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#08752d]" />
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(care.riego_ajuste_clima || hasClimateAlerts) && (
                <div>
                  <h3 className="text-[18px] font-bold text-gray-900">Cómo ajustar según el clima</h3>
                  {care.riego_ajuste_clima && <p className="mt-2 min-w-0 break-words text-[16px] leading-relaxed text-gray-700 [overflow-wrap:anywhere]">{care.riego_ajuste_clima}</p>}
                  {hasClimateAlerts && (
                    <ul className="mt-3 space-y-2">
                      {care.alertas_clima.map((alert) => (
                        <li key={alert} className="flex min-w-0 gap-3 text-[15px] leading-relaxed text-gray-700">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{alert}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-[26px] font-bold text-[#064822]">{entry.careBasis === 'care_archetype' ? 'Señales generales a vigilar' : 'Señales a vigilar'}</h2>
          {signals.length ? (
            <div className="mt-4 overflow-hidden rounded-[16px] border border-gray-200">
              {signals.slice(0, 4).map((signal, index) => (
                <details key={signal} className="group border-b border-gray-200 bg-white p-4 last:border-b-0">
                  <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3">
                    <span className="flex min-w-0 flex-1 items-center gap-4">
                      <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full', problemTone(index))}>
                        <span className="material-symbols-outlined">{problemIcon(signal)}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words text-[18px] font-bold text-gray-900 [overflow-wrap:anywhere]">{signal}</span>
                        <span className="block break-words text-[15px] font-medium text-gray-500 [overflow-wrap:anywhere]">Observa cuándo aparece y si coincide con cambios de riego, luz, temperatura o presencia de plagas.</span>
                      </span>
                    </span>
                    <span className="material-symbols-outlined shrink-0 text-[#08752d] transition group-open:rotate-180">expand_more</span>
                  </summary>
                </details>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[16px] leading-relaxed text-gray-600">Aún no hay señales específicas revisadas para esta especie.</p>
          )}
        </section>

        {precautions.length > 0 && (
          <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-[24px] font-bold text-[#064822]">Precauciones</h2>
            <ul className="mt-4 space-y-3">
              {precautions.map((precaution) => (
                <li key={precaution} className="flex min-w-0 gap-3 text-[16px] leading-relaxed text-gray-700">
                  <span className="material-symbols-outlined shrink-0 text-amber-600">warning</span>
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">{precaution}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-[24px] font-bold text-[#064822]">Curiosidades</h2>
          {info.curiosidades?.length ? (
            <div className="mt-4 grid grid-cols-1 gap-5 min-[620px]:grid-cols-[1fr_auto]">
              <ul className="space-y-3">
                {info.curiosidades.map((curiosity) => (
                  <li key={curiosity} className="flex gap-3 text-[17px] leading-relaxed text-gray-700">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#08752d]" />
                    <span>{curiosity}</span>
                  </li>
                ))}
              </ul>
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-50 text-[#08752d]">
                <span className="material-symbols-outlined text-[64px]">local_florist</span>
              </div>
            </div>
          ) : <p className="mt-4 text-[16px] text-gray-600">Por confirmar.</p>}
        </section>

        <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-[24px] font-bold text-[#064822]">Ficha técnica</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-[16px] min-[520px]:grid-cols-2">
            <p><span className="font-bold text-gray-900">Familia:</span> {entry.family || 'Por confirmar'}</p>
            <p><span className="font-bold text-gray-900">Nombre común:</span> {entry.commonNames.length ? entry.commonNames.join(', ') : 'Por confirmar'}</p>
            <p><span className="font-bold text-gray-900">Origen aproximado:</span> {info.origen || 'Por confirmar'}</p>
            <p><span className="font-bold text-gray-900">Usos:</span> {info.usos_comunes?.length ? info.usos_comunes.join(', ') : 'Por confirmar'}</p>
            <p><span className="font-bold text-gray-900">Fuente:</span> {sourceLabel(entry.source)}</p>
            <p><span className="font-bold text-gray-900">Confianza:</span> {confidenceLabel(entry.confidence)}</p>
          </div>
        </section>

        {plantId && (
          <button onClick={navigateBack} className="mt-5 flex w-full items-center justify-center gap-3 rounded-[18px] bg-[#08752d] px-5 py-5 text-[22px] font-bold text-white shadow-sm">
            <span className="material-symbols-outlined text-[32px]">eco</span>
            Volver a planta
          </button>
        )}
      </main>
    </div>
  );
}
