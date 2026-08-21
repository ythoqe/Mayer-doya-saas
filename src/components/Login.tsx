import React, { useState } from 'react';
import { useERP, DEFAULT_ADMIN } from '../context/ERPContext';
import { MayerLogo } from './ui/MayerLogo';
import { LanguageSwitcher } from './ui/LanguageSwitcher';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Droplets, 
  UserPlus, 
  LogIn, 
  User, 
  Phone, 
  Briefcase, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const { login, registerUser, t, language } = useERP();

  // Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('production_manager');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setErrorMessage(err.message || (language === 'bn' ? 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Login failed. Please check credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage(language === 'bn' ? 'অনুগ্রহ করে সকল আবশ্যক তথ্য পূরণ করুন।' : 'Please fill all required fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        role: regRole
      });

      if (res.success) {
        setSuccessMessage(res.message);
        // Switch to login tab and prefill the newly registered email
        setLoginEmail(regEmail);
        setLoginPassword('');
        setAuthMode('login');
        // Clear reg form
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || (language === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' : 'Registration failed.'));
    } finally {
      setIsLoading(false);
    }
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
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white/80 backdrop-blur-2xl rounded-[32px] border border-white/90 shadow-[0_20px_70px_rgba(30,90,95,0.12)] overflow-hidden"
      >
        {/* LEFT COLUMN: Industrial Art & Factory Highlights (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0B9FA5] via-[#16B8B0] to-[#8178F2] p-8 lg:p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Concentric ambient glows */}
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

          {/* Center Graphic & Factory Approval Badge */}
          <div className="relative z-10 my-6 space-y-5">
            <div className="p-5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg space-y-3">
              <div className="flex items-center gap-2.5 text-xs font-bold text-white/95 uppercase tracking-wider">
                <Droplets className="w-4 h-4 text-[#DDF4F3]" />
                <span>{language === 'bn' ? 'নিরাপদ অথেনটিকেশন ও অ্যাক্সেস' : 'Secure Role-Based Access'}</span>
              </div>
              <p className="text-xs text-white/85 leading-relaxed">
                {language === 'bn' 
                  ? 'কারখানার সকল হিসাব, প্রোডাকশন লট এবং কেমিক্যাল রেজিস্টারের নিরাপত্তা নিশ্চিতে প্রতিটি নতুন অ্যাকাউন্ট এডমিন অনুমোদনের মাধ্যমে সক্রিয় হয়।'
                  : 'To protect factory ledgers, production lots, and chemical recipes, new registrations require direct administrator approval before activation.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                <div className="flex items-center gap-1.5 text-white/80 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#38C99A]" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {language === 'bn' ? 'অ্যাডমিন কন্ট্রোল' : 'Admin Control'}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-white">
                  {language === 'bn' ? 'অনুমোদন সাপেক্ষে' : 'Approval Gate'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                <div className="flex items-center gap-1.5 text-white/80 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#F3B562]" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {language === 'bn' ? 'লাইভ সিঙ্ক' : 'Live Sync'}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-white">
                  {language === 'bn' ? 'ক্লাউড ডেটাবেস' : 'Cloud Firestore'}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/80">
            <Award className="w-4 h-4 text-[#DDF4F3]" />
            <span>Industrial ISO-Compliant Wet Processing ERP</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Auth Form (Login / Register Switcher) */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-white">
          {/* Top Bar: Mobile Brand + Language Switcher */}
          <div className="flex items-center justify-between pb-4">
            <div className="lg:hidden flex items-center gap-2">
              <MayerLogo size={30} />
              <span className="font-extrabold text-base text-[#17383B]">{t('appName')}</span>
            </div>
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Auth Mode Toggle Pill */}
          <div className="p-1 bg-[#F1FAFA] border border-[#D9EAEB] rounded-2xl flex items-center mb-5">
            <button
              type="button"
              id="btn-switch-login"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-[#0B9FA5] shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
            </button>
            <button
              type="button"
              id="btn-switch-register"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-white text-[#0B9FA5] shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন রেজিস্ট্রেশন' : 'Register Account'}</span>
            </button>
          </div>

          {/* Dynamic Heading */}
          <div className="space-y-1 mb-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17383B] tracking-tight">
              {authMode === 'login'
                ? (language === 'bn' ? 'স্বাগতম!' : 'Welcome Back')
                : (language === 'bn' ? 'নতুন অ্যাকাউন্ট আবেদন' : 'Apply for User Account')}
            </h2>
            <p className="text-xs sm:text-sm text-[#688285] leading-relaxed">
              {authMode === 'login'
                ? (language === 'bn' ? 'আপনার নিবন্ধিত ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।' : 'Enter your approved email and password to access the ERP.')
                : (language === 'bn' ? 'নিবন্ধনের পর এডমিন অনুমোদন দিলে আপনি সিস্টেমে প্রবেশ করতে পারবেন।' : 'Fill your details. An administrator will review and approve your access.')}
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FDEDF0] border border-[#EA7185]/30 text-xs font-semibold text-[#EA7185] flex items-start gap-2.5 mb-4">
              <AlertCircle className="w-4 h-4 text-[#EA7185] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-[#E5F8F1] border border-[#38C99A]/40 text-xs font-semibold text-[#229A73] flex items-start gap-2.5 mb-4">
              <CheckCircle2 className="w-4 h-4 text-[#38C99A] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@mayerdoya.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#17383B]">
                    {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'} *
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-[#8EA3A5] hover:text-[#17383B] absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold tracking-wide shadow-[0_6px_20px_rgba(11,159,165,0.28)] transition-all duration-200 hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
                  </span>
                ) : (
                  <>
                    <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: REGISTRATION FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1">
                  {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Md. Shahidul Islam"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">
                    {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Official Email'} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="user@mayerdoya.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">
                    {language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+880 1700-000000"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">
                    {language === 'bn' ? 'পাসওয়ার্ড' : 'Account Password'} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="p-1 text-[#8EA3A5] hover:text-[#17383B] absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">
                    {language === 'bn' ? 'আবেদিত পদবী / রোল' : 'Requested Role'} *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="select-reg-role"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all appearance-none"
                    >
                      <option value="production_manager">{t('production_manager')}</option>
                      <option value="dyeing_master">{t('dyeing_master')}</option>
                      <option value="washing_manager">{t('washing_manager')}</option>
                      <option value="accounts_manager">{t('accounts_manager')}</option>
                      <option value="store_keeper">{t('store_keeper')}</option>
                      <option value="employee">{t('employee')}</option>
                      <option value="auditor">{t('auditor')}</option>
                      <option value="admin">{t('admin')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Approval Notice */}
              <div className="p-3 rounded-xl bg-[#FEF3C7]/40 border border-[#F59E0B]/30 flex items-start gap-2 text-[11px] text-[#92400E]">
                <Clock className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  {language === 'bn'
                    ? 'আবেদন সাবমিট করার পর অ্যাকাউন্টটি "অপেক্ষমান" (Pending) থাকবে। এডমিন অনুমোদন দিলে লগইন করতে পারবেন।'
                    : 'Your account will be in "Pending" status after registration until approved by the admin.'}
                </span>
              </div>

              {/* Submit Registration Button */}
              <button
                id="btn-register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold tracking-wide shadow-[0_6px_20px_rgba(11,159,165,0.28)] transition-all duration-200 hover:-translate-y-0.5 active:scale-98 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'আবেদন পাঠানো হচ্ছে...' : 'Submitting...'}</span>
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{language === 'bn' ? 'রেজিস্ট্রেশন আবেদন জমা দিন' : 'Submit Registration'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="pt-4 text-center">
            <p className="text-[11px] text-[#8EA3A5]">
              {language === 'bn'
                ? 'কারখানা সহায়তা বা অ্যাকাউন্টের জরুরি প্রয়োজনে অ্যাডমিনের সাথে যোগাযোগ করুন।'
                : 'For factory emergency access or role updates, contact the administrator.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
