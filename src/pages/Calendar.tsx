import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { usePlantData } from '../contexts/PlantDataContext';
import { appendPlantAction, getCareReviewStatus, getPlantDisplayName } from '../lib/plants';
import { cn } from '../lib/utils';
import { Plant, PlantActionType } from '../types';

type TaskType = 'photo' | 'humidity' | 'pests' | 'fertilize';

type CareTask = {
  id: string;
  type: TaskType;
  plant: Plant;
  title: string;
  detail: string;
  icon: string;
  color: string;
  bg: string;
  dueDate: Date;
  displayDate: Date;
  overdueDays: number;
};

type CalendarDay = {
  date: Date;
  currentMonth: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TASK_ACTIONS: Partial<Record<TaskType, PlantActionType>> = {
  pests: 'revision_plagas',
  fertilize: 'fertilizacion',
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function dateKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

function daysBetween(from: Date, to: Date) {
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

function getLastActionDate(plant: Plant, type: PlantActionType) {
  const action = plant.historial_acciones
    ?.filter((item) => item.tipo === type)
    .sort((a, b) => b.fecha - a.fecha)[0];

  return action?.fecha;
}

function buildMonthDays(monthDate: Date): CalendarDay[] {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -mondayOffset);
  const totalCells = Math.ceil((mondayOffset + last.getDate()) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      currentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function getTaskDisplayDate(dueDate: Date, today: Date) {
  return dueDate.getTime() < today.getTime() ? today : dueDate;
}

function buildTasks(plants: Plant[]) {
  const today = startOfDay(new Date());

  return plants.flatMap((plant) => {
    const createdAt = plant.fecha_creacion || Date.now();
    const review = getCareReviewStatus(plant);
    const humidityDueDate = review.reviewAt ? startOfDay(new Date(review.reviewAt)) : today;
    const humidityDisplayDate = getTaskDisplayDate(humidityDueDate, today);
    const humidityOverdueDays = review.reviewAt ? Math.max(0, daysBetween(humidityDueDate, today)) : 0;

    const followUpFrequency = plant.plan_cuidados?.seguimiento_foto_dias || 7;
    const lastFollowUp = plant.fecha_ultimo_seguimiento || createdAt;
    const photoDueDate = startOfDay(addDays(new Date(lastFollowUp), followUpFrequency));
    const photoDisplayDate = getTaskDisplayDate(photoDueDate, today);
    const photoOverdueDays = Math.max(0, daysBetween(photoDueDate, today));
    const pestsLastChecked = getLastActionDate(plant, 'revision_plagas') || createdAt;
    const pestsDueDate = startOfDay(addDays(new Date(pestsLastChecked), 14));
    const pestsDisplayDate = getTaskDisplayDate(pestsDueDate, today);
    const pestsOverdueDays = Math.max(0, daysBetween(pestsDueDate, today));
    const lastFertilized = getLastActionDate(plant, 'fertilizacion') || createdAt;
    const fertilizeDueDate = startOfDay(addDays(new Date(lastFertilized), 30));
    const fertilizeDisplayDate = getTaskDisplayDate(fertilizeDueDate, today);
    const fertilizeOverdueDays = Math.max(0, daysBetween(fertilizeDueDate, today));

    const tasks: CareTask[] = [
      {
        id: `${plant.id}-humidity-${dateKey(humidityDisplayDate)}`,
        type: 'humidity',
        plant,
        title: review.reviewPending ? 'Revisión de humedad pendiente' : 'Revisar humedad',
        detail: review.reasons.includes('watering_history_unknown')
          ? 'Sin riego registrado · revisa humedad antes de decidir'
          : review.reasons.includes('care_baseline_unknown')
            ? 'Sin referencia de cuidado · revisa humedad antes de decidir'
            : 'Confirmar sustrato antes de decidir',
        icon: 'humidity_percentage',
        color: 'text-cyan-700',
        bg: 'bg-cyan-50',
        dueDate: humidityDueDate,
        displayDate: humidityDisplayDate,
        overdueDays: humidityOverdueDays,
      },
      {
        id: `${plant.id}-pests-${dateKey(pestsDisplayDate)}`,
        type: 'pests',
        plant,
        title: pestsOverdueDays > 0 ? 'Plagas pendiente' : 'Revisar plagas',
        detail: pestsOverdueDays > 0
          ? `${pestsOverdueDays} dia${pestsOverdueDays !== 1 ? 's' : ''} de atraso`
          : 'Cada 14 dias',
        icon: 'pest_control',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        dueDate: pestsDueDate,
        displayDate: pestsDisplayDate,
        overdueDays: pestsOverdueDays,
      },
      {
        id: `${plant.id}-photo-${dateKey(photoDisplayDate)}`,
        type: 'photo',
        plant,
        title: photoOverdueDays > 0 ? 'Foto pendiente' : 'Foto de seguimiento',
        detail: photoOverdueDays > 0
          ? `${photoOverdueDays} dia${photoOverdueDays !== 1 ? 's' : ''} de atraso`
          : `Cada ${followUpFrequency} dia${followUpFrequency !== 1 ? 's' : ''}`,
        icon: 'photo_camera',
        color: 'text-green-700',
        bg: 'bg-[#edf3ef]',
        dueDate: photoDueDate,
        displayDate: photoDisplayDate,
        overdueDays: photoOverdueDays,
      },
    ];

    if (plant.plan_cuidados?.fertilizacion_temporada === 'crecimiento_activo') {
      tasks.push({
        id: `${plant.id}-fertilize-${dateKey(fertilizeDisplayDate)}`,
        type: 'fertilize',
        plant,
        title: fertilizeOverdueDays > 0 ? 'Fertilizacion pendiente' : 'Fertilizar',
        detail: fertilizeOverdueDays > 0
          ? `${fertilizeOverdueDays} dia${fertilizeOverdueDays !== 1 ? 's' : ''} de atraso`
          : 'Solo si hay crecimiento activo',
        icon: 'science',
        color: 'text-violet-700',
        bg: 'bg-violet-50',
        dueDate: fertilizeDueDate,
        displayDate: fertilizeDisplayDate,
        overdueDays: fertilizeOverdueDays,
      });
    }

    return tasks;
  }).sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());
}

export default function Calendar() {
  const navigate = useNavigate();
  const { plants, loading, refreshPlants } = usePlantData();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tasks = useMemo(() => buildTasks(plants), [plants]);
  const monthDays = useMemo(() => buildMonthDays(monthDate), [monthDate]);
  const selectedTasks = tasks.filter((task) => isSameDay(task.displayDate, selectedDate));
  const today = startOfDay(new Date());
  const todayTasks = tasks.filter((task) => isSameDay(task.displayDate, today));
  const weekTasks = tasks.filter((task) => {
    const diff = daysBetween(today, task.displayDate);
    return diff >= 0 && diff <= 7;
  });
  const pendingTasks = tasks.filter((task) => task.displayDate.getTime() <= today.getTime());
  const monthLabel = monthDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const selectedLabel = selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const tasksByDay = useMemo(() => {
    return tasks.reduce((map, task) => {
      const key = dateKey(task.displayDate);
      const dayTasks = map.get(key) || [];
      dayTasks.push(task);
      map.set(key, dayTasks);
      return map;
    }, new Map<string, CareTask[]>());
  }, [tasks]);

  const handleCareTask = async (task: CareTask) => {
    const actionType = TASK_ACTIONS[task.type];
    if (!actionType) return;

    setUpdatingTaskId(task.id);
    setActionError(null);

    try {
      await appendPlantAction(task.plant, {
        tipo: actionType,
        fecha: Date.now(),
        descripcion: task.title,
      });
      await refreshPlants();
    } catch (error) {
      console.error('Calendar care task error:', error);
      setActionError('No pudimos registrar el cuidado. Revisa permisos de Supabase.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const goToToday = () => {
    const now = startOfDay(new Date());
    setSelectedDate(now);
    setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div className="bg-[#f8f9fa] min-h-[100dvh] pb-24 font-sans">
      <main className="px-4 pt-8 space-y-5 max-w-md mx-auto">
        <header className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Calendario</h1>
            <p className="text-sm text-gray-500 mt-0.5">Planifica y registra cuidados</p>
          </div>
          <button
            onClick={goToToday}
            className="bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors text-[13px] font-semibold text-green-700 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">today</span>
            Hoy
          </button>
        </header>

        <section className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Hoy', value: todayTasks.length, icon: 'calendar_today', color: 'text-green-700' },
            { label: '7 dias', value: weekTasks.length, icon: 'calendar_month', color: 'text-blue-500' },
            { label: 'Pendientes', value: pendingTasks.length, icon: 'notifications_active', color: 'text-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[86px]">
              <span className={cn('material-symbols-outlined mb-1', stat.color)}>{stat.icon}</span>
              <span className="text-xl font-bold text-gray-800">{loading ? '-' : stat.value}</span>
              <span className="text-[11px] text-gray-500">{stat.label}</span>
            </div>
          ))}
        </section>

        {actionError && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-3 text-[13px]">
            {actionError}
          </div>
        )}

        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setMonthDate((current) => addMonths(current, -1))}
              className="w-9 h-9 rounded-full bg-[#edf3ef] text-green-700 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Mes anterior"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 className="font-semibold text-gray-800 text-[15px] capitalize">{monthLabel}</h2>
            <button
              onClick={() => setMonthDate((current) => addMonths(current, 1))}
              className="w-9 h-9 rounded-full bg-[#edf3ef] text-green-700 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Mes siguiente"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 text-center mb-2">
            {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map((day) => (
              <span key={day} className="text-[10px] font-semibold text-gray-400">{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center text-sm text-gray-800">
            {monthDays.map((day) => {
              const dayTasks = tasksByDay.get(dateKey(day.date)) || [];
              const isToday = isSameDay(day.date, today);
              const isSelected = isSameDay(day.date, selectedDate);
              const hasPhoto = dayTasks.some((task) => task.type === 'photo');
              const hasReview = dayTasks.some((task) => task.type === 'humidity' || task.type === 'pests' || task.type === 'fertilize');

              return (
                <button
                  key={dateKey(day.date)}
                  onClick={() => setSelectedDate(startOfDay(day.date))}
                  className={cn(
                    'relative mx-auto flex h-11 w-10 flex-col items-center justify-center rounded-xl transition-colors',
                    !day.currentMonth && 'text-gray-300',
                    isSelected && 'bg-[#2e5c3a] text-white shadow-sm',
                    !isSelected && isToday && 'bg-[#edf3ef] text-green-800',
                    !isSelected && 'active:bg-gray-50',
                  )}
                >
                  <span className="text-[13px] font-semibold">{day.date.getDate()}</span>
                  <span className="mt-1 flex h-1.5 items-center justify-center gap-0.5">
                    {hasPhoto && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/70' : 'bg-green-600')} />}
                    {hasReview && <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white/50' : 'bg-amber-500')} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <div className="mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 text-[15px] capitalize">{selectedLabel}</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                {selectedTasks.length} cuidado{selectedTasks.length !== 1 ? 's' : ''} programado{selectedTasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {selectedTasks.length > 0 ? selectedTasks.map((task) => (
              <article key={task.id} className="border border-gray-100 rounded-2xl p-3 flex gap-3">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', task.bg)}>
                  <span className={cn('material-symbols-outlined', task.color)} style={{ fontVariationSettings: "'FILL' 1" }}>{task.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-gray-900 leading-tight">{task.title}</h4>
                      <p className="text-[12px] text-gray-500 mt-0.5 truncate">{getPlantDisplayName(task.plant)} - {task.plant.nombre_cientifico || 'Sin especie'}</p>
                    </div>
                    {task.plant.fotoUrl ? (
                      <img src={task.plant.fotoUrl} className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0" alt={getPlantDisplayName(task.plant)} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">local_florist</span>
                      </div>
                    )}
                  </div>

                  <p className={cn('text-[12px] mt-2', task.overdueDays > 0 ? 'text-orange-600 font-medium' : 'text-gray-500')}>{task.detail}</p>

                  <div className="flex gap-2 mt-3">
                    {task.type === 'photo' ? (
                      <button
                        onClick={() => navigate(`/planta/${task.plant.id}/seguimiento`)}
                        className="flex-1 bg-[#2e5c3a] text-white text-[12px] font-semibold py-2 rounded-xl active:bg-[#23452b]"
                      >
                        Subir foto
                      </button>
                    ) : task.type === 'humidity' ? (
                      <button
                        onClick={() => navigate(`/planta/${task.plant.id}?review=humidity`)}
                        className="flex-1 bg-[#2e5c3a] text-white text-[12px] font-semibold py-2 rounded-xl active:bg-[#23452b]"
                      >
                        Revisar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCareTask(task)}
                        disabled={updatingTaskId === task.id}
                        className="flex-1 bg-[#2e5c3a] text-white text-[12px] font-semibold py-2 rounded-xl active:bg-[#23452b] disabled:opacity-50"
                      >
                        {updatingTaskId === task.id ? 'Guardando...' : 'Marcar listo'}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/planta/${task.plant.id}`)}
                      className="px-3 bg-gray-50 text-gray-700 text-[12px] font-semibold py-2 rounded-xl border border-gray-100 active:bg-gray-100"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              </article>
            )) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-[#edf3ef] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-green-700">event_available</span>
                </div>
                <p className="text-[14px] font-semibold text-gray-800">Sin cuidados este dia</p>
                <p className="text-[12px] text-gray-500 mt-1">Elige otro dia o agrega una planta para crear tareas automaticas.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
