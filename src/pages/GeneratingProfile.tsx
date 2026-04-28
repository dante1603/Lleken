import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateCarePlan, getAiErrorMessage } from '../lib/ai';
import { createPlantForUser } from '../lib/plants';
import { getWeatherForPlant, LocationCoords } from '../lib/weather';

export default function GeneratingProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { image, plantData, customName, city, coords } = (location.state as any) || {};
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Preparando datos de la planta...');
  const hasGenerated = React.useRef(false);

  useEffect(() => {
    if (!plantData || !user) {
      navigate('/home');
      return;
    }

    if (hasGenerated.current) return;
    hasGenerated.current = true;

    const generateAndSave = async () => {
      try {
        setStatusText('Consultando clima local...');
        const weather = await getWeatherForPlant(city || '', coords as LocationCoords | null);
        const weatherSummary = weather
          ? weather.summary
          : 'No se pudo obtener clima real. Genera un plan conservador y pide revisar humedad manualmente.';

        setStatusText('Generando plan de cuidados...');
        const carePlan = await generateCarePlan({
          plantData,
          city: weather?.city || city,
          weatherSummary,
        });

        setStatusText('Guardando perfil y foto...');
        const plantId = await createPlantForUser(user, {
          image,
          plantData,
          customName,
          city: weather?.city || city,
          lat: weather?.lat,
          lon: weather?.lon,
          weather: weather?.weather,
          carePlan,
        });

        navigate(`/planta/${plantId}`, { replace: true });
      } catch (err) {
        console.error('Error generating profile:', err);
        setError(getAiErrorMessage(err, 'Hubo un problema guardando el perfil. Por favor intenta otra vez.'));
      }
    };

    generateAndSave();
  }, [city, coords, customName, image, navigate, plantData, user]);

  return (
    <div className="bg-primary-container text-on-primary-container min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
      {error ? (
        <div className="space-y-4">
          <span className="material-symbols-outlined text-6xl text-error">error</span>
          <p className="font-body-lg">{error}</p>
          <button
            onClick={() => navigate('/home')}
            className="mt-4 px-6 py-2 bg-surface text-primary rounded-full font-label-lg"
          >
            Volver al inicio
          </button>
        </div>
      ) : (
        <div className="space-y-8 flex flex-col items-center">
          <span className="material-symbols-outlined text-[80px] animate-bounce">compost</span>
          <h2 className="font-display text-[28px]">Creando perfil...</h2>
          <p className="font-body-md opacity-80 max-w-[250px]">{statusText}</p>
        </div>
      )}
    </div>
  );
}
