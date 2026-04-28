import React from 'react';
import BottomNav from '../components/BottomNav';

export default function Calendar() {
  return (
    <div className="bg-[#f8f9fa] min-h-[100dvh] pb-24 font-sans">
      <main className="px-4 pt-8 space-y-5 max-w-md mx-auto">
        
        {/* Header Calendario */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Calendario</h1>
            <p className="text-sm text-gray-500 mt-0.5">Organiza los cuidados de tu jardín</p>
          </div>
          <button className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-green-700">calendar_add_on</span>
          </button>
        </div>

        {/* Resumen de Cuidados */}
        <div className="flex gap-2.5">
          <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-green-700 mb-1">calendar_today</span>
            <span className="text-xs text-gray-500">Hoy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-green-700">1</span>
              <span className="text-[10px] text-gray-500">cuidado</span>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-blue-500 mb-1">calendar_month</span>
            <span className="text-xs text-gray-500">Esta semana</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-blue-500">3</span>
              <span className="text-[10px] text-gray-500">cuidados</span>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-orange-400 mb-1">notifications_active</span>
            <span className="text-xs text-gray-500">Pendientes</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-orange-400">4</span>
              <span className="text-[10px] text-gray-500">cuidados</span>
            </div>
          </div>
        </div>

        {/* Toggle Mes/Semana */}
        <div className="bg-white rounded-full p-1 border border-gray-100 flex shadow-sm">
          <button className="flex-1 bg-[#1a4325] text-white py-2 rounded-full text-sm font-semibold transition-all">Mes</button>
          <button className="flex-1 text-gray-500 py-2 rounded-full text-sm font-medium transition-all active:bg-gray-50">Semana</button>
        </div>

        {/* Tarjeta del Calendario (Mensual) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          {/* Controles de Mes */}
          <div className="flex justify-between items-center mb-4">
            <span className="material-symbols-outlined text-green-700 cursor-pointer">chevron_left</span>
            <h2 className="font-semibold text-gray-800 text-[15px]">Mayo 2024</h2>
            <span className="material-symbols-outlined text-green-700 cursor-pointer">chevron_right</span>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 text-center mb-2">
            <span className="text-[10px] font-semibold text-gray-400">LUN</span>
            <span className="text-[10px] font-semibold text-gray-400">MAR</span>
            <span className="text-[10px] font-semibold text-gray-400">MIÉ</span>
            <span className="text-[10px] font-semibold text-gray-400">JUE</span>
            <span className="text-[10px] font-semibold text-gray-400">VIE</span>
            <span className="text-[10px] font-semibold text-gray-400">SÁB</span>
            <span className="text-[10px] font-semibold text-gray-400">DOM</span>
          </div>

          {/* Cuadrícula de fechas */}
          <div className="grid grid-cols-7 gap-y-3 text-center text-sm text-gray-800">
            <div className="text-gray-300 relative py-1">29</div>
            <div className="text-gray-300 relative py-1">30</div>
            <div className="relative py-1">1</div>
            <div className="relative py-1">2<div className="w-1 h-1 bg-blue-500 rounded-full mx-auto mt-0.5"></div></div>
            <div className="relative py-1">3<div className="w-1 h-1 bg-yellow-400 rounded-full mx-auto mt-0.5"></div></div>
            <div className="relative py-1">4</div>
            <div className="relative py-1">5</div>

            <div className="relative py-1">6</div>
            <div className="relative py-1">7</div>
            <div className="relative py-1">8</div>
            <div className="relative py-1">9</div>
            <div className="relative py-1">10</div>
            <div className="relative py-1">11</div>
            <div className="relative py-1">12</div>

            <div className="relative py-1">
              <span className="flex items-center justify-center w-7 h-7 bg-[#eef5f0] text-green-800 rounded-full mx-auto">13</span>
              <div className="w-1 h-1 bg-green-600 rounded-full mx-auto mt-0.5"></div>
            </div>
            <div className="relative py-1">14</div>
            <div className="relative py-1">15<div className="w-1 h-1 bg-blue-500 rounded-full mx-auto mt-0.5"></div></div>
            <div className="relative py-1">16</div>
            <div className="relative py-1">17</div>
            <div className="relative py-1 font-semibold text-green-700">18<div className="w-1 h-1 bg-green-600 rounded-full mx-auto mt-0.5"></div></div>
            <div className="relative py-1">19</div>

            <div className="relative py-1">20</div>
            <div className="relative py-1">21</div>
            <div className="relative py-1">22</div>
            <div className="relative py-1">23</div>
            <div className="relative py-1">24</div>
            <div className="relative py-1">25<div className="w-1 h-1 bg-yellow-400 rounded-full mx-auto mt-0.5"></div></div>
            <div className="relative py-1">26</div>

            <div className="relative py-1">27</div>
            <div className="relative py-1">28</div>
            <div className="relative py-1">29</div>
            <div className="relative py-1">30</div>
            <div className="relative py-1">31</div>
            <div className="text-gray-300 relative py-1">1</div>
            <div className="text-gray-300 relative py-1">2</div>
          </div>

          {/* Leyenda del calendario */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between px-1">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-600 rounded-full"></div><span className="text-[10px] text-gray-500">Riego</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span className="text-[10px] text-gray-500">Humedad</span></div>
            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px] text-green-700">content_cut</span><span className="text-[10px] text-gray-500">Poda</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div><span className="text-[10px] text-gray-500">Recordatorio</span></div>
          </div>
        </div>

        {/* Próximos cuidados */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800 text-[15px]">Próximos cuidados</h3>
            <button className="text-[11px] text-green-700 font-medium flex items-center">Ver todos <span className="material-symbols-outlined text-[14px]">chevron_right</span></button>
          </div>

          <div className="space-y-4">
            {/* Tarea 1 */}
            <div className="flex items-center gap-3">
              <div className="bg-[#edf3ef] p-2.5 rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-800">Revisar humedad — <span className="text-green-700">hoy</span></p>
                <p className="text-[11px] text-gray-500">mentita · Mentha spicata</p>
              </div>
              <img src="https://images.unsplash.com/photo-1628156107386-815e982167d4?q=80&w=100&auto=format&fit=crop" className="w-10 h-10 rounded-lg object-cover" alt="Menta" />
              <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
            </div>
            {/* Tarea 2 */}
            <div className="flex items-center gap-3">
              <div className="bg-[#edf3ef] p-2.5 rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-800">Próximo riego — <span className="text-green-700">en 2 días</span></p>
                <p className="text-[11px] text-gray-500">mentita · Mentha spicata</p>
              </div>
              <img src="https://images.unsplash.com/photo-1628156107386-815e982167d4?q=80&w=100&auto=format&fit=crop" className="w-10 h-10 rounded-lg object-cover" alt="Menta" />
              <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
            </div>
            {/* Tarea 3 */}
            <div className="flex items-center gap-3">
              <div className="bg-[#edf3ef] p-2.5 rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-green-800" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-800">Tomar foto de seguimiento — <span className="text-green-700">sábado</span></p>
                <p className="text-[11px] text-gray-500">mentita · Mentha spicata</p>
              </div>
              <img src="https://images.unsplash.com/photo-1628156107386-815e982167d4?q=80&w=100&auto=format&fit=crop" className="w-10 h-10 rounded-lg object-cover" alt="Menta" />
              <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
            </div>
          </div>
        </div>

        {/* Clima y consejos */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex items-start gap-3">
          <span className="material-symbols-outlined text-orange-400 text-[28px]">light_mode</span>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className="text-[14px] font-semibold text-gray-800">Clima y consejos</h4>
              <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
            </div>
            <p className="text-[12px] text-gray-600 mt-0.5">Mañana 33°C · evita sol fuerte de tarde</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Riega temprano en la mañana para mejores resultados.</p>
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  );
}
