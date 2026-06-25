/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Trophy, User, Target, CalendarDays, Heart, X, Smartphone, Sparkles } from 'lucide-react';

const BubblesOverlay = () => {
  return (
    <div className="jinx-bubbles-container">
      <div className="jinx-bubble" style={{ left: '15%', width: '12px', height: '12px', animationDuration: '3.2s', animationDelay: '0s' }} />
      <div className="jinx-bubble" style={{ left: '35%', width: '8px', height: '8px', animationDuration: '4s', animationDelay: '0.8s' }} />
      <div className="jinx-bubble" style={{ left: '60%', width: '14px', height: '14px', animationDuration: '2.8s', animationDelay: '0.4s' }} />
      <div className="jinx-bubble" style={{ left: '80%', width: '10px', height: '10px', animationDuration: '3.5s', animationDelay: '1.2s' }} />
    </div>
  );
};

const SmokeOverlay = () => {
  return (
    <div className="jinx-smoke-container">
      <div className="jinx-smoke-wave-element" />
    </div>
  );
};

const CracksOverlay = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-1 bg-gradient-to-br from-gray-900 to-gray-950 opacity-30 jinx-cracks-pulsing">
      <svg className="absolute inset-0 w-full h-full stroke-red-500/40" viewBox="0 0 100 100" fill="none" strokeWidth="0.7">
        <path d="M 10 10 L 25 35 L 45 42 L 50 65 L 75 80" />
        <path d="M 25 35 L 15 50 L 35 75 L 42 90" />
        <path d="M 90 20 L 75 35 L 60 55 L 70 85" />
        <path d="M 75 35 L 85 60 L 80 80" />
      </svg>
    </div>
  );
};

export function getJinxStyles(count) {
  if (!count || count <= 0) {
    return {
      cardCls: "bg-white border-gray-100 text-gray-900 shadow-sm",
      nameCls: "text-gray-900",
      pointsCls: "text-emerald-700",
      subtextCls: "text-gray-400 font-medium",
      overlay: null
    };
  }
  if (count >= 1 && count <= 3) {
    return {
      cardCls: "bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-md ring-2 ring-emerald-400/30 relative overflow-hidden",
      nameCls: "text-emerald-950 font-bold",
      pointsCls: "text-emerald-800 font-black",
      subtextCls: "text-emerald-600/80 font-bold",
      overlay: <BubblesOverlay />
    };
  }
  if (count >= 4 && count <= 10) {
    return {
      cardCls: "bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-100 border-purple-600 shadow-lg ring-4 ring-purple-500/35 relative overflow-hidden",
      nameCls: "text-purple-100 font-black",
      pointsCls: "text-purple-300 font-black",
      subtextCls: "text-purple-400/80 font-bold",
      overlay: <SmokeOverlay />
    };
  }
  // count > 10
  return {
    cardCls: "bg-black text-red-500 border-red-800 shadow-xl ring-4 ring-red-950/65 relative overflow-hidden",
    nameCls: "text-gray-100 font-black",
    pointsCls: "text-red-500 font-black",
    subtextCls: "text-red-700/80 font-bold",
    overlay: <CracksOverlay />
  };
}

export default function Ranking({ onSelectParticipant, onNavigateToInfo, API_BASE }) {
  const { t } = useLanguage();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Jinx state
  const [showJinxModal, setShowJinxModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [jinxLoading, setJinxLoading] = useState(false);
  const [jinxSuccess, setJinxSuccess] = useState(false);
  const [participantDetail, setParticipantDetail] = useState(null);

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

  const handleOpenJinxModal = async (participant) => {
    setSelectedParticipant(participant);
    setJinxSuccess(false);
    setJinxLoading(false);
    setShowJinxModal(true);
    setParticipantDetail(null);

    // Fetch detail to show countdown
    try {
      const response = await fetch(`${API_BASE}/participants/${participant.id}`);
      if (response.ok) {
        const data = await response.json();
        setParticipantDetail(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyJinx = async (isMock = false) => {
    if (!selectedParticipant) return;
    setJinxLoading(true);
    try {
      const response = await fetch(`${API_BASE}/participants/${selectedParticipant.id}/jinx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_mock: isMock })
      });
      if (response.ok) {
        setJinxSuccess(true);
        fetchRanking(); // Refresh scores and jinx counts
      } else {
        alert("No se pudo aplicar el gafe.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor.");
    } finally {
      setJinxLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">{t('ranking.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-6 my-8 p-6 bg-red-50 rounded-2xl flex flex-col items-center text-center">
        <p className="text-base font-semibold text-red-800 mb-2">{t('ranking.connectionError')}</p>
        <p className="text-sm text-red-600 mb-5">{error}</p>
        <button 
          onClick={fetchRanking}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
        >
          {t('ranking.retry')}
        </button>
      </div>
    );
  }

  const top1 = ranking[0];
  const top2 = ranking[1];
  const top3 = ranking[2];

  // Helper to format remaining time
  const formatExpiryTime = (seconds) => {
    if (seconds <= 0) return "Expirando...";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="animate-fadeIn px-2">
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {t('ranking.title')}
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            {t('ranking.participants', { count: ranking.length })}
          </p>
        </div>
      </div>

      {/* Resumen de Premios Banner */}
      <div className="mx-4 mb-6 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute right-2 -bottom-2 opacity-5 text-7xl select-none">💶</div>
        <div className="relative z-10">
          <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2.5">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">{t('ranking.bannerTitle')}</span>
            <span className="text-sm font-black bg-white/15 px-2.5 py-0.5 rounded-full border border-white/10">{t('ranking.bannerTotal')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
              <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">{t('ranking.prize1')}</p>
              <p className="text-sm font-black text-amber-300">1.668€</p>
            </div>
            <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
              <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">{t('ranking.prize2')}</p>
              <p className="text-sm font-black text-slate-100">834€</p>
            </div>
            <div className="bg-white/5 rounded-xl py-1.5 border border-white/5">
              <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">{t('ranking.prize3')}</p>
              <p className="text-sm font-black text-orange-300">278€</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-200">
            <span>🎗️</span>
            <span>{t('ranking.afagiDonation', { amount: "278€" })}</span>
          </div>
        </div>
      </div>

      {/* 🍺 Funny Donation Banner */}
      <div 
        onClick={onNavigateToInfo}
        data-umami-event="Clic Banner Donacion"
        className="mx-4 mb-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-md relative overflow-hidden cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all duration-200"
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 text-6xl select-none animate-bounce" style={{ animationDuration: '3s' }}>
          🍺
        </div>
        <div className="relative z-10 pr-12 text-left">
          <h3 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-amber-100">
            <span>🍻</span> {t('ranking.donationBannerTitle')}
          </h3>
          <p className="text-[11.5px] font-bold mt-1 text-white/95 leading-relaxed">
            {t('ranking.donationBannerDesc')}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1 text-[9px] font-extrabold bg-white text-orange-600 px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
            <span>{t('ranking.donationBannerBtn')}</span>
            <span>➔</span>
          </div>
        </div>
      </div>

      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end mb-8 px-4">
          
          {/* 2º Puesto - Plata Sólido */}
          {top2 && (() => {
            const jinx = getJinxStyles(top2.jinx_count);
            return (
              <div 
                onClick={() => onSelectParticipant(top2.id)}
                className={`flex flex-col items-center cursor-pointer p-3 rounded-2xl hover:brightness-105 transition-all duration-200 relative overflow-hidden ${
                  top2.jinx_count > 0 
                    ? jinx.cardCls 
                    : 'bg-gradient-to-b from-slate-200 to-slate-300 border border-slate-400 shadow-md text-slate-900'
                }`}
              >
                {jinx.overlay}
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenJinxModal(top2); }}
                  className="absolute top-2.5 right-2.5 text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-black/10 hover:bg-black/20 text-black border border-black/10 transition-all z-20 cursor-pointer flex items-center gap-0.5"
                >
                  <span>🧙‍♀️</span>
                </button>
                <div className={`w-8 h-8 rounded-full bg-slate-100/50 flex items-center justify-center text-sm font-black text-slate-800 mb-3 shadow-inner border border-slate-300/50 relative z-10 ${
                  top2.jinx_count > 0 ? 'bg-black/10 border-black/10 text-inherit' : ''
                }`}>
                  2
                </div>
                <p className={`text-xs font-bold text-center truncate w-full relative z-10 ${top2.jinx_count > 0 ? jinx.nameCls : 'text-slate-900'}`}>
                  {top2.name.split(' ')[0]}
                </p>
                <p className={`text-sm font-black mt-1 relative z-10 ${top2.jinx_count > 0 ? jinx.pointsCls : 'text-slate-900'}`}>
                  {top2.points_total} <span className="text-[10px] font-bold">{t('ranking.pts')}</span>
                </p>
                {top2.prize > 0 && (
                  <span className="text-[10px] font-extrabold bg-slate-850/15 text-slate-900 px-2 py-0.5 rounded-full mt-2 border border-slate-950/5 shadow-sm relative z-10">
                    +{top2.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                  </span>
                )}
              </div>
            );
          })()}

          {/* 1º Puesto - Oro Sólido */}
          {top1 && (() => {
            const jinx = getJinxStyles(top1.jinx_count);
            return (
              <div 
                onClick={() => onSelectParticipant(top1.id)}
                className={`flex flex-col items-center cursor-pointer p-4 rounded-2xl hover:brightness-105 transition-all duration-200 -translate-y-3 relative overflow-hidden z-10 ${
                  top1.jinx_count > 0 
                    ? jinx.cardCls 
                    : 'bg-gradient-to-br from-amber-400 to-amber-500 border border-amber-500 shadow-lg text-amber-950'
                }`}
              >
                {jinx.overlay}
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenJinxModal(top1); }}
                  className="absolute top-3 right-3 text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-black/10 hover:bg-black/20 text-black border border-black/10 transition-all z-20 cursor-pointer flex items-center gap-0.5"
                >
                  <span>🧙‍♀️</span>
                </button>
                <div className="absolute -top-3 w-full flex justify-center z-20">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider border ${
                    top1.jinx_count > 0
                      ? 'bg-black text-gray-100 border-zinc-800'
                      : 'bg-white text-amber-600 border-amber-100'
                  }`}>{t('ranking.leader')}</span>
                </div>
                <div className={`w-10 h-10 rounded-full bg-amber-200/40 flex items-center justify-center text-base font-black mb-3 shadow-inner border border-amber-300/50 mt-2 relative z-10 ${
                  top1.jinx_count > 0 ? 'bg-black/10 border-black/10 text-inherit' : 'text-amber-950'
                }`}>
                  1
                </div>
                <p className={`text-sm font-black text-center truncate w-full drop-shadow-sm relative z-10 ${top1.jinx_count > 0 ? jinx.nameCls : 'text-white'}`}>
                  {top1.name.split(' ')[0]}
                </p>
                <p className={`text-lg font-black mt-1 drop-shadow-sm relative z-10 ${top1.jinx_count > 0 ? jinx.pointsCls : 'text-amber-950'}`}>
                  {top1.points_total} <span className="text-xs font-bold">{t('ranking.pts')}</span>
                </p>
                {top1.prize > 0 && (
                  <span className="text-[11px] font-extrabold bg-amber-950/15 text-amber-950 px-2.5 py-0.5 rounded-full mt-2 border border-amber-950/10 shadow-sm relative z-10">
                    +{top1.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                  </span>
                )}
              </div>
            );
          })()}

          {/* 3º Puesto - Bronce Sólido */}
          {top3 && (() => {
            const jinx = getJinxStyles(top3.jinx_count);
            return (
              <div 
                onClick={() => onSelectParticipant(top3.id)}
                className={`flex flex-col items-center cursor-pointer p-3 rounded-2xl hover:brightness-105 transition-all duration-200 relative overflow-hidden ${
                  top3.jinx_count > 0 
                    ? jinx.cardCls 
                    : 'bg-gradient-to-b from-orange-300 to-orange-400 border border-orange-500 shadow-md text-orange-950'
                }`}
              >
                {jinx.overlay}
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenJinxModal(top3); }}
                  className="absolute top-2.5 right-2.5 text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-black/10 hover:bg-black/20 text-black border border-black/10 transition-all z-20 cursor-pointer flex items-center gap-0.5"
                >
                  <span>🧙‍♀️</span>
                </button>
                <div className={`w-8 h-8 rounded-full bg-orange-200/50 flex items-center justify-center text-sm font-black text-orange-900 mb-3 shadow-inner border border-orange-300/50 relative z-10 ${
                  top3.jinx_count > 0 ? 'bg-black/10 border-black/10 text-inherit' : ''
                }`}>
                  3
                </div>
                <p className={`text-xs font-bold text-center truncate w-full relative z-10 ${top3.jinx_count > 0 ? jinx.nameCls : 'text-orange-950'}`}>
                  {top3.name.split(' ')[0]}
                </p>
                <p className={`text-sm font-black mt-1 relative z-10 ${top3.jinx_count > 0 ? jinx.pointsCls : 'text-orange-950'}`}>
                  {top3.points_total} <span className="text-[10px] font-bold">{t('ranking.pts')}</span>
                </p>
                {top3.prize > 0 && (
                  <span className="text-[10px] font-extrabold bg-orange-950/10 text-orange-950 px-2 py-0.5 rounded-full mt-2 border border-orange-950/5 shadow-sm relative z-10">
                    +{top3.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Lista General Simplificada */}
      <div className="bg-white">
        {ranking.length > 0 ? (
          ranking.slice(3).map((item, index) => {
            const pos = index + 4; // Empezamos desde el 4º
            const jinx = getJinxStyles(item.jinx_count);
            return (
              <div 
                key={item.id}
                onClick={() => onSelectParticipant(item.id)}
                className={`flex items-center justify-between px-6 py-3.5 hover:bg-emerald-50/10 transition-colors cursor-pointer border-b border-gray-50 last:border-b-0 relative ${
                  item.jinx_count > 0 ? jinx.cardCls : ''
                }`}
              >
                {jinx.overlay}
                <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
                  <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${item.jinx_count > 0 ? 'text-inherit opacity-60' : 'text-gray-400'}`}>
                    {pos}
                  </span>
                  <p className={`text-base truncate ${item.jinx_count > 0 ? jinx.nameCls : 'font-medium text-gray-900'}`}>
                    {item.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3 relative z-10">
                  {item.prize > 0 && (
                    <span className="text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm">
                      +{item.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                    </span>
                  )}
                  
                  {/* Subtle 🧙‍♀️ GAFAR button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenJinxModal(item);
                    }}
                    className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-full border transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1 ${
                      item.jinx_count > 10
                        ? 'bg-red-950/40 text-red-400 border-red-800/60 hover:bg-red-950/60 shadow-sm'
                        : item.jinx_count >= 4
                        ? 'bg-purple-900/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/60 shadow-sm'
                        : item.jinx_count >= 1
                        ? 'bg-emerald-100 text-emerald-850 border-emerald-300 hover:bg-emerald-200 shadow-sm'
                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  >
                    <span>🧙‍♀️</span>
                    <span>GAFAR</span>
                  </button>

                  <div className="flex items-center gap-0.5">
                    <span className={`text-base font-black ${item.jinx_count > 0 ? jinx.pointsCls : 'text-emerald-700'}`}>
                      {item.points_total}
                    </span>
                    <span className={`text-[10px] uppercase ${item.jinx_count > 0 ? 'text-inherit opacity-70 font-bold' : 'font-semibold text-emerald-500'}`}>{t('ranking.pts')}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center">
            <p className="text-base text-gray-500 font-medium">{t('ranking.noParticipants')}</p>
          </div>
        )}
      </div>

      {/* 🧙‍♀️ JINX MODAL */}
      {showJinxModal && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto relative select-none">
            
            {/* Close */}
            <button 
              onClick={() => setShowJinxModal(false)} 
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            {/* Content */}
            {!jinxSuccess ? (
              <div className="space-y-4 pt-2">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 text-3xl">
                  🧙‍♀️
                </div>
                
                <h3 className="text-lg font-black text-gray-900 text-center leading-tight">
                  Mandar un Gafe a <br /><span className="text-purple-700 text-xl">{selectedParticipant.name}</span>
                </h3>

                <p className="text-xs text-gray-500 leading-relaxed font-semibold text-center px-2">
                  ¿Sientes que <span className="font-extrabold text-gray-700">{selectedParticipant.name}</span> está teniendo demasiada suerte? ¡Lánzale un mal de ojo para teñir su marcador de poción tóxica y enfriar su racha!
                </p>

                {/* Active Jinxes Status */}
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-purple-900">Gafes activos actuales:</span>
                    <span className="font-black text-purple-700 bg-purple-200/50 px-2 py-0.5 rounded-full">
                      {selectedParticipant.jinx_count}
                    </span>
                  </div>
                  {participantDetail && participantDetail.active_jinxes && participantDetail.active_jinxes.length > 0 ? (
                    <div className="pt-1.5 border-t border-purple-100/50 space-y-1 max-h-24 overflow-y-auto">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Tiempos de expiración (72h):</p>
                      {participantDetail.active_jinxes.map((jx, idx) => (
                        <div key={jx.id} className="flex justify-between text-[11px] font-semibold text-purple-800">
                          <span>Gafe #{idx + 1}</span>
                          <span className="font-bold tabular-nums">expira en {formatExpiryTime(jx.seconds_remaining)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-purple-400 text-center italic pt-0.5">¡Este jugador está completamente sano!</p>
                  )}
                </div>

                {/* Level indicators */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-black uppercase tracking-wider">
                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                    🧪 1-3 Gafes <br /><span className="opacity-75 font-semibold">Poción</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800">
                    🔮 4-10 Gafes <br /><span className="opacity-75 font-semibold">Tóxico</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-800">
                    💀 10+ Gafes <br /><span className="opacity-75 font-semibold">Maldito</span>
                  </div>
                </div>

                {/* Stripe Bizum notice */}
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-[11px] font-bold text-amber-800 leading-relaxed text-center flex items-center gap-1.5 justify-center">
                    <Smartphone className="h-4 w-4" /> Cada gafe cuesta 1.00 € vía Bizum.
                  </p>
                </div>

                {/* Submit buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleApplyJinx(false)}
                    disabled={jinxLoading}
                    className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 disabled:bg-purple-300 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {jinxLoading ? 'Conectando...' : 'Pagar 1€ con Bizum 🧙‍♀️'}
                  </button>
                  
                  {/* Test Simulate Gafe */}
                  <button
                    onClick={() => handleApplyJinx(true)}
                    disabled={jinxLoading}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>🧪</span> Gafar Gratis (Simulación Test)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl animate-bounce">
                  ✨
                </div>
                <h3 className="text-xl font-black text-purple-950 uppercase tracking-tight">
                  ¡Gafe Enviado!
                </h3>
                <p className="text-sm text-gray-500 font-medium px-4 leading-relaxed">
                  El mal de ojo ha sido activado de forma instantánea. La tarjeta de <span className="font-extrabold text-purple-800">{selectedParticipant.name}</span> se teñirá de inmediato. ¡Dura exactamente 3 días!
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setShowJinxModal(false)}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-md"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
