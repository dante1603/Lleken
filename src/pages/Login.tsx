import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login fallido", error);
      if (error.code === 'auth/user-cancelled' || error.code === 'auth/popup-closed-by-user') {
        setErrorMsg("El inicio de sesión fue cancelado. Si el popup no se abre, intenta abrir la aplicación en una nueva pestaña (botón arriba a la derecha).");
      } else {
        setErrorMsg("Error al iniciar sesión con Google. Inténtalo de nuevo.");
      }
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased h-[100dvh] w-full overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat opacity-40 mix-blend-multiply" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZMyWBCcIQrOBap6pXxbL9YbwM2qyjOvNDnMfCVf5eCsHalTAre0cfC8GNh5LHv455O5zNifWS_jq57xyhhq0wNYTyWFPqd_P7Gh4WgK7CexNNZHTrkuQvDCgdU93YgGa7TTWHsQ6ZErYus-2O-BaHMme_6e5PVGM1HqJ2fFyQVmywuhRZY2JWZl962cdt3lgUj75SNs-qoSNSj93eeXcTuz7jppKOWM-UyrzuvbL5BRdQHuKB2cv4anVnbZPXeVojNNLJ29WzO3e1')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-bright/80 via-surface/60 to-surface-container-high/90" />
      </div>

      <main className="relative z-10 w-full h-full flex flex-col justify-between px-margin-mobile py-stack-lg max-w-md mx-auto">
        <header className="flex flex-col items-center pt-stack-lg animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shadow-sm mb-stack-sm text-on-primary-container">
            <span className="material-symbols-outlined text-[32px] fill">eco</span>
          </div>
          <h1 className="font-display text-display text-primary tracking-tight">Llekén</h1>
        </header>

        <section className="flex flex-col items-center text-center px-4 space-y-stack-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Tu huerto siempre informado
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[280px]">
            Cuida tus plantas con inteligencia artificial
          </p>
        </section>

        <footer className="flex flex-col items-center pb-stack-md w-full space-y-stack-md">
          {errorMsg && (
            <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm text-center mb-2 shadow-sm w-full mx-4">
              {errorMsg}
            </div>
          )}
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest border border-primary-container rounded-full py-3 px-6 shadow-ambient hover:bg-surface-container-low transition-colors duration-200"
          >
            <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              <path d="M1 1h22v22H1z" fill="none"></path>
            </svg>
            <span className="font-label-lg text-label-lg text-on-surface">Continuar con Google</span>
          </button>
          
          <p className="font-label-sm text-label-sm text-outline text-center mt-stack-sm">
            ¿Qué significa Llekén? Vivero en mapudungun.
          </p>
        </footer>
      </main>
    </div>
  );
}
