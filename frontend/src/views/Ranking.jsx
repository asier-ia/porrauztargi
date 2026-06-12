import { useState, useEffect } from 'react';

export default function Ranking({ onSelectParticipant, API_BASE }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRanking = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/ranking?limit=140`);
      if (!response.ok) throw new Error("No se pudo obtener el ranking");
      const data = await response.json();
      setRanking(data);
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();

    // Listen to auto-refresh event from global header countdown
    window.addEventListener('api-auto-refreshed', fetchRanking);
    return () => window.removeEventListener('api-auto-refreshed', fetchRanking);
  }, [API_BASE]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Cargando clasificación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-6 my-8 p-6 bg-red-50 rounded-2xl flex flex-col items-center text-center">
        <p className="text-base font-semibold text-red-800 mb-2">Error de conexión</p>
        <p className="text-sm text-red-600 mb-5">{error}</p>
        <button 
          onClick={fetchRanking}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const top1 = ranking[0];
  const top2 = ranking[1];
  const top3 = ranking[2];

  return (
    <div className="animate-fadeIn px-2">
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Clasificación
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            {ranking.length} participantes
          </p>
        </div>
      </div>

      {/* Resumen de Premios Banner */}
      <div className="mx-4 mb-6 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute right-2 -bottom-2 opacity-5 text-7xl select-none">💶</div>
        <div className="relative z-10">
          <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2.5">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Premios de la Porra</span>
            <span className="text-sm font-black bg-white/15 px-2.5 py-0.5 rounded-full border border-white/10">Total: 2.780€</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
              <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">1º Premio</p>
              <p className="text-sm font-black text-amber-300">1.668€</p>
            </div>
            <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
              <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">2º Premio</p>
              <p className="text-sm font-black text-slate-100">834€</p>
            </div>
            <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
              <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">3º Premio</p>
              <p className="text-sm font-black text-orange-300">278€</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-200">
            <span>🎗️</span>
            <span>Donación Solidaria Afagi: <span className="text-white font-extrabold">278€</span></span>
          </div>
        </div>
      </div>

      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end mb-8 px-4">
          {/* 2º Puesto - Plata Sólido */}
          {top2 && (
            <div 
              onClick={() => onSelectParticipant(top2.id)}
              className="flex flex-col items-center cursor-pointer p-3 bg-gradient-to-b from-slate-200 to-slate-300 rounded-2xl shadow-md border border-slate-400 hover:brightness-105 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100/50 flex items-center justify-center text-sm font-black text-slate-800 mb-3 shadow-inner border border-slate-300/50">
                2
              </div>
              <p className="text-xs font-bold text-slate-900 text-center truncate w-full">
                {top2.name.split(' ')[0]}
              </p>
              <p className="text-sm font-black text-slate-900 mt-1">
                {top2.points_total} <span className="text-[10px] font-bold text-slate-700">pts</span>
              </p>
              {top2.prize > 0 && (
                <span className="text-[10px] font-extrabold bg-slate-850/15 text-slate-900 px-2 py-0.5 rounded-full mt-2 border border-slate-950/5 shadow-sm">
                  +{top2.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                </span>
              )}
            </div>
          )}

          {/* 1º Puesto - Oro Sólido */}
          {top1 && (
            <div 
              onClick={() => onSelectParticipant(top1.id)}
              className="flex flex-col items-center cursor-pointer p-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl shadow-lg border border-amber-500 hover:brightness-105 transition-all duration-200 -translate-y-3 relative z-10"
            >
              <div className="absolute -top-3 w-full flex justify-center">
                <span className="bg-white text-amber-600 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider border border-amber-100">Líder</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-200/40 flex items-center justify-center text-base font-black text-amber-950 mb-3 shadow-inner border border-amber-300/50 mt-2">
                1
              </div>
              <p className="text-sm font-black text-white text-center truncate w-full drop-shadow-sm">
                {top1.name.split(' ')[0]}
              </p>
              <p className="text-lg font-black text-amber-950 mt-1 drop-shadow-sm">
                {top1.points_total} <span className="text-xs font-bold text-amber-900">pts</span>
              </p>
              {top1.prize > 0 && (
                <span className="text-[11px] font-extrabold bg-amber-950/15 text-amber-950 px-2.5 py-0.5 rounded-full mt-2 border border-amber-950/10 shadow-sm">
                  +{top1.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                </span>
              )}
            </div>
          )}

          {/* 3º Puesto - Bronce Sólido */}
          {top3 && (
            <div 
              onClick={() => onSelectParticipant(top3.id)}
              className="flex flex-col items-center cursor-pointer p-3 bg-gradient-to-b from-orange-300 to-orange-400 rounded-2xl shadow-md border border-orange-500 hover:brightness-105 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-orange-200/50 flex items-center justify-center text-sm font-black text-orange-900 mb-3 shadow-inner border border-orange-300/50">
                3
              </div>
              <p className="text-xs font-bold text-orange-950 text-center truncate w-full">
                {top3.name.split(' ')[0]}
              </p>
              <p className="text-sm font-black text-orange-950 mt-1">
                {top3.points_total} <span className="text-[10px] font-bold text-orange-900">pts</span>
              </p>
              {top3.prize > 0 && (
                <span className="text-[10px] font-extrabold bg-orange-950/10 text-orange-950 px-2 py-0.5 rounded-full mt-2 border border-orange-950/5 shadow-sm">
                  +{top3.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista General Simplificada */}
      <div className="bg-white">
        {ranking.length > 0 ? (
          ranking.slice(3).map((item, index) => {
            const pos = index + 4; // Empezamos desde el 4º
            return (
              <div 
                key={item.id}
                onClick={() => onSelectParticipant(item.id)}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="w-6 text-center text-sm font-bold text-gray-400 flex-shrink-0">
                    {pos}
                  </span>
                  <p className="text-base font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  {item.prize > 0 && (
                    <span className="text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm">
                      +{item.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                    </span>
                  )}
                  <div className="flex items-center gap-0.5">
                    <span className="text-base font-bold text-emerald-700">
                      {item.points_total}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-500 uppercase">pts</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center">
            <p className="text-base text-gray-500 font-medium">No hay participantes aún</p>
          </div>
        )}
      </div>
    </div>
  );
}
