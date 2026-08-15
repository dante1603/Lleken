import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NewPlantProgress from '../components/NewPlantProgress';
import { LocationCoords, LocationSuggestion, reverseGeocodeLocation, searchLocations } from '../lib/weather';
import type { PlantContext } from '../types';
import type { IdentificationProposal } from '../domain/identification';
import { confirmedContextFromTouched } from '../domain/context';
import {
  acceptedIdentificationFromProposal,
  type ConfirmedIdentification,
} from '../domain/identification';
import { getOriginRoute, homeNavigation, readNavigation, toOriginNavigation, withNavigation } from '../lib/navigation';

export default function LocationInput() {
  const location = useLocation();
  const navigate = useNavigate();
  const { image, plantData } = (location.state as { image?: string; plantData?: IdentificationProposal } | null) || {};
  const navigation = readNavigation(location.state) || homeNavigation();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [confirmedIdentification, setConfirmedIdentification] = useState<ConfirmedIdentification | null>(null);
  const [identificationStatus, setIdentificationStatus] = useState<string | null>(null);
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

  const handleNext = () => {
    if (!confirmedIdentification) {
      setIdentificationStatus('Confirma la propuesta o toma otra foto antes de continuar.');
      return;
    }

    if (!city.trim() && !coords) {
      setLocationStatus('Escribe tu ciudad o usa tu ubicación actual para continuar.');
      return;
    }

    navigate('/nueva-planta/generando', {
      state: withNavigation({
        image,
        plantData,
        confirmedIdentification,
        customName: name.trim(),
        city: selectedLocation?.displayName || city.trim(),
        coords,
        context: confirmedContextFromTouched(context),
      }, navigation),
    });
  };

  const updateContext = <K extends keyof PlantContext>(key: K, value: PlantContext[K]) => {
    setContext((current) => ({ ...current, [key]: value }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no permite geolocalizacion.');
      return;
    }

    setLocationStatus('Buscando ubicación...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const nextCoords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      setCoords(nextCoords);
      const resolved = await reverseGeocodeLocation(nextCoords);
      if (resolved) {
        setSelectedLocation(resolved);
        setCity(resolved.displayName);
        setLocationStatus('Ubicación detectada y aplicada.');
      } else {
        setSelectedLocation(null);
        setCity(`${nextCoords.lat.toFixed(4)}, ${nextCoords.lon.toFixed(4)}`);
        setLocationStatus('Ubicación detectada. No pudimos resolver comuna/ciudad automáticamente.');
      }
    }, () => {
      setLocationStatus('No pudimos obtener tu ubicación. Puedes escribir tu ciudad.');
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  };

  const selectLocation = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setCity(suggestion.displayName);
    setCoords({ lat: suggestion.lat, lon: suggestion.lon });
    setLocationSuggestions([]);
    setLocationStatus(null);
  };

  const inferredLabel = (key: keyof PlantContext) => {
    const value = inferredContext[key];
    return value === null || value === undefined ? null : 'Inferido desde la foto';
  };

  const confirmIdentification = () => {
    const accepted = acceptedIdentificationFromProposal(plantData);
    if (!accepted) {
      setIdentificationStatus('No hay una identidad suficiente para confirmar. Toma otra foto.');
      return;
    }

    setConfirmedIdentification(accepted);
    setIdentificationStatus('Identificación confirmada por ti. Ahora completa el contexto de cultivo.');
  };

  const retakePhoto = () => {
    navigate('/nueva-planta', { state: withNavigation({}, navigation) });
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
          onClick={() => navigate('/nueva-planta', { state: withNavigation({}, navigation) })}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform text-gray-700"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <NewPlantProgress step={3} />
        <div className="w-10" />
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 mb-6">
        {image && <img src={image} className="w-20 h-20 rounded-2xl object-cover" alt="Planta identificada" />}
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">{plantData.nombre_comun || 'Propuesta sin nombre'}</h3>
          {plantData.nombre_cientifico && (
            <p className="text-[13px] text-gray-500 italic mt-0.5 truncate">{plantData.nombre_cientifico}</p>
          )}
          <div className="inline-flex items-center gap-1 bg-[#eef5f0] text-[#2e5c3a] px-2.5 py-1 rounded-full mt-2">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span className="text-[10px] font-semibold">Propuesta de identificación</span>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col max-w-sm mx-auto w-full">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
          La propuesta es {plantData.nombre_comun || 'una planta sin identificar'}.
        </h1>
        <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">
          Revisa la propuesta antes de completar el contexto y generar un plan de cuidados.
        </p>

        <section className="mt-6 rounded-2xl border border-[#d2e5d9] bg-[#eef5f0] p-4">
          <p className="text-[14px] font-semibold text-[#163b24]">¿Coincide con tu planta?</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#45604d]">La identificación sigue siendo una propuesta hasta que la confirmes.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={confirmIdentification} className="rounded-xl bg-[#2e5c3a] px-3 py-3 text-[13px] font-semibold text-white active:scale-[0.99]">
              Sí, coincide
            </button>
            <button type="button" onClick={retakePhoto} className="rounded-xl border border-[#9cb7a4] bg-white px-3 py-3 text-[13px] font-semibold text-[#2e5c3a] active:scale-[0.99]">
              No coincide / tomar otra foto
            </button>
          </div>
          {identificationStatus && <p className="mt-3 text-[12px] font-medium text-[#2e5c3a]" role="status">{identificationStatus}</p>}
        </section>

        {confirmedIdentification && <div className="mt-8 space-y-6">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-gray-800">Que nombre quieres ponerle?</label>
              <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">Opcional</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">potted_plant</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={plantData.nombre_sugerido ? `Ej. ${plantData.nombre_sugerido}` : "Ej. Tomatin"}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-2xl text-[14px] text-gray-800 focus:outline-none focus:border-[#2e5c3a] focus:ring-1 focus:ring-[#2e5c3a] transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[13px] font-semibold text-gray-800">En que ciudad te encuentras?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">location_on</span>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setSelectedLocation(null);
                  setCoords(null);
                }}
                placeholder="Ej. Las Condes, Santiago"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-2xl text-[14px] text-gray-800 focus:outline-none focus:border-[#2e5c3a] focus:ring-1 focus:ring-[#2e5c3a] transition-all placeholder:text-gray-400"
              />
            </div>
            {(locationSuggestions.length > 0 || isSearchingLocations) && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {isSearchingLocations && (
                  <div className="px-4 py-3 text-[12px] text-gray-500">Buscando ubicaciones...</div>
                )}
                {locationSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => selectLocation(suggestion)}
                    className="w-full px-4 py-3 text-left active:bg-[#eef5f0] border-t first:border-t-0 border-gray-100"
                  >
                    <span className="block text-[13px] font-semibold text-gray-800">{suggestion.name}</span>
                    <span className="block text-[11px] text-gray-500 truncate">{suggestion.displayName}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-gray-500 mt-1 leading-tight">
              Selecciona una opcion para usar coordenadas mas precisas, idealmente comuna o ciudad.
            </p>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="mt-1 w-fit text-[#2e5c3a] bg-[#eef5f0] px-4 py-2 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 active:bg-[#e4ece7] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">my_location</span>
              Usar ubicación actual
            </button>
            {locationStatus && <p className="text-[11px] text-gray-500">{locationStatus}</p>}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-[13px] font-semibold text-gray-800">Donde vivira</h2>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { value: 'interior', label: 'Interior' },
                  { value: 'balcon', label: 'Balcon' },
                  { value: 'exterior', label: 'Exterior' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateContext('ubicacion_tipo', option.value as PlantContext['ubicacion_tipo'])}
                    className={`rounded-xl px-3 py-2 text-[13px] font-semibold border transition-colors ${context.ubicacion_tipo === option.value ? 'bg-[#2e5c3a] text-white border-[#2e5c3a]' : 'bg-white text-gray-700 border-gray-200'}`}
                  >
                    <span>{option.label}</span>
                    {inferredLabel('ubicacion_tipo') && context.ubicacion_tipo === option.value && (
                      <span className="block text-[9px] font-medium opacity-80">IA</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[13px] font-semibold text-gray-800">Luz habitual</h2>
              <div className="grid grid-cols-2 gap-2 mt-2">
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
                    className={`rounded-xl px-3 py-2 text-[13px] font-semibold border transition-colors ${context.luz_usuario === option.value ? 'bg-[#2e5c3a] text-white border-[#2e5c3a]' : 'bg-white text-gray-700 border-gray-200'}`}
                  >
                    <span>{option.label}</span>
                    {inferredLabel('luz_usuario') && context.luz_usuario === option.value && (
                      <span className="block text-[9px] font-medium opacity-80">IA</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-white border border-gray-200 p-3">
              <div>
                <p className="text-[13px] font-semibold text-gray-800">Maceta con drenaje</p>
                <p className="text-[11px] text-gray-500">Orificios abajo o plato que se pueda vaciar.</p>
                {inferredLabel('maceta_con_drenaje') && (
                  <p className="text-[10px] text-[#2e5c3a] font-semibold mt-1">Inferido desde la foto</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => updateContext('maceta_con_drenaje', !context.maceta_con_drenaje)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${context.maceta_con_drenaje ? 'bg-[#2e5c3a]' : 'bg-outline/40'}`}
                aria-label="Cambiar drenaje"
              >
                <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${context.maceta_con_drenaje ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div>
              <h2 className="text-[13px] font-semibold text-gray-800">Tamaño de maceta</h2>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { value: 'pequena', label: 'Chica' },
                  { value: 'mediana', label: 'Mediana' },
                  { value: 'grande', label: 'Grande' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateContext('tamano_maceta', option.value as PlantContext['tamano_maceta'])}
                    className={`rounded-xl px-3 py-2 text-[13px] font-semibold border transition-colors ${context.tamano_maceta === option.value ? 'bg-[#2e5c3a] text-white border-[#2e5c3a]' : 'bg-white text-gray-700 border-gray-200'}`}
                  >
                    <span>{option.label}</span>
                    {inferredLabel('tamano_maceta') && context.tamano_maceta === option.value && (
                      <span className="block text-[9px] font-medium opacity-80">IA</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>}

        <div className="mt-auto pt-8">
          <button
            onClick={handleNext}
            disabled={!confirmedIdentification || (!city.trim() && !coords)}
            className="w-full bg-[#2e5c3a] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 text-[15px]"
          >
            <span>{confirmedIdentification ? 'Generar plan de cuidados' : 'Confirma la identificación'}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
