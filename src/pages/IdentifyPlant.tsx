import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NewPlantProgress from '../components/NewPlantProgress';
import { getAiErrorMessage, identifyPlantFromImage } from '../lib/ai';
import { homeNavigation, readNavigation, withNavigation } from '../lib/navigation';

export default function IdentifyPlant() {
  const location = useLocation();
  const navigate = useNavigate();
  const image = location.state?.image as string;
  const navigation = readNavigation(location.state) || homeNavigation();
  const onboarding = location.state?.onboarding === true;
  const [error, setError] = useState<string | null>(null);
  const hasIdentified = useRef(false);

  useEffect(() => {
    if (!image) {
      navigate('/nueva-planta', { state: withNavigation({}, navigation) });
      return;
    }

    if (hasIdentified.current) return;
    hasIdentified.current = true;

    const identifyWithAI = async () => {
      try {
        const plantData = await identifyPlantFromImage(image);
        navigate('/nueva-planta/ubicacion', { state: withNavigation({ image, plantData, ...(onboarding ? { onboarding: true } : {}) }, navigation) });
      } catch (err) {
        console.error('AI Error:', err);
        setError(getAiErrorMessage(err, 'No pudimos identificar la planta. Intentalo de nuevo.'));
      }
    };

    identifyWithAI();
  }, [image, navigate]);

  return (
    <div className="bg-[#f4f7f5] text-on-background min-h-[100dvh] flex flex-col p-5 pt-10 pb-8 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/nueva-planta', { state: withNavigation({}, navigation) })}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform text-gray-700"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <NewPlantProgress step={2} />
        <div className="w-10" />
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center flex-1">
        {error ? (
          <div className="flex flex-col items-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined">error</span>
            </div>
            <p className="font-body-lg text-on-surface">{error}</p>
            <button
              onClick={() => navigate('/nueva-planta', { state: withNavigation({}, navigation) })}
              className="mt-4 px-6 py-3 bg-[#2e5c3a] text-white rounded-2xl font-semibold"
            >
              Volver a intentar
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center w-full flex-1">
            <div className="mt-2 p-1 border-4 border-[#2e5c3a] rounded-[2rem]">
              <div className="relative w-44 h-44 rounded-[1.75rem] overflow-hidden">
                {image && <img src={image} alt="Planta" className="w-full h-full object-cover" />}
                <div className="absolute left-0 w-full h-1 bg-[#2e5c3a] shadow-[0_0_8px_rgba(44,95,45,1)] animate-[scan_2s_ease-in-out_infinite_alternate]" />
              </div>
            </div>

            <div className="relative mt-8 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-[#edf3ef] border-t-[#2e5c3a] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#2e5c3a] fill text-[24px]">eco</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Analizando tu planta</h2>
            <p className="text-[13px] text-gray-500 mt-3 leading-relaxed px-4">
              Buscando coincidencias en nuestra base botánica y preparando la identificación.
            </p>

            <div className="flex items-center gap-1.5 mt-4 text-[12px] text-gray-500 font-medium">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              Esto puede tardar unos segundos
            </div>

            <div className="mt-auto w-full bg-[#f4f7f5] rounded-2xl p-4 flex items-start gap-3 text-left">
              <div className="bg-[#e4ece7] p-1.5 rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-[#2e5c3a] fill text-[20px]">eco</span>
              </div>
              <p className="text-[12px] text-gray-700 leading-relaxed mt-0.5">
                <span className="font-bold text-[#2e5c3a]">Consejo:</span> una foto con buena luz mejora la precision.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
