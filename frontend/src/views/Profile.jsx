/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { getJinxStyles } from './Ranking';
import { useLanguage } from '../context/LanguageContext';

const normalizeString = (s) => {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const normalizePlayer = (s) => {
  let norm = normalizeString(s);
  norm = norm.replace(/\./g, "");
  norm = norm.replace(/\s+jr\b/g, " junior");
  norm = norm.replace(/-/g, " ");
  return norm.trim().replace(/\s+/g, " ");
};

const matchScorer = (predictedName, realName) => {
  const pNorm = normalizePlayer(predictedName);
  const rNorm = normalizePlayer(realName);

  if (!pNorm || !rNorm) return false;
  if (pNorm === rNorm) return true;

  // Check substring match
  if (pNorm.includes(rNorm) || rNorm.includes(pNorm)) return true;

  // Check for initials matching (e.g. "B. Díaz" with "Brahim Díaz")
  const pWords = pNorm.split(" ");
  const rWords = rNorm.split(" ");

  if (pWords.length >= 2 && pWords[0].length === 1) {
    if (rWords[0].startsWith(pWords[0])) {
      const remainingP = pWords.slice(1);
      if (remainingP.every(word => rWords.includes(word))) {
        return true;
      }
    }
  }

  if (rWords.length >= 2 && rWords[0].length === 1) {
    if (pWords[0].startsWith(rWords[0])) {
      const remainingR = rWords.slice(1);
      if (remainingR.every(word => pWords.includes(word))) {
        return true;
      }
    }
  }

  return false;
};

export default function Profile({ selectedId, setSelectedId, API_BASE }) {
  const { t } = useLanguage();
  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [realResults, setRealResults] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchParticipantsList = async () => {
      try {
        const response = await fetch(`${API_BASE}/participants`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setParticipants(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    };

    const fetchRealData = async () => {
      try {
        const response = await fetch(`${API_BASE}/results`);
        if (response.ok) {
          const data = await response.json();
          setRealResults(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchParticipantsList();
    fetchRealData();
  }, [API_BASE]);

  useEffect(() => {
    if (!selectedId) {
      setCurrentParticipant(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await fetch(`${API_BASE}/participants/${selectedId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentParticipant(data);
          setSearchTerm(data.name);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedId, API_BASE]);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id) => {
    setSelectedId(id);
    setShowDropdown(false);
  };

  return (
    <div className="animate-fadeIn px-2">
      <div className="px-4 mb-6 pt-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {t('profile.title')}
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-0.5">{t('profile.subtitle')}</p>
      </div>

      <div ref={dropdownRef} className="relative mb-8 px-4 z-30">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('profile.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-base font-medium placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all duration-200 shadow-sm"
          />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>

        {showDropdown && (
          <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto animate-fadeIn">
            {loadingList ? (
              <div className="p-5 text-center text-sm text-gray-400 font-medium">{t('profile.loading')}</div>
            ) : filteredParticipants.length > 0 ? (
              filteredParticipants.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className="px-5 py-3.5 hover:bg-emerald-50 cursor-pointer transition-colors flex justify-between items-center border-b border-gray-50 last:border-0"
                >
                  <span className="text-base font-medium text-gray-700">{p.name}</span>
                  <span className="text-xs text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded-md">Rank #{p.rank || "-"}</span>
                </div>
              ))
            ) : (
              <div className="p-5 text-center text-sm text-gray-400 font-medium">{t('profile.noResults')}</div>
            )}
          </div>
        )}
      </div>

      {loadingDetail ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : currentParticipant ? (
        <div className="animate-slideUp pb-6">

          {(() => {
            const jinx = getJinxStyles(currentParticipant.jinx_count);
            return (
              <div className={`pt-6 pb-4 px-4 border-y border-gray-100 mb-6 relative overflow-hidden transition-all duration-300 ${
                currentParticipant.jinx_count > 0 ? jinx.cardCls : 'bg-gradient-to-b from-emerald-50/30 to-white'
              }`}>
                {jinx.overlay}
            <div className="text-center mb-6">
              <h3 className={`text-2xl font-black mb-1 relative z-10 ${currentParticipant.jinx_count > 0 ? jinx.nameCls : 'text-gray-900'}`}>
                
                {currentParticipant.name}
              </h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm relative z-10">
                <span className="text-xs text-gray-500 font-medium">{t('profile.currentRank')}</span>
                <span className="text-sm font-bold text-emerald-700">#{currentParticipant.rank || "-"}</span>
              </div>
            </div>

            <div className="mt-4 mb-6 text-center relative z-10">
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${currentParticipant.jinx_count > 0 ? 'text-inherit opacity-75' : 'text-gray-400'}`}>{t('profile.pointsTotal')}</p>
              <p className={`text-4xl font-black ${currentParticipant.jinx_count > 0 ? jinx.pointsCls : 'text-emerald-700'}`}>{currentParticipant.points_total}</p>
            </div>

            <div className="space-y-2.5 relative z-10">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1 text-center">{t('profile.pointsSummary')}</h4>

              <div className="flex items-center justify-between bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                <span className="text-sm font-bold text-emerald-900">{t('profile.groupPhase')}</span>
                <span className="text-lg font-black text-emerald-700">{currentParticipant.points_groups} <span className="text-[10px] font-bold text-emerald-600/70">pts</span></span>
              </div>

              <div className="flex items-center justify-between bg-amber-50/80 p-3.5 rounded-xl border border-amber-100 shadow-sm">
                <span className="text-sm font-bold text-amber-900">{t('profile.pointsScorers')}</span>
                <span className="text-lg font-black text-amber-700">{currentParticipant.points_scorers} <span className="text-[10px] font-bold text-emerald-600/70">pts</span></span>
              </div>

              <div className="flex items-center justify-between bg-sky-50/80 p-3.5 rounded-xl border border-sky-100 shadow-sm">
                <span className="text-sm font-bold text-sky-900">{t('profile.pointsTop4')}</span>
                <span className="text-lg font-black text-sky-700">{currentParticipant.points_top4} <span className="text-[10px] font-bold text-emerald-600/70">pts</span></span>
              </div>
            </div>

            {/* Detailed Active Curses Countdowns */}
            {currentParticipant.active_jinxes && currentParticipant.active_jinxes.length > 0 && (
              <div className={`mt-5 p-3.5 rounded-2xl border border-dashed relative z-10 text-center ${
                currentParticipant.jinx_count > 10
                  ? 'bg-red-950/20 border-red-800/40 text-red-200'
                  : currentParticipant.jinx_count >= 4
                  ? 'bg-purple-900/20 border-purple-500/30 text-purple-200'
                  : 'bg-emerald-100/20 border-emerald-300/40 text-emerald-950'
              }`}>
                <h4 className="text-[10px] font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5 justify-center">
                  <span>🕯️</span> Maldiciones Activas ({currentParticipant.jinx_count})
                </h4>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {currentParticipant.active_jinxes.map((jx, idx) => {
                    const formatExpiryTime = (seconds) => {
                      if (seconds <= 0) return "Expirando...";
                      const d = Math.floor(seconds / (3600 * 24));
                      const h = Math.floor((seconds % (3600 * 24)) / 3600);
                      const m = Math.floor((seconds % 3600) / 60);
                      if (d > 0) return `${d}d ${h}h`;
                      return `${h}h ${m}m`;
                    };
                    return (
                      <div key={jx.id} className="flex justify-between text-[11px] font-bold opacity-90 px-1">
                        <span>Gafe #{idx + 1}</span>
                        <span className="font-extrabold tabular-nums">expira en {formatExpiryTime(jx.seconds_remaining)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
              </div>
            );
          })()}

          {currentParticipant.prediction && (
            <div className="px-4 space-y-6">

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                  {t('profile.groupTitle')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(currentParticipant.group_matches || {}).map(([group, matches]) => {
                    return (
                      <div key={group} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 mb-2.5">Grupo {group}</p>
                        <div className="space-y-2">
                          {matches.map((match, idx) => {
                            return (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700 truncate mr-2">
                                  {match.predicted_name}
                                </span>
                                {match.is_correct ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-amber-400 rounded-full"></span>
                  {t('profile.scorersTitle')}
                </h4>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="space-y-3">
                    {currentParticipant.scorer_matches?.map((match, idx) => (
                      <div key={idx} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <span className="text-sm font-semibold text-gray-800">{match.predicted_name}</span>
                        {match.real_name ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {match.goals} goles × 2 = +{match.points} pts
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-300">{t('profile.pending')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-gray-900 rounded-full"></span>
                  {t('profile.top4Title')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(currentParticipant.top4_matches || []).map((match) => {
                    const isCorrectOrQualified = match.points > 0;

                    return (
                      <div key={match.position} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${match.position === "1" ? "text-amber-500" : match.position === "2" ? "text-gray-400" : "text-orange-500"
                          }`}>
                          {match.position === "1" ? t('profile.champion') : match.position === "2" ? t('profile.subchampion') : match.position === "3" ? t('profile.pos3') : t('profile.pos4')}
                        </p>
                        <p className="text-sm font-bold text-gray-800 mb-2">{match.predicted_name}</p>
                        {isCorrectOrQualified ? (
                          <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            +{match.points} pts
                          </span>
                        ) : (
                          <span className="inline-block text-gray-300 text-[10px] font-medium px-2 py-0.5">
                            {t('profile.pending')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-700 mb-1">{t('profile.searchTitle')}</p>
          <p className="text-sm text-gray-400 font-medium">{t('profile.searchDesc')}</p>
        </div>
      )}
    </div>
  );
}
