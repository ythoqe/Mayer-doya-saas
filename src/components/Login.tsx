import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { MayerLogo } from './ui/MayerLogo';
import { LanguageSwitcher } from './ui/LanguageSwitcher';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Droplets, 
  Layers, 
  FlaskConical,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login, t, language } = useERP();
  const [email, setEmail] = useState('manager@mayerdoya.com');
  const [password, setPassword] = useState('••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await login(email, selectedRole);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    login(demoEmail, role);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden bg-[#F1FAFA]">
      {/* Soft atmospheric background glows */}
      <div className="app-atmosphere" />
      <div className="app-bottom-glow" />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white/70 backdrop-blur-2xl rounded-[32px] border border-white/90 shadow-[0_20px_70px_rgba(30,90,95,0.12)] overflow-hidden"
      >
        {/* LEFT COLUMN: Industrial Art & Atmosphere (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0B9FA5] via-[#16B8B0] to-[#8178F2] p-8 lg:p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Subtle concentric fluid ripples */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#8178F2]/30 blur-3xl pointer-events-none" />

          {/* Top Branding in Left Hero */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <MayerLogo size={32} variant="white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">{t('appName')}</h2>
                <p className="text-xs text-white/80 font-medium">{t('appSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Center Graphic & Highlights */}
          <div className="relative z-10 my-8 space-y-6">
            <div className="p-5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-bold text-white/90 uppercase tracking-wider">
                <Droplets className="w-4 h-4 text-[#DDF4F3]" />
                Precision Wet Processing
              </div>
              <p className="text-xs text-white/85 leading-relaxed">
                Automated job cards, chemical batch recipes, machine hydro queues, and real-time client ledger settlement.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                <p className="text-[10px] text-white/75 font-semibold uppercase">Daily Output</p>
                <p className="text-lg font-extrabold text-white mt-0.5">15,000+ Pcs</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                <p className="text-[10px] text-white/75 font-semibold uppercase">Recipe Precision</p>
                <p className="text-lg font-extrabold text-white mt-0.5">99.8% Shade QC</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/80">
            <Award className="w-4 h-4 text-[#DDF4F3]" />
            <span>Industrial ISO-Compliant Factory ERP</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Login Form & Role Selection */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-white">
          {/* Top Bar inside Login Card: Language Toggle */}
          <div className="flex items-center justify-between pb-4">
            <div className="lg:hidden flex items-center gap-2">
              <MayerLogo size={32} />
              <span className="font-extrabold text-base text-[#17383B]">{t('appName')}</span>
            </div>
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="my-2 space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17383B] tracking-tight">
              {t('welcomeBack')}
            </h2>
            <p className="text-xs sm:text-sm text-[#688285] leading-relaxed">
              {t('signInPrompt')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4 my-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#FDECEF] border border-[#EA7185]/30 text-xs font-semibold text-[#EA7185]">
                {errorMessage}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                {t('emailOrPhone')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@mayerdoya.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                  required
                />
              </div>
            </div>

            {/* Operational Role Selector */}
            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                {t('roleSelector')}
              </label>
              <select
                id="select-login-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
              >
                <option value="super_admin">{t('super_admin')}</option>
                <option value="admin">{t('admin')}</option>
                <option value="production_manager">{t('production_manager')}</option>
                <option value="dyeing_master">{t('dyeing_master')}</option>
                <option value="accounts_manager">{t('accounts_manager')}</option>
                <option value="store_keeper">{t('store_keeper')}</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold tracking-wide shadow-[0_6px_20px_rgba(11,159,165,0.30)] transition-all duration-200 hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('authenticating')}
                </span>
              ) : (
                <>
                  <span>{t('signInButton')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Previews */}
          <div className="pt-3 border-t border-[#E6F0F1]">
            <p className="text-[11px] font-semibold text-[#8EA3A5] mb-2 text-center">
              {t('demoHint')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('super_admin', 'owner@mayerdoya.com')}
                className="px-2.5 py-1.5 rounded-lg bg-[#DDF4F3]/60 hover:bg-[#DDF4F3] text-[#0B9FA5] text-[11px] font-bold transition-colors truncate"
              >
                Owner / Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('dyeing_master', 'dyeing@mayerdoya.com')}
                className="px-2.5 py-1.5 rounded-lg bg-[#EEEBFF]/60 hover:bg-[#EEEBFF] text-[#8178F2] text-[11px] font-bold transition-colors truncate"
              >
                Dyeing Master
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('accounts_manager', 'accounts@mayerdoya.com')}
                className="px-2.5 py-1.5 rounded-lg bg-[#E5F8F1]/60 hover:bg-[#E5F8F1] text-[#229A73] text-[11px] font-bold transition-colors truncate col-span-2 sm:col-span-1"
              >
                Accounts Officer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
