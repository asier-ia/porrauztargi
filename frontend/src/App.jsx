import { useState, useEffect } from 'react';
import { Trophy, User, Target, Heart } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import Ranking from './views/Ranking';
import Profile from './views/Profile';
import Scorers from './views/Scorers';
import Info from './views/Info';
import DailyCuriosity from './components/DailyCuriosity';
import DonationFlow from './components/DonationFlow';

const API_BASE = import.meta.env.VITE_API_BASE ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? "http://localhost:8000/api"
    : "/api");

function App() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('ranking');
  const [selectedId, setSelectedId] = useState(null);
  const [countdown, setCountdown] = useState(14400); // 4 hours default
  const [showPopup, setShowPopup] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [infoGlow, setInfoGlow] = useState(false);
  const [highlightDonations, setHighlightDonations] = useState(false);

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
        return (
          <Ranking
            onSelectParticipant={handleSelectParticipant}
            onNavigateToInfo={() => {
              setActiveTab('info');
              setInfoGlow(false);
              setHighlightDonations(true);
            }}
            API_BASE={API_BASE}
          />
        );
      case 'profile':
        return <Profile selectedId={selectedId} setSelectedId={setSelectedId} API_BASE={API_BASE} />;
      case 'scorers':
        return <Scorers API_BASE={API_BASE} />;
      case 'info':
        return <Info highlightDonations={highlightDonations} setHighlightDonations={setHighlightDonations} />;
      default:
        return (
          <Ranking
            onSelectParticipant={handleSelectParticipant}
            onNavigateToInfo={() => {
              setActiveTab('info');
              setInfoGlow(false);
              setHighlightDonations(true);
            }}
            API_BASE={API_BASE}
          />
        );
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

        <DailyCuriosity />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto pb-[80px] md:pb-[88px] bg-white">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed md:absolute bottom-0 left-0 right-0 max-w-lg mx-auto md:mx-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 pb-4 md:pb-5 pt-3 flex justify-around z-20">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (id === 'info') {
                  setInfoGlow(false);
                }
              }}
              data-umami-event={`Ver Tab ${id}`}
              className={`flex flex-col items-center gap-1 flex-1 py-1 px-2 rounded-xl transition-all duration-300 cursor-pointer ${activeTab === id
                  ? id === 'info'
                    ? 'text-red-600'
                    : 'text-emerald-700'
                  : id === 'info'
                    ? 'text-red-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeTab === id
                  ? id === 'info'
                    ? 'bg-red-50'
                    : 'bg-emerald-50'
                  : 'bg-transparent'
                } ${id === 'info' && infoGlow ? 'animate-heart-glow' : ''}`}>
                <Icon
                  className={`h-5 w-5 transition-all duration-300 ${activeTab === id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                    } ${id === 'info' ? 'fill-red-500 text-red-500' : ''}`}
                />
              </div>
              <span className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${activeTab === id
                  ? id === 'info'
                    ? 'text-red-800 font-bold'
                    : 'text-emerald-800 font-bold'
                  : 'text-gray-500'
                }`}>
                {label}
              </span>
            </button>
          ))}
        </nav>

      </div>

      {/* ARBITRO YELLOW CARD POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-[90vw] max-w-sm md:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp select-none">

            {/* Image */}
            <div className="relative">
              <img
                src="/arbi.png"
                alt="Arbitro"
                className="w-full aspect-video object-cover object-[center_15%]"
              />
              <button
                onClick={handleClosePopup}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white text-gray-500 hover:text-gray-800 text-lg font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 md:p-6 space-y-3 md:space-y-4">
              <h3 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight leading-tight">
                {t('popup.title')}
              </h3>

              <p className="text-sm md:text-[15px] text-gray-700 leading-relaxed font-medium">
                {t('popup.message')}
              </p>

              <div className="pt-1 space-y-2.5">
                <button
                  onClick={() => setShowDonation(true)}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white font-black text-sm md:text-base uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-[0.97] cursor-pointer"
                >
                  {t('popup.donateBtn')}
                </button>
                <button
                  onClick={handleClosePopup}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 font-bold text-xs md:text-sm uppercase tracking-wider transition-all duration-200 active:scale-[0.97] cursor-pointer"
                >
                  {t('popup.closeBtn')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {showDonation && (
        <DonationFlow productId="popup" onClose={() => setShowDonation(false)} />
      )}
    </div>
  );
}

      export default App;
