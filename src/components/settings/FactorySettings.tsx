import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { MayerLogo } from '../ui/MayerLogo';
import { FactoryInfo } from './types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Flame, 
  Clock, 
  Save, 
  CheckCircle2, 
  Globe2,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const defaultFactoryInfo: FactoryInfo = {
  name: 'Mayer Doya Washing & Dyeing Factory Ltd.',
  subtitle: 'Export Standard Denim & Garments Wet-Processing Facility',
  address: 'Plot 18-22, BSCIC Industrial Area, Fatullah, Narayanganj, Dhaka - 1400',
  phone: '+880 1711-889900',
  email: 'factory@mayerdoya-erp.com',
  tradeLicense: 'TRAD/DSCC/019482/2024',
  vatBin: '002918472-0102',
  boilerCapacity: '4.0 Ton/Hr Steampower • 8 Industrial Vessels',
  activeShifts: 'Day Shift (8 AM - 8 PM) & Night Shift (8 PM - 8 AM)',
  establishedYear: '2018',
  industrialZone: 'Narayanganj BSCIC Zone 2'
};

export const FactorySettings: React.FC = () => {
  const { t } = useERP();
  const [factory, setFactory] = useState<FactoryInfo>(() => {
    const saved = localStorage.getItem('mayer_doya_factory_info');
    return saved ? JSON.parse(saved) : defaultFactoryInfo;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  useEffect(() => {
    localStorage.setItem('mayer_doya_factory_info', JSON.stringify(factory));
  }, [factory]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {isSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#E5F8F1] border border-[#38C99A]/40 text-[#229A73] text-xs font-bold shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#38C99A]" />
            <span>{t('saveSettingsSuccess')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Factory Profile Card */}
      <GlassCard variant="white" padding="lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-6 border-b border-[#D9EAEB]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0] flex items-center justify-center p-3 shadow-md text-white shrink-0">
              <MayerLogo size={42} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#17383B] tracking-tight">
                {factory.name}
              </h3>
              <p className="text-xs text-[#0B9FA5] font-semibold mt-0.5">
                {factory.subtitle}
              </p>
              <p className="text-[11px] text-[#688285] flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {factory.address}
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            {!isEditing ? (
              <button
                id="btn-edit-factory"
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-[#F1FAFA] hover:bg-[#E2F5F5] text-[#0B9FA5] text-xs font-bold border border-[#0B9FA5]/30 transition-colors"
              >
                {t('edit')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-white hover:bg-[#F1FAFA] text-[#688285] text-xs font-bold border border-[#D9EAEB] transition-colors"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </div>

        {/* Details or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('factoryNameLabel')} <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={factory.name}
                  onChange={(e) => setFactory({ ...factory, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  Tagline / Sector Description
                </label>
                <input
                  type="text"
                  value={factory.subtitle}
                  onChange={(e) => setFactory({ ...factory, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('factoryAddressLabel')} <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={factory.address}
                  onChange={(e) => setFactory({ ...factory, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('factoryPhoneLabel')}
                </label>
                <input
                  type="text"
                  value={factory.phone}
                  onChange={(e) => setFactory({ ...factory, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('factoryEmailLabel')}
                </label>
                <input
                  type="email"
                  value={factory.email}
                  onChange={(e) => setFactory({ ...factory, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('tradeLicenseLabel')}
                </label>
                <input
                  type="text"
                  value={factory.tradeLicense}
                  onChange={(e) => setFactory({ ...factory, tradeLicense: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  VAT BIN / Tax Registration
                </label>
                <input
                  type="text"
                  value={factory.vatBin}
                  onChange={(e) => setFactory({ ...factory, vatBin: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('boilerCapacityLabel')}
                </label>
                <input
                  type="text"
                  value={factory.boilerCapacity}
                  onChange={(e) => setFactory({ ...factory, boilerCapacity: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('shiftTimingLabel')}
                </label>
                <input
                  type="text"
                  value={factory.activeShifts}
                  onChange={(e) => setFactory({ ...factory, activeShifts: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D9EAEB] text-[#688285] text-xs font-bold hover:bg-[#F1FAFA]"
              >
                {t('cancel')}
              </button>
              <button
                id="btn-save-factory"
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white text-xs font-bold shadow-[0_4px_12px_rgba(11,159,165,0.25)] hover:from-[#078A90] hover:to-[#0B9FA5]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('saveChanges')}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                {t('tradeLicenseLabel')}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
                <FileText className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {factory.tradeLicense}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                VAT / BIN Number
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
                <Globe2 className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {factory.vatBin}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                {t('boilerCapacityLabel')}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
                <Flame className="w-3.5 h-3.5 text-[#F3B562]" />
                {factory.boilerCapacity}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                {t('shiftTimingLabel')}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
                <Clock className="w-3.5 h-3.5 text-[#8178F2]" />
                {factory.activeShifts}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                {t('factoryPhoneLabel')}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
                <Phone className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {factory.phone}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                {t('factoryEmailLabel')}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
                <Mail className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {factory.email}
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
