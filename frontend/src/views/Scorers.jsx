import { useState, useEffect } from 'react';

export default function Scorers({ API_BASE }) {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScorers = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/scorers`);
      if (!response.ok) throw new Error("No se pudo obtener la tabla de goleadores");
      const data = await response.json();
      setScorers(data);
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorers();

    // Listen to auto-refresh event from global header countdown
    window.addEventListener('api-auto-refreshed', fetchScorers);
    return () => window.removeEventListener('api-auto-refreshed', fetchScorers);
  }, [API_BASE]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Cargando goleadores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-6 my-8 p-6 bg-red-50 rounded-2xl flex flex-col items-center text-center">
        <p className="text-base font-semibold text-red-800 mb-2">Error</p>
        <p className="text-sm text-red-600 mb-5">{error}</p>
        <button 
          onClick={fetchScorers}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const maxGoals = scorers.length > 0 ? scorers[0].goals : 1;

  return (
    <div className="animate-fadeIn px-2">
      <div className="flex items-center justify-between px-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Goleadores
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-0.5">Mundial 2026</p>
        </div>
      </div>

      {scorers.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10 text-9xl">⚽</div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-900/70 uppercase tracking-wider mb-1">
                  Pichichi Actual
                </p>
                <h3 className="text-xl font-black text-white">{scorers[0].name}</h3>
                <p className="text-sm font-semibold text-amber-100">{scorers[0].team}</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-white">{scorers[0].goals}</span>
                <p className="text-[10px] font-bold text-amber-900/70 uppercase tracking-wider mt-1">
                  Goles
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white pb-6">
        {scorers.map((scorer, index) => {
          const pct = (scorer.goals / maxGoals) * 100;
          
          return (
            <div 
              key={index}
              className="px-6 py-4 border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${
                    index === 0 ? 'text-amber-500' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-orange-400' :
                    'text-gray-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{scorer.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{scorer.team}</p>
                  </div>
                </div>
                <span className="text-base font-black text-emerald-700 flex-shrink-0 ml-3">
                  {scorer.goals}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ml-10 max-w-[calc(100%-2.5rem)]">
                <div 
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    index === 0 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
