import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlantData } from '../contexts/PlantDataContext';
import { DataOperationType, handleDataError } from '../lib/dataErrors';
import {
  appendPlantAction,
  canCareForPlant,
  deletePlant,
  getCareReviewStatus,
  isPlantOwner,
  saveEnvironmentSnapshot,
  saveMoistureReview,
  updatePlantFields,
} from '../lib/plants';
import type { SavedMoistureReview } from '../lib/plants';
import { cn } from '../lib/utils';
import { getWeatherForPlant } from '../lib/weather';
import type { Plant, SoilMoistureRule } from '../types';
import {
  actionIcon,
  actionLabel,
  dateAgo,
  humidityText,
  lightText,
  soilRuleText,
  wateringRule,
} from '../lib/plantFormatters';
import type { CareReviewStatus } from '../domain/care';
import { isWeatherUsable } from '../domain/care';

type PlantTab = 'today' | 'care' | 'history' | 'settings';
type HistoryFilter = 'todo' | 'riego' | 'foto' | 'nota' | 'salud' | 'plagas';

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1628156107386-815e982167d4?q=80&w=900&auto=format&fit=crop';

const tabs: { id: PlantTab; label: string; icon: string }[] = [
  { id: 'today', label: 'Hoy', icon: 'home' },
  { id: 'care', label: 'Cuidados', icon: 'eco' },
  { id: 'history', label: 'Historial', icon: 'history' },
  { id: 'settings', label: 'Ajustes', icon: 'settings' },
];

const historyFilters: { id: HistoryFilter; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'riego', label: 'Riegos' },
  { id: 'foto', label: 'Fotos' },
  { id: 'nota', label: 'Notas' },
  { id: 'salud', label: 'Salud' },
  { id: 'plagas', label: 'Plagas' },
];

function healthLabel(plant: Plant) {
  if (plant.estado === 'en_riesgo') return 'En riesgo';
  if (plant.estado === 'necesita_atencion') return 'Atencion';
  if (plant.estado === 'saludable') return 'Sana';
  return 'Sin evaluar';
}

function speciesKey(plant: Plant) {
  return plant.species_key || (plant.nombre_cientifico || plant.nombre_comun || 'especie')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function locationLabel(plant: Plant) {
  const location = plant.contexto?.ubicacion_tipo;
  if (location === 'interior') return 'Interior';
  if (location === 'balcon') return 'Balcon';
  if (location === 'exterior') return 'Exterior';
  return 'Sin dato';
}

function potLabel(plant: Plant) {
  const pot = plant.contexto?.tamano_maceta;
  if (pot === 'pequena') return 'Maceta pequena';
  if (pot === 'grande') return 'Maceta grande';
  if (pot === 'mediana') return 'Maceta mediana';
  return 'Sin dato';
}

function nextReviewText(review: CareReviewStatus) {
  if (review.reviewPending) return 'Revisar hoy';
  if (review.daysUntilReview === 1) return 'Mañana';
  if (review.daysUntilReview !== undefined) return `En ${review.daysUntilReview} días`;
  return 'Sin dato';
}

function moistureCheckPrompt(rule?: SoilMoistureRule) {
  if (rule === 'top_2cm_seco') return 'Revisa los 2 cm superiores del sustrato.';
  if (rule === 'top_5cm_seco') return 'Revisa los 5 cm superiores del sustrato.';
  if (rule === 'secar_completo') return 'Comprueba que el sustrato esté seco por completo.';
  if (rule === 'humedad_pareja') return 'Comprueba si el sustrato sigue húmedo de forma pareja.';
  return 'No hay una regla de sustrato confirmada; comprueba la humedad con cuidado.';
}

function environmentAdvice(plant: Plant) {
  const humidity = plant.clima_actual?.humedad_relativa;
  const target = plant.plan_cuidados?.humedad_objetivo;
  if (humidity === undefined) return null;
  const weatherCurrent = isWeatherUsable(plant.clima_actual, plant.clima_observado_en);
  const humidityLabel = weatherCurrent
    ? 'Humedad exterior'
    : 'Último registro exterior';

  if (!weatherCurrent) {
    return {
      title: 'Último contexto exterior',
      detail: `${humidityLabel}: ${humidity}%`,
      body: 'Es un registro meteorológico exterior histórico; confirma el ambiente junto a tu planta.',
    };
  }

  if (humidity < 45 && target !== 'baja') {
    return {
      title: 'Clima exterior seco',
      detail: `${humidityLabel}: ${humidity}%`,
      body: 'Open-Meteo aporta contexto meteorológico exterior; no mide directamente el ambiente junto a tu planta.',
    };
  }

  return {
    title: 'Contexto exterior estable',
    detail: `${humidityLabel}: ${humidity}%`,
    body: 'Open-Meteo aporta contexto meteorológico exterior; no mide directamente el ambiente junto a tu planta.',
  };
}

function signalDetail(signal: string) {
  const normalized = signal.toLowerCase();
  if (normalized.includes('amarill')) return 'Puede indicar exceso/falta de agua, poca luz o nutrientes bajos.';
  if (normalized.includes('borde') || normalized.includes('punta')) return 'Suele relacionarse con baja humedad, sol fuerte o corrientes de aire.';
  if (normalized.includes('crecimiento') || normalized.includes('lento')) return 'Revisa luz, nutrientes y espacio de raices.';
  if (normalized.includes('plaga')) return 'Observa enves de hojas, tallos nuevos y manchas pegajosas.';
  return 'Observa si se repite y conectalo con riego, luz, sustrato o clima reciente.';
}

function signalTitle(signal: string) {
  const [title] = signal.split(':');
  return title.trim() || signal;
}

function signalIcon(signal: string) {
  const normalized = signal.toLowerCase();
  if (normalized.includes('amarill')) return 'humidity_mid';
  if (normalized.includes('borde') || normalized.includes('punta')) return 'air';
  if (normalized.includes('crecimiento') || normalized.includes('lento')) return 'psychiatry';
  if (normalized.includes('plaga')) return 'pest_control';
  return 'visibility';
}

function matchesHistoryFilter(type: string, filter: HistoryFilter) {
  if (filter === 'todo') return true;
  if (filter === 'salud') return ['manual_review', 'revision_humedad', 'revision_plagas', 'foto'].includes(type);
  if (filter === 'plagas') return type.includes('plaga') || type === 'tratamiento_plaga';
  if (filter === 'foto') return type === 'foto';
  if (filter === 'nota') return type === 'nota';
  if (filter === 'riego') return type === 'riego';
  return true;
}

export default function PlantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { getCachedPlant, refreshPlant, removeCachedPlant } = usePlantData();
  const [plant, setPlant] = useState<Plant | null>(() => getCachedPlant(id));
  const [activeTab, setActiveTab] = useState<PlantTab>('today');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('todo');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingWeather, setIsUpdatingWeather] = useState(false);
  const [weatherUpdateError, setWeatherUpdateError] = useState<string | null>(null);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  const [showMoistureModal, setShowMoistureModal] = useState(false);
  const [isSavingMoisture, setIsSavingMoisture] = useState(false);
  const [moistureError, setMoistureError] = useState<string | null>(null);
  const [moistureResult, setMoistureResult] = useState<SavedMoistureReview | null>(null);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, left: 0 });
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

  const refreshCurrentPlant = async () => {
    if (!id) return;
    const refreshed = await refreshPlant(id);
    if (refreshed) setPlant(refreshed);
  };

  const openMoistureReview = () => {
    setMoistureError(null);
    setMoistureResult(null);
    setShowMoistureModal(true);
  };

  const handleMoistureObservation = async (value: 'dry' | 'wet' | 'not_sure') => {
    if (!id || !plant || !user?.uid) return;
    setIsSavingMoisture(true);
    setMoistureError(null);
    try {
      const result = await saveMoistureReview({
        plantId: id,
        uid: user.uid,
        value,
        soilRuleUsed: plant.plan_cuidados?.regla_humedad_sustrato,
        observedAt: Date.now(),
      });
      setMoistureResult(result);
      await refreshCurrentPlant();
    } catch (error) {
      console.error('Moisture review failed:', error);
      setMoistureError('No pudimos guardar la observación. Intenta nuevamente.');
    } finally {
      setIsSavingMoisture(false);
    }
  };

  const handleWater = async (options?: { closeMoistureFlowOnSuccess?: boolean }) => {
    if (!id || !plant) return;
    setIsWatering(true);
    try {
      const now = Date.now();
      await appendPlantAction(plant, {
        tipo: 'riego',
        fecha: now,
        descripcion: 'Riego registrado',
      }, { fecha_ultimo_riego: now });
      await refreshCurrentPlant();
      if (options?.closeMoistureFlowOnSuccess) {
        setShowMoistureModal(false);
        setMoistureResult(null);
        setMoistureError(null);
      }
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
      await refreshCurrentPlant();
    } catch (error) {
      handleDataError(error, DataOperationType.UPDATE, `plants/${id}`);
    } finally {
      setUpdatingAction(null);
    }
  };

  const handleUpdateWeather = async () => {
    if (!id || !plant || !user?.uid) return;
    setIsUpdatingWeather(true);
    setWeatherUpdateError(null);

    try {
      const weather = await getWeatherForPlant(
        plant.ciudad || '',
        plant.lat !== undefined && plant.lon !== undefined ? { lat: plant.lat, lon: plant.lon } : null,
      );

      if (!weather) {
        setWeatherUpdateError('No pudimos obtener clima para esta ubicacion. Revisa ciudad o geolocalizacion.');
        return;
      }

      await saveEnvironmentSnapshot({
        plantId: id,
        uid: user.uid,
        weather: weather.weather,
        lat: weather.lat ?? plant.lat,
        lon: weather.lon ?? plant.lon,
        environmentType: plant.contexto?.ubicacion_tipo,
        observedAt: Date.now(),
      });
      await refreshCurrentPlant();
    } catch (error) {
      console.error('Weather update failed:', error);
      setWeatherUpdateError('No pudimos actualizar el clima. Intenta de nuevo en unos minutos.');
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
      await refreshCurrentPlant();
      setNoteText('');
      setShowNoteModal(false);
    } catch (error) {
      handleDataError(error, DataOperationType.UPDATE, `plants/${id}`);
    } finally {
      setIsAddingNote(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('review') !== 'humidity') return;
    openMoistureReview();
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const filteredHistory = useMemo(() => {
    const history = plant?.historial_acciones || [];
    return history.filter((action) => matchesHistoryFilter(action.tipo, historyFilter));
  }, [historyFilter, plant?.historial_acciones]);

  if (!plant) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-[#f6f8f5] text-gray-600">Cargando...</div>;
  }

  const displayName = plant.nombrePersonalizado || plant.nombre_comun || 'Planta';
  const scientificName = plant.nombre_cientifico || 'Especie no confirmada';
  const health = healthLabel(plant);
  const review = getCareReviewStatus(plant);
  const substrateRule = soilRuleText(plant.plan_cuidados?.regla_humedad_sustrato);
  const environment = environmentAdvice(plant);
  const speciesPath = `/especie/${speciesKey(plant)}?planta=${plant.id}`;
  const careCards = [
    {
      title: 'Riego',
      value: review.referenceIntervalDays !== undefined ? `Referencia: cada ${review.referenceIntervalDays} dias` : 'Sin referencia',
      detail: 'Abre una revisión; el sustrato decide la acción.',
      icon: 'water_drop',
      color: 'text-blue-600',
    },
    {
      title: 'Luz',
      value: lightText(plant.plan_cuidados?.luz_categoria, plant.plan_cuidados?.exposicion_sol),
      detail: plant.contexto?.luz_usuario ? `Segun ubicacion: ${plant.contexto.luz_usuario}` : 'Confirma la luz real.',
      icon: 'light_mode',
      color: 'text-amber-500',
    },
    {
      title: 'Humedad',
      value: humidityText(plant.plan_cuidados?.humedad_objetivo),
      detail: plant.clima_actual?.humedad_relativa !== undefined
        ? `${isWeatherUsable(plant.clima_actual, plant.clima_observado_en) ? 'Exterior' : 'Último registro exterior'}: ${plant.clima_actual.humedad_relativa}%`
        : 'Sin contexto exterior.',
      icon: 'humidity_mid',
      color: 'text-cyan-600',
    },
    {
      title: 'Drenaje',
      value: plant.contexto?.maceta_con_drenaje === true ? 'Buen drenaje' : plant.contexto?.maceta_con_drenaje === false ? 'Sin drenaje' : 'Sin dato',
      detail: potLabel(plant),
      icon: 'line_weight',
      color: 'text-green-700',
    },
    {
      title: 'Maceta',
      value: potLabel(plant),
      detail: 'Vigila raices si crece lento.',
      icon: 'potted_plant',
      color: 'text-emerald-700',
    },
  ];
  const signals = plant.plan_cuidados?.senales_alerta?.slice(0, 4) || [];

  return (
    <div className="min-h-[100dvh] bg-[#f6f8f5] pb-24 font-sans text-gray-900">
      <header className="relative min-h-[450px] overflow-hidden bg-[#15231a] text-white">
        <img
          src={plant.fotoUrl || HERO_FALLBACK}
          alt={displayName}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-[#102318]/95" />
        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#082417]/85 to-transparent" />

        <div className="relative z-10 flex items-center justify-between px-5 pt-5">
          <button onClick={() => navigate('/home')} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0f4b2b]/80 text-white shadow-lg backdrop-blur-md active:scale-95">
            <span className="material-symbols-outlined text-[34px]">arrow_back</span>
          </button>
        </div>

        <div className="absolute bottom-9 left-0 right-0 z-10 px-6">
          <h1 className="text-[42px] font-bold leading-none tracking-tight min-[560px]:text-[52px]">{displayName}</h1>
          <p className="mt-4 text-[21px] italic leading-tight text-white/90 min-[560px]:text-[24px]">{scientificName}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[18px] font-medium text-white/90 min-[560px]:text-[20px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[27px]">favorite</span>
              {health}
            </span>
            <span className="text-white/60">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[27px]">home</span>
              {locationLabel(plant)}
            </span>
            <span className="text-white/60">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[27px]">potted_plant</span>
              {potLabel(plant)}
            </span>
          </div>
          <button
            onClick={() => navigate(speciesPath, { state: { plantPhotoUrl: plant.fotoUrl, plantName: displayName } })}
            className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/12 px-5 py-3 text-[18px] font-semibold text-white backdrop-blur-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[26px]">menu_book</span>
            Ver especie
            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
          </button>
        </div>
      </header>

      <main className="-mt-7 rounded-t-[30px] bg-[#f6f8f5] px-5 pt-5">
        <nav className="sticky top-0 z-20 -mx-5 grid grid-cols-4 border-b border-gray-200 bg-[#f6f8f5]/95 px-5 pt-2 backdrop-blur">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex min-h-[66px] flex-col items-center justify-center gap-0.5 border-b-[4px] text-[13px] font-semibold transition min-[640px]:min-h-[74px] min-[640px]:text-[15px]',
                activeTab === tab.id ? 'border-[#08752d] text-[#08752d]' : 'border-transparent text-gray-500',
              )}
            >
              <span className="material-symbols-outlined text-[25px] min-[640px]:text-[28px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {activeTab === 'today' && (
          <div className="space-y-5 py-6">
            <section className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <h2 className="text-[28px] font-bold text-[#064822]">Hoy para {displayName}</h2>
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border', review.reviewPending ? 'border-amber-100 bg-amber-50 text-amber-600' : 'border-green-100 bg-green-50 text-[#08752d]')}>
                  <span className="material-symbols-outlined text-[21px]">{review.reviewPending ? 'priority_high' : 'check'}</span>
                </span>
              </div>
              <div className="mt-5 rounded-[18px] border border-gray-200 bg-white p-4">
                <div className="relative pr-14">
                  <h3 className="text-[24px] font-bold leading-tight text-[#0c2318] min-[560px]:text-[30px]">
                    {review.reviewPending ? 'Revisa el sustrato antes de decidir' : 'Aún no toca revisar humedad'}
                  </h3>
                  <p className="mt-2 text-[14px] font-semibold text-gray-500">Estado: {health}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 rounded-[16px] border border-gray-200 bg-white">
                  <div className="flex items-center gap-3 px-3 py-4">
                    <span className="material-symbols-outlined rounded-full bg-blue-50 p-2 text-[25px] text-blue-600 min-[560px]:text-[30px]">water_drop</span>
                    <div>
                      <p className="text-[13px] leading-tight text-gray-500 min-[560px]:text-[15px]">Próxima revisión</p>
                      <p className="whitespace-nowrap text-[17px] font-bold leading-tight text-blue-700 min-[560px]:text-[22px]">{nextReviewText(review)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-l border-gray-200 px-3 py-4">
                    <span className="material-symbols-outlined rounded-full bg-green-50 p-2 text-[25px] text-[#08752d] min-[560px]:text-[30px]">history</span>
                    <div>
                      <p className="text-[13px] leading-tight text-gray-500 min-[560px]:text-[15px]">Ultimo riego</p>
                      <p className="text-[17px] font-bold leading-tight text-[#08752d] min-[560px]:text-[22px]">{plant.fecha_ultimo_riego !== undefined ? dateAgo(plant.fecha_ultimo_riego) : 'Sin registro'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-[16px] bg-[#f3f8f4] p-4">
                  <span className="material-symbols-outlined rounded-full bg-green-100 p-2 text-[28px] text-[#08752d]">psychiatry</span>
                  <p className="text-[16px] leading-relaxed text-gray-600">{wateringRule(plant)} Úsala para observar el sustrato; el calendario no decide un riego.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={openMoistureReview}
                    disabled={isSavingMoisture}
                    className="flex min-h-[70px] items-center justify-center gap-2 rounded-[16px] bg-[#08752d] px-3 py-3 text-[15px] font-bold text-white shadow-sm active:scale-[0.99] disabled:opacity-60 min-[560px]:text-[18px]"
                  >
                    <span className="material-symbols-outlined text-[28px]">humidity_mid</span>
                    Revisar humedad
                  </button>
                  <button
                    onClick={() => handleWater()}
                    disabled={isWatering}
                    className="flex min-h-[70px] items-center justify-center gap-2 rounded-[16px] border border-green-200 bg-white px-3 py-3 text-[15px] font-bold text-[#0b5d29] active:scale-[0.99] disabled:opacity-60 min-[560px]:text-[18px]"
                  >
                    <span className="material-symbols-outlined text-[28px]">water_drop</span>
                    {isWatering ? 'Guardando' : 'Registrar riego'}
                  </button>
                </div>
              </div>

              <h3 className="mt-7 text-[21px] font-bold text-[#064822]">Acciones rapidas</h3>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { label: 'Foto', icon: 'photo_camera', action: () => navigate(`/planta/${plant.id}/seguimiento`) },
                  { label: 'Humedad', icon: 'water_drop', action: openMoistureReview },
                  { label: 'Plagas', icon: 'pest_control', action: () => handleQuickAction('revision_plagas', 'Revision de plagas registrada') },
                  { label: 'Nota', icon: 'edit_document', action: () => setShowNoteModal(true) },
                ].map((action) => (
                  <button key={action.label} onClick={action.action} className="flex h-[76px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[14px] border border-gray-200 bg-white px-1 text-gray-700 active:scale-[0.99]">
                    <span className="material-symbols-outlined text-[25px] text-[#08752d]">{action.icon}</span>
                    <span className="max-w-full truncate text-[12px] font-semibold leading-tight min-[380px]:text-[13px]">{action.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
            {environment && (
              <section
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('care')}
                onKeyDown={(event) => event.key === 'Enter' && setActiveTab('care')}
                className="rounded-[18px] border border-blue-100 bg-blue-50 p-4 text-left shadow-sm active:scale-[0.99]"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <span className="material-symbols-outlined text-[26px]">humidity_mid</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[18px] font-bold leading-tight text-[#0c2318]">{environment.title}</h2>
                    <p className="mt-1 text-[14px] font-semibold leading-tight text-blue-700">{environment.detail}</p>
                    <p className="sr-only">{environment.body}</p>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700">
                    Ver senales
                  </span>
                </div>
              </section>
            )}

            <section
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('history')}
              onKeyDown={(event) => event.key === 'Enter' && setActiveTab('history')}
              className={cn('rounded-[18px] border border-gray-100 bg-white p-4 text-left shadow-sm active:scale-[0.99]', !environment && 'col-span-2')}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold leading-tight text-[#064822]">Actividad reciente</h2>
                <span className="text-[13px] font-semibold text-[#08752d]">Ver todo</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                {(plant.historial_acciones || []).slice(0, 1).map((action, index) => (
                  <article key={`${action.fecha}-${index}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#08752d]">
                      <span className="material-symbols-outlined text-[22px]">{actionIcon(action.tipo)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] leading-tight text-gray-500">{dateAgo(action.fecha)}</p>
                      <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-gray-800">{actionLabel(action.tipo, action.descripcion)}</p>
                    </div>
                  </article>
                ))}
                {(plant.historial_acciones || []).length === 0 && (
                  <p className="rounded-xl bg-gray-50 p-3 text-[14px] text-gray-500">Hoy: sin registros.</p>
                )}
              </div>
            </section>
            </div>
          </div>
        )}

        {activeTab === 'care' && (
          <div className="space-y-5 py-6">
            <section className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-[26px] font-bold text-[#064822]">Plan de cuidado</h2>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-2.5">
                {careCards.map((card) => (
                  <article key={card.title} className="min-w-0 rounded-[14px] border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('material-symbols-outlined text-[24px]', card.color)}>{card.icon}</span>
                      <h3 className="min-w-0 text-[15px] font-bold leading-tight text-gray-900">{card.title}</h3>
                    </div>
                    <p className="mt-2 min-w-0 whitespace-normal break-words text-[13px] font-semibold leading-snug text-gray-700 [overflow-wrap:anywhere]">{card.value}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-gray-500">{card.detail}</p>
                  </article>
                ))}
              </div>
              <details className="mt-4 rounded-[14px] border border-gray-200 bg-gray-50 p-3">
                <summary className="cursor-pointer text-[15px] font-bold text-[#064822]">Riego base</summary>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{substrateRule}. {plant.plan_cuidados?.riego_ajuste_clima || 'Ajusta segun humedad real del sustrato.'}</p>
              </details>
            </section>

            <section className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-[24px] font-bold text-[#064822]">Señales a vigilar</h2>
              <div className="mt-4 grid gap-3">
                {signals.length > 0 ? signals.map((signal) => (
                  <article key={signal} className="grid grid-cols-[76px_minmax(0,1fr)] overflow-hidden rounded-[16px] border border-green-100 bg-[#f7fbf6]">
                    <div className="flex min-h-[98px] items-center justify-center bg-gradient-to-br from-[#dff2e3] to-[#eef7df] text-[#08752d]">
                      <span className="material-symbols-outlined text-[38px]">{signalIcon(signal)}</span>
                    </div>
                    <div className="min-w-0 p-3">
                      <h3 className="text-[15px] font-bold leading-snug text-[#0c2318]">{signalTitle(signal)}</h3>
                      <p className="mt-1 text-[13px] leading-snug text-gray-600">{signalDetail(signal)}</p>
                    </div>
                  </article>
                )) : (
                  <p className="rounded-[16px] border border-gray-200 bg-white p-4 text-[15px] text-gray-500">Sin señales especificas guardadas para esta planta.</p>
                )}
              </div>
            </section>

            <section className="grid grid-cols-[minmax(0,1fr)_104px] items-center gap-4 rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="min-w-0">
                <h2 className="text-[22px] font-bold leading-tight text-[#064822]">Más sobre esta especie</h2>
                <p className="mt-2 text-[15px] leading-snug text-gray-600">Consulta informacion extendida sobre {scientificName}.</p>
              </div>
              <button onClick={() => navigate(speciesPath, { state: { plantPhotoUrl: plant.fotoUrl, plantName: displayName } })} className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-[16px] bg-[#08752d] p-3 text-[13px] font-bold leading-tight text-white active:scale-[0.99]">
                <span className="material-symbols-outlined text-[28px]">menu_book</span>
                Especie
              </button>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-5 py-6">
            <section className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[26px] font-bold text-[#064822]">Historial</h2>
                <button onClick={() => setShowNoteModal(true)} className="rounded-full bg-[#edf3ef] px-4 py-2 text-[15px] font-bold text-[#08752d]">Agregar</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {historyFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setHistoryFilter(filter.id)}
                    className={cn('rounded-full border px-3 py-2 text-[13px] font-semibold', historyFilter === filter.id ? 'border-[#08752d] bg-[#08752d] text-white' : 'border-gray-200 bg-white text-gray-600')}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {filteredHistory.length > 0 ? filteredHistory.map((action, index) => (
                  <article key={`${action.fecha}-${index}`} className="flex gap-4 rounded-[16px] border border-gray-100 bg-gray-50 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#08752d]">
                      <span className="material-symbols-outlined">{actionIcon(action.tipo)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-gray-500">{dateAgo(action.fecha)}</p>
                      <p className="mt-1 text-[17px] font-bold text-gray-900">{actionLabel(action.tipo, action.descripcion)}</p>
                      {action.descripcion && action.tipo !== 'riego' && (
                        <p className="mt-1 text-[14px] leading-relaxed text-gray-600">{action.descripcion}</p>
                      )}
                    </div>
                  </article>
                )) : (
                  <p className="rounded-[16px] bg-gray-50 p-5 text-center text-[16px] text-gray-500">No hay registros para este filtro.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-5 py-6">
            <section className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-[26px] font-bold text-[#064822]">Ajustes</h2>
              <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-[16px] border border-gray-200">
                {[
                  { label: 'Cambiar foto principal', icon: 'photo_camera', action: () => navigate(`/planta/${plant.id}/seguimiento`) },
                  { label: 'Actualizar contexto exterior', icon: 'cloud_sync', action: handleUpdateWeather, disabled: isUpdatingWeather || (!plant.ciudad && (plant.lat === undefined || plant.lon === undefined)) },
                  { label: 'Revisar con IA', icon: 'auto_awesome', action: () => navigate(`/planta/${plant.id}/actualizar-desde-foto`) },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    disabled={!item.action || item.disabled}
                    className="flex w-full items-center justify-between gap-4 bg-white px-4 py-4 text-left disabled:opacity-45"
                  >
                    <span className="flex items-center gap-3 text-[17px] font-semibold text-gray-800">
                      <span className="material-symbols-outlined text-[#08752d]">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                  </button>
                ))}
              </div>
              {weatherUpdateError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-[13px] leading-relaxed text-red-700">{weatherUpdateError}</p>}
            </section>

            <section className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-[22px] font-bold text-[#064822]">Vinculacion con especie</h2>
              <p className="mt-2 text-[18px] italic text-gray-700">{scientificName}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
                <button onClick={() => navigate(speciesPath, { state: { plantPhotoUrl: plant.fotoUrl, plantName: displayName } })} className="rounded-[16px] border border-gray-200 bg-white px-5 py-4 text-[16px] font-bold text-[#08752d]">Ver especie</button>
                <button disabled className="rounded-[16px] border border-gray-200 bg-gray-50 px-5 py-4 text-[16px] font-bold text-gray-400">Cambiar especie</button>
              </div>
            </section>

            {isPlantOwner(plant, user?.uid) && (
              <button onClick={() => setShowDeleteModal(true)} className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-red-100 bg-white px-5 py-4 text-[17px] font-bold text-red-600">
                <span className="material-symbols-outlined">delete</span>
                Eliminar planta
              </button>
            )}
          </div>
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

      {showMoistureModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-sm sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#2e5c3a]">
                <span className="material-symbols-outlined">humidity_mid</span>
                <h3 className="text-[18px] font-bold text-gray-900">Revisar humedad</h3>
              </div>
              <button onClick={() => setShowMoistureModal(false)} disabled={isSavingMoisture} className="p-1 text-gray-400">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {!moistureResult ? (
              <>
                <p className="mt-4 rounded-xl bg-[#f3f8f4] p-3 text-sm leading-relaxed text-gray-700">{moistureCheckPrompt(plant.plan_cuidados?.regla_humedad_sustrato)}</p>
                <p className="mt-4 text-[13px] text-gray-500">¿Qué observaste según esta regla?</p>
                <div className="mt-3 space-y-2">
                  <button onClick={() => handleMoistureObservation('dry')} disabled={isSavingMoisture} className="w-full rounded-xl bg-[#2e5c3a] px-4 py-3 text-left text-[14px] font-semibold text-white disabled:opacity-50">
                    {plant.plan_cuidados?.regla_humedad_sustrato ? 'Seco según la regla' : 'Parece seco'}
                  </button>
                  <button onClick={() => handleMoistureObservation('wet')} disabled={isSavingMoisture} className="w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-[14px] font-semibold text-blue-800 disabled:opacity-50">
                    Todavía húmedo
                  </button>
                  <button onClick={() => handleMoistureObservation('not_sure')} disabled={isSavingMoisture} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-[14px] font-semibold text-gray-700 disabled:opacity-50">
                    No estoy seguro
                  </button>
                </div>
                {isSavingMoisture && <p className="mt-3 text-center text-[13px] text-gray-500">Guardando observación...</p>}
                {moistureError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-[13px] text-red-700">{moistureError}</p>}
              </>
            ) : (
              <div className="mt-4">
                <p className="rounded-xl bg-[#f3f8f4] p-3 text-sm leading-relaxed text-gray-700">{moistureResult.decision.explanation}</p>
                {moistureResult.decision.type === 'recommendation' && moistureResult.decision.action === 'water' ? (
                  <button
                    onClick={() => handleWater({ closeMoistureFlowOnSuccess: true })}
                    disabled={isWatering}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#2e5c3a] px-5 py-3 text-[13px] font-semibold text-white disabled:opacity-50"
                  >
                    {isWatering ? 'Guardando...' : 'Registrar riego'}
                  </button>
                ) : (
                  <button onClick={() => setShowMoistureModal(false)} className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#2e5c3a] px-5 py-3 text-[13px] font-semibold text-white">
                    Entendido
                  </button>
                )}
              </div>
            )}
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
