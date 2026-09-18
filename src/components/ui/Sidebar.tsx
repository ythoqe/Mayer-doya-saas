import React from 'react';
import { useERP } from '../../context/ERPContext';
import { MayerLogo } from './MayerLogo';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  FlaskConical, 
  Landmark, 
  Receipt, 
  BarChart3, 
  HelpCircle, 
  LogOut, 
  X, 
  Sparkles,
  ChevronRight,
  UserCheck,
  Settings,
  TrendingUp,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsedTablet?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsedTablet = false
}) => {
  const { t, orders, inventory, cheques, currentUser, logout, language } = useERP();

  // Actual dynamic badge counts
  const pendingOrdersCount = orders.filter(o => ['pending', 'lot_received', 'batch_assigned', 'washing', 'dyeing'].includes(o.status)).length;
  const lowStockCount = inventory.filter(i => i.currentStockKg <= i.minAlertLevel).length;
  const pendingChequesCount = cheques.filter(c => c.status === 'Pending').length;

  const navGroups = [
    {
      groupTitle: 'Primary',
      items: [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard }
      ]
    },
    {
      groupTitle: 'Operations',
      items: [
        { id: 'orders', label: t('orders'), icon: Package, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined, badgeColor: 'bg-[#DDF4F3] text-[#0B9FA5]' }
      ]
    },
    {
      groupTitle: 'Management',
      items: [
        { id: 'clients', label: t('clients'), icon: Users },
        { id: 'suppliers', label: t('suppliers'), icon: Truck },
        { id: 'inventory', label: t('inventory'), icon: FlaskConical, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-[#FFF3DF] text-[#F3B562]' },
        { id: 'employees', label: t('employees'), icon: UserCheck }
      ]
    },
    {
      groupTitle: 'Finance',
      items: [
        { id: 'accounts', label: t('accounts'), icon: Landmark, badge: pendingChequesCount > 0 ? pendingChequesCount : undefined, badgeColor: 'bg-[#EEEBFF] text-[#8178F2]' },
        { id: 'expenses', label: t('expenses'), icon: Receipt },
        { id: 'bankLoans', label: t('loans'), icon: Building2 },
        { id: 'investors', label: t('investors'), icon: TrendingUp }
      ]
    },
    {
      groupTitle: 'Analytics & Config',
      items: [
        { id: 'reports', label: t('reports'), icon: BarChart3 },
        { id: 'settings', label: t('settingsTitle'), icon: Settings }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-5 pb-4 flex items-center justify-between border-b border-[#E6F0F1]/70">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('dashboard'); if (onCloseMobile) onCloseMobile(); }}>
          <MayerLogo size={36} />
          {!isCollapsedTablet && (
            <div className="flex flex-col">
              <span className="font-extrabold text-[17px] tracking-tight text-[#17383B] leading-none">
                {t('appName')}
              </span>
              <span className="text-[10px] font-semibold text-[#0B9FA5] tracking-wider uppercase mt-1">
                {t('appSubtitle')}
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-full hover:bg-black/5 text-[#688285]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsedTablet && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5]">
                {group.groupTitle}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={isCollapsedTablet ? item.label : undefined}
                  className={`w-full group relative flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white shadow-[0_4px_16px_rgba(11,159,165,0.28)] font-bold'
                      : 'text-[#688285] hover:text-[#17383B] hover:bg-white/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#688285]'}`} />
                  
                  {!isCollapsedTablet && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}

                  {!isCollapsedTablet && item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-[#DDF4F3] text-[#0B9FA5]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <motion.span
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-[14px] pointer-events-none"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Support & Profile */}
      <div className="p-3 border-t border-[#E6F0F1]/70 bg-white/40 space-y-2">
        {/* User Card */}
        {currentUser && (
          <div className="p-2.5 rounded-[16px] bg-white/80 border border-[#D9EAEB] flex items-center justify-between shadow-[0_2px_10px_rgba(30,90,95,0.03)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              {!isCollapsedTablet && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#17383B] truncate leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-[#0B9FA5] font-medium truncate leading-tight capitalize">
                    {t(currentUser.role) || currentUser.role.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsedTablet && (
              <button
                type="button"
                onClick={logout}
                title={t('signOut')}
                className="p-1.5 rounded-lg hover:bg-[#FDECEF] text-[#8EA3A5] hover:text-[#EA7185] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full bg-white/50 backdrop-blur-xl border-r border-[#D9EAEB]/80 transition-all duration-300 z-30 shrink-0 ${
          isCollapsedTablet ? 'w-[76px]' : 'w-[248px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="md:hidden fixed inset-0 z-40 bg-[#17383B]/30 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-[285px] max-w-[85vw] bg-white/95 backdrop-blur-2xl border-r border-[#D9EAEB] shadow-[0_20px_60px_rgba(23,56,59,0.18)] z-50 overflow-hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
