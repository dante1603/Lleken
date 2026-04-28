import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';

export default function IdentifyPlant() {
  const location = useLocation();
  const navigate = useNavigate();
  const image = location.state?.image as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      navigate('/nueva-planta');
      return;
    }

    const identifyWithAI = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        
        const prompt = `Analiza esta imagen y responde en un JSON válido con esta estructura exacta:
{
  "nombre_comun": "...",
  "nombre_cientifico": "...",
  "familia": "...",
  "estado": "saludable",
  "puntuacion_salud": 85,
  "info_general": {
    "descripcion": "...",
    "origen": "...",
    "curiosidades": ["...", "..."],
    "usos_comunes": ["..."],
    "condiciones_ideales": "..."
  }
}
Si la planta claramente se ve maltratada, seca o enferma, marca el estado como "necesita_atencion" o "en_riesgo" y baja la puntuación.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            prompt,
            { inlineData: { data: base64Data, mimeType } }
          ],
          config: {
            responseMimeType: 'application/json',
          }
        });

        const jsonText = response.text;
        if (jsonText) {
           const plantData = JSON.parse(jsonText);
           navigate('/nueva-planta/ubicacion', { state: { image, plantData } });
        } else {
           throw new Error("No response from AI");
        }
      } catch (err: any) {
        console.error("AI Error:", err);
        setError("No pudimos identificar la planta. Inténtalo de nuevo.");
      }
    };

    identifyWithAI();
  }, [image, navigate]);

  return (
    <div className="bg-background text-on-background min-h-[100dvh] flex flex-col pt-12 relative overflow-hidden">
       {/* Background scanning effect */}
       <div className="absolute inset-0 z-0">
          {image && (
            <img src={image} alt="Escaneando" className="w-full h-full object-cover blur-sm opacity-50" />
          )}
          <div className="absolute inset-0 bg-surface/80" />
       </div>

       <div className="relative z-10 flex flex-col items-center justify-center flex-grow p-6">
         {error ? (
           <div className="flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
               <span className="material-symbols-outlined">error</span>
             </div>
             <p className="font-body-lg text-on-surface">{error}</p>
             <button 
               onClick={() => navigate('/nueva-planta')}
               className="mt-4 px-6 py-2 bg-primary-container text-on-primary-container rounded-full"
             >
               Volver a intentar
             </button>
           </div>
         ) : (
           <div className="flex flex-col items-center text-center space-y-8 w-full max-w-sm">
             <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary-container shadow-raised">
               {image && <img src={image} alt="Planta" className="w-full h-full object-cover" />}
               <div className="absolute left-0 w-full h-1 bg-primary shadow-[0_0_8px_rgba(44,95,45,1)] animate-[scan_2s_ease-in-out_infinite_alternate]" />
             </div>
             <div>
                <h2 className="font-display text-[24px] text-on-surface animate-pulse">Analizando tu planta</h2>
                <p className="font-body-md text-on-surface-variant mt-2">Buscando en nuestra base de datos botánica...</p>
             </div>
           </div>
         )}
       </div>
    </div>
  );
}
