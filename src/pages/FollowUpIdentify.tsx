import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyzeFollowUpImage, getAiErrorMessage } from '../lib/ai';
import { attachFollowUpAssessment, canCareForPlant, getPlantById, savePlantObservation } from '../lib/plants';
import { homeNavigation, readNavigation, toPlantNavigation, withNavigation } from '../lib/navigation';

export default function FollowUpIdentify() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const image = location.state?.image as string | undefined;
  const observationText = typeof location.state?.observationText === 'string'
    ? location.state.observationText.trim() || undefined
    : undefined;
  const navigation = readNavigation(location.state) || homeNavigation();
  const hasProcessed = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceSaved, setEvidenceSaved] = useState(false);

  useEffect(() => {
    if (!id || !image) {
      navigate(id ? `/planta/${id}/seguimiento` : '/home', id ? { state: withNavigation({}, navigation) } : undefined);
      return;
    }

    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const analyzeAndSave = async () => {
      let eventId: string | undefined;
      try {
        if (!user?.uid) throw new Error('Debes iniciar sesión para guardar la observación.');
        const plant = await getPlantById(id);
        if (!plant || !canCareForPlant(plant, user.uid)) {
          navigate('/home');
          return;
        }

        const saved = await savePlantObservation({
          plant,
          uid: user.uid,
          observedAt: Date.now(),
          text: observationText,
          image,
        });
        eventId = saved.eventId;
        setEvidenceSaved(true);

        const result = await analyzeFollowUpImage({ plant, image, observationText });
        await attachFollowUpAssessment({
          plantId: plant.id,
          eventId,
          uid: user.uid,
          assessment: result,
        });
        navigate(`/planta/${id}`, { replace: true, state: withNavigation({}, toPlantNavigation(navigation)) });
      } catch (err) {
        console.error('Follow-up observation error:', err);
        if (eventId) {
          setError('Tu observación y la foto quedaron guardadas. No pudimos completar el análisis de IA.');
        } else {
          setError(getAiErrorMessage(err, 'No pudimos guardar la observación. Inténtalo de nuevo.'));
        }
      }
    };

    void analyzeAndSave();
  }, [id, image, navigate, observationText, user]);

  const goToPlant = () => navigate(id ? `/planta/${id}` : '/home', id ? { replace: true, state: withNavigation({}, toPlantNavigation(navigation)) } : undefined);
  const goToComposer = () => navigate(id ? `/planta/${id}/seguimiento` : '/home', id ? { state: withNavigation({}, navigation) } : undefined);

  return (
    <div className="bg-background text-on-background min-h-[100dvh] flex flex-col pt-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {image && <img src={image} alt="Observación de la planta" className="w-full h-full object-cover blur-sm opacity-50" />}
        <div className="absolute inset-0 bg-surface/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-grow p-6">
        {error ? (
          <div className="flex flex-col items-center text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined">{evidenceSaved ? 'check_circle' : 'error'}</span>
            </div>
            <p className="font-body-lg text-on-surface">{error}</p>
            <button onClick={evidenceSaved ? goToPlant : goToComposer} className="mt-4 px-6 py-2 bg-primary-container text-on-primary-container rounded-full">
              {evidenceSaved ? 'Volver a la planta' : 'Volver a intentar'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-8 w-full max-w-sm">
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary-container shadow-raised">
              {image && <img src={image} alt="Planta" className="w-full h-full object-cover" />}
              <div className="absolute left-0 w-full h-1 bg-primary shadow-[0_0_8px_rgba(44,95,45,1)] animate-[scan_2s_ease-in-out_infinite_alternate]" />
            </div>
            <div>
              <h2 className="font-display text-[24px] text-on-surface animate-pulse">{evidenceSaved ? 'Completando evaluación visual' : 'Guardando observación'}</h2>
              <p className="font-body-md text-on-surface-variant mt-2">{evidenceSaved ? 'La evidencia quedó guardada; ahora analizamos la foto.' : 'Guardamos primero la foto y el texto original.'}</p>
              <p className="font-body-md text-on-surface-variant mt-2">La evaluación visual de IA es una inferencia y no cambia la salud factual de la planta.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
