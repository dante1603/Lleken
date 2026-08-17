import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NewPlantProgress from '../components/NewPlantProgress';
import { getWeatherForPlant, isCurrentWeatherRequest, isWeatherResultForLocation, type LocationCoords, type LocationSuggestion, type WeatherLookupResult, searchLocations } from '../lib/weather';
import type { PlantContext } from '../types';
import type { IdentificationProposal } from '../domain/identification';
import { confirmedContextFromTouched } from '../domain/context';
import {
  acceptedIdentificationFromProposal,
  type ConfirmedIdentification,
} from '../domain/identification';
import { getOriginRoute, homeNavigation, readNavigation, toOriginNavigation, withNavigation, withOnboarding } from '../lib/navigation';

type LocationState = 'idle' | 'searching' | 'gps-success' | 'manual-success' | 'error';

type WeatherPreviewState =
  | { status: 'idle' | 'loading' | 'error'; result: null }
  | { status: 'ready'; result: WeatherLookupResult };

export default function LocationInput() {
  const location = useLocation();
  const navigate = useNavigate();
  const { image, plantData } = (location.state as { image?: string; plantData?: IdentificationProposal } | null) || {};
  const navigation = readNavigation(location.state) || homeNavigation();
  const onboarding = location.state?.onboarding === true;

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [weatherPreview, setWeatherPreview] = useState<WeatherPreviewState>({ status: 'idle', result: null });
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [confirmedIdentification, setConfirmedIdentification] = useState<ConfirmedIdentification | null>(null);
  const [identificationStatus, setIdentificationStatus] = useState<string | null>(null);
  const locationRevisionRef = useRef(0);
  const weatherRequestIdRef = useRef(0);
  const weatherRequestRef = useRef<Promise<WeatherLookupResult | null> | null>(null);
  // Starts empty: inferred photo data is a suggestion, not a confirmation.
  const [context, setContext] = useState<PlantContext>({});
  const inferredContext = useMemo(() => plantData?.contexto_inferido || {}, [plantData]);

  useEffect(() => {
    if (selectedLocation || city.trim().length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocations(false);
      return;
    }

    let cancelled = false;
    setIsSearchingLocations(true);

    const timeout = window.setTimeout(async () => {
      const results = await searchLocations(city, 7);
      if (!cancelled) {
        setLocationSuggestions(results);
        setIsSearchingLocations(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [city, selectedLocation]);

  const invalidateWeatherPreview = () => {
    locationRevisionRef.current += 1;
    weatherRequestIdRef.current += 1;
    setWeatherPreview({ status: 'idle', result: null });
    return locationRevisionRef.current;
  };

  const loadWeatherPreview = (locationName: string, nextCoords: LocationCoords, revision = locationRevisionRef.current) => {
    const requestId = ++weatherRequestIdRef.current;
    setWeatherPreview({ status: 'loading', result: null });
    const request = getWeatherForPlant(locationName, nextCoords);
    weatherRequestRef.current = request;

    void request.then((result) => {
      if (!isCurrentWeatherRequest(requestId, weatherRequestIdRef.current) || revision !== locationRevisionRef.current) return;

      if (!result || !isWeatherResultForLocation(result, nextCoords)) {
        setWeatherPreview({ status: 'error', result: null });
        return;
      }

      setWeatherPreview({ status: 'ready', result });
    }).catch(() => {
      if (!isCurrentWeatherRequest(requestId, weatherRequestIdRef.current) || revision !== locationRevisionRef.current) return;
      setWeatherPreview({ status: 'error', result: null });
    }).finally(() => {
      if (isCurrentWeatherRequest(requestId, weatherRequestIdRef.current)) weatherRequestRef.current = null;
    });
  };

  const retryWeatherPreview = () => {
    if (coords) loadWeatherPreview(city.trim() || 'Ubicación actual', coords);
  };

  const handleNext = async () => {
    if (!confirmedIdentification) {
      setIdentificationStatus('Confirma la propuesta o toma otra foto antes de continuar.');
      return;
    }

    if (!city.trim() && !coords) {
      setLocationState('error');
      setLocationError('Escribe tu ciudad o usa tu ubicación actual para continuar.');
      return;
    }

    const selectionRevision = locationRevisionRef.current;
    let reusableWeather = weatherPreview.status === 'ready' && isWeatherResultForLocation(weatherPreview.result, coords)
      ? weatherPreview.result
      : undefined;

    if (!reusableWeather && weatherPreview.status === 'loading' && weatherRequestRef.current) {
      try {
        const pendingWeather = await weatherRequestRef.current;
        if (selectionRevision !== locationRevisionRef.current) return;
        if (isWeatherResultForLocation(pendingWeather, coords)) reusableWeather = pendingWeather;
      } catch {
        // GeneratingProfile keeps the existing conservative fallback when preview fails.
      }
    }

    if (selectionRevision !== locationRevisionRef.current) return;

    navigate('/nueva-planta/generando', {
      state: withNavigation(withOnboarding({
        image,
        plantData,
        confirmedIdentification,
        customName: name.trim(),
        city: selectedLocation?.displayName || city.trim(),
        coords,
        weatherResult: reusableWeather,
        context: confirmedContextFromTouched(context),
      }, onboarding), navigation),
    });
  };

  const updateContext = <K extends keyof PlantContext>(key: K, value: PlantContext[K]) => {
    setContext((current) => ({ ...current, [key]: value }));
  };

  const useCurrentLocation = () => {
    const revision = invalidateWeatherPreview();
    setLocationState('searching');
    setLocationError(null);
    setGpsAccuracy(null);

    if (!navigator.geolocation) {
      setLocationState('error');
      setLocationError('Tu navegador no permite geolocalización. Puedes utilizar una ubicación manual.');
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      if (revision !== locationRevisionRef.current) return;

      const nextCoords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      setCoords(nextCoords);
      const currentLocation: LocationSuggestion = {
        id: 'current-location',
        name: 'Ubicación actual',
        displayName: 'Ubicación actual',
        lat: nextCoords.lat,
        lon: nextCoords.lon,
      };
      setSelectedLocation(currentLocation);
      setCity(currentLocation.displayName);
      setLocationState('gps-success');
      setLocationError(null);
      setGpsAccuracy(Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null);
      loadWeatherPreview(currentLocation.displayName, nextCoords, revision);
    }, () => {
      if (revision !== locationRevisionRef.current) return;
      setLocationState('error');
      setLocationError('No pudimos obtener tu ubicación. Puedes reintentar GPS o utilizar una ubicación manual.');
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  };

  const selectLocation = (suggestion: LocationSuggestion) => {
    const revision = invalidateWeatherPreview();
    const nextCoords = { lat: suggestion.lat, lon: suggestion.lon };
    setSelectedLocation(suggestion);
    setCity(suggestion.displayName);
    setCoords(nextCoords);
    setLocationSuggestions([]);
    setLocationState('manual-success');
    setLocationError(null);
    setGpsAccuracy(null);
    loadWeatherPreview(suggestion.displayName, nextCoords, revision);
  };

  const inferredMatches = <K extends keyof PlantContext>(key: K, value: PlantContext[K]) => {
    const inferred = inferredContext[key];
    return inferred !== null && inferred !== undefined && inferred === value;
  };

  const weatherLocationLabel = selectedLocation?.displayName || city.trim() || 'Ubicación actual';

  const confirmIdentification = () => {
    if (!plantData) {
      setIdentificationStatus('No hay una identidad suficiente para confirmar. Toma otra foto.');
      return;
    }

    const accepted = acceptedIdentificationFromProposal(plantData);
    if (!accepted) {
      setIdentificationStatus('No hay una identidad suficiente para confirmar. Toma otra foto.');
      return;
    }

    setConfirmedIdentification(accepted);
    setIdentificationStatus(null);
  };

  const retakePhoto = () => {
    navigate('/nueva-planta', { state: withNavigation(withOnboarding({}, onboarding), navigation) });
  };

  if (!plantData) {
    return (
      <div className="p-4 text-center mt-20">
        <p>Faltan datos de la planta.</p>
        <button onClick={() => navigate(getOriginRoute(navigation), { state: withNavigation({}, toOriginNavigation(navigation)) })} className="text-primary mt-4">Volver</button>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f7f5] text-on-background min-h-[100dvh] flex flex-col p-5 pt-10 pb-8 relative">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/nueva-planta', { state: withNavigation(withOnboarding({}, onboarding), navigation) })}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform text-gray-700"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <NewPlantProgress step={3} />
        <div className="w-10" />
      </div>

      <div className="flex-grow flex flex-col max-w-sm mx-auto w-full">
        {!confirmedIdentification ? (
          <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 min-[360px]:flex-row">
              {image && <img src={image} className="h-20 w-20 shrink-0 rounded-2xl object-cover" alt="Propuesta de identificación de tu planta" />}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2e5c3a]">Propuesta de identificación</p>
                <h1 className="mt-1 break-words text-lg font-bold leading-tight text-gray-900">{plantData.nombre_comun || 'Propuesta sin nombre'}</h1>
                {plantData.nombre_cientifico && (
                  <p className="mt-0.5 break-words text-[13px] italic leading-relaxed text-gray-500">{plantData.nombre_cientifico}</p>
                )}
                <div className="mt-4">
                  <p className="text-[14px] font-semibold text-[#163b24]">¿Coincide con tu planta?</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#45604d]">Revisa la propuesta antes de continuar.</p>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                  <button type="button" onClick={confirmIdentification} className="min-h-[48px] rounded-xl bg-[#2e5c3a] px-3 py-3 text-[13px] font-semibold text-white active:scale-[0.99]">
                    Sí, coincide
                  </button>
                  <button type="button" onClick={retakePhoto} className="min-h-[48px] rounded-xl border border-[#9cb7a4] bg-white px-3 py-3 text-[13px] font-semibold text-[#2e5c3a] active:scale-[0.99]">
                    Tomar otra foto
                  </button>
                </div>
                {identificationStatus && <p className="mt-3 text-[12px] font-medium text-red-700" role="alert">{identificationStatus}</p>}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex gap-4">
              {image && <img src={image} className="h-16 w-16 shrink-0 rounded-2xl object-cover" alt="Identificación confirmada de tu planta" />}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2e5c3a]">Identificación confirmada</p>
                <h1 className="mt-1 break-words text-base font-bold leading-tight text-gray-900">{plantData.nombre_comun || 'Planta confirmada'}</h1>
                {plantData.nombre_cientifico && (
                  <p className="mt-0.5 break-words text-[12px] italic leading-relaxed text-gray-500">{plantData.nombre_cientifico}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2e5c3a]">
                    <span aria-hidden="true">✓</span>
                    Confirmada por ti
                  </span>
                  <button type="button" onClick={retakePhoto} className="min-h-[36px] text-[12px] font-semibold text-[#2e5c3a] underline underline-offset-2">
                    Cambiar foto
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {confirmedIdentification && (
          <div className="mt-8 space-y-6">
            <header>
              <h2 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">Contexto de tu planta</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-600">Tu ubicación nos permite sumar el clima exterior como contexto.</p>
            </header>

            <section className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-800">¿En qué ciudad estás?</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">location_on</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    invalidateWeatherPreview();
                    setCity(e.target.value);
                    setSelectedLocation(null);
                    setCoords(null);
                    setLocationState('idle');
                    setLocationError(null);
                    setGpsAccuracy(null);
                  }}
                  placeholder="Ej. Las Condes, Santiago"
                  className="w-full rounded-2xl border border-gray-300 bg-white py-3.5 pl-12 pr-4 text-[14px] text-gray-800 transition-all placeholder:text-gray-400 focus:border-[#2e5c3a] focus:outline-none focus:ring-1 focus:ring-[#2e5c3a]"
                />
              </div>
              {(locationSuggestions.length > 0 || isSearchingLocations) && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  {isSearchingLocations && (
                    <div className="px-4 py-3 text-[12px] text-gray-500">Buscando ubicaciones...</div>
                  )}
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => selectLocation(suggestion)}
                      className="w-full border-t border-gray-100 px-4 py-3 text-left active:bg-[#eef5f0] first:border-t-0"
                    >
                      <span className="block break-words text-[13px] font-semibold text-gray-800">{suggestion.name}</span>
                      <span className="block break-words text-[11px] text-gray-500">{suggestion.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] leading-tight text-gray-500">Puedes elegir una sugerencia para usar coordenadas más precisas.</p>
              <button
                type="button"
                onClick={useCurrentLocation}
                className="mt-1 flex min-h-[40px] w-fit items-center gap-1.5 rounded-xl bg-[#eef5f0] px-4 py-2 text-[12px] font-semibold text-[#2e5c3a] transition-colors active:bg-[#e4ece7]"
              >
                <span className="material-symbols-outlined text-[18px]">my_location</span>
                {locationState === 'error' ? 'Reintentar GPS' : 'Usar ubicación actual'}
              </button>
              {locationState === 'searching' && <p className="text-[11px] text-gray-600" role="status">Buscando ubicación…</p>}
              {locationState === 'gps-success' && (
                <p className="text-[11px] font-semibold text-[#2e5c3a]" role="status">
                  Ubicación obtenida por GPS{gpsAccuracy !== null ? ` · Precisión aproximada: ±${Math.round(gpsAccuracy)} m` : ''}
                </p>
              )}
              {locationState === 'manual-success' && <p className="text-[11px] font-semibold text-[#2e5c3a]" role="status">Ubicación manual seleccionada.</p>}
              {locationState === 'error' && locationError && <p className="text-[11px] text-red-700" role="alert">{locationError}</p>}

              {weatherPreview.status !== 'idle' && (
                <section className="space-y-2 rounded-2xl border border-[#d2e5d9] bg-white p-4" aria-live="polite">
                  {weatherPreview.status === 'loading' && (
                    <p className="text-[12px] text-gray-600">Añadiendo clima exterior…</p>
                  )}
                  {weatherPreview.status === 'ready' && (
                    <>
                      <p className="text-[12px] font-semibold text-[#2e5c3a]">Clima exterior añadido</p>
                      <p className="text-[11px] text-gray-600">Ubicación utilizada: {weatherLocationLabel}</p>
                      <details className="text-[11px] text-gray-600">
                        <summary className="cursor-pointer font-semibold text-[#2e5c3a]">Ver detalle</summary>
                        <div className="mt-2 space-y-2 leading-relaxed">
                          <div className="grid grid-cols-1 gap-1 min-[360px]:grid-cols-2 text-[12px] text-gray-700">
                            {weatherPreview.result.weather.temp_actual !== undefined && <span>Temperatura: {weatherPreview.result.weather.temp_actual} °C</span>}
                            {weatherPreview.result.weather.humedad_relativa !== undefined && <span>Humedad: {weatherPreview.result.weather.humedad_relativa}%</span>}
                          </div>
                          <p>Fuente: Open-Meteo</p>
                          <p>Es contexto meteorológico exterior, no una medición junto a la planta.</p>
                        </div>
                      </details>
                    </>
                  )}
                  {weatherPreview.status === 'error' && (
                    <>
                      <p className="text-[12px] text-red-700">No pudimos añadir el clima exterior ahora.</p>
                      <p className="text-[11px] text-gray-600">Puedes continuar sin él.</p>
                      <button type="button" onClick={retryWeatherPreview} className="min-h-[36px] text-[12px] font-semibold text-[#2e5c3a] underline underline-offset-2">Reintentar</button>
                    </>
                  )}
                </section>
              )}
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13px] font-semibold text-gray-800">¿Dónde vive normalmente?</h3>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">Opcional</span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
                {[
                  { value: 'interior', label: 'Interior' },
                  { value: 'balcon', label: 'Balcón' },
                  { value: 'exterior', label: 'Exterior' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateContext('ubicacion_tipo', option.value as PlantContext['ubicacion_tipo'])}
                    aria-pressed={context.ubicacion_tipo === option.value}
                    className={`min-h-[48px] rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${context.ubicacion_tipo === option.value ? 'border-[#2e5c3a] bg-[#2e5c3a] text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                  >
                    <span>{option.label}</span>
                    {inferredMatches('ubicacion_tipo', option.value as PlantContext['ubicacion_tipo']) && (
                      <span className={`mt-0.5 block text-[9px] font-medium ${context.ubicacion_tipo === option.value ? 'text-white/80' : 'text-[#2e5c3a]'}`}>Sugerido desde la foto</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[13px] font-semibold text-gray-800">¿Qué nombre quieres ponerle?</label>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">Opcional</span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">potted_plant</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={plantData.nombre_sugerido ? `Ej. ${plantData.nombre_sugerido}` : 'Ej. Tomatin'}
                  className="w-full rounded-2xl border border-gray-300 bg-white py-3.5 pl-12 pr-4 text-[14px] text-gray-800 transition-all placeholder:text-gray-400 focus:border-[#2e5c3a] focus:outline-none focus:ring-1 focus:ring-[#2e5c3a]"
                />
              </div>
            </section>

            <details className="rounded-2xl border border-gray-200 bg-white p-4">
              <summary className="cursor-pointer text-[13px] font-semibold text-gray-800">Afinar el cuidado · opcional</summary>
              <p className="mt-1 text-[11px] text-gray-500">Luz, drenaje y tamaño de maceta</p>
              <div className="mt-4 space-y-5">
                <section>
                  <h3 className="text-[13px] font-semibold text-gray-800">Luz habitual</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { value: 'baja', label: 'Baja' },
                      { value: 'media', label: 'Media' },
                      { value: 'brillante_indirecta', label: 'Indirecta' },
                      { value: 'sol_directo', label: 'Sol directo' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateContext('luz_usuario', option.value as PlantContext['luz_usuario'])}
                        aria-pressed={context.luz_usuario === option.value}
                        className={`min-h-[48px] rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${context.luz_usuario === option.value ? 'border-[#2e5c3a] bg-[#2e5c3a] text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                      >
                        <span>{option.label}</span>
                        {inferredMatches('luz_usuario', option.value as PlantContext['luz_usuario']) && (
                          <span className={`mt-0.5 block text-[9px] font-medium ${context.luz_usuario === option.value ? 'text-white/80' : 'text-[#2e5c3a]'}`}>Sugerido desde la foto</span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold text-gray-800">Maceta con drenaje</h3>
                    <p className="text-[11px] leading-relaxed text-gray-500">Orificios abajo o plato que se pueda vaciar.</p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { value: true, label: 'Sí' },
                      { value: false, label: 'No' },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => updateContext('maceta_con_drenaje', option.value)}
                        aria-pressed={context.maceta_con_drenaje === option.value}
                        className={`min-h-[48px] rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${context.maceta_con_drenaje === option.value ? 'border-[#2e5c3a] bg-[#2e5c3a] text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                      >
                        <span>{option.label}</span>
                        {inferredMatches('maceta_con_drenaje', option.value) && (
                          <span className={`mt-0.5 block text-[9px] font-medium ${context.maceta_con_drenaje === option.value ? 'text-white/80' : 'text-[#2e5c3a]'}`}>Sugerido desde la foto</span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[13px] font-semibold text-gray-800">Tamaño de maceta</h3>
                  <div className="mt-2 grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
                    {[
                      { value: 'pequena', label: 'Chica' },
                      { value: 'mediana', label: 'Mediana' },
                      { value: 'grande', label: 'Grande' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateContext('tamano_maceta', option.value as PlantContext['tamano_maceta'])}
                        aria-pressed={context.tamano_maceta === option.value}
                        className={`min-h-[48px] rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${context.tamano_maceta === option.value ? 'border-[#2e5c3a] bg-[#2e5c3a] text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                      >
                        <span>{option.label}</span>
                        {inferredMatches('tamano_maceta', option.value as PlantContext['tamano_maceta']) && (
                          <span className={`mt-0.5 block text-[9px] font-medium ${context.tamano_maceta === option.value ? 'text-white/80' : 'text-[#2e5c3a]'}`}>Sugerido desde la foto</span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </details>

            <div className="pt-2">
              <button
                onClick={handleNext}
                disabled={!confirmedIdentification || (!city.trim() && !coords)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2e5c3a] py-4 text-[15px] font-semibold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                <span>Generar plan de cuidados</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
