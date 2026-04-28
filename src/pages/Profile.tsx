import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { isPlantOwner, listenToVisiblePlants } from '../lib/plants';
import { Plant } from '../types';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    if (!user) return;
    return listenToVisiblePlants(user.uid, setPlants, (error) => {
      console.error('Error loading profile plants:', error);
    });
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const ownedPlants = plants.filter((plant) => isPlantOwner(plant, user?.uid));
  const sharedPlants = plants.length - ownedPlants.length;
  const healthyPlants = plants.filter((plant) => !plant.estado || plant.estado === 'saludable').length;

  return (
    <div className="bg-[#f8f9fa] min-h-[100dvh] pb-24 font-sans">
      <main className="px-4 pt-8 space-y-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Mi perfil</h1>

        {/* Tarjeta Usuario */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
          {/* Gráfico fondo (simulación planta) */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <span className="material-symbols-outlined text-[150px] text-green-800" style={{ fontVariationSettings: "'FILL' 1" }}>potted_plant</span>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-[72px] h-[72px] rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-[72px] h-[72px] bg-[#4a3696] rounded-full flex items-center justify-center text-white text-4xl font-normal pb-1">
                {getInitials(user?.displayName)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 leading-tight">{user?.displayName || 'Usuario'}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{user?.email || 'Sin correo'}</p>
              <button className="mt-2 text-[13px] text-green-700 font-medium flex items-center gap-1 active:opacity-70">
                <span className="material-symbols-outlined text-[16px]">edit</span> Editar perfil
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="bg-[#edf3ef] p-1.5 rounded-full"><span className="material-symbols-outlined text-green-700 text-[18px]">nest_eco_leaf</span></div>
              <span className="text-lg font-bold text-gray-800">{ownedPlants.length}</span>
            </div>
            <span className="text-[11px] text-gray-500 mt-1">propias</span>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3d6849] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span className="text-lg font-bold text-gray-800">{healthyPlants}</span>
            </div>
            <span className="text-[11px] text-gray-500 mt-1">saludable</span>
          </div>
          <div className="flex-[1.5] bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="bg-[#edf3ef] p-1.5 rounded-full"><span className="material-symbols-outlined text-green-700 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span></div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-800">{sharedPlants} compartidas</span>
                <span className="text-[10px] text-gray-500">plan gratis: 3 propias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferencias */}
        <div>
          <h3 className="text-[15px] font-semibold text-gray-800 mb-3 ml-1">Preferencias</h3>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-[#edf3ef] p-1.5 rounded-full"><span className="material-symbols-outlined text-green-700 text-[20px]">notifications</span></div>
                <span className="text-[14px] text-gray-800 font-medium">Notificaciones</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-[#edf3ef] p-1.5 rounded-full"><span className="material-symbols-outlined text-green-700 text-[20px]">location_on</span></div>
                <span className="text-[14px] text-gray-800 font-medium">Ubicación y clima</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-[#edf3ef] p-1.5 rounded-full"><span className="material-symbols-outlined text-green-700 text-[20px]">schedule</span></div>
                <span className="text-[14px] text-gray-800 font-medium">Recordatorios</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-[#edf3ef] p-1.5 rounded-full"><span className="material-symbols-outlined text-green-700 text-[20px]">palette</span></div>
                <span className="text-[14px] text-gray-800 font-medium">Apariencia</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Cuenta */}
        <div className="pb-6">
          <h3 className="text-[15px] font-semibold text-gray-800 mb-3 ml-1">Cuenta</h3>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-[#edf3ef] p-1.5 rounded-full"><span className="material-symbols-outlined text-green-700 text-[20px]">privacy_tip</span></div>
                <span className="text-[14px] text-gray-800 font-medium">Privacidad</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-[#edf3ef] p-1.5 rounded-full"><span className="material-symbols-outlined text-green-700 text-[20px]">help</span></div>
                <span className="text-[14px] text-gray-800 font-medium">Ayuda</span>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 bg-[#fff9f9] active:bg-[#ffebeb] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-700 text-[22px] ml-1">logout</span>
                <span className="text-[14px] text-red-700 font-medium">Cerrar sesión</span>
              </div>
              <span className="material-symbols-outlined text-red-700">chevron_right</span>
            </button>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
