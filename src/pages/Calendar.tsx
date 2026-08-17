import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { usePlantData } from '../contexts/PlantDataContext';
import { getPlantDisplayName } from '../lib/plants';
import { buildCalendarReviews, isWithinUpcomingDays, type CalendarReview } from '../lib/calendarReviews';
import { cn } from '../lib/utils';
import { readNavigation, toOriginChildNavigation, withNavigation, type NavigationOrigin } from '../lib/navigation';

type CalendarDay = {
  date: Date;
  currentMonth: boolean;
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

function dateFromKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
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

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plants, initializationStatus, error, retryInitialization } = usePlantData();
  const restoredOrigin = readNavigation(location.state)?.origin;
  const restoredView = restoredOrigin?.surface === 'calendar' ? restoredOrigin.view : undefined;
  const [selectedDate, setSelectedDate] = useState(() => restoredView ? dateFromKey(restoredView.selectedDate) : startOfDay(new Date()));
  const [monthDate, setMonthDate] = useState(() => restoredView ? dateFromKey(restoredView.monthDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const origin: NavigationOrigin = {
    surface: 'calendar',
    view: { selectedDate: dateKey(selectedDate), monthDate: dateKey(monthDate) },
  };
  const plantNavigationState = () => withNavigation({}, { origin });
  const followUpNavigationState = () => withNavigation({ observationMode: 'photo' }, toOriginChildNavigation(origin));

  const now = Date.now();
  const reviews = useMemo(() => initializationStatus === 'ready' ? buildCalendarReviews(plants, now) : [], [initializationStatus, plants, now]);
  const monthDays = useMemo(() => buildMonthDays(monthDate), [monthDate]);
  const selectedReviews = reviews.filter((review) => isSameDay(review.displayDate, selectedDate));
  const today = startOfDay(new Date(now));
  const todayReviews = reviews.filter((review) => isSameDay(review.displayDate, today));
  const weekReviews = reviews.filter((review) => isWithinUpcomingDays(review.displayDate, today, 7));
  const reviewsToCheck = reviews.filter((review) => review.dueDate.getTime() <= today.getTime());
  const monthLabel = monthDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const selectedLabel = selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const reviewsByDay = useMemo(() => {
    return reviews.reduce((map, review) => {
      const key = dateKey(review.displayDate);
      const dayReviews = map.get(key) || [];
      dayReviews.push(review);
      map.set(key, dayReviews);
      return map;
    }, new Map<string, CalendarReview[]>());
  }, [reviews]);

  const goToToday = () => {
    setSelectedDate(today);
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  if (initializationStatus !== 'ready') {
    return (
      <div className="bg-[#f8f9fa] min-h-[100dvh] pb-24 font-sans">
        <main className="px-4 pt-8 space-y-5 max-w-md mx-auto">
          <header>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Calendario</h1>
            <p className="text-sm text-gray-500 mt-0.5">Cuándo conviene volver a revisar</p>
          </header>
          <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
            {initializationStatus === 'loading' ? <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-100 border-t-[#2e5c3a]" /> : <>
              <h2 className="text-[18px] font-semibold text-gray-900">{error || 'No pudimos cargar tu jardín.'}</h2>
              <p className="mt-2 text-[14px] text-gray-500">Intenta nuevamente.</p>
              <button onClick={() => void retryInitialization()} className="mt-5 bg-[#2e5c3a] text-white text-[14px] font-medium px-4 py-2.5 rounded-[10px]">Reintentar</button>
            </>}
          </section>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] min-h-[100dvh] pb-24 font-sans">
      <main className="px-4 pt-8 space-y-5 max-w-md mx-auto">
        <header className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Calendario</h1>
            <p className="text-sm text-gray-500 mt-0.5">Cuándo conviene volver a revisar</p>
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
            { label: 'Hoy', value: todayReviews.length, icon: 'calendar_today', color: 'text-green-700' },
            { label: '7 días', value: weekReviews.length, icon: 'calendar_month', color: 'text-blue-500' },
            { label: 'Por revisar', value: reviewsToCheck.length, icon: 'notifications_active', color: 'text-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[86px]">
              <span className={cn('material-symbols-outlined mb-1', stat.color)}>{stat.icon}</span>
              <span className="text-xl font-bold text-gray-800">{stat.value}</span>
              <span className="text-[11px] text-gray-500">{stat.label}</span>
            </div>
          ))}
        </section>

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
              const dayReviews = reviewsByDay.get(dateKey(day.date)) || [];
              const isToday = isSameDay(day.date, today);
              const isSelected = isSameDay(day.date, selectedDate);
              const hasPhoto = dayReviews.some((review) => review.type === 'photo');
              const hasReview = dayReviews.some((review) => review.type === 'humidity');

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
                {selectedReviews.length} revisión{selectedReviews.length !== 1 ? 'es' : ''} para este día
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {selectedReviews.length > 0 ? selectedReviews.map((review) => (
              <article key={review.id} className="border border-gray-100 rounded-2xl p-3 flex gap-3">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', review.bg)}>
                  <span className={cn('material-symbols-outlined', review.color)} style={{ fontVariationSettings: "'FILL' 1" }}>{review.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-semibold text-gray-900 leading-tight">{review.title}</h4>
                      <p className="text-[12px] text-gray-500 mt-0.5 truncate">{getPlantDisplayName(review.plant)} - {review.plant.nombre_cientifico || 'Sin especie'}</p>
                    </div>
                    {review.plant.fotoUrl ? (
                      <img src={review.plant.fotoUrl} className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0" alt={getPlantDisplayName(review.plant)} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">local_florist</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[12px] text-gray-500 mt-2">{review.detail}</p>

                  <div className="flex gap-2 mt-3">
                    {review.type === 'photo' ? (
                      <button
                        onClick={() => navigate(`/planta/${review.plant.id}/seguimiento`, { state: followUpNavigationState() })}
                        className="flex-1 bg-[#2e5c3a] text-white text-[12px] font-semibold py-2 rounded-xl active:bg-[#23452b]"
                      >
                        Subir foto
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/planta/${review.plant.id}/seguimiento`, { state: withNavigation({ observationMode: 'humidity' }, toOriginChildNavigation(origin)) })}
                        className="flex-1 bg-[#2e5c3a] text-white text-[12px] font-semibold py-2 rounded-xl active:bg-[#23452b]"
                      >
                        Revisar
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/planta/${review.plant.id}`, { state: plantNavigationState() })}
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
                <p className="text-[14px] font-semibold text-gray-800">Sin revisiones este día</p>
                <p className="text-[12px] text-gray-500 mt-1">Elige otro día para ver próximas revisiones.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
