import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Camera() {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // Compressing image before usage to fit in Firestore size limits
  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        navigate('/nueva-planta/identificando', { state: { image: dataUrl } });
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <div className="bg-[#f8faf8] min-h-[100dvh] flex flex-col items-center justify-center p-6 relative font-sans">
      <button 
        onClick={() => navigate('/home')} 
        className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 active:scale-95 text-gray-700"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm w-full bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <div className="w-24 h-24 bg-[#edf5f0] rounded-full flex items-center justify-center text-[#2e5c3a] mb-2">
           <span className="material-symbols-outlined text-[48px] fill">eco</span>
        </div>
        
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">Identifica tu planta</h1>
          <p className="text-[15px] text-gray-500 mt-3 leading-relaxed">
            Toma una foto nueva o elige una de tu galería para analizarla y crear su perfil.
          </p>
        </div>
        
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
        
        <div className="w-full pt-4 flex flex-col gap-3">
          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-[#2e5c3a] text-white py-4 flex items-center justify-center gap-2 shadow-sm font-medium rounded-2xl active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined fill">photo_camera</span>
            Tomar foto
          </button>
          
          <button 
            onClick={() => galleryInputRef.current?.click()}
            className="w-full bg-white text-gray-700 border border-gray-200 py-4 flex items-center justify-center gap-2 shadow-sm font-medium rounded-2xl active:scale-95 transition-transform active:bg-gray-50"
          >
            <span className="material-symbols-outlined">photo_library</span>
            Subir de galería
          </button>
        </div>
      </div>
    </div>
  );
}
