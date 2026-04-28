import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NewPlantProgress from '../components/NewPlantProgress';
import { useAuth } from '../contexts/AuthContext';
import { generateCarePlan, getAiErrorMessage } from '../lib/ai';
import { createPlantForUser } from '../lib/plants';
import { getWeatherForPlant, LocationCoords } from '../lib/weather';
import type { PlantContext } from '../types';

function buildContextSummary(context?: PlantContext) {
  if (!context) return undefined;

  return [
    `Ubicacion de cultivo: ${context.ubicacion_tipo || 'sin dato'}`,
    `Maceta con drenaje: ${context.maceta_con_drenaje === false ? 'no' : 'si'}`,
    `Tamano de maceta: ${context.tamano_maceta || 'sin dato'}`,
    `Luz habitual indicada: ${context.luz_usuario || 'sin dato'}`,
  ].join('\n');
}

export default function GeneratingProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { image, plantData, customName, city, coords, context } = (location.state as any) || {};
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Preparando riego, luz y recordatorios');
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
          weather: weather?.weather,
          contextSummary: buildContextSummary(context as PlantContext | undefined),
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
          context,
        });

        navigate(`/planta/${plantId}`, { replace: true });
      } catch (err) {
        console.error('Error generating profile:', err);
        setError(getAiErrorMessage(err, 'Hubo un problema guardando el perfil. Por favor intenta otra vez.'));
      }
    };

    generateAndSave();
  }, [city, context, coords, customName, image, navigate, plantData, user]);

  return (
    <div className="bg-[#1a3824] text-white min-h-[100dvh] flex flex-col items-center p-6 pt-16 pb-10 text-center">
      {error ? (
        <div className="space-y-4 my-auto">
          <span className="material-symbols-outlined text-6xl text-error">error</span>
          <p className="font-body-lg">{error}</p>
          <button
            onClick={() => navigate('/nueva-planta/ubicacion', { state: { image, plantData, customName, city, coords, context } })}
            className="mt-4 px-6 py-3 bg-white text-[#2e5c3a] rounded-2xl font-semibold"
          >
            Revisar datos
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full flex-1">
          <div className="mb-16">
            <NewPlantProgress step={4} dark />
          </div>

          <div className="relative mb-10">
            <div className="w-28 h-28 border-[3px] border-white/10 rounded-full border-t-[#a3c7af] animate-spin" />
            <div className="absolute inset-2 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-[48px] text-[#a3c7af] fill">eco</span>
            </div>
            <span className="absolute top-0 right-4 text-white text-xs animate-pulse">*</span>
            <span className="absolute bottom-4 left-2 text-white text-[10px] animate-pulse">*</span>
          </div>

          <h2 className="text-[28px] font-bold tracking-tight text-center">Creando perfil...</h2>
          <p className="text-[14px] text-[#a3c7af] mt-4 leading-relaxed text-center max-w-[280px]">
            Estamos ajustando el plan de cuidados segun tu ubicacion y el clima actual.
          </p>

          {(city || coords) && (
            <div className="flex items-center justify-center gap-1.5 mt-8 text-[#86d99f]">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span className="text-[13px] font-medium">{city || 'Ubicacion actual'}</span>
            </div>
          )}

          <div className="mt-12 w-full border border-white/20 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
            <div className="flex gap-1 text-[#a3c7af]">
              <span className="material-symbols-outlined text-[16px]">water_drop</span>
              <span className="material-symbols-outlined text-[16px]">light_mode</span>
              <span className="material-symbols-outlined text-[16px]">notifications</span>
            </div>
            <div className="w-[1px] h-4 bg-white/20" />
            <p className="text-[12px] text-white/90 text-left">{statusText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
