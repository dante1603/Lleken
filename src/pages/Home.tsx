import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useAuth } from '../contexts/AuthContext';
import { usePlantData } from '../contexts/PlantDataContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { getCareReviewStatus, getPlantDisplayName } from '../lib/plants';
import { homeNavigation, toOriginChildNavigation, withNavigation } from '../lib/navigation';
import { cn } from '../lib/utils';
import type { Plant } from '../types';

import { actionIcon, actionLabel, dateAgo, wateringRule } from '../lib/plantFormatters';

type HomeTask = {
  id: string;
  plant: Plant;
  title: string;
  detail: string;
  icon: string;
  tone: 'danger' | 'water' | 'photo' | 'review';
  actionLabel: string;
  actionPath: string;
  destination: 'plant' | 'followUp';
  observationMode?: 'photo' | 'humidity';
  dueAt: number;
};

type WeekDayLoad = {
  key: string;
  monthDate: string;
  label: string;
  taskCount: number;
  isToday: boolean;
  isDone: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_PLANT_IMAGE = 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=900&auto=format&fit=crop';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function calendarDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function plural(value: number, singular: string, pluralText: string) {
  return value === 1 ? singular : pluralText;
}

function titleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function displayName(plant: Plant) {
  return titleCase(getPlantDisplayName(plant));
}

function taskToneClass(tone: HomeTask['tone']) {
  if (tone === 'danger') return 'bg-red-50 text-red-700';
  if (tone === 'water') return 'bg-[#eaf3ec] text-[#2f6b45]';
  if (tone === 'photo') return 'bg-green-50 text-green-700';
  return 'bg-amber-50 text-amber-700';
}

function statusText(plant: Plant) {
  if (plant.estado === 'en_riesgo') return 'En riesgo';
  if (plant.estado === 'necesita_atencion') return 'Revisar';
  if (plant.estado === 'saludable') return 'Estable';
  return 'Sin evaluar';
}

function nextActionText(plant: Plant) {
  const review = getCareReviewStatus(plant);

  if (plant.estado === 'en_riesgo') return 'Alerta: revisar hoy';
  if (plant.estado === 'necesita_atencion') return 'Revisar cuidado hoy';
  if (review.reasons.includes('watering_history_unknown')) return 'Sin riego registrado · revisa humedad';
  if (review.reasons.includes('care_baseline_unknown')) return 'Sin referencia · revisa humedad';
  if (review.reviewPending) return 'Revisar humedad hoy';
  if (review.daysUntilReview === 1) return 'Revisar humedad mañana';
  return review.daysUntilReview !== undefined ? `Revisión en ${review.daysUntilReview} días` : 'Revisar humedad';
}

function buildTodayTasks(plants: Plant[]): HomeTask[] {
  const now = Date.now();
  const today = startOfDay(new Date());

  return plants.flatMap((plant) => {
    const tasks: HomeTask[] = [];
    const review = getCareReviewStatus(plant);

    if (plant.estado === 'en_riesgo') {
      tasks.push({
        id: `${plant.id}-risk`,
        plant,
        title: 'Revisar alerta',
        detail: plant.plan_cuidados?.senales_alerta?.[0] || 'Hay señales que conviene mirar hoy.',
        icon: 'warning',
        tone: 'danger',
        actionLabel: 'Ver ficha',
        actionPath: `/planta/${plant.id}`,
        destination: 'plant',
        dueAt: today,
      });
    }

    if (review.reviewPending) {
      tasks.push({
        id: `${plant.id}-water`,
        plant,
        title: 'Revisión de humedad',
        detail: review.reasons.includes('watering_history_unknown')
          ? 'Sin riego registrado · revisa humedad antes de decidir.'
          : review.reasons.includes('care_baseline_unknown')
            ? 'Sin referencia de cuidado · revisa humedad antes de decidir.'
            : review.daysSinceWatered !== undefined && review.daysSinceWatered > 0
              ? `Último riego hace ${review.daysSinceWatered} ${plural(review.daysSinceWatered, 'día', 'días')}`
              : wateringRule(plant),
        icon: 'water_drop',
        tone: 'water',
        actionLabel: 'Revisar',
        actionPath: `/planta/${plant.id}/seguimiento`,
        destination: 'followUp',
        observationMode: 'humidity',
        dueAt: today,
      });
    }

    const followUpDays = plant.plan_cuidados?.seguimiento_foto_dias || 7;
    const lastFollowUp = plant.fecha_ultimo_seguimiento || plant.fecha_creacion;
    const daysSinceFollowUp = Math.floor((now - lastFollowUp) / DAY_MS);

    if (daysSinceFollowUp >= followUpDays) {
      tasks.push({
        id: `${plant.id}-photo`,
        plant,
        title: 'Foto de seguimiento',
        detail: `Han pasado ${daysSinceFollowUp} días desde la última foto.`,
        icon: 'photo_camera',
        tone: 'photo',
        actionLabel: 'Subir foto',
        actionPath: `/planta/${plant.id}/seguimiento`,
        destination: 'followUp',
        dueAt: today + DAY_MS,
      });
    }

    if (plant.estado === 'necesita_atencion') {
      tasks.push({
        id: `${plant.id}-review`,
        plant,
        title: 'Revisar cuidado',
        detail: plant.plan_cuidados?.alertas_clima?.[0] || 'Conviene revisar luz, sustrato o ubicación.',
        icon: 'search_check',
        tone: 'review',
        actionLabel: 'Ver ficha',
        actionPath: `/planta/${plant.id}`,
        destination: 'plant',
        dueAt: today,
      });
    }

    return tasks;
  }).sort((a, b) => a.dueAt - b.dueAt).slice(0, 6);
}

function getNextCareDate(plant: Plant) {
  const review = getCareReviewStatus(plant);
  const base = startOfDay(new Date());
  if (plant.estado === 'en_riesgo' || plant.estado === 'necesita_atencion' || review.reviewPending || !review.reviewAt) return base;
  return review.reviewAt;
}

function buildWeekLoad(plants: Plant[]): WeekDayLoad[] {
  const todayDate = new Date();
  const today = startOfDay(todayDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(todayDate, index);
    const key = calendarDateKey(date);
    const monthDate = calendarDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
    const dayStart = today + index * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const taskCount = plants.filter((plant) => {
      const careDate = getNextCareDate(plant);
      return careDate >= dayStart && careDate < dayEnd;
    }).length;

    return {
      key,
      monthDate,
      label: date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '').slice(0, 3).toUpperCase(),
      taskCount,
      isToday: index === 0,
      isDone: index < 2 && taskCount === 0,
    };
  });
}

function buildQuickActions(featuredPlant?: Plant) {
  return [
    {
      label: 'Agregar planta',
      icon: 'local_florist',
      path: '/nueva-planta',
      destination: 'newPlant' as const,
    },
    {
      label: 'Seguimiento',
      icon: 'photo_camera',
      path: featuredPlant ? `/planta/${featuredPlant.id}/seguimiento` : '/plants',
      destination: featuredPlant ? 'followUp' as const : 'plants' as const,
    },
  ];
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plants, initializationStatus, error, retryInitialization } = usePlantData();
  const { status: onboardingStatus, error: onboardingError, startOnboarding, retryOnboarding } = useOnboarding();
  const isReady = initializationStatus === 'ready';

  const tasks = isReady ? buildTodayTasks(plants) : [];
  const weekLoad = isReady ? buildWeekLoad(plants) : [];
  const firstName = titleCase(user?.displayName?.split(' ')[0] || 'Amigo');
  const priorityTask = tasks[0];
  const priorityPlants = (isReady ? [...plants] : [])
    .sort((a, b) => {
      const score = (plant: Plant) => {
        if (plant.estado === 'en_riesgo') return 0;
        if (getCareReviewStatus(plant).reviewPending) return 1;
        if (plant.estado === 'necesita_atencion') return 2;
        return 3;
      };
      return score(a) - score(b) || getNextCareDate(a) - getNextCareDate(b);
    })
    .slice(0, 3);
  const fallbackPriorityPlant = priorityPlants[0];
  const featuredPlant = priorityTask?.plant || fallbackPriorityPlant;
  const latestPlants = (isReady ? [...plants] : []).sort((a, b) => (b.fecha_creacion || 0) - (a.fecha_creacion || 0)).slice(0, 2);
  const recentActions = (isReady ? plants : [])
    .flatMap((plant) => (plant.historial_acciones || []).map((action) => ({ plant, action })))
    .sort((a, b) => b.action.fecha - a.action.fecha)
    .slice(0, 2);
  const quickActions = buildQuickActions(featuredPlant);
  const homeOrigin = { surface: 'home' } as const;
  const navigateToPlant = (path: string) => navigate(path, { state: withNavigation({}, homeNavigation()) });
  const navigateToPlantHistory = (plantId: string) => navigate(`/planta/${plantId}`, {
    state: withNavigation({}, { ...homeNavigation(), plantTab: 'history' }),
  });
  const navigateToCalendarDay = (day: WeekDayLoad) => navigate('/calendar', {
    state: withNavigation({}, {
      origin: { surface: 'calendar', view: { selectedDate: day.key, monthDate: day.monthDate } },
    }),
  });
  const navigateToFollowUp = (path: string, observationMode: 'photo' | 'humidity' = 'photo') => navigate(path, { state: withNavigation({ observationMode }, toOriginChildNavigation(homeOrigin)) });
  const navigateTask = (task: HomeTask) => {
    if (task.destination === 'followUp') navigateToFollowUp(task.actionPath, task.observationMode);
    else navigateToPlant(task.actionPath);
  };
  const navigateToNewPlant = () => navigate('/nueva-planta', { state: withNavigation({}, homeNavigation()) });

  const startFirstPlant = async () => {
    try {
      await startOnboarding();
    } catch {
      return;
    }
    navigate('/nueva-planta', { state: withNavigation({ onboarding: true }, homeNavigation()) });
  };

  if (!isReady) {
    return (
      <div className="min-h-[100dvh] bg-[#f8faf7] pb-36 font-sans text-[#08142d]">
        <main className="mx-auto max-w-md px-7 pt-9 space-y-7">
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0 pt-1">
              <p className="text-[14px] font-semibold uppercase tracking-wide text-[#2f6b45]">Hoy en tu jardín</p>
              <h1 className="mt-3 text-[40px] font-semibold leading-none tracking-tight text-[#08142d]">Hola, {firstName}</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              aria-label="Abrir perfil de usuario"
              className="mt-[52px] shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6b45]"
            >
              <ProfileAvatar user={user} alt="User" className="h-[66px] w-[66px]" />
            </button>
          </header>
          <section className="rounded-[26px] border border-white bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
            {initializationStatus === 'loading' ? <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-100 border-t-[#2e5c3a]" /> : <>
              <h2 className="text-[20px] font-semibold text-[#08142d]">{error || 'No pudimos cargar tu jardín.'}</h2>
              <p className="mt-2 text-[16px] text-[#7b8494]">Intenta nuevamente.</p>
              <button onClick={() => void retryInitialization()} className="mt-6 rounded-[16px] bg-[#2f6b45] px-6 py-3 text-[16px] font-semibold text-white">Reintentar</button>
            </>}
          </section>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (onboardingStatus === 'loading' || onboardingStatus === 'error' || onboardingStatus === 'not_started' || onboardingStatus === 'in_progress') {
    const isLoading = onboardingStatus === 'loading';
    const isRecovery = onboardingStatus === 'in_progress';
    return (
      <div className="min-h-[100dvh] bg-[#f8faf7] font-sans text-[#08142d]">
        <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-7 py-8">
          <header className="flex items-center gap-3">
            <img src="/LlekenLogo.svg" alt="" className="h-12 w-12 rounded-[15px] shadow-[0_8px_20px_rgba(44,95,45,0.14)]" />
            <div>
              <p className="text-[22px] font-semibold tracking-tight text-[#2f6b45]">Llekén</p>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a93a3]">Tu jardín, paso a paso</p>
            </div>
          </header>

          <section className="flex flex-1 flex-col justify-center py-12">
            {isLoading ? <div className="rounded-[28px] border border-[#e2eee3] bg-white/80 p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.07)]" role="status" aria-live="polite">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3ec] text-[#2f6b45]">
                <span className="material-symbols-outlined animate-pulse text-[34px]">potted_plant</span>
              </div>
              <h1 className="mt-5 text-[24px] font-semibold tracking-tight text-[#08142d]">Preparando tu activación</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-[#7b8494]">Estamos comprobando por dónde continuar.</p>
            </div> : onboardingStatus === 'error' ? <div className="rounded-[28px] border border-[#f0d8d5] bg-white/80 p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fce8e6] text-[#9b2c2c]">
                <span className="material-symbols-outlined text-[32px]">error</span>
              </div>
              <h1 className="mt-5 text-[24px] font-semibold tracking-tight text-[#08142d]">No pudimos cargar tu activación</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-[#7b8494]">{onboardingError || 'Intenta nuevamente.'}</p>
              <button onClick={() => void retryOnboarding()} className="mt-7 w-full rounded-full bg-[#2f6b45] px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-[#245738]">Reintentar</button>
            </div> : <>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#2f6b45]">Así empieza tu jardín</p>
              <h1 className="mt-4 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#08142d]">{isRecovery ? 'Continúa con tu primera planta' : 'Agrega tu primera planta'}</h1>
              <p className="mt-5 text-[17px] leading-relaxed text-[#596579]">{isRecovery
                ? 'Tu activación ya comenzó. Retómala para terminar de preparar qué revisar hoy.'
                : 'En unos pasos prepararemos una guía basada en tu planta y su contexto.'}</p>

              <ol className="mt-8 space-y-3">
                {['Fotografía tu planta', 'Confirma la propuesta', 'Recibe qué revisar hoy'].map((hint, index) => (
                  <li key={hint} className="flex items-center gap-3 rounded-[18px] border border-[#e2eee3] bg-white/75 px-4 py-3 text-[15px] font-medium text-[#334155]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf3ec] text-[13px] font-bold text-[#2f6b45]">{index + 1}</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ol>

              <button onClick={() => void startFirstPlant()} className="mt-8 w-full rounded-full bg-[#2f6b45] px-6 py-4 text-[16px] font-semibold text-white shadow-[0_10px_22px_rgba(47,107,69,0.20)] transition-colors hover:bg-[#245738]">
                {isRecovery ? 'Continuar' : 'Agregar mi primera planta'}
              </button>
            </>}
          </section>
        </main>
      </div>
    );
  }

  const summaryText = plants.length === 0
    ? 'Agrega tu primera planta para activar cuidados.'
    : `Tu jardín tiene ${plants.length} ${plural(plants.length, 'planta', 'plantas')} y ${tasks.length} ${plural(tasks.length, 'revisión pendiente', 'revisiones pendientes')}.`;

  return (
    <div className="min-h-[100dvh] bg-[#f8faf7] pb-36 font-sans text-[#08142d]">
      <main className="mx-auto max-w-md px-7 pt-9 space-y-7">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 pt-1">
            <p className="text-[14px] font-semibold uppercase tracking-wide text-[#2f6b45]">Hoy en tu jardín</p>
            <h1 className="mt-3 text-[40px] font-semibold leading-none tracking-tight text-[#08142d]">Hola, {firstName}</h1>
            <p className="mt-4 max-w-[310px] text-[16px] leading-snug text-[#7b8494]">
              {summaryText}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Abrir perfil de usuario"
            className="mt-[52px] shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6b45]"
          >
            <ProfileAvatar
              user={user}
              alt="User"
              className="h-[66px] w-[66px]"
              imageClassName="shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
              fallbackClassName="text-[35px] font-light shadow-[0_10px_25px_rgba(96,49,189,0.25)]"
            />
          </button>
        </header>

        <section className="rounded-[26px] border border-white bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          {featuredPlant ? (
            <div className="grid grid-cols-[38%_1px_1fr] items-stretch gap-4">
              <button onClick={() => navigateToPlant(`/planta/${featuredPlant.id}`)} className="flex min-w-0 flex-col items-center text-center">
                <img
                  src={featuredPlant.fotoUrl || FALLBACK_PLANT_IMAGE}
                  alt={displayName(featuredPlant)}
                  className="h-[184px] w-full rounded-[18px] bg-gray-100 object-cover"
                />
                <span className="mt-4 block max-w-full truncate text-[24px] font-semibold leading-tight tracking-tight text-[#08142d]">
                  {displayName(featuredPlant)}
                </span>
              </button>

              <div className="my-2 w-px bg-[#e5e8ed]" />

              <div className="flex min-w-0 flex-col py-2">
                <div className={cn('mb-5 flex h-[56px] w-[56px] items-center justify-center rounded-full', priorityTask ? taskToneClass(priorityTask.tone) : 'bg-[#eaf3ec] text-[#2f6b45]')}>
                  <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                    {priorityTask?.icon || 'eco'}
                  </span>
                </div>
                <h2 className="text-[26px] font-semibold leading-[1.08] tracking-tight text-[#08142d]">
                  {priorityTask?.title || 'Cuidado pendiente de evaluación'}
                </h2>
                <p className="mb-5 mt-3 text-[14px] leading-snug text-[#8a93a3]">
                  {priorityTask?.detail || nextActionText(featuredPlant)}
                </p>
                <button
                  onClick={() => priorityTask ? navigateTask(priorityTask) : navigateToPlant(`/planta/${featuredPlant.id}`)}
                  className="rounded-[16px] bg-[#2f6b45] px-5 py-3.5 text-[18px] font-semibold text-white shadow-[0_10px_22px_rgba(47,107,69,0.22)] active:bg-[#255639]"
                >
                  {priorityTask?.actionLabel || 'Ver ficha'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3ec] text-[#2f6b45]">
                <span className="material-symbols-outlined text-[34px]">potted_plant</span>
              </div>
              <h2 className="mt-5 text-[24px] font-semibold text-[#08142d]">Tu jardín parte aquí</h2>
              <p className="mt-2 text-[16px] text-[#8a93a3]">Agrega una planta para recibir cuidados y recordatorios.</p>
              <button onClick={navigateToNewPlant} className="mt-6 rounded-[16px] bg-[#2f6b45] px-6 py-4 text-[16px] font-semibold text-white">
                Agregar planta
              </button>
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#08142d]">Semana de cuidados</h2>
            <button onClick={() => navigate('/calendar')} className="flex items-center gap-1 text-[15px] font-semibold text-[#2f6b45] active:opacity-70">
              Ver calendario
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 rounded-[18px] bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            {weekLoad.map((day) => (
              <button
                key={day.key}
                onClick={() => navigateToCalendarDay(day)}
                className={cn(
                  'min-h-[68px] rounded-[14px] px-1 py-2 text-center active:bg-[#edf5f0]',
                  day.isToday && 'bg-[#edf5f0]',
                )}
              >
                <span className="block text-[13px] font-semibold text-[#7c8493]">{day.label}</span>
                <span className={cn(
                  'mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-full text-[16px] font-semibold',
                  day.isToday && day.taskCount > 0
                    ? 'bg-[#2f6b45] text-white'
                    : day.taskCount > 0
                      ? 'bg-[#dfece2] text-[#2f6b45]'
                      : 'bg-[#f0f1f2] text-[#8a93a3]',
                )}>
                  {day.taskCount > 0 ? day.taskCount : day.isDone ? (
                    <span className="material-symbols-outlined text-[22px]">check</span>
                  ) : '–'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-[20px] font-semibold tracking-tight text-[#08142d]">Acciones rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                aria-label={`Accion rapida: ${action.label}`}
                onClick={() => {
                  if (action.destination === 'followUp') navigateToFollowUp(action.path);
                  else if (action.destination === 'newPlant') navigateToNewPlant();
                  else navigate(action.path);
                }}
                className="flex min-h-[132px] min-w-0 flex-col items-center justify-center rounded-[22px] bg-white px-2.5 py-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)] active:scale-[0.98]"
              >
                <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#eaf3ec] text-[#0f6a2d]">
                  <span className="material-symbols-outlined text-[31px]" style={{ fontVariationSettings: "'FILL' 0" }}>{action.icon}</span>
                </span>
                <span className="mt-4 block w-full min-w-0 text-[15px] font-semibold leading-tight text-[#08142d]">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {priorityPlants.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold tracking-tight text-[#08142d]">Plantas prioritarias</h2>
              <button onClick={() => navigate('/plants')} className="text-[15px] font-semibold text-[#2f6b45] active:opacity-70">Ver todas</button>
            </div>
            <div className="space-y-3">
              {priorityPlants.slice(0, 2).map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => navigateToPlant(`/planta/${plant.id}`)}
                  className="flex w-full items-center gap-3 rounded-[20px] bg-white p-3 text-left shadow-[0_10px_26px_rgba(15,23,42,0.07)] active:bg-gray-50"
                >
                  <img
                    src={plant.fotoUrl || FALLBACK_PLANT_IMAGE}
                    alt={displayName(plant)}
                    className="h-14 w-14 shrink-0 rounded-[14px] bg-gray-100 object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[#08142d]">{displayName(plant)}</span>
                    <span className="mt-1 block truncate text-[13px] text-[#8a93a3]">{nextActionText(plant)}</span>
                  </span>
                  <span className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    plant.estado === 'en_riesgo'
                      ? 'bg-red-50 text-red-600'
                      : plant.estado === 'necesita_atencion'
                        ? 'bg-amber-50 text-amber-700'
                        : plant.estado === 'saludable'
                          ? 'bg-[#eaf3ec] text-[#2f6b45]'
                          : 'bg-gray-100 text-gray-600',
                  )}>
                    {statusText(plant)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#08142d]">Actividad reciente</h2>
            <button onClick={() => navigate('/plants')} className="text-[15px] font-semibold text-[#2f6b45] active:opacity-70">Ver plantas</button>
          </div>
          <div className="space-y-3">
            {recentActions.length > 0 ? recentActions.map(({ plant, action }) => (
              <button key={`${plant.id}-${action.fecha}-${action.tipo}`} onClick={() => navigateToPlantHistory(plant.id)} className="flex w-full items-center justify-between rounded-[18px] bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:bg-gray-50">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf3ec] text-[#2f6b45]">
                    <span className="material-symbols-outlined text-[20px]">{actionIcon(action.tipo)}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-[#08142d]">{actionLabel(action.tipo, action.descripcion)}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-[#8a93a3]">{displayName(plant)} · {dateAgo(action.fecha)}</span>
                  </span>
                </span>
                <span className="material-symbols-outlined text-[#8a93a3]">chevron_right</span>
              </button>
            )) : latestPlants.length > 0 ? latestPlants.map((plant) => (
              <button key={plant.id} onClick={() => navigateToPlant(`/planta/${plant.id}`)} className="flex w-full items-center justify-between rounded-[18px] bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:bg-gray-50">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf3ec] text-[#2f6b45]">
                    <span className="material-symbols-outlined text-[20px]">potted_plant</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-[#08142d]">Planta creada</span>
                    <span className="mt-0.5 block truncate text-[12px] text-[#8a93a3]">{displayName(plant)} · {dateAgo(plant.fecha_creacion)}</span>
                  </span>
                </span>
                <span className="material-symbols-outlined text-[#8a93a3]">chevron_right</span>
              </button>
            )) : (
              <p className="rounded-[18px] bg-white p-4 text-center text-[13px] text-[#8a93a3] shadow-[0_8px_22px_rgba(15,23,42,0.06)]">Aún no hay actividad.</p>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
