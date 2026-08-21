import React from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { Globe, Check, Sparkles } from 'lucide-react';
import { Language } from '../../types';

export const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useERP();

  const languages: { id: Language; name: string; nativeName: string; desc: string; flag: string }[] = [
    {
      id: 'en',
      name: 'English',
      nativeName: 'English (US / Commercial)',
      desc: t('englishDesc'),
      flag: 'EN'
    },
    {
      id: 'bn',
      name: 'বাংলা',
      nativeName: 'বাংলা (বাংলাদেশ)',
      desc: t('bengaliDesc'),
      flag: 'বাং'
    }
  ];

  return (
    <div className="space-y-6">
      <GlassCard variant="white" padding="lg">
        <div className="flex items-center gap-3 pb-5 border-b border-[#D9EAEB]">
          <div className="p-2.5 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
              {t('languagePreferenceTitle')}
            </h3>
            <p className="text-xs text-[#688285]">
              {t('languagePreferenceSubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((langItem) => {
            const isSelected = language === langItem.id;
            return (
              <div
                key={langItem.id}
                id={`lang-card-${langItem.id}`}
                onClick={() => setLanguage(langItem.id)}
                className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#F1FAFA] to-white border-[#0B9FA5] shadow-[0_8px_24px_rgba(11,159,165,0.14)]'
                    : 'bg-white border-[#D9EAEB] hover:border-[#16B8B0]/40 hover:bg-[#F8FAFA]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white shadow-sm'
                          : 'bg-[#F1FAFA] text-[#0B9FA5] border border-[#D9EAEB]'
                      }`}
                    >
                      {langItem.flag}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#17383B]">
                        {langItem.nativeName}
                      </h4>
                      <span className="text-xs text-[#8EA3A5] font-medium">
                        {langItem.name}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-[#0B9FA5] bg-[#0B9FA5] text-white'
                        : 'border-[#D9EAEB] bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="mt-3.5 text-xs text-[#688285] leading-relaxed">
                  {langItem.desc}
                </p>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-[#D9EAEB]/60 flex items-center gap-1 text-[11px] font-bold text-[#0B9FA5]">
                    <Sparkles className="w-3 h-3" />
                    <span>Active System Language</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};
