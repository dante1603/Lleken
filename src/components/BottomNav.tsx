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
    <nav className="bg-white fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-6 py-2 pb-5 border-t border-gray-100 md:max-w-md md:left-1/2 md:-translate-x-1/2 md:border-x">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-0.5 relative py-1 transition-colors",
              isActive ? "text-[#2e5c3a]" : "text-gray-400 active:text-gray-600"
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
            <span className={cn("text-[11px]", isActive ? "font-semibold" : "font-medium")}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -bottom-1 w-1.5 h-1.5 bg-[#2e5c3a] rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
