/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTeamFlag } from '../data/teamFlags';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getOffsetDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateStr(d);
}

function formatDateDisplay(dateStr, locale) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const STATUS_BADGE = {
  IN_PLAY: { label: 'EN VIVO', cls: 'bg-red-500 text-white' },
  PAUSED: { label: 'DESCANSO', cls: 'bg-amber-500 text-white' },
  FINISHED: { label: 'FT', cls: 'bg-gray-200 text-gray-600' },
  AWARDED: { label: 'FT', cls: 'bg-gray-200 text-gray-600' },
  SUSPENDED: { label: 'SUSP.', cls: 'bg-gray-200 text-gray-500' },
  CANCELLED: { label: 'CANC.', cls: 'bg-gray-200 text-gray-500' },
  POSTPONED: { label: 'APLAZ.', cls: 'bg-gray-200 text-gray-500' },
};

function getStatusBadge(match) {
  return STATUS_BADGE[match.status] || null;
}

function getTeamColor(match, isHome) {
  if (match.status !== 'FINISHED' && match.status !== 'AWARDED') return 'text-gray-900';
  const h = match.homeScore;
  const a = match.awayScore;
  if (h == null || a == null) return 'text-gray-900';
  if (h > a) return isHome ? 'text-emerald-700' : 'text-gray-400';
  if (a > h) return isHome ? 'text-gray-400' : 'text-emerald-700';
  return 'text-gray-900';
}

export default function Partidos({ API_BASE }) {
  const { t, language } = useLanguage();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => toDateStr(new Date()));

  const todayStr = toDateStr(new Date());
  const yesterdayStr = getOffsetDate(-1);
  const tomorrowStr = getOffsetDate(1);
  const canGoPrev = currentDate > yesterdayStr;
  const canGoNext = currentDate < tomorrowStr;
  const isToday = currentDate === todayStr;
  const locale = language === 'eu' ? 'eu' : 'es';

  const fetchMatches = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/matches?date=${currentDate}`);
      if (!res.ok) throw new Error('Error');
      setMatches(await res.json());
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    window.addEventListener('api-auto-refreshed', fetchMatches);
    return () => window.removeEventListener('api-auto-refreshed', fetchMatches);
  }, [currentDate]);

  const goToDay = (offset) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setCurrentDate(toDateStr(d));
  };

  const formatTime = (utcDate) => {
    const d = new Date(utcDate);
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const renderMatchRow = (m) => {
    const badge = getStatusBadge(m);
    const isScheduled = m.status === 'SCHEDULED' || m.status === 'TIMED';

    return (
      <div
        key={m.id || m.utcDate + m.homeTeam + m.awayTeam}
        className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-b-0 relative"
      >
        <div className="flex items-center gap-2 min-w-0 flex-[2]">
          <span className="text-xs font-medium text-gray-400 w-10 flex-shrink-0 tabular-nums">
            {formatTime(m.utcDate)}
          </span>
          <span className={`text-sm font-bold truncate flex items-center gap-1.5 ${getTeamColor(m, true)}`}>
            <span className="text-base leading-none flex-shrink-0">{getTeamFlag(m.homeTeam)}</span>
            <span className="truncate">{m.homeTeam}</span>
          </span>
        </div>

        <div className="flex-shrink-0 mx-2 text-center min-w-[64px]">
          {isScheduled ? (
            <span className="text-xs font-bold text-gray-400">vs</span>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-black text-gray-900 leading-none tabular-nums">
                {m.homeScore != null ? m.homeScore : '-'}
                <span className="mx-0.5 text-gray-300 font-medium">:</span>
                {m.awayScore != null ? m.awayScore : '-'}
              </span>
              {badge && (
                <span className={`px-1.5 py-px text-[9px] font-bold leading-tight rounded-sm ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-[2] justify-end">
          <span className={`text-sm font-bold truncate flex items-center gap-1.5 ${getTeamColor(m, false)}`}>
            <span className="truncate">{m.awayTeam}</span>
            <span className="text-base leading-none flex-shrink-0">{getTeamFlag(m.awayTeam)}</span>
          </span>
          {m.status === 'IN_PLAY' && (
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-medium">Cargando partidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-6 my-8 p-6 bg-red-50 rounded-2xl flex flex-col items-center text-center">
        <p className="text-sm text-red-600 mb-5">{error}</p>
        <button
          onClick={fetchMatches}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn px-2">
      {/* Date Navigation */}
      <div className="flex items-center justify-between px-4 mb-4 pt-2">
        <button
          onClick={() => goToDay(-1)}
          disabled={!canGoPrev}
          className={`flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            canGoPrev
              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              : 'text-gray-300 cursor-default'
          }`}
        >
          <span className="text-lg leading-none">&larr;</span>
          <span className="hidden sm:inline">{language === 'es' ? 'Anterior' : 'Aurrekoa'}</span>
        </button>

        <button
          onClick={() => setCurrentDate(todayStr)}
          disabled={isToday}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            isToday
              ? 'bg-emerald-600 text-white shadow-sm cursor-default'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t('matches.today')}
        </button>

        <button
          onClick={() => goToDay(1)}
          disabled={!canGoNext}
          className={`flex items-center gap-1 px-3 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            canGoNext
              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              : 'text-gray-300 cursor-default'
          }`}
        >
          <span className="hidden sm:inline">{language === 'es' ? 'Siguiente' : 'Hurrengoa'}</span>
          <span className="text-lg leading-none">&rarr;</span>
        </button>
      </div>

      <div className="text-center mb-6">
        <p className="text-base font-bold text-gray-800 capitalize">
          {formatDateDisplay(currentDate, locale)}
        </p>
      </div>

      {/* Matches */}
      {matches.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {matches.map(renderMatchRow)}
        </div>
      )}

      {matches.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-sm text-gray-400 font-medium">{t('matches.noMatches')}</p>
        </div>
      )}
    </div>
  );
}
