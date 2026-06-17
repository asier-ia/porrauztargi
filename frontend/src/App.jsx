import { useState, useEffect } from 'react';
import { Trophy, User, Target, Heart } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import Ranking from './views/Ranking';
import Profile from './views/Profile';
import Scorers from './views/Scorers';
import Info from './views/Info';

const API_BASE = "http://localhost:8000/api";

function App() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('ranking');
  const [selectedId, setSelectedId] = useState(null);
  const [countdown, setCountdown] = useState(14400); // 4 hours default
  const [showPopup, setShowPopup] = useState(false);

  // Timer for the humorous donation pop-up (3 minutes)
  useEffect(() => {
    if (showPopup) return;

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 180000); // 3 minutes in milliseconds

    return () => clearTimeout(timer);
  }, [showPopup]);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // Sync countdown with server
  useEffect(() => {
    const fetchCountdown = async () => {
      try {
        const res = await fetch(`${API_BASE}/next-update`);
        if (res.ok) {
          const data = await res.json();
          setCountdown(data.countdown_seconds);
        }
      } catch (err) {
        console.error("Error fetching countdown:", err);
      }
    };

    fetchCountdown();
    // Align with server every 30s to keep clock completely accurate
    const alignTimer = setInterval(fetchCountdown, 30000);
    return () => clearInterval(alignTimer);
  }, []);

  // Tick local countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger global custom event so active views auto-refresh
          window.dispatchEvent(new Event('api-auto-refreshed'));
          return 14400; // Reset
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectParticipant = (id) => {
    setSelectedId(id);
    setActiveTab('profile');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'ranking':
        return <Ranking onSelectParticipant={handleSelectParticipant} API_BASE={API_BASE} />;
      case 'profile':
        return <Profile selectedId={selectedId} setSelectedId={setSelectedId} API_BASE={API_BASE} />;
      case 'scorers':
        return <Scorers API_BASE={API_BASE} />;
      case 'info':
        return <Info />;
      default:
        return <Ranking onSelectParticipant={handleSelectParticipant} API_BASE={API_BASE} />;
    }
  };

  const tabs = [
    { id: 'ranking', label: t('tabs.ranking'), icon: Trophy },
    { id: 'profile', label: t('tabs.profile'), icon: User },
    { id: 'scorers', label: t('tabs.scorers'), icon: Target },
    { id: 'info', label: t('tabs.info'), icon: Heart },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 md:p-4 lg:p-8">
      {/* App Container - Floating card on desktop, full screen on mobile */}
      <div className="w-full max-w-lg bg-white min-h-screen md:min-h-[85vh] md:h-[85vh] flex flex-col relative md:rounded-3xl md:shadow-2xl md:overflow-hidden md:border md:border-gray-100">

        {/* Header - Simple Typography with absolute Language Toggle */}
        <header className="pt-6 pb-4 px-6 bg-white z-10 text-center border-b border-b-gray-50/50 relative">

          {/* Subtle Language Pill Toggle */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
            <button
              onClick={() => setLanguage('es')}
              className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all duration-200 active:scale-95 cursor-pointer ${language === 'es'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              ES
            </button>
            <button
              onClick={() => setLanguage('eu')}
              className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all duration-200 active:scale-95 cursor-pointer ${language === 'eu'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              EU
            </button>
          </div>

          <h1 className="text-[22px] font-black text-gray-900 tracking-tight uppercase leading-none pr-14 text-left md:text-center md:pr-0">
            {t('app.title')} <span className="text-emerald-600">2026</span>
          </h1>
          <h2 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mt-1.5 text-left md:text-center">
            {t('app.subtitle')}
          </h2>

          {/* Synchronized Live Sincronizador Pill */}
          <div className="flex justify-center mt-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 shadow-inner">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">
                {t('app.updating', { time: formatTime(countdown) })}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto pb-[80px] md:pb-[88px] bg-white">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 pb-4 md:pb-5 pt-3 flex justify-around z-20">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 flex-1 py-1 px-2 rounded-xl transition-all duration-300 cursor-pointer ${activeTab === id
                ? 'text-emerald-700'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeTab === id ? 'bg-emerald-50' : 'bg-transparent'
                }`}>
                <Icon
                  className={`h-5 w-5 transition-all duration-300 ${activeTab === id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                    }`}
                />
              </div>
              <span className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${activeTab === id ? 'text-emerald-800 font-bold' : 'text-gray-500'
                }`}>
                {label}
              </span>
            </button>
          ))}
        </nav>

      </div>

      {/* ÁRBITRO SACANDO AMARILLA - POP-UP */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fadeIn">

          {/* CONTENEDOR PRINCIPAL (Flex para alinear el árbitro y la tarjeta) */}
          <div className="relative flex items-center w-full max-w-[520px]">

            {/* EL ÁRBITRO (Lateral izquierdo, centrado verticalmente, tamaño grande) */}
            <div className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-20 w-48 md:w-64 pointer-events-none drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]">
              <img
                src="/arbi.png"
                alt="Árbitro"
                className="w-full h-auto object-contain scale-110 md:scale-125"
              />
            </div>

            {/* EL CAMPO (Tarjeta verde desplazada a la derecha para hacer hueco) */}
            <div className="relative w-full ml-24 md:ml-36 bg-gradient-to-b from-[#118B50] to-[#0A6237] text-white rounded-[24px] p-6 md:p-8 shadow-2xl border border-white/20 overflow-hidden animate-slideUp">

              {/* MARCAS DEL CAMPO (Fondo sutil) */}
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute left-1/2 top-0 w-[2px] h-full bg-white" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />
                <div className="absolute top-0 left-0 w-8 h-8 border-r-2 border-b-2 border-white rounded-br-full" />
                <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-white rounded-bl-full" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-r-2 border-t-2 border-white rounded-tr-full" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-l-2 border-t-2 border-white rounded-tl-full" />
              </div>

              {/* CONTENIDO (Textos limpios y Botones profesionales) */}
              <div className="relative z-10 flex flex-col gap-5 text-left">

                {/* TÍTULO */}
                <h3 className="text-xl md:text-2xl font-black text-[#FFD700] uppercase tracking-wide">
                  {typeof t('popup.title') === 'string' ? t('popup.title').replace(/\[|\]/g, '') : t('popup.title')}
                </h3>

                {/* CAJA DE TEXTO (Sin sombras raras, fondo semitransparente limpio) */}
                <div className="bg-black/15 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                  <p className="text-sm md:text-base font-medium leading-relaxed text-emerald-50">
                    {typeof t('popup.message') === 'string' ? t('popup.message').replace(/\[|\]/g, '') : t('popup.message')}
                  </p>
                  <p className="text-xs md:text-sm font-bold mt-4 text-[#FFD700] uppercase tracking-wider">
                    {typeof t('popup.action') === 'string' ? t('popup.action').replace(/\[|\]/g, '') : t('popup.action')}
                  </p>
                </div>

                {/* BOTONES (Estilo moderno, sin corchetes) */}
                <div className="flex flex-col gap-3 mt-2">
                  <a
                    href="https://buy.stripe.com/28EfZh3G58fs3vNe5V7wA04"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-[#FFCC00] hover:bg-[#FFD633] text-black font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-center cursor-pointer"
                  >
                    {typeof t('popup.donateBtn') === 'string' ? t('popup.donateBtn').replace(/\[|\]/g, '').trim() : t('popup.donateBtn')}
                  </a>

                  <button
                    onClick={handleClosePopup}
                    className="w-full py-2.5 bg-transparent hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {typeof t('popup.closeBtn') === 'string' ? t('popup.closeBtn').replace(/\[|\]/g, '').trim() : t('popup.closeBtn')}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
