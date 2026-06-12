import { useState, useEffect } from 'react';
import { Trophy, User, Target, Heart } from 'lucide-react';
import Ranking from './views/Ranking';
import Profile from './views/Profile';
import Scorers from './views/Scorers';
import Info from './views/Info';

const API_BASE = "http://localhost:8000/api";

function App() {
  const [activeTab, setActiveTab] = useState('ranking');
  const [selectedId, setSelectedId] = useState(null);
  const [countdown, setCountdown] = useState(14400); // 4 hours default

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
    switch(activeTab) {
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
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'scorers', label: 'Goleadores', icon: Target },
    { id: 'info', label: 'Info', icon: Heart },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 md:p-4 lg:p-8">
      {/* App Container - Floating card on desktop, full screen on mobile */}
      <div className="w-full max-w-lg bg-white min-h-screen md:min-h-[85vh] md:h-[85vh] flex flex-col relative md:rounded-3xl md:shadow-2xl md:overflow-hidden md:border md:border-gray-100">
        
        {/* Header - Simple Typography */}
        <header className="pt-6 pb-4 px-6 bg-white z-10 text-center border-b border-gray-50/50">
          <h1 className="text-[22px] font-black text-gray-900 tracking-tight uppercase leading-none">
            Porra Mundial <span className="text-emerald-600">2026</span>
          </h1>
          <h2 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mt-1.5">
            Bar Uztargi
          </h2>
          
          {/* Synchronized Live Sincronizador Pill */}
          <div className="flex justify-center mt-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 shadow-inner">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">
                Actualizando en {formatTime(countdown)}
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
              className={`flex flex-col items-center gap-1 flex-1 py-1 px-2 rounded-xl transition-all duration-300 ${
                activeTab === id 
                  ? 'text-emerald-700' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                activeTab === id ? 'bg-emerald-50' : 'bg-transparent'
              }`}>
                <Icon 
                  className={`h-5 w-5 transition-all duration-300 ${
                    activeTab === id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                  }`} 
                />
              </div>
              <span className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${
                activeTab === id ? 'text-emerald-800 font-bold' : 'text-gray-500'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}

export default App;
