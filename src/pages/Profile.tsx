import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { ProfileAvatar, ProfilePlantAvatarImage, PROFILE_PLANT_AVATARS } from '../components/ProfileAvatar';

export default function Profile() {
  const { user, logout, updateProfileAvatar } = useAuth();
  const navigate = useNavigate();
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [savingAvatarId, setSavingAvatarId] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAvatarSelect = async (avatarId: string) => {
    setSavingAvatarId(avatarId);
    setAvatarMessage(null);

    try {
      await updateProfileAvatar(avatarId);
      setAvatarMessage('Imagen de perfil actualizada.');
    } catch (error) {
      console.error('Error updating profile avatar:', error);
      setAvatarMessage('No se pudo guardar. Intentalo de nuevo.');
    } finally {
      setSavingAvatarId(null);
    }
  };

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
            <ProfileAvatar user={user} className="h-[72px] w-[72px]" fallbackClassName="pb-1 text-4xl font-normal" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800 leading-tight">{user?.displayName || 'Usuario'}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{user?.email || 'Sin correo'}</p>
              <button
                onClick={() => setIsEditingAvatar((value) => !value)}
                className="mt-2 text-[13px] text-green-700 font-medium flex items-center gap-1 active:opacity-70"
              >
                <span className="material-symbols-outlined text-[16px]">palette</span> Elegir imagen
              </button>
            </div>
          </div>
        </div>

        {isEditingAvatar && (
          <section className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-gray-800">Imagen de perfil</h3>
                <p className="mt-1 text-[12px] leading-snug text-gray-500">Ilustraciones de plantas comunes de Chile.</p>
              </div>
              <span className="material-symbols-outlined text-[#2f6b45]">local_florist</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {PROFILE_PLANT_AVATARS.map((avatar) => {
                const isSelected = user?.profileAvatarId === avatar.id;
                const isSaving = savingAvatarId === avatar.id;

                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => void handleAvatarSelect(avatar.id)}
                    disabled={Boolean(savingAvatarId)}
                    className={`relative flex aspect-square items-center justify-center rounded-2xl border bg-[#fbf8f1] transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'border-[#2f6b45] ring-2 ring-[#cfe2d5]'
                        : 'border-gray-100 hover:border-[#9fc5aa]'
                    } ${savingAvatarId ? 'opacity-70' : ''}`}
                    aria-label={`Elegir avatar ${avatar.name}`}
                  >
                    <ProfilePlantAvatarImage avatarId={avatar.id} className="h-[72%] w-[72%]" title={avatar.name} />
                    {isSelected && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#2f6b45] text-white">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </span>
                    )}
                    {isSaving && (
                      <span className="absolute inset-x-2 bottom-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#2f6b45]">
                        Guardando
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {avatarMessage && <p className="mt-3 text-[12px] font-medium text-gray-500">{avatarMessage}</p>}
          </section>
        )}

        {/* Cuenta */}
        <div className="pb-6">
          <h3 className="text-[15px] font-semibold text-gray-800 mb-3 ml-1">Cuenta</h3>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
