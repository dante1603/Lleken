import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OperationType, handleFirestoreError } from '../lib/firebase';
import { Plant } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import {
  appendPlantAction,
  canCareForPlant,
  deletePlant,
  isPlantOwner,
  listenToPlant,
} from '../lib/plants';

export default function PlantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [checkedHumidity, setCheckedHumidity] = useState(false);
  const [checkedPests, setCheckedPests] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = listenToPlant(id, (plantData) => {
      if (plantData && canCareForPlant(plantData, user?.uid)) {
        setPlant(plantData);
      } else {
        navigate('/home');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `plants/${id}`);
    });
    return unsubscribe;
  }, [id, navigate, user?.uid]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deletePlant(id);
      navigate('/home');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `plants/${id}`);
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
      const action = {
        tipo: 'riego',
        fecha: now,
        descripcion: 'Riego registrado'
      };
      
      await appendPlantAction(plant, action, { fecha_ultimo_riego: now });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `plants/${id}`);
    } finally {
      setIsWatering(false);
    }
  };

  const handleQuickAction = async (tipo: string, descripcion: string) => {
    if (!id || !plant) return;
    if (tipo === 'cosecha') setIsHarvesting(true);
    try {
      const action = {
        tipo,
        fecha: Date.now(),
        descripcion
      };
      await appendPlantAction(plant, action);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `plants/${id}`);
    } finally {
      if (tipo === 'cosecha') setIsHarvesting(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !plant || !noteText.trim()) return;
    setIsAddingNote(true);
    try {
      const action = {
        tipo: 'nota',
        fecha: Date.now(),
        descripcion: noteText.trim()
      };
      
      await appendPlantAction(plant, action);
      setNoteText("");
      setShowNoteModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `plants/${id}`);
    } finally {
      setIsAddingNote(false);
    }
  };

  if (!plant) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-gray-100">Cargando...</div>;
  }

  const isHealthy = plant.estado === 'saludable';
  // Mock watering value since the existing entity doesn't store last specific watered date yet.
  const frequency = plant.plan_cuidados?.riego_frecuencia_dias || 5;

  let lastWateredText = "Desconocido";
  let nextWateringDays = frequency;
  let daysSinceWatered = 0;
  
  if (plant.fecha_ultimo_riego) {
    daysSinceWatered = Math.floor((Date.now() - plant.fecha_ultimo_riego) / (1000 * 60 * 60 * 24));
    if (daysSinceWatered === 0) lastWateredText = "hoy";
    else if (daysSinceWatered === 1) lastWateredText = "hace 1 día";
    else lastWateredText = `hace ${daysSinceWatered} días`;
    
    nextWateringDays = frequency - daysSinceWatered;
  }
  
  const isWaterDue = nextWateringDays <= 0;
  const soilStateIcon = isWaterDue ? '🔴' : nextWateringDays <= 1 ? '🟡' : '🟢';
  const soilStateText = isWaterDue ? 'Seco' : nextWateringDays <= 1 ? 'Moderado' : 'Húmedo';

  const scrollToHistory = () => {
    document.getElementById('historial-reciente')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-100 sm:py-8 sm:flex sm:justify-center min-h-[100dvh] font-sans">
    
      <div className="w-full min-h-[100dvh] bg-[#f8f9fa] sm:max-w-[400px] sm:min-h-[850px] sm:rounded-[2.5rem] sm:shadow-2xl sm:overflow-hidden relative sm:border-[8px] sm:border-gray-900 flex flex-col">
        
        {/* HEADER / HERO SECTION */}
        <header className="relative h-64 shrink-0">
            <img 
              src={plant.fotoUrl || "https://images.unsplash.com/photo-1628156107386-815e982167d4?q=80&w=800&auto=format&fit=crop"} 
              alt={plant.nombre_comun} 
              className="w-full h-full object-cover rounded-b-3xl sm:rounded-none sm:rounded-b-3xl"
            />
            
            <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                <button onClick={() => navigate('/home')} className="bg-white/90 p-2 rounded-full shadow backdrop-blur-sm active:scale-95 transition-transform flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-800">arrow_back</span>
                </button>
                <div className="flex gap-2">
                  {isPlantOwner(plant, user?.uid) && (
                    <button onClick={() => setShowDeleteModal(true)} className="bg-white/90 p-2 rounded-full shadow backdrop-blur-sm active:scale-95 transition-transform flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-800">delete</span>
                    </button>
                  )}
                  <button className="bg-white/90 p-2 rounded-full shadow backdrop-blur-sm active:scale-95 transition-transform flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-800">more_horiz</span>
                  </button>
                </div>
            </div>

            <div className="absolute -bottom-6 left-4 right-4 bg-white rounded-2xl p-4 shadow-md z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight leading-tight capitalize">
                          {plant.nombrePersonalizado || plant.nombre_comun || 'Planta'}
                        </h1>
                        <p className="text-sm italic text-gray-600">
                          {plant.nombre_cientifico || 'Sin identificar'}
                        </p>
                    </div>
                    <button onClick={scrollToHistory} className={cn(
                      "text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm text-white active:scale-95 transition-transform cursor-pointer",
                      isHealthy ? "bg-[#2e5c3a]" : "bg-orange-500"
                    )}>
                        <span className="material-symbols-outlined icon-filled text-[14px]">
                          {isHealthy ? 'local_hospital' : 'warning'}
                        </span> 
                        {isHealthy ? 'SANO · hoy' : 'ATENCIÓN · hoy'}
                    </button>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1.5">
                    <p className="flex items-center gap-1.5 line-clamp-1">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span> 
                      {plant.ciudad || 'Ubicación desconocida'}
                    </p>
                </div>
            </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="px-4 pt-10 pb-8 space-y-4 flex-1 overflow-y-auto hide-scrollbar">
            
            {/* Tarjeta "Hoy" */}
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-1.5 text-sm">
                    <span className="material-symbols-outlined text-green-700 text-[20px]">calendar_today</span> Hoy
                </h2>
                
                <div className="bg-[#fafafa] rounded-xl p-3 border border-gray-100">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pendiente</h3>
                    <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex flex-col">
                                <span className={cn("text-[13px] font-medium transition-colors", checkedHumidity ? "text-gray-400 line-through" : "text-gray-800")}>Revisar humedad</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={checkedHumidity}
                              onChange={(e) => setCheckedHumidity(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-[#2e5c3a] focus:ring-[#2e5c3a]" 
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex flex-col">
                                <span className={cn("text-[13px] font-medium transition-colors", checkedPests ? "text-gray-400 line-through" : "text-gray-800")}>Revisar plagas</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={checkedPests}
                              onChange={(e) => setCheckedPests(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-[#2e5c3a] focus:ring-[#2e5c3a]" 
                            />
                        </label>
                    </div>
                </div>

                <div className="bg-[#fafafa] rounded-xl p-3 border border-gray-100">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Condiciones</h3>
                    <div className="space-y-3">
                        {plant.clima_actual && plant.clima_actual.temp_max && (
                          <div className="flex gap-2.5 items-start">
                              <span className="material-symbols-outlined text-yellow-500 mt-0.5 text-[18px]">light_mode</span>
                              <p className="text-[12px] text-gray-600 mt-0.5"><span className="font-semibold text-gray-800">Mañana: {plant.clima_actual.temp_max}°C</span> · evita sol tarde</p>
                          </div>
                        )}
                        <div className="flex gap-2.5 items-start">
                            <span className="material-symbols-outlined text-blue-400 mt-0.5 text-[18px]">water_drop</span>
                            <div>
                                <p className="text-[12px] text-gray-800 font-medium mt-0.5">Estado suelo: [{soilStateIcon} {soilStateText}]</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">Estimado · {daysSinceWatered} días desde riego</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Botones de Acción Rápida */}
            <section className="grid grid-cols-4 gap-2">
                <button 
                  onClick={handleWater} 
                  disabled={isWatering}
                  className={cn(
                    "py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer disabled:opacity-50",
                    isWatering ? "bg-[#dce8e0] text-[#2e5c3a]" : "bg-[#edf3ef] text-[#2e5c3a] hover:bg-[#e4ece7] active:bg-[#dce8e0]"
                  )}
                >
                    <span className="material-symbols-outlined text-[20px] sm:text-[22px]">{isWatering ? 'hourglass_empty' : 'water_drop'}</span>
                    <span className="text-[10px] sm:text-[11px] font-semibold leading-tight text-center">Riego</span>
                </button>
                <button 
                  onClick={() => handleQuickAction('cosecha', 'Cosecha registrada')}
                  disabled={isHarvesting} 
                  className={cn(
                    "bg-[#edf3ef] text-[#2e5c3a] py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-[#e4ece7] active:bg-[#dce8e0] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  )}
                >
                    <span className="material-symbols-outlined text-[20px] sm:text-[22px]">{isHarvesting ? 'hourglass_empty' : 'volunteer_activism'}</span>
                    <span className="text-[10px] sm:text-[11px] font-semibold leading-tight text-center">Cosecha</span>
                </button>
                <button onClick={() => navigate(`/planta/${plant.id}/seguimiento`)} className="bg-[#edf3ef] text-[#2e5c3a] py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-[#e4ece7] active:bg-[#dce8e0] transition-colors shadow-sm cursor-pointer">
                    <span className="material-symbols-outlined text-[20px] sm:text-[22px]">photo_camera</span>
                    <span className="text-[10px] sm:text-[11px] font-semibold leading-tight text-center">Foto</span>
                </button>
                <button onClick={() => setShowNoteModal(true)} className="bg-[#edf3ef] text-[#2e5c3a] py-3 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-[#e4ece7] active:bg-[#dce8e0] transition-colors shadow-sm cursor-pointer">
                    <span className="material-symbols-outlined text-[20px] sm:text-[22px]">edit_document</span>
                    <span className="text-[10px] sm:text-[11px] font-semibold leading-tight text-center">Nota</span>
                </button>
            </section>

            {/* Resumen de Cuidados (Scroll Horizontal) */}
            {plant.plan_cuidados && (
              <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-1.5 text-sm">
                          <span className="material-symbols-outlined text-green-700 text-[20px]">eco</span> Resumen de cuidados
                      </h3>
                      <button className="text-[11px] text-gray-500 font-medium flex items-center active:text-gray-800">Ver todo <span className="material-symbols-outlined text-[14px]">chevron_right</span></button>
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
                      {/* Card 1: Riego */}
                      <div className="snap-start shrink-0 w-[120px] bg-[#fafafa] border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col">
                          <span className="material-symbols-outlined text-green-600 mb-1">water_drop</span>
                          <h4 className="text-[13px] font-bold text-gray-800">Riego</h4>
                          <p className="text-[11px] text-gray-800 font-semibold mt-0.5">Cada {frequency} días</p>
                          <p className="text-[10px] text-gray-500 leading-tight mt-1 line-clamp-2">Revisar si los 2 cm superiores están secos</p>
                      </div>
                      {/* Card 2: Luz */}
                      <div className="snap-start shrink-0 w-[120px] bg-[#fafafa] border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col">
                          <span className="material-symbols-outlined text-yellow-500 mb-1">light_mode</span>
                          <h4 className="text-[13px] font-bold text-gray-800">Luz</h4>
                          <p className="text-[11px] text-gray-500 leading-tight mt-1.5 capitalize line-clamp-3">{plant.plan_cuidados.exposicion_sol || "Sol indirecto"}</p>
                      </div>
                      {/* Card 3: Poda */}
                      {plant.plan_cuidados.tareas_adicionales && plant.plan_cuidados.tareas_adicionales.length > 0 && (
                        <div className="snap-start shrink-0 w-[120px] bg-[#fafafa] border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col">
                            <span className="material-symbols-outlined text-green-700 mb-1">content_cut</span>
                            <h4 className="text-[13px] font-bold text-gray-800">Poda</h4>
                            <p className="text-[11px] text-gray-500 leading-tight mt-1.5 line-clamp-3">{plant.plan_cuidados.tareas_adicionales[0]}</p>
                        </div>
                      )}
                      
                      {/* Drenaje/Otros (Mock based on the HTML provided by user) */}
                      <div className="snap-start shrink-0 w-[120px] bg-[#fafafa] border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col">
                          <span className="material-symbols-outlined text-green-800 mb-1">line_weight</span>
                          <h4 className="text-[13px] font-bold text-gray-800">Drenaje</h4>
                          <p className="text-[11px] text-gray-500 leading-tight mt-1.5">Maceta con buen drenaje</p>
                      </div>
                      {/* Card 4: Cosecha */}
                      <div className="snap-start shrink-0 w-[120px] bg-[#fafafa] border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col">
                          <span className="material-symbols-outlined text-green-600 mb-1">spa</span>
                          <h4 className="text-[13px] font-bold text-gray-800">Cosecha</h4>
                          <p className="text-[11px] text-gray-500 leading-tight mt-1.5">Antes de florecer. Hojas jóvenes tienen más sabor</p>
                      </div>
                  </div>
              </section>
            )}

            {/* Alertas Inteligentes */}
            {plant.plan_cuidados?.alertas_clima && plant.plan_cuidados.alertas_clima.length > 0 ? (
              <section className="bg-[#fff8eb] border border-[#fce3b8] rounded-xl p-3 shadow-sm flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-orange-400 text-[20px] mt-0.5">warning</span>
                  <div className="flex-1">
                      <div className="flex justify-between items-center">
                          <h4 className="text-[13px] font-bold text-gray-800">Alerta de clima</h4>
                      </div>
                      <p className="text-[11px] text-gray-700 mt-1 leading-tight">{plant.plan_cuidados.alertas_clima[0]}</p>
                  </div>
              </section>
            ) : daysSinceWatered > frequency ? (
               <section className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3 shadow-sm flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5">water_drop</span>
                  <div className="flex-1">
                      <div className="flex justify-between items-center">
                          <h4 className="text-[13px] font-bold text-red-800">Riego atrasado</h4>
                      </div>
                      <p className="text-[11px] text-red-700 mt-1 leading-tight">Han pasado {daysSinceWatered} días sin regar. Revisa la humedad urgente.</p>
                  </div>
              </section>
            ) : (
               <section className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 shadow-sm flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-blue-500 text-[20px] mt-0.5">science</span>
                  <div className="flex-1">
                      <div className="flex justify-between items-center">
                          <h4 className="text-[13px] font-bold text-blue-800">Fertilización</h4>
                      </div>
                      <p className="text-[11px] text-blue-700 mt-1 leading-tight">Temporada activa: fertilizar esta semana si no lo has hecho.</p>
                  </div>
              </section>
            )}

            {/* Historial Reciente */}
            <section id="historial-reciente" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 scroll-mt-24">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-1.5 text-sm">
                        <span className="material-symbols-outlined text-green-700 text-[20px]">history</span> Historial reciente
                    </h3>
                    <button className="text-[11px] text-gray-500 font-medium flex items-center hover:text-gray-800 transition-colors">Ver todo <span className="material-symbols-outlined text-[14px]">chevron_right</span></button>
                </div>
                
                <div className="ml-2.5 border-l-2 border-[#a3c7af] pl-4 space-y-4 relative">
                    {plant.historial_acciones && plant.historial_acciones.length > 0 ? (
                      plant.historial_acciones.slice(0, 5).map((accion, idx) => {
                        const daysAgo = Math.floor((Date.now() - accion.fecha) / (1000 * 60 * 60 * 24));
                        let timeText = daysAgo === 0 ? "Hoy" : daysAgo === 1 ? "Ayer" : `Hace ${daysAgo} días`;
                        
                        let icon = "info";
                        if (accion.tipo === 'riego') icon = "water_drop";
                        else if (accion.tipo === 'foto') icon = "photo_camera";
                        else if (accion.tipo === 'poda') icon = "content_cut";
                        else if (accion.tipo === 'nota') icon = "edit_document";
                        else if (accion.tipo === 'fertilizacion') icon = "science";
                        else if (accion.tipo === 'cosecha') icon = "spa";
                        else if (accion.tipo === 'plagas') icon = "bug_report";

                        return (
                          <div key={idx} className="relative">
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-[#2e5c3a] rounded-full ring-4 ring-white"></div>
                              <div className="flex gap-2.5">
                                  <span className="material-symbols-outlined text-gray-400 text-[18px]">{icon}</span>
                                  <div>
                                      <p className="text-[12px] text-gray-800"><span className="font-bold">{timeText}</span> · {accion.tipo === 'riego' ? 'Riego registrado' : accion.descripcion || 'Acción'}</p>
                                      {accion.descripcion && accion.tipo !== 'riego' && <p className="text-[11px] text-gray-500 mt-0.5">{accion.descripcion}</p>}
                                      {accion.tipo === 'riego' && <p className="text-[11px] text-gray-500 mt-0.5">{accion.descripcion}</p>}
                                  </div>
                              </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-[12px] text-gray-500 italic">No hay acciones registradas aún.</div>
                    )}
                </div>
            </section>

            {/* Sobre esta planta (Acordeón) */}
            {plant.info_general && plant.info_general.descripcion && (
              <section 
                onClick={() => setShowAbout(!showAbout)}
                className="bg-[#edf3ef] rounded-xl p-3.5 shadow-sm active:bg-[#e4ece7] transition-colors cursor-pointer"
              >
                  <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                          <span className="material-symbols-outlined text-green-700 text-[20px]">nest_eco_leaf</span>
                          <div>
                              <h4 className="text-[13px] font-bold text-gray-800">Sobre esta planta</h4>
                              <p className={cn(
                                "text-[11px] text-gray-600 mt-1 leading-relaxed pr-2 transition-all",
                                !showAbout && "line-clamp-2"
                              )}>
                                {plant.info_general.descripcion}
                              </p>
                          </div>
                      </div>
                      <span className={cn("material-symbols-outlined text-gray-400 mt-0.5 transition-transform", showAbout && "rotate-180")}>
                        expand_more
                      </span>
                  </div>
              </section>
            )}

        </main>

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:absolute sm:rounded-[2.5rem]">
            <div className="bg-white w-full max-w-[90%] rounded-2xl p-6 shadow-xl flex flex-col gap-4 animate-fade-in-up">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-red-500">
                  <span className="material-symbols-outlined text-[28px]">warning</span>
                  <h3 className="font-bold text-[20px] text-gray-800">Eliminar planta</h3>
                </div>
                <p className="text-sm text-gray-600 pt-2">
                  ¿Estás seguro de que quieres eliminar <strong>{plant.nombrePersonalizado || plant.nombre_comun}</strong>? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showNoteModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 backdrop-blur-sm sm:absolute sm:rounded-[2.5rem] transition-all">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-2xl p-6 shadow-xl flex flex-col gap-4 animate-slide-up sm:animate-fade-in-up">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#2e5c3a]">
                  <span className="material-symbols-outlined">edit_document</span>
                  <h3 className="font-bold text-[18px] text-gray-800">Agregar nota</h3>
                </div>
                <button 
                  onClick={() => setShowNoteModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="¿Cómo está tu planta hoy? Escribe aquí cuidados, observaciones..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3c7af] focus:border-transparent min-h-[120px] resize-none"
                autoFocus
              />
              
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={handleAddNote}
                  disabled={isAddingNote || !noteText.trim()}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2 text-[13px] font-semibold bg-[#2e5c3a] text-white rounded-xl hover:bg-[#23462c] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isAddingNote ? 'Guardando...' : 'Guardar nota'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
