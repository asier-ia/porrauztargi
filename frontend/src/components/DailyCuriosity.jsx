import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, ChevronDown, X } from 'lucide-react';
import { curiosidadesVAR } from '../data/curiosidadesVAR';

const STORAGE_KEY = 'uztargi_daily_curiosity';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function pickRandomIndex(excludeIndices) {
  const available = curiosidadesVAR
    .map((_, i) => i)
    .filter(i => !excludeIndices.includes(i));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
  }
}

export default function DailyCuriosity() {
  const [revealed, setRevealed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [factIndex, setFactIndex] = useState(null);
  const [ready, setReady] = useState(false);

  const initializeDay = useCallback(() => {
    const today = getToday();
    const saved = loadState();

    if (saved && saved.today === today) {
      setFactIndex(saved.index);
      setRevealed(saved.revealed);
      setDismissed(saved.dismissed || false);
      setReady(true);
      return;
    }

    const history = saved && saved.today !== today ? saved.history : [];
    const index = pickRandomIndex(history);
    if (index === null) {
      const fresh = pickRandomIndex([]);
      setFactIndex(fresh);
      saveState({ today, index: fresh, history: [fresh], revealed: false, dismissed: false });
    } else {
      setFactIndex(index);
      saveState({ today, index, history: [...history, index], revealed: false, dismissed: false });
    }
    setRevealed(false);
    setDismissed(false);
    setReady(true);
  }, []);

  useEffect(() => {
    initializeDay();
  }, [initializeDay]);

  const handleReveal = () => {
    setRevealed(true);
    setDismissed(false);
    const saved = loadState();
    if (saved) {
      saveState({ ...saved, revealed: true, dismissed: false });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    const saved = loadState();
    if (saved) {
      saveState({ ...saved, dismissed: true });
    }
  };

  if (!ready || factIndex === null) return null;

  return (
    <div className="px-4 pt-2 pb-1">
      {!revealed || dismissed ? (
        <button
          onClick={handleReveal}
          className="w-full group flex items-center justify-between gap-2 px-4 py-2.5 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100/60 hover:border-emerald-200 rounded-2xl transition-all duration-300 active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100/80 group-hover:bg-emerald-200/80 transition-colors duration-300 flex-shrink-0">
              <Lightbulb className="h-3.5 w-3.5 text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700/80 group-hover:text-emerald-800 tracking-wide transition-colors duration-300">
              Dato curioso del día
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500/70 group-hover:text-emerald-600 uppercase tracking-wider transition-colors duration-300 flex-shrink-0">
            <span>{dismissed ? 'Ver' : 'Descubrir'}</span>
            <ChevronDown className="h-3 w-3 group-hover:translate-y-0.5 transition-transform duration-300" />
          </div>
        </button>
      ) : (
        <div className="relative px-4 py-3 bg-gradient-to-r from-emerald-50/80 to-amber-50/40 border border-emerald-100/60 rounded-2xl animate-fadeIn">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 text-gray-400 hover:text-gray-600 transition-all duration-200"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-start gap-2.5 pr-5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 flex-shrink-0 mt-0.5">
              <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest">
                  Dato curioso del día
                </span>
                <span className="text-[9px] font-bold text-emerald-400/60">
                  #{factIndex + 1}/{curiosidadesVAR.length}
                </span>
              </div>
              <p className="text-[12.5px] font-semibold text-gray-700 leading-relaxed">
                {curiosidadesVAR[factIndex]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
