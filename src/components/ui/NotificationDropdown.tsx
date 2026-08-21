import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { Bell, Check, CheckCheck, ExternalLink, AlertTriangle, Package, Layers, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationDropdownProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigateTab }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, t, language } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return <div className="p-2 rounded-xl bg-[#FFF3DF] text-[#F3B562]"><AlertTriangle className="w-4 h-4" /></div>;
      case 'order':
        return <div className="p-2 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]"><Package className="w-4 h-4" /></div>;
      case 'cheque':
        return <div className="p-2 rounded-xl bg-[#EEEBFF] text-[#8178F2]"><DollarSign className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 rounded-xl bg-[#E5F8F1] text-[#38C99A]"><Layers className="w-4 h-4" /></div>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="btn-notifications-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2.5 rounded-full bg-white/80 hover:bg-white text-[#17383B] border border-[#D9EAEB] shadow-[0_2px_10px_rgba(30,90,95,0.04)] transition-all duration-200 hover:shadow-md active:scale-95"
      >
        <Bell className="w-5 h-5 text-[#17383B]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EA7185] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#EA7185] text-white text-[9px] font-bold items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-[22px] border border-[#D9EAEB] shadow-[0_15px_45px_rgba(23,56,59,0.12)] z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]/70">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-[#17383B]">{t('notifications')}</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#DDF4F3] text-[#0B9FA5]">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="text-xs text-[#0B9FA5] hover:text-[#078A90] font-medium flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {t('markAllRead')}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-[#F1FAFA]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#8EA3A5]">
                  {t('noNotifications')}
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationAsRead(n.id);
                      if (n.linkTab && onNavigateTab) {
                        onNavigateTab(n.linkTab);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#F1FAFA] ${
                      !n.read ? 'bg-[#F1FAFA]/50 font-medium' : ''
                    }`}
                  >
                    {getIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className="text-xs font-semibold text-[#17383B] truncate">{n.title}</p>
                        <span className="text-[10px] text-[#8EA3A5] shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-[#688285] line-clamp-2 leading-relaxed">{n.message}</p>
                    </div>

                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#0B9FA5] mt-1.5 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
