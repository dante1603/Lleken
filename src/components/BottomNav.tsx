import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  { id: 'home', label: 'Inicio', icon: 'home', path: '/home' },
  { id: 'plants', label: 'Mis plantas', icon: 'nest_eco_leaf', path: '/plants' },
  { id: 'calendar', label: 'Calendario', icon: 'calendar_today', path: '/calendar' },
  { id: 'profile', label: 'Perfil', icon: 'person', path: '/profile' }
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center justify-between rounded-t-[32px] border border-white/80 bg-white/95 px-8 pb-4 pt-3 shadow-[0_-12px_38px_rgba(15,23,42,0.12)] backdrop-blur">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={cn(
              "relative flex min-w-0 flex-col items-center gap-0.5 py-1 transition-colors",
              isActive ? "text-[#2e5c3a]" : "text-[#7f8796] active:text-gray-600"
            )}
          >
            <span 
              className={cn(
                "material-symbols-outlined text-[28px]",
                isActive && "fill"
              )}
            >
              {item.icon}
            </span>
            <span className={cn("text-[11px] leading-tight", isActive ? "font-semibold" : "font-medium")}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -top-1 right-3 h-2 w-2 rounded-full bg-[#2e5c3a]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
