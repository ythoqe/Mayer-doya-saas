import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { NotificationSettingsState } from './types';
import { 
  Bell, 
  FlaskConical, 
  Package, 
  CreditCard, 
  Receipt, 
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const defaultNotificationSettings: NotificationSettingsState = {
  lowStockAlerts: true,
  orderStatusUpdates: true,
  chequeReminders: true,
  paymentReceipts: true,
  dailyEveningDigest: false,
  emailNotifications: true
};

export const NotificationSettings: React.FC = () => {
  const { t } = useERP();
  const [settings, setSettings] = useState<NotificationSettingsState>(() => {
    const saved = localStorage.getItem('mayer_doya_notification_settings');
    return saved ? JSON.parse(saved) : defaultNotificationSettings;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mayer_doya_notification_settings', JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key: keyof NotificationSettingsState) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setToastMessage(t('saveSettingsSuccess'));
      setTimeout(() => setToastMessage(null), 2500);
      return updated;
    });
  };

  const notificationItems: {
    key: keyof NotificationSettingsState;
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
  }[] = [
    {
      key: 'lowStockAlerts',
      title: t('alertLowStock'),
      description: t('alertLowStockDesc'),
      icon: FlaskConical,
      iconColor: 'text-[#F3B562]',
      iconBg: 'bg-[#FFF3DF]'
    },
    {
      key: 'orderStatusUpdates',
      title: t('alertOrderUpdates'),
      description: t('alertOrderUpdatesDesc'),
      icon: Package,
      iconColor: 'text-[#0B9FA5]',
      iconBg: 'bg-[#DDF4F3]'
    },
    {
      key: 'chequeReminders',
      title: t('alertCheques'),
      description: t('alertChequesDesc'),
      icon: CalendarCheck,
      iconColor: 'text-[#8178F2]',
      iconBg: 'bg-[#EEEBFF]'
    },
    {
      key: 'paymentReceipts',
      title: t('alertPayments'),
      description: t('alertPaymentsDesc'),
      icon: CreditCard,
      iconColor: 'text-[#38C99A]',
      iconBg: 'bg-[#E5F8F1]'
    },
    {
      key: 'dailyEveningDigest',
      title: t('alertDailyDigest'),
      description: t('alertDailyDigestDesc'),
      icon: Receipt,
      iconColor: 'text-[#688285]',
      iconBg: 'bg-[#EAF6F7]'
    }
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#E5F8F1] border border-[#38C99A]/40 text-[#229A73] text-xs font-bold shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#38C99A]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassCard variant="white" padding="lg">
        <div className="flex items-center gap-3 pb-5 border-b border-[#D9EAEB]">
          <div className="p-2.5 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
              {t('notificationPreferencesTitle')}
            </h3>
            <p className="text-xs text-[#688285]">
              {t('notificationPreferencesSubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#D9EAEB]/70">
          {notificationItems.map((item) => {
            const Icon = item.icon;
            const isEnabled = settings[item.key];

            return (
              <div
                key={item.key}
                className="py-4 flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl ${item.iconBg} ${item.iconColor} shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#17383B]">
                      {item.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-[#688285] mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={() => toggleSetting(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/20 ${
                    isEnabled ? 'bg-[#0B9FA5]' : 'bg-[#D9EAEB]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};
