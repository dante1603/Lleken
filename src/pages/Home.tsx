import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../contexts/AuthContext';
import { getPlantDisplayName, getWateringStatus, listenToVisiblePlants } from '../lib/plants';
import { cn } from '../lib/utils';
import type { Plant } from '../types';

import { actionIcon, actionLabel, knowledgeSourceText as sourceLabel, wateringRule } from '../lib/plantFormatters';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToVisiblePlants(user.uid, (plantsData) => {
      setPlants(plantsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching plants:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const healthyCount = plants.filter((plant) => !plant.estado || plant.estado === 'saludable').length;
  const needsAttentionCount = plants.filter((plant) => plant.estado === 'necesita_atencion').length;
  const alertsCount = plants.filter((plant) => plant.estado === 'en_riesgo').length;
  const dueCount = plants.filter((plant) => getWateringStatus(plant).isDue).length;
  const firstName = user?.displayName?.split(' ')[0] || 'Amigo';
  const firstLetter = firstName.charAt(0).toLowerCase();
  const plantNeedingAttention = plants.find((plant) => plant.estado === 'necesita_atencion' || plant.estado === 'en_riesgo') || plants[0];
  const plantDueForWater = plants.find((plant) => getWateringStatus(plant).isDue) || plantNeedingAttention;
  const recentActions = plants
    .flatMap((plant) => (plant.historial_acciones || []).map((action) => ({ plant, action })))
    .sort((a, b) => b.action.fecha - a.action.fecha)
    .slice(0, 3);
  const lastAction = recentActions[0]?.action;
  const lastReviewText = lastAction
    ? new Date(lastAction.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    : 'sin registros';
  const todayInsight = dueCount > 0
    ? `${dueCount} planta${dueCount !== 1 ? 's' : ''} requiere${dueCount === 1 ? '' : 'n'} revisar humedad.`
    : 'Sin tareas urgentes.';
  const activeSourceLabel = sourceLabel(plantDueForWater);

  return (
    <div className="bg-white min-h-[100dvh] font-sans pb-24">
      <main className="px-5 pt-8 space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Hola, {firstName}</h1>
            <p className="text-[14px] text-gray-500 mt-1">{dueCount > 0 ? 'Hay cuidados pendientes hoy.' : 'Tu jardín está estable hoy.'}</p>
          </div>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-11 h-11 rounded-full object-cover shadow-sm bg-gray-200" />
          ) : (
            <div className="w-11 h-11 bg-[#4b3b87] rounded-full flex items-center justify-center text-white text-xl font-medium shadow-sm">
              {firstLetter}
            </div>
          )}
        </header>

        <section className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-5 px-5 pb-2">
          {[
            { label: 'plantas', value: plants.length, icon: 'nest_eco_leaf', color: 'text-[#6e8a75]' },
            { label: 'saludable', value: healthyCount, icon: 'favorite', color: 'text-[#2e5c3a]' },
            { label: 'por revisar', value: Math.max(dueCount, needsAttentionCount), icon: 'water_drop', color: 'text-[#3b82f6]' },
            { label: 'alertas', value: alertsCount, icon: 'warning', color: 'text-[#f59e0b]' },
          ].map((stat) => (
            <div key={stat.label} className="snap-start shrink-0 min-w-[90px] flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl py-3 flex flex-col items-center justify-center gap-1">
              <span className={cn('material-symbols-outlined fill', stat.color)}>{stat.icon}</span>
              <span className="text-[22px] font-bold text-gray-800 mt-1">{loading ? '-' : stat.value}</span>
              <span className="text-[12px] text-gray-500 tracking-wide">{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-1">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-[17px]">
              <span className="material-symbols-outlined text-[#6e8a75] text-[22px]">calendar_today</span> Hoy
            </h2>
            <span className="bg-[#edf5f0] text-[#2e5c3a] text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] font-bold">{dueCount > 0 ? 'notifications_active' : 'check'}</span>
              {dueCount > 0 ? `${dueCount} pendiente${dueCount !== 1 ? 's' : ''}` : 'Todo al día'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-[#2e5c3a] bg-[#edf5f0] rounded-full p-[2px] fill text-[18px]">check_circle</span>
              <p className="text-[14px] text-gray-700">{todayInsight}</p>
            </div>
            <div className="w-full h-[1px] bg-gray-50" />
            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-[#3b82f6] fill text-[22px]">water_drop</span>
              <p className="text-[14px] text-gray-700">Próximo riego: <span className="text-[#2e5c3a] font-medium">{plantDueForWater ? getPlantDisplayName(plantDueForWater) : 'ninguno'}</span></p>
            </div>
            <div className="w-full h-[1px] bg-gray-50" />
            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-[#6e8a75] text-[22px]">schedule</span>
              <p className="text-[14px] text-gray-700">Última revisión: <span className="text-[#2e5c3a] font-medium">{lastReviewText}</span></p>
            </div>
            <div className="w-full h-[1px] bg-gray-50" />
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-[#f59e0b] mt-0.5 text-[22px]">light_mode</span>
              <div className="min-w-0">
                <p className="text-[14px] text-gray-700 mt-0.5">{wateringRule(plantDueForWater)}</p>
                {activeSourceLabel && <p className="text-[11px] text-[#2e5c3a] font-semibold mt-2">{activeSourceLabel}</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="flex gap-2.5">
          <button onClick={() => navigate('/plants')} className="flex-1 bg-white border border-gray-100 py-3.5 rounded-[20px] flex flex-col items-center justify-center gap-1.5 shadow-sm active:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[#6e8a75] text-[24px]">water_drop</span>
            <span className="text-[12px] text-gray-600 font-medium leading-tight text-center">Registrar<br />riego</span>
          </button>
          <button onClick={() => navigate('/nueva-planta')} className="flex-1 bg-white border border-gray-100 py-3.5 rounded-[20px] flex flex-col items-center justify-center gap-1.5 shadow-sm active:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[#6e8a75] text-[24px] fill">photo_camera</span>
            <span className="text-[12px] text-gray-600 font-medium leading-tight text-center">Tomar<br />foto</span>
          </button>
          <button onClick={() => navigate('/nueva-planta')} className="flex-1 bg-white border border-gray-100 py-3.5 rounded-[20px] flex flex-col items-center justify-center gap-1.5 shadow-sm active:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[#6e8a75] text-[24px]">add</span>
            <span className="text-[12px] text-gray-600 font-medium leading-tight text-center">Agregar<br />planta</span>
          </button>
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 text-[17px]">Atención de hoy</h3>
            <button onClick={() => navigate('/plants')} className="text-[13px] text-[#2e5c3a] font-medium flex items-center active:opacity-70">
              Ver todas <span className="material-symbols-outlined text-[18px] ml-0.5">chevron_right</span>
            </button>
          </div>

          {plantNeedingAttention ? (
            <div onClick={() => navigate(`/planta/${plantNeedingAttention.id}`)} className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 flex gap-4 items-center active:bg-gray-50 transition-colors cursor-pointer">
              {plantNeedingAttention.fotoUrl ? (
                <img src={plantNeedingAttention.fotoUrl} alt={getPlantDisplayName(plantNeedingAttention)} className="w-[84px] h-[84px] rounded-2xl object-cover bg-gray-100" />
              ) : (
                <div className="w-[84px] h-[84px] rounded-2xl bg-gray-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">local_florist</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[16px] font-bold text-gray-900 leading-tight">{getPlantDisplayName(plantNeedingAttention)}</h4>
                    <p className="text-[12px] text-gray-500 italic mt-0.5">{plantNeedingAttention.nombre_cientifico || 'Desconocido'}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </div>
                <span className={cn(
                  'mt-2 text-[11px] font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit',
                  plantNeedingAttention.estado === 'saludable' || !plantNeedingAttention.estado ? 'bg-[#edf5f0] text-[#2e5c3a]' : 'bg-red-50 text-red-600',
                )}>
                  <span className="material-symbols-outlined fill text-[13px]">{plantNeedingAttention.estado === 'saludable' || !plantNeedingAttention.estado ? 'favorite' : 'warning'}</span>
                  {plantNeedingAttention.estado === 'saludable' || !plantNeedingAttention.estado ? 'Saludable' : 'Alerta'}
                </span>
                {sourceLabel(plantNeedingAttention) && (
                  <span className="mt-2 text-[11px] font-semibold text-gray-500 block">{sourceLabel(plantNeedingAttention)}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[#6e8a75] text-[24px]">nest_eco_leaf</span>
              </div>
              <p className="text-[14px] text-gray-600">No hay plantas que requieran atención urgente</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 text-[17px]">Actividad reciente</h3>
            <button className="text-[13px] text-[#2e5c3a] font-medium flex items-center active:opacity-70">Ver todo</button>
          </div>

          <div className="space-y-4">
            {recentActions.length > 0 ? recentActions.map(({ plant, action }) => (
              <div key={`${plant.id}-${action.fecha}-${action.tipo}`} onClick={() => navigate(`/planta/${plant.id}`)} className="flex items-center justify-between active:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#edf5f0] rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#2e5c3a] fill text-[20px]">{actionIcon(action.tipo)}</span>
                  </div>
                  <div>
                    <p className="text-[14px] text-gray-900"><span className="font-bold tracking-tight">{new Date(action.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span> · {actionLabel(action.tipo, action.descripcion)}</p>
                    <p className="text-[13px] text-gray-500 mt-0.5">{getPlantDisplayName(plant)}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-300">chevron_right</span>
              </div>
            )) : (
              <p className="text-[14px] text-gray-500">Aún no hay actividad registrada.</p>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
