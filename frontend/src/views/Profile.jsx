/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Search, ChevronDown, CheckCircle2, XCircle, Sparkles, X } from 'lucide-react';
import { getJinxStyles, JinxPaymentForm } from './Ranking';
import { useLanguage } from '../context/LanguageContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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

  if (pNorm.includes(rNorm) || rNorm.includes(pNorm)) return true;

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

  // Estados para el Modal de Mal de Ojo
  const [showJinxModal, setShowJinxModal] = useState(false);
  const [jinxLoading, setJinxLoading] = useState(false);
  const [jinxSuccess, setJinxSuccess] = useState(false);
  const [jinxQuantity, setJinxQuantity] = useState(1);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentStep, setPaymentStep] = useState('form');
  const [jinxRedirectSuccess, setJinxRedirectSuccess] = useState(false);

  const jinxElementsOptions = useMemo(() => clientSecret ? { clientSecret } : null, [clientSecret]);

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

  const fetchDetail = async (idToFetch) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_BASE}/participants/${idToFetch}`);
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

  useEffect(() => {
    if (!selectedId) {
      setCurrentParticipant(null);
      return;
    }
    fetchDetail(selectedId);
  }, [selectedId, API_BASE]);

  // Detect Stripe redirect return after Bizum payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('redirect_status') === 'succeeded' &&
        params.get('payment_intent') &&
        params.get('payment_intent_client_secret')) {
      setJinxRedirectSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
      if (currentParticipant) {
        fetchDetail(currentParticipant.id);
      }
    }
  }, []);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id) => {
    setSelectedId(id);
    setShowDropdown(false);
  };

  // Lógica de Mal de Ojo
  const handleOpenJinxModal = () => {
    setJinxSuccess(false);
    setJinxLoading(false);
    setJinxQuantity(1);
    setClientSecret(null);
    setPaymentError(null);
    setPaymentStep('form');
    setShowJinxModal(true);
  };

  const handleStartPayment = async () => {
    if (!currentParticipant) return;
    setJinxLoading(true);
    setPaymentError(null);
    try {
      const res = await fetch(`${API_BASE}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: 'jinx',
          quantity: jinxQuantity,
          target_id: currentParticipant.id,
          payment_method_type: 'bizum',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al preparar el pago');
      }
      const data = await res.json();
      setClientSecret(data.client_secret);
      setPaymentStep('paying');
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setJinxLoading(false);
    }
  };

  const handleConfirmJinx = async (paymentIntentId) => {
    setJinxLoading(true);
    try {
      const response = await fetch(`${API_BASE}/participants/${currentParticipant.id}/jinx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: jinxQuantity, payment_intent_id: paymentIntentId })
      });
      if (response.ok) {
        window.umami?.track?.('Jinx Aplicado');
        setJinxSuccess(true);
        setTimeout(async () => {
          const detailRes = await fetch(`${API_BASE}/participants/${currentParticipant.id}`);
          if (detailRes.ok) {
            const data = await detailRes.json();
            setCurrentParticipant(data);
          }
        }, 2000);
      } else {
        const err = await response.json();
        setPaymentError(err.detail || 'No se pudo aplicar el mal de ojo.');
        setPaymentStep('error');
      }
    } catch (err) {
      console.error(err);
      setPaymentError('Error al conectar con el servidor.');
      setPaymentStep('error');
    } finally {
      setJinxLoading(false);
    }
  };

  const handleCancelPayment = () => {
    setClientSecret(null);
    setPaymentError(null);
    setPaymentStep('form');
  };

  return (
    <div className="animate-fadeIn px-2">
      <div className="px-4 mb-6 pt-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {t('profile.title')}
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-0.5">{t('profile.subtitle')}</p>
      </div>

      {jinxRedirectSuccess && (
        <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 shadow-sm text-center animate-slideUp">
          <p className="text-sm font-bold">
            ¡Mal de ojo aplicado con éxito!
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Los cambios ya se reflejan en el perfil.
          </p>
          <button
            onClick={() => setJinxRedirectSuccess(false)}
            className="mt-2 text-[10px] font-bold text-emerald-600 underline underline-offset-2 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

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
        <div className="animate-slideUp pb-6 px-2">

          {(() => {
            const jinxCount = currentParticipant.jinx_count || 0;
            const jinx = getJinxStyles(jinxCount);

            const isDarkTier = jinxCount > 10;
            const isJinxed = jinxCount > 0;

            const summaryBoxCls = isDarkTier
              ? "bg-[#2c2c2e] border-[#3c3c3e] text-gray-300"
              : isJinxed
                ? "bg-white/50 border-white/40 text-gray-800"
                : "bg-white border-gray-100 shadow-sm";

            return (
              <div className={`p-6 rounded-[2rem] border mb-8 relative overflow-hidden transition-all duration-300 ${isJinxed ? jinx.cardCls : 'bg-gradient-to-b from-emerald-50/40 to-white border-gray-200 shadow-sm'
                }`}>
                {jinx.overlay}

                {/* BOTÓN DE GAFAR FLOTANTE (ESTILO APPLE) */}
                <button
                  onClick={handleOpenJinxModal}
                  className={`absolute top-5 right-5 px-3.5 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-1.5 z-20 ${isJinxed ? jinx.btnCls : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Sparkles size={14} strokeWidth={2.5} />
                  <span>MAL DE OJO</span>
                </button>

                <div className="text-center mb-8 mt-2">
                  <h3 className={`text-2xl font-black mb-2 relative z-10 pr-16 pl-16 truncate ${isJinxed ? jinx.nameCls : 'text-gray-900'}`}>
                    {currentParticipant.name}
                  </h3>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm relative z-10 ${isDarkTier ? 'bg-[#2c2c2e] border-[#3c3c3e]' : 'bg-white border-gray-200'
                    }`}>
                    <span className={`text-xs font-medium ${isDarkTier ? 'text-gray-400' : 'text-gray-500'}`}>{t('profile.currentRank')}</span>
                    <span className={`text-sm font-bold ${isDarkTier ? 'text-gray-200' : 'text-emerald-700'}`}>#{currentParticipant.rank || "-"}</span>
                  </div>
                </div>

                <div className="mt-2 mb-8 text-center relative z-10">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkTier ? 'text-gray-400' : isJinxed ? 'text-inherit opacity-75' : 'text-gray-400'}`}>
                    {t('profile.pointsTotal')}
                  </p>
                  <p className={`text-5xl font-black ${isJinxed ? jinx.pointsCls : 'text-emerald-700'}`}>
                    {currentParticipant.points_total}
                  </p>
                </div>

                <div className="space-y-2.5 relative z-10">
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider px-1 mb-2 text-center ${isDarkTier ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('profile.pointsSummary')}
                  </h4>

                  <div className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm ${!isJinxed ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900' : summaryBoxCls
                    }`}>
                    <span className="text-sm font-bold">{t('profile.groupPhase')}</span>
                    <span className="text-lg font-black">{currentParticipant.points_groups} <span className="text-[10px] font-bold opacity-60">pts</span></span>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm ${!isJinxed ? 'bg-amber-50/80 border-amber-100 text-amber-900' : summaryBoxCls
                    }`}>
                    <span className="text-sm font-bold">{t('profile.pointsScorers')}</span>
                    <span className="text-lg font-black">{currentParticipant.points_scorers} <span className="text-[10px] font-bold opacity-60">pts</span></span>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm ${!isJinxed ? 'bg-sky-50/80 border-sky-100 text-sky-900' : summaryBoxCls
                    }`}>
                    <span className="text-sm font-bold">{t('profile.pointsTop4')}</span>
                    <span className="text-lg font-black">{currentParticipant.points_top4} <span className="text-[10px] font-bold opacity-60">pts</span></span>
                  </div>
                </div>

                {/* Maldiciones Activas */}
                {currentParticipant.active_jinxes && currentParticipant.active_jinxes.length > 0 && (
                  <div className={`mt-6 p-4 rounded-2xl border relative z-10 text-center shadow-sm ${isDarkTier
                      ? 'bg-[#2c2c2e] border-[#3c3c3e] text-gray-200'
                      : jinxCount >= 4
                        ? 'bg-purple-100/90 border-purple-200 text-purple-900'
                        : 'bg-lime-100/90 border-lime-200 text-lime-900'
                    }`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 justify-center opacity-90">
                      <Sparkles size={14} strokeWidth={2.5} />
                      Maldiciones Activas ({jinxCount})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto px-1">
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
                          <div key={jx.id} className="flex justify-between items-center text-[11px] font-bold px-2 py-1.5 rounded-lg hover:bg-black/5 transition-colors">
                            <span className="opacity-90">Mal de ojo #{idx + 1}</span>
                            <span className="font-extrabold tabular-nums opacity-75">
                              expira en {formatExpiryTime(jx.seconds_remaining)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Secciones de predicciones */}
          {currentParticipant.prediction && (
            <div className="px-2 space-y-8">

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                  {t('profile.groupTitle')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(currentParticipant.group_matches || {}).map(([group, matches]) => {
                    return (
                      <div key={group} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 mb-3">Grupo {group}</p>
                        <div className="space-y-2.5">
                          {matches.map((match, idx) => {
                            return (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-[13px] font-semibold text-gray-700 truncate mr-2">
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
                <h4 className="text-sm font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-amber-400 rounded-full"></span>
                  {t('profile.scorersTitle')}
                </h4>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="space-y-3">
                    {currentParticipant.scorer_matches?.map((match, idx) => (
                      <div key={idx} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <span className="text-[13px] font-semibold text-gray-800">{match.predicted_name}</span>
                        {match.real_name ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-emerald-100/50">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {match.goals} goles × 2 = +{match.points} pts
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-400">{t('profile.pending')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-gray-900 rounded-full"></span>
                  {t('profile.top4Title')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(currentParticipant.top4_matches || []).map((match) => {
                    const isCorrectOrQualified = match.points > 0;

                    return (
                      <div key={match.position} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center flex flex-col justify-between">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${match.position === "1" ? "text-amber-500" : match.position === "2" ? "text-gray-400" : "text-orange-500"
                            }`}>
                            {match.position === "1" ? t('profile.champion') : match.position === "2" ? t('profile.subchampion') : match.position === "3" ? t('profile.pos3') : t('profile.pos4')}
                          </p>
                          <p className="text-[13px] font-bold text-gray-800 mb-3">{match.predicted_name}</p>
                        </div>
                        <div>
                          {isCorrectOrQualified ? (
                            <span className="inline-block bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-100/50">
                              +{match.points} pts
                            </span>
                          ) : (
                            <span className="inline-block text-gray-400 bg-gray-50 text-[10px] font-medium px-2.5 py-1 rounded-md">
                              {t('profile.pending')}
                            </span>
                          )}
                        </div>
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
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <Search className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-700 mb-1">{t('profile.searchTitle')}</p>
          <p className="text-sm text-gray-400 font-medium">{t('profile.searchDesc')}</p>
        </div>
      )}

      {/* JINX MODAL */}
      {showJinxModal && currentParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-slideUp relative">

            {/* Close */}
            <button
              onClick={() => setShowJinxModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            {/* Content */}
            {!jinxSuccess ? (
              <div className="space-y-6 pt-2 text-center">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-purple-100">
                  <Sparkles size={28} strokeWidth={2} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  Echar mal de ojo a <br /><span className="text-purple-600 font-black">{currentParticipant.name}</span>
                </h3>

                {paymentStep === 'form' && (
                  <>
                    {/* Slider + Number Input */}
                    <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-gray-700">Fuerza:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={jinxQuantity}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 1;
                            setJinxQuantity(Math.max(1, Math.min(100, val)));
                          }}
                          className="w-20 text-center bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
                        />
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={jinxQuantity}
                        onChange={(e) => setJinxQuantity(parseInt(e.target.value))}
                        className="w-full accent-purple-600 h-2 rounded-full appearance-none cursor-pointer bg-purple-200"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 font-medium px-0.5">
                        <span>1</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                      </div>
                    </div>

                    <p className="text-sm font-bold text-gray-500">
                      Total: <span className="text-purple-700 font-black">{jinxQuantity}.00 €</span>
                    </p>

                    <button
                      data-umami-event="Iniciar Pago Jinx"
                      onClick={handleStartPayment}
                      disabled={jinxLoading}
                      className="w-full py-4 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold text-sm rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md flex justify-center items-center gap-2"
                    >
                      {jinxLoading ? 'Preparando pago...' : `Pagar ${jinxQuantity}€ con Bizum`}
                    </button>
                  </>
                )}

                {paymentStep === 'paying' && clientSecret && (
                  <Elements stripe={stripePromise} options={jinxElementsOptions}>
                    <JinxPaymentForm
                      clientSecret={clientSecret}
                      amount={jinxQuantity}
                      onSuccess={handleConfirmJinx}
                      onError={(msg) => { setPaymentError(msg); setPaymentStep('error'); }}
                      onCancel={handleCancelPayment}
                    />
                  </Elements>
                )}

                {(paymentStep === 'error' || paymentError) && (
                  <div className="space-y-4">
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-xs font-semibold text-red-700">{paymentError}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelPayment}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer"
                      >
                        Volver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 pt-4 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                  <Sparkles size={32} strokeWidth={2.5} className="animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  ¡Mal de ojo aplicado!
                </h3>
                <p className="text-sm text-gray-500 font-medium px-2 leading-relaxed">
                  Has echado mal de ojo nivel <span className="font-bold text-purple-600">{jinxQuantity}</span> a <span className="font-bold text-gray-800">{currentParticipant.name}</span>.
                </p>
                <div className="pt-6">
                  <button
                    onClick={() => setShowJinxModal(false)}
                    className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    Cerrar
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