/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useLanguage } from '../context/LanguageContext';
import { Trophy, User, Target, CalendarDays, Heart, X, Smartphone, Sparkles } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const BubblesOverlay = () => {
  return (
    <div className="jinx-bubbles-container">
      <div className="jinx-bubble" style={{ left: '10%', width: '12px', height: '12px', animationDuration: '3.1s', animationDelay: '0s' }} />
      <div className="jinx-bubble" style={{ left: '30%', width: '7px', height: '7px', animationDuration: '3.8s', animationDelay: '0.7s' }} />
      <div className="jinx-bubble" style={{ left: '55%', width: '13px', height: '14px', animationDuration: '2.5s', animationDelay: '0.3s' }} />
      <div className="jinx-bubble" style={{ left: '75%', width: '9px', height: '9px', animationDuration: '3.3s', animationDelay: '1.1s' }} />
      <div className="jinx-bubble" style={{ left: '90%', width: '11px', height: '11px', animationDuration: '2.9s', animationDelay: '0.5s' }} />
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-1 jinx-cracks-pulsing">
      <svg className="absolute inset-0 w-full h-full stroke-red-500/50" viewBox="0 0 100 100" fill="none" strokeWidth="0.85">
        <path d="M 8 10 L 22 32 L 40 40 L 48 60 L 70 78 M 22 32 L 12 45 L 32 70 L 38 85 M 88 18 L 70 32 L 55 50 L 65 80 M 70 32 L 80 55 L 75 75" />
      </svg>
    </div>
  );
};

export function JinxPaymentForm({ clientSecret, amount, onSuccess, onError, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    onError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      onError(submitError.message);
      setLoading(false);
      return;
    }

    const cleanReturnUrl = `${window.location.origin}${window.location.pathname}`;
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: cleanReturnUrl,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message);
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
        <p className="text-[11px] font-semibold text-amber-800 text-center leading-relaxed">
          Introduce <u className="underline decoration-2 underline-offset-2 decoration-amber-500">tu número</u> de teléfono, no el de ejemplo.
        </p>
      </div>
      <PaymentElement options={{ paymentMethodOrder: ['bizum'] }} />
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full py-4 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold text-sm rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md flex justify-center items-center gap-2"
      >
        {loading ? 'Procesando...' : `Pagar ${amount}.00€ con Bizum`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        ← Cancelar
      </button>
    </form>
  );
}

export function getJinxStyles(count) {
  if (!count || count <= 0) {
    return {
      cardCls: "bg-white border-gray-100 text-gray-900 shadow-sm",
      nameCls: "text-gray-900 font-semibold",
      pointsCls: "text-emerald-600 font-bold",
      btnCls: "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-gray-200",
      ringCls: "", // Sin anillo exterior
      overlay: null
    };
  }

  if (count >= 1 && count <= 3) {
    // Nivel 1: Verde Tóxico (Ácido/Lima)
    return {
      cardCls: "bg-lime-50/80 border-lime-200 shadow-sm",
      nameCls: "text-lime-900 font-semibold",
      pointsCls: "text-lime-600 font-bold",
      btnCls: "bg-white text-lime-600 border border-lime-200 hover:bg-lime-100 shadow-sm",
      ringCls: "ring-2 ring-lime-400 ring-offset-2 ring-offset-white",
      overlay: null
    };
  }

  if (count >= 4 && count <= 10) {
    // Nivel 2: Morado
    return {
      cardCls: "bg-purple-50/80 border-purple-200 shadow-sm",
      nameCls: "text-purple-950 font-bold",
      pointsCls: "text-purple-700 font-bold",
      btnCls: "bg-white text-purple-700 border border-purple-300 hover:bg-purple-100 shadow-sm",
      ringCls: "ring-2 ring-purple-500 ring-offset-2 ring-offset-white",
      overlay: null
    };
  }

  // Nivel > 10: Negro sombra gris (Elegante, minimalista y muy legible)
  return {
    cardCls: "bg-[#1c1c1e] border-[#2c2c2e] shadow-md",
    nameCls: "text-gray-100 font-bold",
    pointsCls: "text-gray-300 font-bold",
    btnCls: "bg-[#2c2c2e] text-gray-400 border border-[#3c3c3e] hover:bg-[#3c3c3e] shadow-sm",
    ringCls: "ring-2 ring-[#2c2c2e] ring-offset-2 ring-offset-white",
    overlay: null
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
  const [jinxQuantity, setJinxQuantity] = useState(1);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentStep, setPaymentStep] = useState('form');
  const [jinxRedirectSuccess, setJinxRedirectSuccess] = useState(false);

  const jinxElementsOptions = useMemo(() => clientSecret ? { clientSecret } : null, [clientSecret]);

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
    window.addEventListener('api-auto-refreshed', fetchRanking);
    return () => window.removeEventListener('api-auto-refreshed', fetchRanking);
  }, [API_BASE]);

  // Detect Stripe redirect return after Bizum payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('redirect_status') === 'succeeded' &&
        params.get('payment_intent') &&
        params.get('payment_intent_client_secret')) {
      setJinxRedirectSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(fetchRanking, 1000);
    }
  }, []);

  const handleOpenJinxModal = (participant) => {
    setSelectedParticipant(participant);
    setJinxSuccess(false);
    setJinxLoading(false);
    setJinxQuantity(1);
    setClientSecret(null);
    setPaymentError(null);
    setPaymentStep('form');
    setShowJinxModal(true);
  };

  const handleStartPayment = async () => {
    if (!selectedParticipant) return;
    setJinxLoading(true);
    setPaymentError(null);
    try {
      const res = await fetch(`${API_BASE}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: 'jinx',
          quantity: jinxQuantity,
          target_id: selectedParticipant.id,
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
      const response = await fetch(`${API_BASE}/participants/${selectedParticipant.id}/jinx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: jinxQuantity, payment_intent_id: paymentIntentId })
      });
      if (response.ok) {
        window.umami?.track?.('Jinx Aplicado');
        setJinxSuccess(true);
        setTimeout(fetchRanking, 2000);
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

      {jinxRedirectSuccess && (
        <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 shadow-sm text-center animate-slideUp">
          <p className="text-sm font-bold">
            ¡Mal de ojo aplicado con éxito!
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Los cambios ya se reflejan en la clasificación.
          </p>
          <button
            onClick={() => setJinxRedirectSuccess(false)}
            className="mt-2 text-[10px] font-bold text-emerald-600 underline underline-offset-2 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

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

      {/* Funny Donation Banner */}
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
        <div className="flex items-end justify-center gap-3 mb-10 px-4 mt-8 h-48">

          {/* 2º Puesto - Plata */}
          {top2 && (() => {
            const jinx = getJinxStyles(top2.jinx_count);
            const isJinxed = top2.jinx_count > 0;
            return (
              <div
                onClick={() => onSelectParticipant(top2.id)}
                className={`flex-1 flex flex-col items-center cursor-pointer p-3 pb-4 rounded-[1.5rem] hover:scale-[1.02] transition-transform duration-200 relative w-full h-[85%] bg-gradient-to-b from-slate-50 to-slate-200 border border-slate-300 shadow-sm ${isJinxed ? jinx.ringCls : ''}`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenJinxModal(top2); }}
                  className={`absolute top-2.5 right-2.5 p-1.5 rounded-full transition-all z-20 ${isJinxed ? jinx.btnCls : 'bg-white/60 text-slate-400 hover:bg-white hover:text-slate-600'}`}
                >
                  <Sparkles size={12} strokeWidth={2.5} />
                </button>

                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-auto shadow-sm border mt-1 bg-white border-slate-200 text-slate-600">
                  2
                </div>

                <p className="text-xs font-bold text-center truncate w-full mt-2 text-slate-900">
                  {top2.name.split(' ')[0]}
                </p>
                <p className="text-sm font-black tracking-tight text-slate-900">
                  {top2.points_total} <span className="text-[10px] font-semibold opacity-60 text-slate-700">{t('ranking.pts')}</span>
                </p>
                {top2.prize > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg mt-1.5 bg-slate-100 text-slate-800 border border-slate-200/50">
                    +{top2.prize.toLocaleString('es-ES')}€
                  </span>
                )}
              </div>
            );
          })()}

          {/* 1º Puesto - Oro */}
          {top1 && (() => {
            const jinx = getJinxStyles(top1.jinx_count);
            const isJinxed = top1.jinx_count > 0;
            return (
              <div
                onClick={() => onSelectParticipant(top1.id)}
                className={`flex-[1.15] flex flex-col items-center cursor-pointer p-4 pb-5 rounded-[1.5rem] hover:scale-[1.02] transition-transform duration-200 relative z-10 w-full h-[100%] bg-gradient-to-b from-amber-50 to-amber-200 border border-amber-300 shadow-md ${isJinxed ? jinx.ringCls : ''}`}
              >
                <div className="absolute -top-3.5 w-full flex justify-center z-20">
                  <span className="text-[9px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-widest bg-white text-amber-600 border border-amber-100">
                    {t('ranking.leader')}
                  </span>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenJinxModal(top1); }}
                  className={`absolute top-3 right-3 p-1.5 rounded-full transition-all z-20 ${isJinxed ? jinx.btnCls : 'bg-white/50 text-amber-500 hover:bg-white hover:text-amber-700'}`}
                >
                  <Sparkles size={14} strokeWidth={2.5} />
                </button>

                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black mb-auto shadow-sm border mt-2 bg-white border-amber-200 text-amber-600">
                  1
                </div>

                <p className="text-sm font-bold text-center truncate w-full mt-2 text-amber-950">
                  {top1.name.split(' ')[0]}
                </p>
                <p className="text-lg font-black tracking-tight text-amber-950">
                  {top1.points_total} <span className="text-[11px] font-semibold opacity-60 text-amber-800">{t('ranking.pts')}</span>
                </p>
                {top1.prize > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg mt-1.5 bg-amber-100 text-amber-800 border border-amber-200/50">
                    +{top1.prize.toLocaleString('es-ES')}€
                  </span>
                )}
              </div>
            );
          })()}

          {/* 3º Puesto - Bronce */}
          {top3 && (() => {
            const jinx = getJinxStyles(top3.jinx_count);
            const isJinxed = top3.jinx_count > 0;
            return (
              <div
                onClick={() => onSelectParticipant(top3.id)}
                className={`flex-1 flex flex-col items-center cursor-pointer p-3 pb-3 rounded-[1.5rem] hover:scale-[1.02] transition-transform duration-200 relative w-full h-[75%] bg-gradient-to-b from-orange-50 to-orange-200 border border-orange-300 shadow-sm ${isJinxed ? jinx.ringCls : ''}`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenJinxModal(top3); }}
                  className={`absolute top-2.5 right-2.5 p-1.5 rounded-full transition-all z-20 ${isJinxed ? jinx.btnCls : 'bg-white/60 text-orange-500 hover:bg-white hover:text-orange-700'}`}
                >
                  <Sparkles size={12} strokeWidth={2.5} />
                </button>

                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-auto shadow-sm border mt-1 bg-white border-orange-200 text-orange-600">
                  3
                </div>

                <p className="text-xs font-bold text-center truncate w-full mt-2 text-orange-950">
                  {top3.name.split(' ')[0]}
                </p>
                <p className="text-sm font-black tracking-tight text-orange-950">
                  {top3.points_total} <span className="text-[10px] font-semibold opacity-60 text-orange-800">{t('ranking.pts')}</span>
                </p>
                {top3.prize > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg mt-1.5 bg-orange-100 text-orange-800 border border-orange-200/50">
                    +{top3.prize.toLocaleString('es-ES')}€
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
            const isHeavyJinx = item.jinx_count > 10;
            return (
              <div
                key={item.id}
                onClick={() => onSelectParticipant(item.id)}
                className={`flex items-center justify-between px-6 py-3.5 hover:opacity-90 transition-opacity cursor-pointer border-b border-gray-50 last:border-b-0 relative ${item.jinx_count > 0 ? jinx.cardCls : ''}`}
              >
                {jinx.overlay}
                <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
                  <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${isHeavyJinx ? 'text-gray-500' : (item.jinx_count > 0 ? 'opacity-60 text-inherit' : 'text-gray-400')}`}>
                    {pos}
                  </span>
                  <p className={`text-base truncate ${jinx.nameCls}`}>
                    {item.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3 relative z-10">
                  {item.prize > 0 && (
                    <span className={`text-[11px] font-black border px-2 py-0.5 rounded-full shadow-sm ${isHeavyJinx ? 'bg-[#3a3a3c] text-gray-300 border-[#4a4a4c]' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      +{item.prize.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                    </span>
                  )}

                  {/* Clean Sparkles GAFAR button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenJinxModal(item);
                    }}
                    className={`text-[10px] font-bold tracking-wider px-2.5 py-1.5 rounded-full transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${jinx.btnCls}`}
                  >
                    <Sparkles size={12} strokeWidth={2.5} />
                  </button>

                  <div className="flex items-center gap-0.5 min-w-[32px] justify-end">
                    <span className={`text-base font-black ${jinx.pointsCls}`}>
                      {item.points_total}
                    </span>
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

      {/* JINX MODAL */}
      {showJinxModal && selectedParticipant && (
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
                  Echar mal de ojo a <br /><span className="text-purple-600 font-black">{selectedParticipant.name}</span>
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
                  Has echado mal de ojo nivel <span className="font-bold text-purple-600">{jinxQuantity}</span> a <span className="font-bold text-gray-800">{selectedParticipant.name}</span>.
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