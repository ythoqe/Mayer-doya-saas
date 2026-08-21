import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { 
  KeyRound, 
  ShieldCheck, 
  Laptop, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Fingerprint,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SecuritySettings: React.FC = () => {
  const { currentUser, t } = useERP();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setToastMessage({ text: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setToastMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToastMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setToastMessage({ text: 'Password successfully updated and session re-authenticated.', type: 'success' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold shadow-sm ${
              toastMessage.type === 'success'
                ? 'bg-[#E5F8F1] border-[#38C99A]/40 text-[#229A73]'
                : 'bg-[#FDEDF0] border-[#EA7185]/40 text-[#EA7185]'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#38C99A]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#EA7185]" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Session Card */}
      <GlassCard variant="white" padding="lg">
        <div className="flex items-center gap-3 pb-5 border-b border-[#D9EAEB]">
          <div className="p-2.5 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
              {t('securityTitle')}
            </h3>
            <p className="text-xs text-[#688285]">
              {t('securitySubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {t('currentSession')}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#229A73]">
              <span className="w-2 h-2 rounded-full bg-[#38C99A]" />
              Online (Current Browser)
            </div>
            <p className="text-[11px] text-[#688285] mt-1 font-mono">
              IP: 103.145.22.84 (Dhaka, BD)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {t('twoFactorStatus')}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#6357E8]">
              <Fingerprint className="w-3.5 h-3.5 text-[#8178F2]" />
              {t('twoFactorActive')}
            </div>
            <p className="text-[11px] text-[#688285] mt-1">
              Protected by session token hash.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {t('lastLoginTime')}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
              <RefreshCw className="w-3.5 h-3.5 text-[#0B9FA5]" />
              Today, Active
            </div>
            <p className="text-[11px] text-[#688285] mt-1">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Password Change Simulator */}
      <GlassCard variant="white" padding="lg">
        <div className="flex items-center gap-3 pb-5 border-b border-[#D9EAEB]">
          <div className="p-2.5 rounded-xl bg-[#EEEBFF] text-[#8178F2]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
              Update Account Password
            </h3>
            <p className="text-xs text-[#688285]">
              Ensure your account uses a strong password with letters, numbers, and symbols.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="mt-5 max-w-xl space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#17383B] mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8EA3A5] hover:text-[#17383B]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#D9EAEB] text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="btn-update-password"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white text-xs font-bold shadow-[0_4px_12px_rgba(11,159,165,0.25)] hover:from-[#078A90] hover:to-[#0B9FA5] transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
