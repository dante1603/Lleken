import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NewPlantProgress from '../components/NewPlantProgress';
import { compressImageFile } from '../lib/images';
import { getOriginRoute, homeNavigation, readNavigation, toOriginNavigation, withNavigation, withOnboarding } from '../lib/navigation';

export default function Camera() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = readNavigation(location.state) || homeNavigation();
  const onboarding = location.state?.onboarding === true;
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const processImage = async (file: File) => {
    try {
      setError(null);

      if (!file.type.startsWith('image/')) {
        setError('Elige una imagen valida de tu camara o galeria.');
        return;
      }

      setProcessing(true);
      const dataUrl = await compressImageFile(file);
      navigate('/nueva-planta/identificando', { state: withNavigation(withOnboarding({ image: dataUrl }, onboarding), navigation) });
    } catch (err) {
      console.error('New plant image error:', err);
      setError('No pudimos preparar la imagen. Intenta con otra foto.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const triggerInput = (input: HTMLInputElement | null) => {
    if (processing) return;
    setError(null);
    if (input) input.value = '';
    input?.click();
  };

  return (
    <div className="bg-[#f4f7f5] min-h-[100dvh] flex flex-col p-5 pt-10 pb-8 relative font-sans">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(getOriginRoute(navigation), { state: withNavigation({}, toOriginNavigation(navigation)) })}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform text-gray-700"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <NewPlantProgress step={1} />
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center text-center flex-1 w-full bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="w-28 h-28 bg-[#edf3ef] rounded-full flex items-center justify-center text-[#2e5c3a] mt-4 relative">
          <span className="material-symbols-outlined text-[64px] fill">eco</span>
          <span className="absolute top-4 left-4 text-[#a3c7af] text-lg font-serif">*</span>
          <span className="absolute bottom-6 right-4 text-[#a3c7af] text-sm font-serif">*</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight mt-6">Identifica tu planta</h1>
          <p className="text-[13px] text-gray-500 mt-3 leading-relaxed px-2">
            Toma una foto nueva o elige una de tu galeria para analizarla y crear el perfil personalizado de tu planta.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 w-full mt-6">{error}</p>}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-full mt-auto pt-8 flex flex-col gap-3">
          <button
            onClick={() => triggerInput(cameraInputRef.current)}
            disabled={processing}
            className="w-full bg-[#2e5c3a] text-white py-4 flex items-center justify-center gap-2 shadow-md font-semibold rounded-2xl active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            <span className="material-symbols-outlined fill">{processing ? 'hourglass_empty' : 'photo_camera'}</span>
            Tomar foto
          </button>

          <button
            onClick={() => triggerInput(galleryInputRef.current)}
            disabled={processing}
            className="w-full bg-white text-[#2e5c3a] border border-[#2e5c3a] py-4 flex items-center justify-center gap-2 font-semibold rounded-2xl active:scale-95 transition-transform active:bg-gray-50 disabled:opacity-50 disabled:scale-100"
          >
            <span className="material-symbols-outlined">image</span>
            Elegir de galeria
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 mb-2 text-[11px] text-gray-500">
          <span className="material-symbols-outlined text-[14px]">info</span>
          <span>La imagen debe mostrar hojas y tallo con buena luz.</span>
        </div>
      </div>
    </div>
  );
}
