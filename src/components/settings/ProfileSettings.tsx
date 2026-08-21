import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Camera, 
  KeyRound,
  Building2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProfileSettings: React.FC = () => {
  const { currentUser, setCurrentUser, t, language } = useERP();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '+880 1711-000000',
    avatar: currentUser?.avatar || ''
  });
  const [isSavedToast, setIsSavedToast] = useState(false);

  if (!currentUser) return null;

  const roleLabel = t(currentUser.role) || currentUser.role.replace(/_/g, ' ');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setCurrentUser({
      ...currentUser,
      name: formData.name,
      phone: formData.phone,
      avatar: formData.avatar
    });

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

      {/* Main Profile Card */}
      <GlassCard variant="white" padding="lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#D9EAEB]">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-tr from-[#0B9FA5] to-[#8178F2] p-[2.5px] shadow-[0_4px_20px_rgba(11,159,165,0.2)]">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-black text-2xl">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#38C99A] border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg sm:text-xl font-black text-[#17383B] tracking-tight">
                  {currentUser.name}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DDF4F3] text-[#0B9FA5] text-[11px] font-bold border border-[#0B9FA5]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-[#688285] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {currentUser.email}
              </p>
              <p className="text-xs text-[#688285] flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {formData.phone || '+880 1700-000000'}
              </p>
            </div>
          </div>

          {/* Edit / Cancel Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {!isEditing ? (
              <button
                id="btn-edit-profile"
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-[#F1FAFA] hover:bg-[#E2F5F5] text-[#0B9FA5] text-xs font-bold border border-[#0B9FA5]/30 transition-colors"
              >
                {t('edit')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: currentUser.name,
                    email: currentUser.email,
                    phone: currentUser.phone || '',
                    avatar: currentUser.avatar || ''
                  });
                  setIsEditing(false);
                }}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-white hover:bg-[#F1FAFA] text-[#688285] text-xs font-bold border border-[#D9EAEB] transition-colors"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </div>

        {/* Form Body */}
        {isEditing ? (
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('fullNameLabel')} <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('phoneLabel')}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('emailLabel')} <span className="text-[10px] text-[#8EA3A5] font-normal">(Read Only)</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F8FAFA] border border-[#D9EAEB] text-[#688285] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
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
                id="btn-save-profile"
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white text-xs font-bold shadow-[0_4px_12px_rgba(11,159,165,0.25)] hover:from-[#078A90] hover:to-[#0B9FA5]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('saveChanges')}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                {t('accountStatusLabel')}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#229A73]">
                <span className="w-2 h-2 rounded-full bg-[#38C99A]" />
                Active Authenticated Session
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                {t('roleLabel')}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
                <Building2 className="w-3.5 h-3.5 text-[#0B9FA5]" />
                {roleLabel}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                Security Standard
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#6357E8]">
                <KeyRound className="w-3.5 h-3.5 text-[#8178F2]" />
                Encrypted Session
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
