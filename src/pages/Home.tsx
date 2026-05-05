import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useAuth } from '../contexts/AuthContext';
import { usePlantData } from '../contexts/PlantDataContext';
import { getPlantDisplayName, getWateringStatus } from '../lib/plants';
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
  dueAt: number;
};

type WeekDayLoad = {
  key: string;
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
  return 'Estable';
}

function nextActionText(plant: Plant) {
  const watering = getWateringStatus(plant);

  if (plant.estado === 'en_riesgo') return 'Alerta: revisar hoy';
  if (plant.estado === 'necesita_atencion') return 'Revisar cuidado hoy';
  if (watering.isDue) return 'Revisar humedad hoy';
  if (watering.nextWateringDays === 1) return 'Riego probable mañana';
  return `Riego en ${watering.nextWateringDays} días`;
}

function buildTodayTasks(plants: Plant[]): HomeTask[] {
  const now = Date.now();
  const today = startOfDay(new Date());

  return plants.flatMap((plant) => {
    const tasks: HomeTask[] = [];
    const watering = getWateringStatus(plant);

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
        dueAt: today,
      });
    }

    if (watering.isDue) {
      tasks.push({
        id: `${plant.id}-water`,
        plant,
        title: 'Revisión de humedad',
        detail: watering.daysSinceWatered > 0
          ? `Último riego hace ${watering.daysSinceWatered} ${plural(watering.daysSinceWatered, 'día', 'días')}`
          : wateringRule(plant),
        icon: 'water_drop',
        tone: 'water',
        actionLabel: 'Registrar',
        actionPath: '/calendar',
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
        dueAt: today,
      });
    }

    return tasks;
  }).sort((a, b) => a.dueAt - b.dueAt).slice(0, 6);
}

function getNextCareDate(plant: Plant) {
  const watering = getWateringStatus(plant);
  const base = startOfDay(new Date());
  if (plant.estado === 'en_riesgo' || plant.estado === 'necesita_atencion' || watering.isDue) return base;
  return base + Math.max(1, watering.nextWateringDays) * DAY_MS;
}

function buildWeekLoad(plants: Plant[]): WeekDayLoad[] {
  const todayDate = new Date();
  const today = startOfDay(todayDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(todayDate, index);
    const key = new Date(startOfDay(date)).toISOString();
    const dayStart = today + index * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const taskCount = plants.filter((plant) => {
      const careDate = getNextCareDate(plant);
      return careDate >= dayStart && careDate < dayEnd;
    }).length;

    return {
      key,
      label: date.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '').slice(0, 3).toUpperCase(),
      taskCount,
      isToday: index === 0,
      isDone: index < 2 && taskCount === 0,
    };
  });
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plants, loading, refreshing } = usePlantData();

  const tasks = buildTodayTasks(plants);
  const weekLoad = buildWeekLoad(plants);
  const stableCount = plants.filter((plant) => !plant.estado || plant.estado === 'saludable').length;
  const alertsCount = plants.filter((plant) => plant.estado === 'en_riesgo').length;
  const firstName = titleCase(user?.displayName?.split(' ')[0] || 'Amigo');
  const priorityTask = tasks[0];
  const priorityPlants = [...plants]
    .sort((a, b) => {
      const score = (plant: Plant) => {
        if (plant.estado === 'en_riesgo') return 0;
        if (getWateringStatus(plant).isDue) return 1;
        if (plant.estado === 'necesita_atencion') return 2;
        return 3;
      };
      return score(a) - score(b) || getNextCareDate(a) - getNextCareDate(b);
    })
    .slice(0, 3);
  const fallbackPriorityPlant = priorityPlants[0];
  const featuredPlant = priorityTask?.plant || fallbackPriorityPlant;
  const latestPlants = [...plants].sort((a, b) => (b.fecha_creacion || 0) - (a.fecha_creacion || 0)).slice(0, 2);
  const recentActions = plants
    .flatMap((plant) => (plant.historial_acciones || []).map((action) => ({ plant, action })))
    .sort((a, b) => b.action.fecha - a.action.fecha)
    .slice(0, 2);

  const summaryText = plants.length === 0
    ? 'Agrega tu primera planta para activar cuidados.'
    : `Tu jardín está estable, con ${tasks.length} ${plural(tasks.length, 'revisión pendiente', 'revisiones pendientes')}.`;

  return (
    <div className="min-h-[100dvh] bg-[#f8faf7] pb-36 font-sans text-[#08142d]">
      <main className="mx-auto max-w-md px-7 pt-9 space-y-7">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 pt-1">
            <p className="text-[14px] font-semibold uppercase tracking-wide text-[#2f6b45]">Hoy en tu jardín</p>
            <h1 className="mt-3 text-[40px] font-semibold leading-none tracking-tight text-[#08142d]">Hola, {firstName}</h1>
            <p className="mt-4 max-w-[310px] text-[16px] leading-snug text-[#7b8494]">
              {loading && plants.length === 0 ? 'Cargando tus plantas.' : summaryText}
            </p>
          </div>
          <ProfileAvatar
            user={user}
            alt="User"
            className="mt-[52px] h-[66px] w-[66px]"
            imageClassName="shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
            fallbackClassName="text-[35px] font-light shadow-[0_10px_25px_rgba(96,49,189,0.25)]"
          />
        </header>

        <section className="rounded-[26px] border border-white bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
          {featuredPlant ? (
            <div className="grid grid-cols-[38%_1px_1fr] items-stretch gap-4">
              <button onClick={() => navigate(`/planta/${featuredPlant.id}`)} className="flex min-w-0 flex-col items-center text-center">
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
                  {priorityTask?.title || 'Cuidado estable'}
                </h2>
                <p className="mb-5 mt-3 text-[14px] leading-snug text-[#8a93a3]">
                  {priorityTask?.detail || nextActionText(featuredPlant)}
                </p>
                <button
                  onClick={() => navigate(priorityTask?.actionPath || `/planta/${featuredPlant.id}`)}
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
              <button onClick={() => navigate('/nueva-planta')} className="mt-6 rounded-[16px] bg-[#2f6b45] px-6 py-4 text-[16px] font-semibold text-white">
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
                onClick={() => navigate('/calendar')}
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
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Agregar planta', detail: 'Registra una nueva planta en tu jardín.', icon: 'local_florist', path: '/nueva-planta' },
              { label: 'Riego manual', detail: 'Registra un riego fuera de lo planeado.', icon: 'watering_can', path: '/calendar' },
              { label: 'Seguimiento', detail: 'Sube una foto de evolución.', icon: 'photo_camera', path: featuredPlant ? `/planta/${featuredPlant.id}/seguimiento` : '/nueva-planta' },
              { label: 'Feedback beta', detail: 'Cuéntanos qué falla o confunde.', icon: 'feedback', path: '/profile' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex min-h-[126px] items-center gap-3 rounded-[20px] bg-white p-4 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)] active:scale-[0.99]"
              >
                <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#eaf3ec] text-[#2f6b45]">
                  <span className="material-symbols-outlined text-[27px]">{action.icon}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold leading-tight text-[#08142d]">{action.label}</span>
                  <span className="mt-1 block text-[13px] leading-snug text-[#8a93a3]">{action.detail}</span>
                </span>
                <span className="material-symbols-outlined shrink-0 text-[24px] text-[#8a93a3]">chevron_right</span>
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
                  onClick={() => navigate(`/planta/${plant.id}`)}
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
                        : 'bg-[#eaf3ec] text-[#2f6b45]',
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
              <button key={`${plant.id}-${action.fecha}-${action.tipo}`} onClick={() => navigate(`/planta/${plant.id}`)} className="flex w-full items-center justify-between rounded-[18px] bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:bg-gray-50">
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
              <button key={plant.id} onClick={() => navigate(`/planta/${plant.id}`)} className="flex w-full items-center justify-between rounded-[18px] bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.06)] active:bg-gray-50">
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
