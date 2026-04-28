import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocationCoords } from '../lib/weather';

export default function LocationInput() {
  const location = useLocation();
  const navigate = useNavigate();
  const { image, plantData } = (location.state as any) || {};

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const handleNext = () => {
    navigate('/nueva-planta/generando', {
      state: { image, plantData, customName: name, city, coords }
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no permite geolocalización.');
      return;
    }

    setLocationStatus('Buscando ubicación...');
    navigator.geolocation.getCurrentPosition((position) => {
      setCoords({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
      setCity((current) => current || 'Mi ubicación actual');
      setLocationStatus('Ubicación detectada.');
    }, () => {
      setLocationStatus('No pudimos obtener tu ubicación. Puedes escribir tu ciudad.');
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  };

  if (!plantData) {
    return (
      <div className="p-4 text-center mt-20">
        <p>Faltan datos de la planta.</p>
        <button onClick={() => navigate('/home')} className="text-primary mt-4">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-[100dvh] flex flex-col p-6 relative">
      <button
        onClick={() => navigate(-1)}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container mb-8 shadow-sm active:scale-95"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="flex-grow flex flex-col max-w-sm mx-auto w-full">
        <h1 className="font-display text-[28px] leading-tight text-on-surface mb-2">
          ¡Es un(a) {plantData.nombre_comun}!
        </h1>
        <p className="font-body-lg text-on-surface-variant mb-8">
          Cuéntanos un poco más sobre ella para generar un plan de cuidados con clima real.
        </p>

        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="font-label-lg text-on-surface">¿Qué nombre quieres ponerle? (Opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mi suculenta regalona"
              className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-outline"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="font-label-lg text-on-surface">¿En qué ciudad te encuentras?</label>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setCoords(null);
              }}
              placeholder="Ej. Santiago, Chile"
              className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-outline"
            />
            <p className="font-label-sm text-outline">Esto nos ayudará a adaptar riego, sol y alertas al clima local.</p>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="mt-2 w-fit px-4 py-2 rounded-full bg-surface-container text-primary text-sm font-semibold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">my_location</span>
              Usar ubicación actual
            </button>
            {locationStatus && <p className="font-label-sm text-outline">{locationStatus}</p>}
          </div>
        </div>

        <div className="mt-auto pt-8">
          <button
            onClick={handleNext}
            disabled={!city.trim() && !coords}
            className="w-full bg-primary-container text-on-primary-container py-4 rounded-full font-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            <span>Generar plan de cuidados</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
