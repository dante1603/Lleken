import React, { useState } from 'react';
import { usePlantData } from '../contexts/PlantDataContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { cn } from '../lib/utils';
import { getCareReviewStatus } from '../lib/plants';

type FilterType = 'todas' | 'revisar';

export default function PlantsList() {
  const navigate = useNavigate();
  const { plants, loading } = usePlantData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');
  const [sortBy, setSortBy] = useState<'reciente' | 'nombre'>('reciente');

  const filteredAndSortedPlants = plants
    .filter(plant => {
      // 1. Search Query
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const nameMatch = (plant.nombrePersonalizado || plant.nombre_comun || '').toLowerCase().includes(queryLower);
        const scientificMatch = (plant.nombre_cientifico || '').toLowerCase().includes(queryLower);
        if (!nameMatch && !scientificMatch) return false;
      }

      // 2. Filters
      if (activeFilter === 'revisar') return getCareReviewStatus(plant).reviewPending;
      
      return true; // 'todas'
    })
    .sort((a, b) => {
      if (sortBy === 'reciente') {
        return (b.fecha_creacion || 0) - (a.fecha_creacion || 0);
      } else {
        const nameA = (a.nombrePersonalizado || a.nombre_comun || '').toLowerCase();
        const nameB = (b.nombrePersonalizado || b.nombre_comun || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
    });

  return (
    <div className="bg-[#f8faf8] min-h-[100dvh] font-sans pb-24">
      {/* MAIN CONTENT */}
      <main className="px-5 pt-8 space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Mis plantas</h1>
            <p className="text-[14px] text-gray-500 mt-1">Gestiona y revisa todas tus plantas</p>
          </div>
          <button 
            onClick={() => navigate('/nueva-planta')}
            className="w-12 h-12 bg-[#2e5c3a] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform shrink-0 ml-4"
          >
            <span className="material-symbols-outlined text-[28px]">add</span>
          </button>
        </header>

        {/* Barra de búsqueda */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-[16px] px-4 py-3.5 flex items-center gap-3">
          <span className="material-symbols-outlined text-gray-400 text-[22px]">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o especie" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-[15px] text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Filtros (Pills) */}
        <section className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1 -mx-5 px-5">
          <button 
            onClick={() => setActiveFilter('todas')}
            className={cn(
              "shrink-0 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-[13px] transition-colors border",
              activeFilter === 'todas' 
                ? "bg-[#edf5f0] text-[#2e5c3a] border-[#d2e5d9]" 
                : "bg-white text-gray-700 border-gray-200 active:bg-gray-50"
            )}
          >
            <span className={cn("material-symbols-outlined text-[18px]", activeFilter === 'todas' && "fill")}>nest_eco_leaf</span> Todas
          </button>
          
          <button 
            onClick={() => setActiveFilter('revisar')}
            className={cn(
              "shrink-0 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-[13px] transition-colors border",
              activeFilter === 'revisar'
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-white text-gray-700 border-gray-200 active:bg-gray-50"
            )}
          >
            <span className={cn("material-symbols-outlined text-[18px] text-[#3b82f6]", activeFilter === 'revisar' && "fill")}>water_drop</span> Por revisar
          </button>

        </section>

        {/* Listado de Plantas */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[14px] text-gray-500">{filteredAndSortedPlants.length} planta{filteredAndSortedPlants.length !== 1 ? 's' : ''}</span>
            <button 
              onClick={() => setSortBy(sortBy === 'reciente' ? 'nombre' : 'reciente')}
              className="text-[14px] text-gray-700 flex items-center gap-1 font-medium active:opacity-70"
            >
              Ordenar: {sortBy === 'reciente' ? 'reciente' : 'nombre'} <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
          </div>

          {loading && plants.length === 0 ? (
             <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-100 border-t-[#2e5c3a]" />
             </div>
          ) : filteredAndSortedPlants.length === 0 ? (
             <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">search_off</span>
                </div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Sin resultados</h3>
                <p className="text-[14px] text-gray-500">No se encontraron plantas que coincidan con tu búsqueda.</p>
             </div>
          ) : (
            filteredAndSortedPlants.map(plant => (
              <div 
                key={plant.id}
                onClick={() => navigate(`/planta/${plant.id}`)}
                className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 flex gap-4 items-center relative active:bg-gray-50 transition-colors cursor-pointer"
              >
                {plant.fotoUrl ? (
                  <img 
                    src={plant.fotoUrl} 
                    alt={plant.nombrePersonalizado || plant.nombre_comun || 'Planta'} 
                    className="w-[90px] h-[90px] rounded-2xl object-cover shrink-0 bg-gray-100"
                  />
                ) : (
                  <div className="w-[90px] h-[90px] rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-gray-400 text-[40px]">local_florist</span>
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-center pr-8">
                  <h3 className="text-[17px] font-bold text-gray-900 leading-tight">
                    {plant.nombrePersonalizado || plant.nombre_comun || 'Sin identificar'}
                  </h3>
                  <p className="text-[13px] text-gray-500 italic mt-0.5 line-clamp-1">{plant.nombre_cientifico || 'Desconocido'}</p>
                  
                  <div className="mt-2 text-[11px] font-medium flex gap-2 w-fit">
                    {plant.estado === 'saludable' && (
                      <span className="bg-[#edf5f0] text-[#2e5c3a] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined fill text-[12px]">favorite</span> Saludable
                      </span>
                    )}
                    {!plant.estado && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">help</span> Sin evaluar
                      </span>
                    )}
                    {plant.estado === 'necesita_atencion' && (
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined fill text-[12px]">water_drop</span> Revisar cuidado
                      </span>
                    )}
                    {plant.estado === 'en_riesgo' && (
                      <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined fill text-[12px]">warning</span> Alerta
                      </span>
                    )}
                  </div>
                </div>
                
                <span className="material-symbols-outlined text-gray-300 absolute right-4 top-1/2 -translate-y-1/2 text-[28px]">chevron_right</span>
              </div>
            ))
          )}

          {/* Tarjeta CTA "Agrega otra planta" - Ocultar si hay muchas plantas, p. ej., > 3 */}
          {plants.length <= 3 && (
            <div className="bg-[#fafafa] rounded-[24px] p-5 border border-gray-100 flex gap-4 items-center mt-2">
              <div className="w-[72px] h-[72px] rounded-full border-[2px] border-dashed border-[#b6d1c0] flex items-center justify-center shrink-0 relative bg-white">
                <span className="material-symbols-outlined text-[#6e8a75] text-[32px]">potted_plant</span>
                <div className="absolute bottom-0 right-0 bg-[#2e5c3a] text-white rounded-full w-6 h-6 flex items-center justify-center ring-2 ring-white">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </div>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900">Agrega otra planta</h4>
                <p className="text-[13px] text-gray-600 mt-0.5 leading-snug">Crea un seguimiento para nuevas plantas de tu jardín.</p>
                <button 
                  onClick={() => navigate('/nueva-planta')}
                  className="mt-3 bg-[#2e5c3a] text-white text-[13px] font-medium px-4 py-2 rounded-[10px] shadow-sm active:bg-[#23452b] transition-colors"
                >
                  Agregar planta
                </button>
              </div>
            </div>
          )}

        </section>
      </main>

      <BottomNav />
    </div>
  );
}
