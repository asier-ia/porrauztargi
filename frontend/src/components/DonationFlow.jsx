import { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { X, Smartphone } from 'lucide-react';
import { assetUrl } from '../staticMode';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PRODUCTS = {
  cafe: { name: 'Café', price: 1.50, img: assetUrl('/cafe.png') },
  cana: { name: 'Caña', price: 3.00, img: assetUrl('/cana.png') },
  cena: { name: 'Cena', price: 15.00, img: assetUrl('/pizza.png') },
  sueno: { name: 'Sueño', price: null, img: assetUrl('/sueno.png') },
  popup: { name: 'Soborno al árbitro', price: null, img: null },
};

const API_BASE = import.meta.env.VITE_API_BASE ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : '/api');

function BizumPaymentForm({ clientSecret, amount, onSuccess, onError }) {
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

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
        <p className="text-[11px] font-semibold text-amber-800 text-center leading-relaxed">
          Introduce <u className="underline decoration-2 underline-offset-2 decoration-amber-500">tu número</u> de teléfono, no el de ejemplo.
        </p>
      </div>
      <PaymentElement options={{ paymentMethodOrder: ['bizum'] }} />
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : `Pagar ${amount.toFixed(2)}€`}
      </button>
    </form>
  );
}

function PaymentRequestBtn({ amount, productId, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [canPay, setCanPay] = useState(false);

  useEffect(() => {
    if (!stripe || !elements) return;

    const paymentRequest = stripe.paymentRequest({
      country: 'ES',
      currency: 'eur',
      total: { label: 'Porra Uztargi', amount: Math.round(amount * 100) },
      requestPayerName: false,
      requestPayerEmail: false,
      requestPayerPhone: false,
    });

    paymentRequest.canMakePayment().then((result) => {
      if (result) setCanPay(true);
    });

    return () => {};
  }, [stripe, elements, amount, productId, onSuccess, onError]);

  useEffect(() => {
    if (!canPay || !stripe || !elements) return;

    const paymentRequest = stripe.paymentRequest({
      country: 'ES',
      currency: 'eur',
      total: { label: 'Porra Uztargi', amount: Math.round(amount * 100) },
      requestPayerName: false,
      requestPayerEmail: false,
      requestPayerPhone: false,
    });

    const prButton = elements.create('paymentRequestButton', { paymentRequest });
    prButton.mount('#payment-request-button');

    paymentRequest.on('paymentmethod', async (e) => {
      try {
        const res = await fetch(`${API_BASE}/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            amount: Math.round(amount * 100),
            payment_method_type: 'card',
          }),
        });

        if (!res.ok) throw new Error('Error al procesar el pago');
        const { client_secret } = await res.json();

        const { error: confirmError } = await stripe.confirmCardPayment(
          client_secret,
          { payment_method: e.paymentMethod.id }
        );

        if (confirmError) {
          e.complete('fail');
          onError(confirmError.message);
        } else {
          e.complete('success');
          onSuccess();
        }
      } catch (err) {
        e.complete('fail');
        onError(err.message);
      }
    });

    return () => prButton.destroy();
  }, [canPay, stripe, elements, amount, productId, onSuccess, onError]);

  return <div id="payment-request-button" className={canPay ? 'mb-3' : 'hidden'} />;
}

export default function DonationFlow({ productId, onClose }) {
  const product = PRODUCTS[productId];
  const [amount, setAmount] = useState(product.price || '');
  const [method, setMethod] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isValidAmount = () => {
    const val = typeof amount === 'number' ? amount : parseFloat(amount);
    return !isNaN(val) && val >= 1 && val <= 200;
  };

  const handleSuccess = () => {
    setSuccess(true);
  };

  const elementsOptions = useMemo(() => clientSecret ? { clientSecret } : null, [clientSecret]);

  const handleSelectBizum = async () => {
    const finalAmount = product.price || parseFloat(amount);
    if (!finalAmount || finalAmount < 1 || finalAmount > 200) {
      setError('Introduce un importe válido (1€ - 200€)');
      return;
    }
    setMethod('bizum');
    setLoadingIntent(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          amount: Math.round(finalAmount * 100),
          payment_method_type: 'bizum',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al preparar el pago');
      }

      const data = await res.json();
      setClientSecret(data.client_secret);
    } catch (err) {
      setError(err.message);
      setMethod(null);
    } finally {
      setLoadingIntent(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-slideUp">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">¡Gracias!</h3>
          <p className="text-sm text-gray-500 font-medium mb-6">Tu aportación hace que esto siga vivo.</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {product.img && (
              <img src={product.img} alt={product.name} className="w-10 h-10 object-contain" />
            )}
            <div>
              <h3 className="text-base font-black text-gray-900">{product.name}</h3>
              {product.price && (
                <p className="text-xs font-bold text-emerald-600">{product.price.toFixed(2)}€</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {!product.price && (
          <div className="mb-4">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Importe (1€ - 200€)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">€</span>
              <input
                type="number"
                min="1"
                max="200"
                step="0.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
              />
            </div>
            {amount && !isValidAmount() && (
              <p className="text-[11px] font-medium text-red-500 mt-1">Mínimo 1€, máximo 200€</p>
            )}
          </div>
        )}

        {!method ? (
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Elige método de pago
            </p>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mb-3">
              <p className="text-[12px] font-semibold text-gray-700 leading-relaxed">
                Solo aceptamos Bizum. Ignora el número de ejemplo <span className="font-black text-gray-900">612345678</span> que aparece, introduce <u className="underline decoration-2 underline-offset-2 decoration-gray-500">tu número</u> de teléfono para pagar.
              </p>
            </div>

            <Elements stripe={stripePromise}>
              <button
                onClick={handleSelectBizum}
                disabled={loadingIntent}
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center">
                    <Smartphone className="h-4.5 w-4.5 text-orange-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    {loadingIntent ? 'Preparando...' : 'Bizum'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Rápido y seguro</span>
              </button>
            </Elements>
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <div className="space-y-4">
              {method === 'bizum' && (
                <div>
                  {!clientSecret ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                      <span className="ml-3 text-sm font-medium text-gray-500">Preparando...</span>
                    </div>
                  ) : (
                    <Elements stripe={stripePromise} options={elementsOptions}>
                      <BizumPaymentForm
                        clientSecret={clientSecret}
                        amount={product.price || parseFloat(amount)}
                        onSuccess={handleSuccess}
                        onError={setError}
                      />
                    </Elements>
                  )}
                </div>
              )}

              <button
                onClick={() => { setMethod(null); setError(null); }}
                className="w-full py-2 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ← Volver a métodos
              </button>
            </div>
          </Elements>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-xs font-semibold text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
