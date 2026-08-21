import React from 'react';
import { useERP } from '../../context/ERPContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationDropdown } from './NotificationDropdown';
import { UserMenu } from './UserMenu';
import { 
  Menu, 
  Search, 
  Plus, 
  Sparkles, 
  Wifi, 
  Calendar,
  Layers
} from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  onOpenMobileMenu: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenSettings?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onNavigateTab,
  onOpenSettings
}) => {
  const { t, openQuickAction, isOnline, language } = useERP();

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return t('dashboard');
      case 'orders': return t('orders');
      case 'clients': return t('clients');
      case 'suppliers': return t('suppliers');
      case 'inventory': return t('inventory');
      case 'accounts': return t('accounts');
      case 'expenses': return t('expenses');
      case 'cheques': return t('cheques');
      case 'employees': return t('employees');
      case 'reports': return t('reports');
      case 'settings': return t('settingsTitle');
      default: return t('appName');
    }
  };

  const todayFormatted = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-[72px] px-4 sm:px-6 md:px-8 border-b border-[#D9EAEB]/80 bg-white/45 backdrop-blur-xl flex items-center justify-between gap-4 z-20 shrink-0 select-none">
      {/* Left: Mobile Menu & Context Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="btn-mobile-menu-toggle"
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation"
          className="md:hidden p-2 rounded-xl bg-white/80 border border-[#D9EAEB] text-[#17383B] hover:bg-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-[#17383B] tracking-tight truncate">
              {getPageTitle(activeTab)}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5F8F1] text-[#229A73] text-[10px] font-bold border border-[#38C99A]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38C99A] animate-pulse" />
              {t('onlineStatus')}
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-[#688285]">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#0B9FA5]" /> {todayFormatted}</span>
            <span>•</span>
            <span className="text-[#0B9FA5] font-medium">{t('factoryShift')}</span>
          </div>
        </div>
      </div>

      {/* Middle: Compact Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md mx-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white/80 border border-[#D9EAEB] text-[#17383B] placeholder-[#8EA3A5] focus:outline-none focus:bg-white focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all shadow-[0_2px_8px_rgba(30,90,95,0.02)]"
          />
        </div>
      </div>

      {/* Right: Actions, Language, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Action Button */}
        <button
          id="btn-topbar-quick-action"
          type="button"
          onClick={() => openQuickAction('order')}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-[0_4px_14px_rgba(11,159,165,0.25)] transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('quickNew')}</span>
        </button>

        {/* Language Switcher */}
        <LanguageSwitcher compact />

        {/* Notifications */}
        <NotificationDropdown onNavigateTab={onNavigateTab} />

        {/* User Menu */}
        <UserMenu onOpenSettings={onOpenSettings} />
      </div>
    </header>
  );
};
