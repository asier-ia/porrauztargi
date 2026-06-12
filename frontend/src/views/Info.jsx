import { Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Icono de Instagram personalizado (SVG)
function InstagramIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function Info() {
  const { t } = useLanguage();

  const donations = [
    {
      id: 'cafe',
      title: t('info.donateItems.cafe'),
      price: '1,50 €',
      img: '/cafe.png',
      url: 'https://buy.stripe.com/14AaEX1xX0N06HZf9Z7wA03'
    },
    {
      id: 'cana',
      title: t('info.donateItems.cana'),
      price: '3,00 €',
      img: '/cana.png',
      url: 'https://buy.stripe.com/4gM4gz4K97bofev2nd7wA02'
    },
    {
      id: 'cena',
      title: t('info.donateItems.cena'),
      price: '15,00 €',
      img: '/pizza.png',
      url: 'https://buy.stripe.com/dRmcN5foNanAgiz8LB7wA01'
    },
    {
      id: 'sueno',
      title: t('info.donateItems.sueno'),
      price: t('info.donateItems.anyHelp'),
      img: '/sueno.png',
      url: 'https://buy.stripe.com/3cIfZhdgFgLY3vN6Dt7wA00'
    }
  ];

  return (
    <div className="animate-fadeIn px-2 max-w-lg mx-auto">
      {/* Cabecera Principal */}
      <div className="px-4 mb-6 pt-2 text-center">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {t('info.title')}
        </h2>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          {t('info.subtitle')}
        </p>
      </div>

      <div className="px-4 space-y-6 pb-8">
        
        {/* Bloque del Creador */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center">
          {/* Foto de Perfil */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img 
                src="/profile.png" 
                alt="Asier" 
                className="w-24 h-24 rounded-full object-cover border-3 border-emerald-500 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-sm border border-white">
                <Heart className="h-4 w-4 fill-white" />
              </div>
            </div>
          </div>

          <h3 className="text-lg font-extrabold text-gray-900">Asier Iglesias</h3>
          <p className="text-xs font-bold text-emerald-600 mb-4">{t('info.role')}</p>
          
          <div className="text-sm text-gray-600 leading-relaxed font-semibold space-y-3 max-w-md mx-auto">
            <p>{t('info.p1')}</p>
            <p>{t('info.p2')}</p>
            <p>{t('info.p3')}</p>
          </div>
        </div>

        {/* Sección de Aportaciones */}
        <div className="space-y-4">
          <div className="px-1 text-center">
            <h4 className="text-sm font-extrabold text-gray-800">{t('info.donateTitle')}</h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{t('info.donateDesc')}</p>
          </div>

          {/* Cuadrícula 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {donations.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center text-center p-4 bg-white hover:bg-emerald-50/20 border border-gray-100 hover:border-emerald-200 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer"
              >
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-12 h-12 object-contain mb-2.5"
                />
                <span className="text-xs font-extrabold text-gray-900 leading-tight px-1">
                  {item.title}
                </span>
                <span className="text-xs font-black text-emerald-600 mt-1">
                  {item.price}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Bloque Extra AFAGI */}
        <div className="bg-rose-50/40 border border-rose-100/60 rounded-2xl p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-rose-700 font-extrabold text-xs tracking-wider uppercase mb-1.5">
            <Heart className="h-4.5 w-4.5 fill-rose-600 text-rose-600" />
            {t('info.afagiTitle')}
          </div>
          <p className="text-xs text-rose-950 leading-relaxed font-bold max-w-sm mx-auto">
            {t('info.afagiDesc', { brand: "AFAGI" })}
          </p>
        </div>

        {/* Apartado de Contacto */}
        <div className="text-center space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{t('info.contactTitle')}</h4>
          <a 
            href="https://instagram.com/asier_iglesias21"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200/80 hover:border-gray-300 text-gray-700 hover:text-gray-900 text-xs font-extrabold rounded-full transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow cursor-pointer"
          >
            <InstagramIcon className="h-4.5 w-4.5 text-pink-600 animate-pulse" />
            {t('info.contactBtn', { handle: '@asier_iglesias21' })}
          </a>
        </div>

        {/* Descargo de Responsabilidad Legal y Cookies */}
        <div className="bg-gray-50/60 border border-gray-150/55 rounded-2xl p-5 text-left shadow-sm mt-4">
          <h4 className="text-[11px] font-black text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
            ⚖️ {t('info.disclaimerTitle')}
          </h4>
          <p className="text-[10.5px] text-gray-400/95 leading-relaxed font-semibold">
            {t('info.disclaimerDesc')}
          </p>
        </div>

      </div>
    </div>
  );
}
