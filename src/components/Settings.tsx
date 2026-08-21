import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { SettingsTab } from './settings/types';
import { ProfileSettings } from './settings/ProfileSettings';
import { FactorySettings } from './settings/FactorySettings';
import { LanguageSettings } from './settings/LanguageSettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { RolesSettings } from './settings/RolesSettings';
import { UsersSettings } from './settings/UsersSettings';
import { PreferencesSettings } from './settings/PreferencesSettings';
import { SecuritySettings } from './settings/SecuritySettings';
import { SystemSettings } from './settings/SystemSettings';
import { 
  User, 
  Users,
  Building2, 
  Globe, 
  Bell, 
  Sliders, 
  ShieldCheck, 
  KeyRound, 
  Server,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Settings: React.FC = () => {
  const { t, pendingUsersCount } = useERP();
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');

  const navItems: { id: SettingsTab; labelKey: string; icon: React.ElementType; color: string; badge?: number }[] = [
    { id: 'users', labelKey: 'tabUsers', icon: Users, color: 'text-[#0B9FA5]', badge: pendingUsersCount },
    { id: 'profile', labelKey: 'tabProfile', icon: User, color: 'text-[#0B9FA5]' },
    { id: 'factory', labelKey: 'tabFactory', icon: Building2, color: 'text-[#16B8B0]' },
    { id: 'language', labelKey: 'tabLanguage', icon: Globe, color: 'text-[#8178F2]' },
    { id: 'notifications', labelKey: 'tabNotifications', icon: Bell, color: 'text-[#F3B562]' },
    { id: 'preferences', labelKey: 'tabPreferences', icon: Sliders, color: 'text-[#38C99A]' },
    { id: 'roles', labelKey: 'tabRoles', icon: ShieldCheck, color: 'text-[#0B9FA5]' },
    { id: 'security', labelKey: 'tabSecurity', icon: KeyRound, color: 'text-[#8178F2]' },
    { id: 'system', labelKey: 'tabSystem', icon: Server, color: 'text-[#688285]' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight">
              {t('settingsTitle')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#688285]">
            {t('settingsSubtitle')}
          </p>
        </div>
      </div>

      {/* Mobile Tab Selector (Horizontal Scrollable Chips) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white shadow-md'
                  : 'bg-white border border-[#D9EAEB] text-[#688285] hover:bg-[#F1FAFA]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t(item.labelKey)}</span>
              {item.badge && item.badge > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-[#EA7185] text-white text-[10px] font-black">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Main Settings Grid (Left Nav + Right Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-2 sticky top-20">
          <div className="p-3 bg-white rounded-3xl border border-[#D9EAEB] shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] px-3 py-1.5 block">
              Preferences & Config
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`btn-settings-tab-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white shadow-[0_4px_16px_rgba(11,159,165,0.25)]'
                      : 'text-[#17383B] hover:bg-[#F1FAFA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-white' : item.color
                      }`}
                    />
                    <span>{t(item.labelKey)}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-white text-[#0B9FA5]' : 'bg-[#EA7185] text-white'
                      }`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-white translate-x-0.5' : 'text-[#8EA3A5]'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Settings Content Area */}
        <div className="lg:col-span-8 xl:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'users' && <UsersSettings />}
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'factory' && <FactorySettings />}
              {activeTab === 'language' && <LanguageSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'preferences' && <PreferencesSettings />}
              {activeTab === 'roles' && <RolesSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'system' && <SystemSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
