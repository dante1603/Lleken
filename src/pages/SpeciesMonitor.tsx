import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { loadSpeciesMonitor, type SpeciesMonitorRow } from '../lib/speciesMonitor';
import { cn } from '../lib/utils';

function formatDate(value?: string | null) {
  if (!value) return 'Sin plantas';
  return new Date(value).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sourceLabel(source: string) {
  if (source === 'static_catalog') return 'Catalogo local';
  if (source === 'reviewed') return 'Revisada';
  return 'IA pendiente';
}

function sourceClass(source: string) {
  if (source === 'reviewed') return 'bg-[#e7f4ea] text-[#1f6b3a]';
  if (source === 'static_catalog') return 'bg-blue-50 text-blue-700';
  return 'bg-amber-50 text-amber-700';
}

function total(rows: SpeciesMonitorRow[], key: 'plant_count' | 'recent_plant_count') {
  return rows.reduce((sum, row) => sum + row[key], 0);
}

export default function SpeciesMonitor() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SpeciesMonitorRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'rpc' | 'fallback'>('rpc');

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadSpeciesMonitor();
      setRows(result.rows);
      setSource(result.source);
    } catch (loadError) {
      console.error('No se pudo cargar monitor de especies.', loadError);
      setError('No se pudo cargar el monitor de especies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sortedRows = [...rows].sort((a, b) => {
      const latestA = new Date(a.latest_plant_created_at || a.created_at).getTime();
      const latestB = new Date(b.latest_plant_created_at || b.created_at).getTime();
      return latestB - latestA || b.plant_count - a.plant_count;
    });

    if (!normalizedQuery) return sortedRows;

    return sortedRows.filter((row) => [
      row.species_key,
      row.scientific_name,
      row.family || '',
      ...row.common_names,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)));
  }, [query, rows]);

  const totalPlants = total(rows, 'plant_count');
  const recentPlants = total(rows, 'recent_plant_count');
  const pendingSpecies = rows.filter((row) => row.knowledge_source === 'ai_generated').length;

  return (
    <div className="min-h-[100dvh] bg-[#f8faf7] pb-28 font-sans text-[#08142d]">
      <main className="mx-auto max-w-md px-5 pt-6">
        <header className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#2f6b45] shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined text-[28px]">arrow_back</span>
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#2f6b45] shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
            aria-label="Actualizar monitor"
          >
            <span className={cn('material-symbols-outlined text-[25px]', loading && 'animate-spin')}>sync</span>
          </button>
        </header>

        <section className="mt-7">
          <h1 className="text-[34px] font-semibold leading-none tracking-tight text-[#08142d]">Monitor de especies</h1>
          <p className="mt-3 max-w-[350px] text-[15px] leading-snug text-[#7b8494]">
            Revisa que especies entran al catalogo y cuantas plantas comparten la misma ficha comun.
          </p>
        </section>

        <section className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-[22px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
            <span className="block text-[24px] font-bold text-[#08142d]">{rows.length}</span>
            <span className="mt-1 block text-[11px] font-semibold leading-tight text-[#7b8494]">especies</span>
          </div>
          <div className="rounded-[22px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
            <span className="block text-[24px] font-bold text-[#08142d]">{totalPlants}</span>
            <span className="mt-1 block text-[11px] font-semibold leading-tight text-[#7b8494]">plantas</span>
          </div>
          <div className="rounded-[22px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
            <span className="block text-[24px] font-bold text-[#08142d]">{recentPlants}</span>
            <span className="mt-1 block text-[11px] font-semibold leading-tight text-[#7b8494]">7 dias</span>
          </div>
        </section>

        {source === 'fallback' && (
          <p className="mt-4 rounded-[18px] bg-amber-50 px-4 py-3 text-[12px] font-medium leading-snug text-amber-800">
            Vista parcial: falta aplicar la migracion de conteo global, asi que el conteo puede usar solo plantas visibles para tu usuario.
          </p>
        )}

        <section className="mt-5 rounded-[24px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
          <label className="flex items-center gap-3 rounded-[18px] bg-[#f1f5f0] px-4 py-3">
            <span className="material-symbols-outlined text-[#2f6b45]">search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar especie, familia o nombre comun"
              className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#08142d] outline-none placeholder:text-[#8a93a3]"
            />
          </label>
          <div className="mt-4 flex items-center justify-between text-[12px] font-semibold text-[#7b8494]">
            <span>{filteredRows.length} resultados</span>
            <span>{pendingSpecies} por revisar</span>
          </div>
        </section>

        <section className="mt-5 space-y-3">
          {loading && rows.length === 0 ? (
            <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-100 border-t-[#2f6b45]" />
              <p className="mt-4 text-[14px] font-medium text-[#7b8494]">Cargando especies.</p>
            </div>
          ) : error ? (
            <div className="rounded-[24px] bg-white p-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
              <p className="text-[14px] font-semibold text-red-700">{error}</p>
              <button onClick={() => void refresh()} className="mt-4 rounded-[14px] bg-[#2f6b45] px-5 py-3 text-[14px] font-bold text-white">
                Reintentar
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
              <span className="material-symbols-outlined text-[36px] text-[#2f6b45]">travel_explore</span>
              <p className="mt-3 text-[14px] font-medium text-[#7b8494]">No hay especies para esa busqueda.</p>
            </div>
          ) : filteredRows.map((row) => (
            <article key={row.species_id} className="rounded-[24px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => navigate(`/especie/${row.species_key}`)} className="min-w-0 flex-1 text-left">
                  <h2 className="truncate text-[18px] font-bold leading-tight text-[#08142d]">{row.scientific_name}</h2>
                  <p className="mt-1 truncate text-[13px] font-medium text-[#7b8494]">
                    {row.common_names.length > 0 ? row.common_names.join(', ') : row.species_key}
                  </p>
                </button>
                <span className={cn('shrink-0 rounded-full px-3 py-1 text-[11px] font-bold', sourceClass(row.knowledge_source))}>
                  {sourceLabel(row.knowledge_source)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                <div>
                  <span className="block text-[26px] font-bold leading-none text-[#2f6b45]">{row.plant_count}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-[#7b8494]">plantas registradas</span>
                </div>
                <div>
                  <span className="block text-[18px] font-bold leading-none text-[#08142d]">{row.recent_plant_count}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-[#7b8494]">nuevas 7 dias</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/especie/${row.species_key}`)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3ef] text-[#2f6b45]"
                  aria-label={`Ver ficha ${row.scientific_name}`}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] font-semibold text-[#8a93a3]">
                <span>Ultima planta: {formatDate(row.latest_plant_created_at)}</span>
                <span>{row.confidence}</span>
              </div>
            </article>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
