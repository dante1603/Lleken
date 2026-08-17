import React, { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { compressImageFile } from '../lib/images';
import { canCareForPlant, getPlantById, savePlantObservation } from '../lib/plants';
import { getOriginRoute, homeNavigation, readNavigation, toOriginNavigation, toPlantNavigation, withNavigation } from '../lib/navigation';

export default function FollowUpCamera() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const locationNavigation = readNavigation(location.state);
  const navigation = locationNavigation || homeNavigation();
  const observationMode = location.state?.observationMode === 'photo' ? 'photo' : 'generic';
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string>();
  const [observationText, setObservationText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const trimmedText = observationText.trim();
  const canSubmit = observationMode === 'photo' ? Boolean(image) : Boolean(image || trimmedText);

  const processImage = async (file: File) => {
    try {
      setError(null);
      setProcessing(true);
      setImage(await compressImageFile(file));
    } catch (err) {
      console.error('Observation image error:', err);
      setError('No pudimos preparar la foto. Intenta con otra imagen.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void processImage(file);
  };

  const handleSubmit = async () => {
    if (!id || !canSubmit || processing) return;

    setError(null);
    setProcessing(true);
    try {
      if (image) {
        navigate(`/planta/${id}/seguimiento/analizando`, {
          state: withNavigation({
            image,
            ...(trimmedText ? { observationText: trimmedText } : {}),
          }, navigation),
        });
        return;
      }

      if (!user?.uid) throw new Error('Debes iniciar sesión para guardar la observación.');
      const plant = await getPlantById(id);
      if (!plant || !canCareForPlant(plant, user.uid)) {
        navigate('/home');
        return;
      }

      await savePlantObservation({
        plant,
        uid: user.uid,
        observedAt: Date.now(),
        text: trimmedText,
      });
      navigate(`/planta/${id}`, { replace: true, state: withNavigation({}, toPlantNavigation(navigation)) });
    } catch (err) {
      console.error('Observation save error:', err);
      setError(err instanceof Error ? err.message : 'No pudimos guardar la observación. Intenta nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  const navigateBack = () => {
    if (locationNavigation?.parent === 'origin') {
      navigate(getOriginRoute(locationNavigation), { state: withNavigation({}, toOriginNavigation(locationNavigation)) });
    } else if (id) {
      navigate(`/planta/${id}`, { state: withNavigation({}, toPlantNavigation(navigation)) });
    } else {
      navigate('/home');
    }
  };

  const title = observationMode === 'photo' ? 'Seguimiento con foto' : 'Registrar observación';
  const description = observationMode === 'photo'
    ? 'Guarda una foto de seguimiento y, si quieres, agrega lo que notaste.'
    : 'Registra algo que notaste en tu planta con texto, una foto o ambos.';

  return (
    <div className="bg-[#f8faf8] min-h-[100dvh] flex flex-col items-center justify-center p-6 relative font-sans">
      <button onClick={navigateBack} className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 active:scale-95 text-gray-700" aria-label="Volver">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="flex flex-col items-center text-center space-y-5 max-w-sm w-full bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <div className="w-20 h-20 bg-[#edf5f0] rounded-full flex items-center justify-center text-[#2e5c3a]">
          <span className="material-symbols-outlined text-[42px] fill">{observationMode === 'photo' ? 'photo_camera' : 'visibility'}</span>
        </div>

        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">{title}</h1>
          <p className="text-[15px] text-gray-500 mt-3 leading-relaxed">{description}</p>
        </div>

        <label htmlFor="plant-observation-text" className="w-full text-left text-[14px] font-semibold text-gray-700">¿Qué notaste?</label>
        <textarea
          id="plant-observation-text"
          value={observationText}
          onChange={(event) => setObservationText(event.target.value.slice(0, 1000))}
          placeholder="Describe lo que observaste (opcional)"
          className="min-h-[112px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-3 text-[15px] text-gray-800 outline-none focus:ring-2 focus:ring-[#a3c7af]"
        />
        <p className="w-full text-right text-[12px] text-gray-400">{observationText.length}/1000</p>

        {image && (
          <div className="w-full rounded-2xl border border-green-100 bg-[#f3f8f4] p-3 text-left">
            <img src={image} alt="Foto seleccionada para la observación" className="h-40 w-full rounded-xl object-cover" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-[#2e5c3a]">Foto seleccionada</span>
              <button type="button" onClick={() => setImage(undefined)} disabled={processing} className="text-[13px] font-semibold text-gray-600 underline disabled:opacity-50">
                Cambiar foto
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 w-full">{error}</p>}

        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} />
        <input type="file" accept="image/*" ref={galleryInputRef} className="hidden" onChange={handleFileChange} />

        <div className="w-full pt-1 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button disabled={processing} onClick={() => cameraInputRef.current?.click()} className="w-full bg-[#2e5c3a] text-white py-3 flex items-center justify-center gap-2 shadow-sm font-medium rounded-2xl active:scale-95 transition-transform disabled:opacity-50">
              <span className="material-symbols-outlined">photo_camera</span>
              Tomar foto
            </button>
            <button disabled={processing} onClick={() => galleryInputRef.current?.click()} className="w-full bg-white text-gray-700 border border-gray-200 py-3 flex items-center justify-center gap-2 shadow-sm font-medium rounded-2xl active:scale-95 transition-transform active:bg-gray-50 disabled:opacity-50">
              <span className="material-symbols-outlined">photo_library</span>
              Galería
            </button>
          </div>
          <button disabled={processing || !canSubmit} onClick={() => void handleSubmit()} className="w-full bg-[#08752d] text-white py-4 flex items-center justify-center gap-2 shadow-sm font-semibold rounded-2xl active:scale-95 transition-transform disabled:opacity-50">
            <span className="material-symbols-outlined">{processing ? 'hourglass_empty' : 'save'}</span>
            {processing ? 'Guardando...' : image ? 'Guardar y analizar foto' : 'Guardar observación'}
          </button>
        </div>
      </div>
    </div>
  );
}
