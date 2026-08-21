import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { formatNumber } from '../utils/translation';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { ChequeSummaryCards } from './cheques/ChequeSummaryCards';
import { ChequeTable } from './cheques/ChequeTable';
import { ChequeModal } from './cheques/ChequeModal';

export const Cheques: React.FC = () => {
  const { cheques, language, t } = useERP();
  const [isAddChequeOpen, setIsAddChequeOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#17383B]">
              {t('chequesTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#EEEBFF] text-[#8178F2] border border-[#8178F2]/20">
              {formatNumber(cheques.length, language)} {language === 'bn' ? 'টি চেক' : 'Cheques'}
            </span>
          </div>
          <p className="text-xs text-[#688285] mt-1 font-medium">
            {t('chequesSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddChequeOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addChequeBtn')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <ChequeSummaryCards />

      {/* Cheque Table */}
      <ChequeTable
        cheques={cheques}
        onAddCheque={() => setIsAddChequeOpen(true)}
      />

      {/* Modal */}
      {isAddChequeOpen && (
        <ChequeModal
          isOpen={isAddChequeOpen}
          onClose={() => setIsAddChequeOpen(false)}
        />
      )}
    </div>
  );
};
