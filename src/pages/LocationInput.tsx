import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LocationInput() {
  const location = useLocation();
  const navigate = useNavigate();
  const { image, plantData } = (location.state as any) || {};
  
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const handleNext = () => {
    navigate('/nueva-planta/generando', { 
      state: { image, plantData, customName: name, city } 
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
          Cuéntanos un poco más sobre ella para generar un plan de cuidados perfecto.
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
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Santiago, Chile"
              className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-outline"
            />
            <p className="font-label-sm text-outline">Esto nos ayudará a adaptar los cuidados al clima local.</p>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <button 
            onClick={handleNext}
            disabled={!city.trim()}
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
