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
    <div className="relative min-h-[100dvh] w-full bg-[#f6faf5] text-[#08142d] antialiased">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#dff0d8] opacity-80 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#d9eeea] opacity-70 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/70 to-transparent" />
      </div>

      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 py-8 sm:px-8">
        <header className="flex items-center gap-3">
          <img src="/LlekenLogo.svg" alt="" className="h-12 w-12 rounded-[15px] shadow-[0_8px_20px_rgba(44,95,45,0.16)]" />
          <span className="font-display text-[24px] font-semibold tracking-tight text-[#2f6b45]">Llekén</span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12 text-center">
          <p className="mx-auto mb-4 inline-flex self-center rounded-full bg-[#eaf3ec] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#2f6b45]">
            Orientación para tu jardín
          </p>
          <h1 className="font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#08142d] sm:text-[38px]">
            Entiende qué necesita tu planta ahora y qué hacer después.
          </h1>
          <p className="mx-auto mt-5 max-w-[330px] text-[17px] leading-relaxed text-[#596579]">
            Combina conocimiento botánico, el contexto de tu planta y lo que observas para orientarte en cada revisión.
          </p>
        </section>

        <footer className="w-full pt-8">
          {errorMsg && (
            <div className="mb-4 w-full rounded-[16px] bg-[#fce8e6] p-3 text-center text-[14px] leading-relaxed text-[#9b2c2c] shadow-sm">
              {errorMsg}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[#cfe3d2] bg-white px-6 py-4 shadow-[0_8px_24px_rgba(44,95,45,0.10)] transition-colors duration-200 hover:bg-[#f5faf4]"
          >
            <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              <path d="M1 1h22v22H1z" fill="none"></path>
            </svg>
            <span className="text-[16px] font-semibold text-[#08142d]">Continuar con Google</span>
          </button>

          <p className="mt-5 text-center text-[12px] leading-relaxed text-[#7b8494]">
            Llekén significa «vivero» en mapudungun.
          </p>
        </footer>
      </main>
    </div>
  );
}
