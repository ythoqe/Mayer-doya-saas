import React from 'react';
import { 
  LayoutDashboard, 
  Factory, 
  ShoppingBag, 
  Users, 
  Truck, 
  Boxes, 
  Landmark, 
  Receipt, 
  UserCheck, 
  Printer,
  Lock
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ReportCategory } from './types';
import { UserRole } from '../../types';

interface ReportCategoryTabsProps {
  activeCategory: ReportCategory;
  onSelectCategory: (category: ReportCategory) => void;
  userRole?: UserRole;
}

export const ReportCategoryTabs: React.FC<ReportCategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  userRole = 'super_admin'
}) => {
  const { t } = useERP();

  const isFinancialRole = ['super_admin', 'admin', 'accounts_manager', 'auditor'].includes(userRole);

  const tabs: { id: ReportCategory; label: string; icon: React.ComponentType<{ className?: string }>; requiresFinance?: boolean }[] = [
    { id: 'overview', label: t('tabOverview'), icon: LayoutDashboard },
    { id: 'production', label: t('tabProduction'), icon: Factory },
    { id: 'orders', label: t('tabOrders'), icon: ShoppingBag },
    { id: 'clients', label: t('tabClients'), icon: Users },
    { id: 'suppliers', label: t('tabSuppliers'), icon: Truck },
    { id: 'inventory', label: t('tabInventory'), icon: Boxes },
    { id: 'finance', label: t('tabFinance'), icon: Landmark, requiresFinance: true },
    { id: 'expenses', label: t('tabExpenses'), icon: Receipt, requiresFinance: true },
    { id: 'employees', label: t('tabEmployees'), icon: UserCheck, requiresFinance: true },
    { id: 'print_center', label: t('tabPrintCenter'), icon: Printer },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs mb-6 overflow-hidden">
      <div className="flex items-center gap-1.5 p-2 overflow-x-auto scrollbar-none no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          const isRestricted = tab.requiresFinance && !isFinancialRole;

          return (
            <button
              key={tab.id}
              id={`report-tab-${tab.id}`}
              onClick={() => onSelectCategory(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : isRestricted
                  ? 'text-slate-400 bg-slate-50/50 hover:bg-slate-100 hover:text-slate-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {isRestricted && (
                <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
