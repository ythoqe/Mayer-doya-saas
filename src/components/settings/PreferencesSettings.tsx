import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { SystemPreferencesState } from './types';
import { 
  Sliders, 
  Table, 
  Volume2, 
  Printer, 
  Coins, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const defaultPreferences: SystemPreferencesState = {
  compactDensity: false,
  soundAlerts: true,
  autoPrintPrompt: true,
  currencySymbol: '৳ (BDT)',
  dateFormat: 'YYYY-MM-DD',
  numberSystem: 'en-IN'
};

export const PreferencesSettings: React.FC = () => {
  const { t } = useERP();
  const [preferences, setPreferences] = useState<SystemPreferencesState>(() => {
    const saved = localStorage.getItem('mayer_doya_system_preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mayer_doya_system_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const togglePreference = (key: keyof Pick<SystemPreferencesState, 'compactDensity' | 'soundAlerts' | 'autoPrintPrompt'>) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setToastMessage(t('saveSettingsSuccess'));
      setTimeout(() => setToastMessage(null), 2500);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#E5F8F1] border border-[#38C99A]/40 text-[#229A73] text-xs font-bold shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#38C99A]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassCard variant="white" padding="lg">
        <div className="flex items-center gap-3 pb-5 border-b border-[#D9EAEB]">
          <div className="p-2.5 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
              {t('preferencesTitle')}
            </h3>
            <p className="text-xs text-[#688285]">
              {t('preferencesSubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#D9EAEB]/70">
          {/* Compact Density */}
          <div className="py-4 flex items-center justify-between gap-4 select-none">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] shrink-0 mt-0.5">
                <Table className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#17383B]">
                  {t('compactDensity')}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#688285] mt-0.5 leading-relaxed">
                  {t('compactDensityDesc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.compactDensity}
              onClick={() => togglePreference('compactDensity')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/20 ${
                preferences.compactDensity ? 'bg-[#0B9FA5]' : 'bg-[#D9EAEB]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.compactDensity ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Alerts */}
          <div className="py-4 flex items-center justify-between gap-4 select-none">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#EEEBFF] text-[#8178F2] shrink-0 mt-0.5">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#17383B]">
                  {t('soundEffects')}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#688285] mt-0.5 leading-relaxed">
                  {t('soundEffectsDesc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.soundAlerts}
              onClick={() => togglePreference('soundAlerts')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/20 ${
                preferences.soundAlerts ? 'bg-[#0B9FA5]' : 'bg-[#D9EAEB]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.soundAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Instant Print Prompt */}
          <div className="py-4 flex items-center justify-between gap-4 select-none">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#E5F8F1] text-[#229A73] shrink-0 mt-0.5">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#17383B]">
                  {t('autoPrintPrompt')}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#688285] mt-0.5 leading-relaxed">
                  {t('autoPrintPromptDesc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences.autoPrintPrompt}
              onClick={() => togglePreference('autoPrintPrompt')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/20 ${
                preferences.autoPrintPrompt ? 'bg-[#0B9FA5]' : 'bg-[#D9EAEB]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  preferences.autoPrintPrompt ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Currency & Formatting Standards */}
        <div className="mt-6 pt-5 border-t border-[#D9EAEB] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              Active Currency Standard
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-[#17383B]">
              <Coins className="w-4 h-4 text-[#0B9FA5]" />
              <span>Bangladeshi Taka (৳ BDT)</span>
            </div>
            <p className="text-[11px] text-[#688285] mt-1">
              Used across all Job Cards, Money Receipts, Vouchers, and Statements.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              Numeric Grouping
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-[#17383B]">
              <Sparkles className="w-4 h-4 text-[#8178F2]" />
              <span>South Asian Lakh & Crore (e.g. ৳ 1,50,000)</span>
            </div>
            <p className="text-[11px] text-[#688285] mt-1">
              Calibrated to standard Bangladesh textile commercial conventions.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
