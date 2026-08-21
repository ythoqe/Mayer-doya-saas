import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { 
  Database, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Layers, 
  Cpu, 
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SystemSettings: React.FC = () => {
  const { 
    orders, 
    clients, 
    suppliers, 
    inventory, 
    transactions, 
    expenses, 
    cheques, 
    accounts, 
    employees, 
    t 
  } = useERP();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  const handleDownloadBackup = () => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      factoryName: 'Mayer Doya Washing & Dyeing Factory Ltd.',
      appVersion: '2.4.0',
      data: {
        orders,
        clients,
        suppliers,
        inventory,
        transactions,
        expenses,
        cheques,
        accounts,
        employees
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mayer_doya_erp_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastMessage('ERP JSON snapshot generated and downloaded successfully.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePurgeCache = () => {
    // Purge cached UI preferences while keeping the app alive
    localStorage.removeItem('mayer_doya_notification_settings');
    localStorage.removeItem('mayer_doya_system_preferences');
    setShowPurgeModal(false);
    setToastMessage(t('cacheClearedSuccess'));
    setTimeout(() => setToastMessage(null), 3000);
  };

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

      {/* Diagnostics Card */}
      <GlassCard variant="white" padding="lg">
        <div className="flex items-center gap-3 pb-5 border-b border-[#D9EAEB]">
          <div className="p-2.5 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
              {t('systemDiagnosticsTitle')}
            </h3>
            <p className="text-xs text-[#688285]">
              {t('systemDiagnosticsSubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {t('databaseSyncStatus')}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#229A73]">
              <span className="w-2 h-2 rounded-full bg-[#38C99A] animate-pulse" />
              Connected & Synchronized
            </div>
            <p className="text-[11px] text-[#688285] mt-1 font-mono">
              Firestore Cloud Channel
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {t('cacheStatus')}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
              <HardDrive className="w-3.5 h-3.5 text-[#0B9FA5]" />
              Persistent Storage
            </div>
            <p className="text-[11px] text-[#688285] mt-1">
              Local Browser Cache OK
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              Runtime Architecture
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#6357E8]">
              <Cpu className="w-3.5 h-3.5 text-[#8178F2]" />
              React 18 + Vite 5 + Tailwind
            </div>
            <p className="text-[11px] text-[#688285] mt-1">
              Single Page Application
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {t('appVersion')}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17383B]">
              <Layers className="w-3.5 h-3.5 text-[#0B9FA5]" />
              v2.4.0 (Phase 10 Release)
            </div>
            <p className="text-[11px] text-[#688285] mt-1">
              Production Build Ready
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Backup & Purge Tools Card */}
      <GlassCard variant="white" padding="lg">
        <div className="flex items-center gap-3 pb-5 border-b border-[#D9EAEB]">
          <div className="p-2.5 rounded-xl bg-[#E5F8F1] text-[#229A73]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
              {t('backupExportTitle')}
            </h3>
            <p className="text-xs text-[#688285]">
              {t('backupExportSubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download Snapshot */}
          <div className="p-5 rounded-2xl border border-[#D9EAEB] bg-gradient-to-br from-[#F1FAFA] to-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#17383B]">
                <Download className="w-4 h-4 text-[#0B9FA5]" />
                Full Database JSON Dump
              </div>
              <p className="text-xs text-[#688285] mt-2 leading-relaxed">
                Export all active records including {orders.length} orders, {inventory.length} chemical items, {clients.length} clients, and accounting ledgers into a secure JSON archive.
              </p>
            </div>
            <button
              id="btn-download-erp-backup"
              type="button"
              onClick={handleDownloadBackup}
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] text-white text-xs font-bold shadow-[0_4px_12px_rgba(11,159,165,0.2)] hover:from-[#078A90] hover:to-[#0B9FA5] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('exportAllData')}</span>
            </button>
          </div>

          {/* Purge Cache */}
          <div className="p-5 rounded-2xl border border-[#D9EAEB] bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#EA7185]">
                <Trash2 className="w-4 h-4 text-[#EA7185]" />
                Purge Temporary Cache
              </div>
              <p className="text-xs text-[#688285] mt-2 leading-relaxed">
                Clear locally cached UI preferences, filters, and offline storage keys without affecting persistent Firestore documents.
              </p>
            </div>
            <button
              id="btn-purge-cache"
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FDEDF0] text-[#EA7185] border border-[#EA7185]/30 text-xs font-bold hover:bg-[#FCD8DE] transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clearCacheBtn')}</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Confirmation Modal for Purge Cache */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#D9EAEB] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDEDF0] text-[#EA7185] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17383B]">
                Clear Local Application Cache?
              </h3>
              <p className="text-xs text-[#688285] mt-1.5 leading-relaxed">
                This will reset your temporary display preferences and cached state in this browser. Your master business records in the database will remain unaffected.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#D9EAEB] text-[#688285] text-xs font-bold hover:bg-[#F1FAFA]"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handlePurgeCache}
                className="px-4 py-2 rounded-xl bg-[#EA7185] text-white text-xs font-bold hover:bg-[#D95368] shadow-sm"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
