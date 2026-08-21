import React from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { 
  ShieldCheck, 
  Users, 
  Check, 
  X, 
  Lock, 
  Crown, 
  Landmark, 
  FlaskConical, 
  Eye, 
  Building 
} from 'lucide-react';
import { UserRole } from '../../types';

interface RoleDefinition {
  role: UserRole;
  name: string;
  badgeStyle: { bg: string; text: string; border: string; dot: string };
  description: string;
  permissions: {
    production: boolean;
    orders: boolean;
    inventory: boolean;
    accounts: boolean;
    expenses: boolean;
    payroll: boolean;
    reports: boolean;
    settings: boolean;
  };
}

export const RolesSettings: React.FC = () => {
  const { t, currentUser } = useERP();

  const roleDefinitions: RoleDefinition[] = [
    {
      role: 'super_admin',
      name: t('roleSuperAdmin'),
      badgeStyle: {
        bg: 'bg-[#DDF4F3]',
        text: 'text-[#0B9FA5]',
        border: 'border-[#16B8B0]/30',
        dot: 'bg-[#0B9FA5]'
      },
      description: t('roleSuperAdminDesc'),
      permissions: {
        production: true,
        orders: true,
        inventory: true,
        accounts: true,
        expenses: true,
        payroll: true,
        reports: true,
        settings: true
      }
    },
    {
      role: 'accounts_manager',
      name: t('roleAccounts'),
      badgeStyle: {
        bg: 'bg-[#E5F8F1]',
        text: 'text-[#229A73]',
        border: 'border-[#38C99A]/30',
        dot: 'bg-[#38C99A]'
      },
      description: t('roleAccountsDesc'),
      permissions: {
        production: true,
        orders: true,
        inventory: true,
        accounts: true,
        expenses: true,
        payroll: true,
        reports: true,
        settings: false
      }
    },
    {
      role: 'dyeing_master',
      name: t('roleDyeingMaster'),
      badgeStyle: {
        bg: 'bg-[#EEEBFF]',
        text: 'text-[#6357E8]',
        border: 'border-[#8178F2]/30',
        dot: 'bg-[#8178F2]'
      },
      description: t('roleDyeingMasterDesc'),
      permissions: {
        production: true,
        orders: true,
        inventory: true,
        accounts: false,
        expenses: false,
        payroll: false,
        reports: false,
        settings: false
      }
    },
    {
      role: 'store_keeper',
      name: t('roleStoreKeeper'),
      badgeStyle: {
        bg: 'bg-[#FFF3DF]',
        text: 'text-[#C47D1C]',
        border: 'border-[#F3B562]/30',
        dot: 'bg-[#F3B562]'
      },
      description: t('roleStoreKeeperDesc'),
      permissions: {
        production: false,
        orders: false,
        inventory: true,
        accounts: false,
        expenses: false,
        payroll: false,
        reports: false,
        settings: false
      }
    },
    {
      role: 'auditor',
      name: t('roleAuditor'),
      badgeStyle: {
        bg: 'bg-[#EAF6F7]',
        text: 'text-[#688285]',
        border: 'border-[#D9EAEB]',
        dot: 'bg-[#8EA3A5]'
      },
      description: t('roleAuditorDesc'),
      permissions: {
        production: true,
        orders: true,
        inventory: true,
        accounts: false,
        expenses: false,
        payroll: false,
        reports: true,
        settings: false
      }
    }
  ];

  return (
    <div className="space-y-6">
      <GlassCard variant="white" padding="lg">
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#D9EAEB]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
                {t('rolesTitle')}
              </h3>
              <p className="text-xs text-[#688285]">
                {t('rolesSubtitle')}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-semibold text-[#0B9FA5]">
            <Crown className="w-3.5 h-3.5" />
            <span>Active: {t(currentUser?.role || '') || currentUser?.role}</span>
          </div>
        </div>

        {/* Roles List */}
        <div className="mt-6 space-y-4">
          {roleDefinitions.map((item) => {
            const isUserRole = currentUser?.role === item.role;

            return (
              <div
                key={item.role}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isUserRole
                    ? 'bg-gradient-to-br from-[#F1FAFA] to-white border-[#0B9FA5] shadow-[0_4px_16px_rgba(11,159,165,0.12)]'
                    : 'bg-white border-[#D9EAEB] hover:border-[#D9EAEB]/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9EAEB]/60">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${item.badgeStyle.bg} ${item.badgeStyle.text} ${item.badgeStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.badgeStyle.dot}`} />
                      {item.name}
                    </span>
                    {isUserRole && (
                      <span className="px-2 py-0.5 rounded-full bg-[#0B9FA5] text-white text-[10px] font-bold">
                        Your Current Role
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-[#688285] leading-relaxed">
                  {item.description}
                </p>

                {/* Permissions Matrix Pills */}
                <div className="mt-3.5 pt-3 border-t border-[#D9EAEB]/50 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EA3A5] mr-1">
                    Modules:
                  </span>
                  {Object.entries(item.permissions).map(([moduleName, hasAccess]) => (
                    <span
                      key={moduleName}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                        hasAccess
                          ? 'bg-[#E5F8F1] text-[#229A73] border border-[#38C99A]/20'
                          : 'bg-[#F8FAFA] text-[#8EA3A5] border border-[#D9EAEB]/60 opacity-60'
                      }`}
                    >
                      {hasAccess ? (
                        <Check className="w-2.5 h-2.5 stroke-[3] text-[#38C99A]" />
                      ) : (
                        <X className="w-2.5 h-2.5 stroke-[3] text-[#8EA3A5]" />
                      )}
                      <span>{moduleName}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};
