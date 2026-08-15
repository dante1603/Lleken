import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { findPlantKnowledgeByKey, findPlantKnowledgeByName } from '../lib/plantKnowledge';
import type { PlantKnowledgeEntry } from '../lib/plantKnowledge';
import { humidityText, lightText, soilRuleText } from '../lib/plantFormatters';
import { getSpeciesCatalogEntry } from '../lib/speciesCatalog';
import { cn } from '../lib/utils';

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

function problemDetail(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('amarill')) return 'Puede responder a exceso/falta de riego, poca luz o nutrientes bajos.';
  if (normalized.includes('borde') || normalized.includes('punta')) return 'Suele aparecer con baja humedad ambiental, sol fuerte o corrientes de aire.';
  if (normalized.includes('crecimiento')) return 'Revisa luz, nutrientes, poda y espacio de raices.';
  return 'Observa si aparece junto a cambios de riego, luz, temperatura o plagas.';
}

function careTone(title: string) {
  if (title === 'Riego') return 'border-blue-100 bg-blue-50/70';
  if (title === 'Luz') return 'border-amber-100 bg-amber-50/70';
  if (title === 'Humedad') return 'border-cyan-100 bg-cyan-50/70';
  return 'border-green-100 bg-green-50/70';
}

export default function SpeciesEncyclopedia() {
  const { speciesKey } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const plantId = searchParams.get('planta');
  const locationState = location.state as { plantPhotoUrl?: string; plantName?: string } | null;
  const heroImage = locationState?.plantPhotoUrl || HERO_FALLBACK;
  const staticEntry = findPlantKnowledgeByKey(speciesKey) || findPlantKnowledgeByName(speciesKey)?.entry;
  const [catalogEntry, setCatalogEntry] = useState<PlantKnowledgeEntry | null>(null);
  const [isLoadingCatalogEntry, setIsLoadingCatalogEntry] = useState(false);
  const entry = staticEntry || catalogEntry;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [speciesKey]);

  useEffect(() => {
    let cancelled = false;

    setCatalogEntry(null);
    if (staticEntry || !speciesKey) {
      setIsLoadingCatalogEntry(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingCatalogEntry(true);
    void getSpeciesCatalogEntry(speciesKey, plantId)
      .then((entryFromCatalog) => {
        if (!cancelled) setCatalogEntry(entryFromCatalog);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCatalogEntry(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plantId, speciesKey, staticEntry]);

  if (isLoadingCatalogEntry) {
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
        <p className="mt-2 max-w-[340px] text-gray-600">Todavia no hay una ficha en el catalogo ni plantas registradas para esta especie.</p>
        <button onClick={() => navigate(plantId ? `/planta/${plantId}` : '/home')} className="mt-6 rounded-full bg-[#08752d] px-5 py-3 font-bold text-white">
          Volver
        </button>
      </div>
    );
  }

  const care = entry.care;
  const info = entry.info;
  const careItems = [
    {
      title: 'Riego',
      icon: 'water_drop',
      color: 'text-blue-600',
      value: `Cada ${care.riego_frecuencia_dias} dias`,
      detail: soilRuleText(care.regla_humedad_sustrato),
    },
    {
      title: 'Luz',
      icon: 'light_mode',
      color: 'text-amber-500',
      value: lightText(care.luz_categoria, care.exposicion_sol),
      detail: care.exposicion_sol,
    },
    {
      title: 'Humedad',
      icon: 'humidity_mid',
      color: 'text-blue-600',
      value: humidityText(care.humedad_objetivo),
      detail: 'Ajusta segun clima local y ventilacion.',
    },
    {
      title: 'Sustrato',
      icon: 'landscape',
      color: 'text-amber-700',
      value: care.drenaje_requerido ? 'Buen drenaje' : 'Drenaje moderado',
      detail: info.condiciones_ideales,
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f6f8f5] pb-8 font-sans text-gray-900">
      <header className="relative overflow-hidden bg-[#15231a] text-white">
        <img src={heroImage} alt={entry.scientificName} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#122418]/92 via-[#122418]/48 to-black/5" />
        <div className="relative z-10 flex flex-col px-5 pt-5 pb-9">
          <div>
            <button onClick={() => navigate(plantId ? `/planta/${plantId}` : '/home')} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0f4b2b]/80 text-white shadow-lg backdrop-blur-md active:scale-95">
              <span className="material-symbols-outlined text-[34px]">arrow_back</span>
            </button>
          </div>
          <div className="mt-10 px-1">
            <h1 className="max-w-[760px] text-[48px] font-bold leading-tight tracking-tight">{entry.scientificName}</h1>
            <p className="mt-2 text-[24px] font-semibold text-white/90">Guia de especie</p>
            <p className="mt-5 max-w-[560px] text-[20px] leading-relaxed text-white/90">Informacion general para conocer y cuidar mejor esta especie.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {[
                { label: entry.commonNames[0] || 'Aromatica', icon: 'eco' },
                { label: 'Interior / exterior', icon: 'home' },
                { label: care.arquetipo_cuidado === 'comestible_aromatica' ? 'Aromatica' : 'Guia general', icon: 'psychiatry' },
              ].map((chip) => (
                <span key={chip.label} className="inline-flex shrink-0 items-center gap-3 rounded-full border border-white/45 bg-white/90 px-5 py-3 text-[18px] font-semibold text-[#163426]">
                  <span className="material-symbols-outlined text-[#08752d]">{chip.icon}</span>
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="-mt-4 rounded-t-[24px] bg-[#f6f8f5] px-5 pt-5">
        <section className="rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-[26px] font-bold text-[#064822]">Descripcion general</h2>
          <div className="mt-5 flex gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#08752d]">
              <span className="material-symbols-outlined text-[54px]">eco</span>
            </div>
            <p className="text-[19px] leading-relaxed text-gray-700">{info.descripcion}</p>
          </div>
        </section>

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

        <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-[26px] font-bold text-[#064822]">Problemas comunes</h2>
          <div className="mt-4 overflow-hidden rounded-[16px] border border-gray-200">
            {care.senales_alerta.slice(0, 4).map((signal, index) => (
              <details key={signal} className="group border-b border-gray-200 bg-white p-4 last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="flex items-center gap-4">
                    <span className={cn('flex h-14 w-14 items-center justify-center rounded-full', problemTone(index))}>
                      <span className="material-symbols-outlined">{problemIcon(signal)}</span>
                    </span>
                    <span>
                      <span className="block text-[18px] font-bold text-gray-900">{signal}</span>
                      <span className="block text-[15px] font-medium text-gray-500">{problemDetail(signal)}</span>
                    </span>
                  </span>
                  <span className="material-symbols-outlined text-[#08752d] transition group-open:rotate-180">expand_more</span>
                </summary>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-[24px] font-bold text-[#064822]">Curiosidades</h2>
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
        </section>

        <section className="mt-5 rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-[24px] font-bold text-[#064822]">Ficha tecnica</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 text-[16px] min-[520px]:grid-cols-2">
            <p><span className="font-bold text-gray-900">Familia:</span> {entry.family}</p>
            <p><span className="font-bold text-gray-900">Nombre comun:</span> {entry.commonNames.join(', ')}</p>
            <p><span className="font-bold text-gray-900">Origen aproximado:</span> {info.origen}</p>
            <p><span className="font-bold text-gray-900">Usos:</span> {info.usos_comunes.join(', ')}</p>
          </div>
        </section>

        {plantId && (
          <button onClick={() => navigate(`/planta/${plantId}`)} className="mt-5 flex w-full items-center justify-center gap-3 rounded-[18px] bg-[#08752d] px-5 py-5 text-[22px] font-bold text-white shadow-sm">
            <span className="material-symbols-outlined text-[32px]">eco</span>
            Volver a planta
          </button>
        )}
      </main>
    </div>
  );
}
