import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useERP();

  return (
    <div className="relative inline-flex items-center p-0.5 rounded-full bg-[#EAF6F7] border border-[#D9EAEB] shadow-inner">
      <button
        id="btn-lang-en"
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-1 ${
          language === 'en'
            ? 'bg-white text-[#0B9FA5] shadow-[0_2px_8px_rgba(11,159,165,0.15)] font-bold'
            : 'text-[#688285] hover:text-[#17383B]'
        }`}
      >
        {!compact && <span className="text-[10px] opacity-70">EN</span>}
        {compact ? 'EN' : 'English'}
      </button>

      <button
        id="btn-lang-bn"
        type="button"
        onClick={() => setLanguage('bn')}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1 font-['Noto_Sans_Bengali'] ${
          language === 'bn'
            ? 'bg-white text-[#0B9FA5] shadow-[0_2px_8px_rgba(11,159,165,0.15)] font-bold'
            : 'text-[#688285] hover:text-[#17383B]'
        }`}
      >
        বাংলা
      </button>
    </div>
  );
};
