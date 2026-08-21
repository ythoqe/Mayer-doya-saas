import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { ChevronDown, LogOut, ShieldCheck, User as UserIcon, Building, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserMenuProps {
  onOpenSettings?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenSettings }) => {
  const { currentUser, logout, t } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const roleLabel = t(currentUser.role) || currentUser.role;

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="btn-user-menu"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-white/80 hover:bg-white border border-[#D9EAEB] shadow-[0_2px_10px_rgba(30,90,95,0.04)] transition-all duration-200 hover:shadow-md active:scale-98"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#0B9FA5] to-[#8178F2] p-[1.5px]">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full bg-white"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#38C99A] border-2 border-white" />
        </div>

        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-[#17383B] leading-tight truncate max-w-[110px]">
            {currentUser.name}
          </span>
          <span className="text-[10px] font-medium text-[#0B9FA5] leading-tight truncate max-w-[110px]">
            {roleLabel}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-[#8EA3A5] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-[22px] border border-[#D9EAEB] shadow-[0_15px_45px_rgba(23,56,59,0.12)] z-50 p-2 overflow-hidden"
          >
            {/* User details header */}
            <div className="p-3 bg-[#F1FAFA] rounded-[16px] mb-1">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0B9FA5]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B9FA5]">
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs font-bold text-[#17383B] truncate">{currentUser.name}</p>
              <p className="text-[11px] text-[#688285] truncate">{currentUser.email}</p>
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#17383B] hover:bg-[#F1FAFA] rounded-xl transition-colors text-left"
              >
                <UserIcon className="w-4 h-4 text-[#688285]" />
                <span>{t('profile')}</span>
              </button>

              <div className="h-[1px] bg-[#E6F0F1] my-1" />

              <button
                id="btn-logout"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#EA7185] hover:bg-[#FDECEF] rounded-xl transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-[#EA7185]" />
                <span>{t('signOut')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
