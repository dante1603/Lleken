import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NewPlantProgress from '../components/NewPlantProgress';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { usePlantData } from '../contexts/PlantDataContext';
import { generateCarePlan, getAiErrorMessage } from '../lib/ai';
import { getOnboardingTimestamps } from '../lib/onboarding';
import { confirmPlantIdentification, createPlantForUser, discardUnconfirmedOwnedPlantsForOnboarding, getLatestConfirmedOwnedPlantForOnboarding } from '../lib/plants';
import { getWeatherForPlant, LocationCoords } from '../lib/weather';
import type { PlantContext } from '../types';
import type { ConfirmedIdentification, IdentificationProposal } from '../domain/identification';
import { getOriginRoute, homeNavigation, readNavigation, toOriginNavigation, toPlantNavigation, withNavigation, withOnboarding } from '../lib/navigation';

function buildContextSummary(context?: PlantContext) {
  if (!context) return undefined;

  return [
    `Ubicación de cultivo: ${context.ubicacion_tipo || 'sin dato'}`,
    `Maceta con drenaje: ${context.maceta_con_drenaje === true ? 'si' : context.maceta_con_drenaje === false ? 'no' : 'sin dato'}`,
    `Tamaño de maceta: ${context.tamano_maceta || 'sin dato'}`,
    `Luz habitual indicada: ${context.luz_usuario || 'sin dato'}`,
  ].join('\n');
}

export default function GeneratingProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const { getCachedPlant, refreshPlant, refreshPlants, removeCachedPlant } = usePlantData();
  const { image, plantData, customName, city, coords, context, confirmedIdentification, onboarding } = (location.state as {
    image?: string;
    plantData?: IdentificationProposal;
    customName?: string;
    city?: string;
    coords?: LocationCoords | null;
    context?: PlantContext;
    confirmedIdentification?: ConfirmedIdentification;
    onboarding?: boolean;
  }) || {};
  const navigation = readNavigation(location.state) || homeNavigation();
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Preparando riego, luz y recordatorios');
  const hasGenerated = useRef(false);
  const onboardingPlantIdRef = useRef<string | null>(null);
  const discardedOnboardingPlantIdsRef = useRef<string[]>([]);
  const identificationConfirmedRef = useRef(false);
  const onboardingCarePlanRef = useRef<unknown>(undefined);

  const finishOnboardingPlant = useCallback(async (plantId: string) => {
    if (!user || !confirmedIdentification) throw new Error('Faltan datos para completar la primera planta.');

    if (!identificationConfirmedRef.current) {
      setStatusText('Confirmando la identificación...');
      await confirmPlantIdentification({
        plantId,
        confirmedBy: user.uid,
        identification: confirmedIdentification,
        carePlan: onboardingCarePlanRef.current,
      });
      identificationConfirmedRef.current = true;
    }

    setStatusText('Sincronizando tu jardín...');
    const refreshed = await refreshPlant(plantId);
    if (!refreshed || !getCachedPlant(plantId)) await refreshPlants();
    if (!getCachedPlant(plantId)) {
      throw new Error('Tu planta fue creada, pero todavía no pudimos sincronizarla con tu jardín.');
    }
    discardedOnboardingPlantIdsRef.current.forEach(removeCachedPlant);

    setStatusText('Activando tu jardín...');
    await completeOnboarding();
    navigate('/home', { replace: true });
  }, [completeOnboarding, confirmedIdentification, getCachedPlant, navigate, refreshPlant, refreshPlants, removeCachedPlant, user]);

  useEffect(() => {
    if (!plantData || !user || confirmedIdentification?.provenance !== 'user_confirmed') {
      navigate(getOriginRoute(navigation), { state: withNavigation({}, toOriginNavigation(navigation)) });
      return;
    }

    if (hasGenerated.current) return;
    hasGenerated.current = true;

    const generateAndSave = async () => {
      try {
        setStatusText('Consultando contexto exterior...');
        const weather = await getWeatherForPlant(city || '', coords as LocationCoords | null);
        const weatherSummary = weather
          ? weather.summary
          : 'No se pudo obtener contexto exterior real. Genera un plan conservador y pide revisar humedad manualmente.';

        setStatusText('Generando plan de cuidados...');
        const carePlan = await generateCarePlan({
          plantData,
          city: weather?.city || city || '',
          weatherSummary,
          weather: weather?.weather,
          contextSummary: buildContextSummary(context as PlantContext | undefined),
        });

        setStatusText('Guardando perfil y foto...');
        if (onboarding) {
          const [timestamps, confirmedPlant] = await Promise.all([
            getOnboardingTimestamps(user.uid),
            getLatestConfirmedOwnedPlantForOnboarding(user.uid),
          ]);
          let plantId = confirmedPlant?.id;
          if (!plantId) {
            if (timestamps.onboarding_started_at) {
              const discardedPlantIds = await discardUnconfirmedOwnedPlantsForOnboarding(user.uid, timestamps.onboarding_started_at);
              discardedOnboardingPlantIdsRef.current = discardedPlantIds;
              discardedPlantIds.forEach(removeCachedPlant);
            }
            plantId = await createPlantForUser(user, {
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
          }
          onboardingPlantIdRef.current = plantId;
          onboardingCarePlanRef.current = carePlan;
          identificationConfirmedRef.current = Boolean(confirmedPlant);
          await finishOnboardingPlant(plantId);
          return;
        }

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

        await confirmPlantIdentification({
          plantId,
          confirmedBy: user.uid,
          identification: confirmedIdentification,
          carePlan,
        });

        navigate(`/planta/${plantId}`, { replace: true, state: withNavigation({}, toPlantNavigation(navigation)) });
      } catch (err) {
        console.error('Error generating profile:', err);
        setError(getAiErrorMessage(err, 'Hubo un problema guardando el perfil. Por favor intenta otra vez.'));
      }
    };

    generateAndSave();
  }, [city, confirmedIdentification, context, coords, customName, finishOnboardingPlant, image, navigate, onboarding, plantData, user]);

  const retryOnboardingHandoff = () => {
    const plantId = onboardingPlantIdRef.current;
    if (!plantId) return;
    setError(null);
    void finishOnboardingPlant(plantId).catch((handoffError) => {
      console.error('Error completing onboarding handoff:', handoffError);
      setError(getAiErrorMessage(handoffError, 'No pudimos terminar de activar tu jardín. Intenta nuevamente.'));
    });
  };

  return (
    <div className="bg-[#1a3824] text-white min-h-[100dvh] flex flex-col items-center p-6 pt-16 pb-10 text-center">
      {error ? (
        <div className="space-y-4 my-auto">
          <span className="material-symbols-outlined text-6xl text-error">error</span>
          <p className="font-body-lg">{error}</p>
          <button
            onClick={() => onboarding && onboardingPlantIdRef.current
              ? retryOnboardingHandoff()
              : navigate('/nueva-planta/ubicacion', { state: withNavigation(withOnboarding({ image, plantData, customName, city, coords, context, confirmedIdentification }, onboarding === true), navigation) })}
            className="mt-4 px-6 py-3 bg-white text-[#2e5c3a] rounded-2xl font-semibold"
          >
            {onboarding && onboardingPlantIdRef.current ? 'Reintentar activación' : 'Revisar datos'}
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
            Estamos preparando tu plan y contexto de cuidado.
          </p>

          {(city || coords) && (
            <div className="flex items-center justify-center gap-1.5 mt-8 text-[#86d99f]">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span className="text-[13px] font-medium">{city || 'Ubicación actual'}</span>
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
