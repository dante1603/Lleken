import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyzeFollowUpImage, getAiErrorMessage } from '../lib/ai';
import { canCareForPlant, getPlantById, saveFollowUpPhoto } from '../lib/plants';

export default function FollowUpIdentify() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const image = location.state?.image as string | undefined;
  const hasProcessed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !image) {
      navigate(id ? `/planta/${id}/seguimiento` : '/home');
      return;
    }

    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const analyzeAndSave = async () => {
      try {
        const plant = await getPlantById(id);
        if (!plant || !canCareForPlant(plant, user?.uid)) {
          navigate('/home');
          return;
        }

        const result = await analyzeFollowUpImage({ plant, image });
        await saveFollowUpPhoto(plant, user!.uid, image, result);
        navigate(`/planta/${id}`, { replace: true });
      } catch (err) {
        console.error('Follow-up AI error:', err);
        setError(getAiErrorMessage(err, 'No pudimos guardar el seguimiento. Intentalo de nuevo.'));
      }
    };

    analyzeAndSave();
  }, [id, image, navigate, user]);

  return (
    <div className="bg-background text-on-background min-h-[100dvh] flex flex-col pt-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {image && <img src={image} alt="Analizando seguimiento" className="w-full h-full object-cover blur-sm opacity-50" />}
        <div className="absolute inset-0 bg-surface/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-grow p-6">
        {error ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined">error</span>
            </div>
            <p className="font-body-lg text-on-surface">{error}</p>
            <button onClick={() => navigate(id ? `/planta/${id}/seguimiento` : '/home')} className="mt-4 px-6 py-2 bg-primary-container text-on-primary-container rounded-full">
              Volver a intentar
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-8 w-full max-w-sm">
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary-container shadow-raised">
              {image && <img src={image} alt="Planta" className="w-full h-full object-cover" />}
              <div className="absolute left-0 w-full h-1 bg-primary shadow-[0_0_8px_rgba(44,95,45,1)] animate-[scan_2s_ease-in-out_infinite_alternate]" />
            </div>
            <div>
              <h2 className="font-display text-[24px] text-on-surface animate-pulse">Analizando seguimiento</h2>
              <p className="font-body-md text-on-surface-variant mt-2">Actualizando estado, historial y foto.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
