import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plant } from '../types';
import BottomNav from '../components/BottomNav';
import { cn } from '../lib/utils';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'plants'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plantsData: Plant[] = [];
      snapshot.forEach((doc) => {
        plantsData.push({ id: doc.id, ...doc.data() } as Plant);
      });
      plantsData.sort((a, b) => (b.fecha_creacion || 0) - (a.fecha_creacion || 0));
      setPlants(plantsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching plants:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const healthyCount = plants.filter(p => !p.estado || p.estado === 'saludable').length;
  const needsAttentionCount = plants.filter(p => p.estado === 'necesita_atencion').length;
  const alertsCount = plants.filter(p => p.estado === 'en_riesgo').length;

  const firstName = user?.displayName?.split(' ')[0] || 'Amigo';
  const firstLetter = firstName.charAt(0).toLowerCase();

  const plantNeedingAttention = plants.find(p => p.estado === 'necesita_atencion' || p.estado === 'en_riesgo') || plants[0];

  return (
    <div className="bg-white min-h-[100dvh] font-sans pb-24">
      {/* MAIN CONTENT */}
      <main className="px-5 pt-8 space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Hola, {firstName}</h1>
            <p className="text-[14px] text-gray-500 mt-1">Tu jardín está estable hoy.</p>
          </div>
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="User" 
              className="w-11 h-11 rounded-full object-cover shadow-sm bg-gray-200" 
            />
          ) : (
            <div className="w-11 h-11 bg-[#4b3b87] rounded-full flex items-center justify-center text-white text-xl font-medium shadow-sm">
              {firstLetter}
            </div>
          )}
        </header>

        {/* Stats Row */}
        <section className="flex gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory -mx-5 px-5 pb-2">
          {/* Stat 1 */}
          <div className="snap-start shrink-0 min-w-[90px] flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl py-3 flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[#6e8a75] fill">nest_eco_leaf</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold text-gray-800">{plants.length}</span>
            </div>
            <span className="text-[12px] text-gray-500 tracking-wide">planta{plants.length !== 1 ? 's' : ''}</span>
          </div>
          {/* Stat 2 */}
          <div className="snap-start shrink-0 min-w-[90px] flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl py-3 flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[#2e5c3a] fill">favorite</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold text-gray-800">{healthyCount}</span>
            </div>
            <span className="text-[12px] text-gray-500 tracking-wide">saludable</span>
          </div>
          {/* Stat 3 */}
          <div className="snap-start shrink-0 min-w-[90px] flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl py-3 flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[#3b82f6] fill">water_drop</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold text-gray-800">{needsAttentionCount}</span>
            </div>
            <span className="text-[12px] text-gray-500 tracking-wide">por regar</span>
          </div>
          {/* Stat 4 */}
          <div className="snap-start shrink-0 min-w-[90px] flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl py-3 flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[#f59e0b] fill">warning</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[22px] font-bold text-gray-800">{alertsCount}</span>
            </div>
            <span className="text-[12px] text-gray-500 tracking-wide">alertas</span>
          </div>
        </section>

        {/* Tarjeta "Hoy" */}
        <section className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-1">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-[17px]">
              <span className="material-symbols-outlined text-[#6e8a75] text-[22px]">calendar_today</span> Hoy
            </h2>
            <span className="bg-[#edf5f0] text-[#2e5c3a] text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] font-bold">check</span> Todo al día
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-[#2e5c3a] bg-[#edf5f0] rounded-full p-[2px] fill text-[18px]">check_circle</span>
              <p className="text-[14px] text-gray-700">Sin tareas urgentes</p>
            </div>

            <div className="w-full h-[1px] bg-gray-50"></div>

            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-[#3b82f6] fill text-[22px]">water_drop</span>
              <p className="text-[14px] text-gray-700">Próximo riego: <span className="text-[#2e5c3a] font-medium">{plantNeedingAttention ? (plantNeedingAttention.nombrePersonalizado || plantNeedingAttention.nombre_comun || 'planta') : 'ninguno'}</span></p>
            </div>

            <div className="w-full h-[1px] bg-gray-50"></div>

            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-[#6e8a75] text-[22px]">schedule</span>
              <p className="text-[14px] text-gray-700">Última revisión: <span className="text-[#2e5c3a] font-medium">hoy</span></p>
            </div>

            <div className="w-full h-[1px] bg-gray-50"></div>

            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-[#f59e0b] mt-0.5 text-[22px]">light_mode</span>
              <p className="text-[14px] text-gray-700 mt-0.5">Mañana: <span className="text-[#2e5c3a] font-medium">33°C</span> · evita sol fuerte de tarde</p>
            </div>
          </div>
        </section>

        {/* Botones de Acción Rápida */}
        <section className="flex gap-2.5">
          <button 
            onClick={() => navigate('/plants')}
            className="flex-1 bg-white border border-gray-100 py-3.5 rounded-[20px] flex flex-col items-center justify-center gap-1.5 shadow-sm active:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[#6e8a75] text-[24px]">water_drop</span>
            <span className="text-[12px] text-gray-600 font-medium leading-tight text-center">Registrar<br/>riego</span>
          </button>
          <button 
            onClick={() => navigate('/nueva-planta')}
            className="flex-1 bg-white border border-gray-100 py-3.5 rounded-[20px] flex flex-col items-center justify-center gap-1.5 shadow-sm active:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[#6e8a75] text-[24px] fill">photo_camera</span>
            <span className="text-[12px] text-gray-600 font-medium leading-tight text-center">Tomar<br/>foto</span>
          </button>
          <button 
            onClick={() => navigate('/nueva-planta')}
            className="flex-1 bg-white border border-gray-100 py-3.5 rounded-[20px] flex flex-col items-center justify-center gap-1.5 shadow-sm active:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[#6e8a75] text-[24px]">add</span>
            <span className="text-[12px] text-gray-600 font-medium leading-tight text-center">Agregar<br/>planta</span>
          </button>
        </section>

        {/* Atención de hoy */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 text-[17px]">Atención de hoy</h3>
            <button onClick={() => navigate('/plants')} className="text-[13px] text-[#2e5c3a] font-medium flex items-center active:opacity-70">
              Ver todas <span className="material-symbols-outlined text-[18px] ml-0.5">chevron_right</span>
            </button>
          </div>
          
          {plantNeedingAttention ? (
            <div 
              onClick={() => navigate(`/planta/${plantNeedingAttention.id}`)}
              className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 flex gap-4 items-center active:bg-gray-50 transition-colors cursor-pointer"
            >
              {plantNeedingAttention.fotoUrl ? (
                <img 
                  src={plantNeedingAttention.fotoUrl} 
                  alt={plantNeedingAttention.nombre_comun || 'Planta'} 
                  className="w-[84px] h-[84px] rounded-2xl object-cover bg-gray-100"
                />
              ) : (
                <div className="w-[84px] h-[84px] rounded-2xl bg-gray-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">local_florist</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[16px] font-bold text-gray-900 leading-tight">
                      {plantNeedingAttention.nombrePersonalizado || plantNeedingAttention.nombre_comun || 'Sin identificar'}
                    </h4>
                    <p className="text-[12px] text-gray-500 italic mt-0.5">{plantNeedingAttention.nombre_cientifico || 'Desconocido'}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </div>
                <div className="mt-2 flex gap-1 items-center">
                  <span className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 w-fit",
                    plantNeedingAttention.estado === 'saludable' || !plantNeedingAttention.estado ? "bg-[#edf5f0] text-[#2e5c3a]" : "bg-red-50 text-red-600"
                  )}>
                    <span className="material-symbols-outlined fill text-[13px]">
                      {plantNeedingAttention.estado === 'saludable' || !plantNeedingAttention.estado ? 'favorite' : 'warning'}
                    </span> 
                    {plantNeedingAttention.estado === 'saludable' || !plantNeedingAttention.estado ? 'Saludable' : 'Alerta'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-2">
                  <span className="material-symbols-outlined text-[#3b82f6] text-[14px]">water_drop</span> Revisar humedad
                </p>
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

        {/* Actividad reciente */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900 text-[17px]">Actividad reciente</h3>
            <button className="text-[13px] text-[#2e5c3a] font-medium flex items-center active:opacity-70">Ver todo</button>
          </div>
          
          <div className="space-y-4">
            {/* Item 1 */}
            <div className="flex items-center justify-between active:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#f3f4f6] rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#6e8a75] fill text-[20px]">photo_camera</span>
                </div>
                <div>
                  <p className="text-[14px] text-gray-900"><span className="font-bold tracking-tight">Hoy</span> · Foto analizada</p>
                  <p className="text-[13px] text-gray-500 mt-0.5">{plantNeedingAttention?.nombre_comun || 'Planta'}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-300">chevron_right</span>
            </div>
            {/* Item 2 */}
            <div className="flex items-center justify-between active:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#eff6ff] rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#3b82f6] fill text-[20px]">water_drop</span>
                </div>
                <div>
                  <p className="text-[14px] text-gray-900"><span className="font-bold tracking-tight">Hace 3 días</span> · Riego registrado</p>
                  <p className="text-[13px] text-gray-500 mt-0.5">{plantNeedingAttention?.nombre_comun || 'Planta'}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-300">chevron_right</span>
            </div>
            {/* Item 3 */}
            <div className="flex items-center justify-between active:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#edf5f0] rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#2e5c3a] fill text-[20px]">content_cut</span>
                </div>
                <div>
                  <p className="text-[14px] text-gray-900"><span className="font-bold tracking-tight">Hace 8 días</span> · Poda ligera</p>
                  <p className="text-[13px] text-gray-500 mt-0.5">{plants[1]?.nombre_comun || 'Planta'}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-300">chevron_right</span>
            </div>
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}

