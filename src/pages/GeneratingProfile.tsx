import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function GeneratingProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { image, plantData, customName, city } = (location.state as any) || {};
  
  const [error, setError] = useState<string | null>(null);

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
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `Genera un plan de cuidados en JSON para la planta "${plantData.nombre_comun}" (${plantData.nombre_cientifico}) que se encuentra en la ciudad de "${city}". 
Ten en cuenta que su estado actual detectado es "${plantData.estado}".
El JSON debe seguir esta estructura exacta:
{
  "riego_frecuencia_dias": 5,
  "instrucciones": "...",
  "alertas_clima": ["...", "..."],
  "riego_ajuste_clima": "...",
  "exposicion_sol": "...",
  "seguimiento_foto_dias": 7,
  "tareas_adicionales": ["...", "..."]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [prompt],
          config: { responseMimeType: 'application/json' }
        });

        let carePlan = {};
        if (response.text) {
           carePlan = JSON.parse(response.text);
        }

        // Save to Firebase
        // NOTE: In a real app we'd upload the base64 `image` to Firebase Storage. 
        // Here we just save the base64 string to Firestore directly or skip if it's too large.
        // We compressed it in Camera.tsx, so it should be < 50KB.
        const docData = {
           userId: user.uid,
           fotoUrl: image, 
           nombrePersonalizado: customName || '',
           nombre_comun: plantData.nombre_comun,
           nombre_cientifico: plantData.nombre_cientifico,
           familia: plantData.familia,
           estado: plantData.estado,
           puntuacion_salud: plantData.puntuacion_salud,
           ciudad: city,
           info_general: plantData.info_general,
           plan_cuidados: carePlan,
           fecha_creacion: Date.now(),
        };

        const docRef = await addDoc(collection(db, 'plants'), docData);
        navigate(`/planta/${docRef.id}`, { replace: true });

      } catch (err: any) {
        console.error("Error generating profile:", err);
        setError("Hubo un problema guardando el perfil. Por favor intenta otra vez.");
      }
    };

    generateAndSave();
  }, [navigate]);

  return (
    <div className="bg-primary-container text-on-primary-container min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
       {error ? (
         <div className="space-y-4">
           <span className="material-symbols-outlined text-6xl text-error">error</span>
           <p className="font-body-lg">{error}</p>
           <button 
             onClick={() => navigate('/home')}
             className="mt-4 px-6 py-2 bg-surface text-primary rounded-full font-label-lg"
           >
             Volver al inicio
           </button>
         </div>
       ) : (
         <div className="space-y-8 flex flex-col items-center">
           <span className="material-symbols-outlined text-[80px] animate-bounce">compost</span>
           <h2 className="font-display text-[28px]">Creando perfil...</h2>
           <p className="font-body-md opacity-80 max-w-[250px]">
             Cargando información del clima para {city} y ajustando el plan de riego.
           </p>
         </div>
       )}
    </div>
  );
}
