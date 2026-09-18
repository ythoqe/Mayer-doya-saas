import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Cheque, ChequeDirection } from '../types';
import { formatNumber } from '../utils/translation';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { ChequeSummaryCards } from './cheques/ChequeSummaryCards';
import { ChequeTable } from './cheques/ChequeTable';
import { ChequeModal } from './cheques/ChequeModal';

export const Cheques: React.FC = () => {
  const { cheques, language, t } = useERP();
  const [isAddChequeOpen, setIsAddChequeOpen] = useState(false);
  const [addDirection, setAddDirection] = useState<'received' | 'issued'>('received');
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);

  const handleOpenAdd = (dir: 'received' | 'issued' = 'received') => {
    setEditingCheque(null);
    setAddDirection(dir);
    setIsAddChequeOpen(true);
  };

  const handleEditCheque = (chq: Cheque) => {
    setEditingCheque(chq);
    setAddDirection(chq.direction || (chq.partyType === 'Client' ? 'received' : 'issued'));
    setIsAddChequeOpen(true);
  };

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
            {language === 'bn' 
              ? 'গ্রাহক থেকে চেক গ্রহণ, মহাজনকে চেক প্রদান/অ্যান্ডোর্সমেন্ট ও ব্যাংকিং ক্লিয়ারেন্স পরিচালনা।' 
              : t('chequesSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAdd('received')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? '📥 চেক গ্রহণ (Client)' : '+ Receive Cheque'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('issued')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6357E8] to-[#4838D1] hover:from-[#5144D3] hover:to-[#3C2BBF] text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? '📤 চেক প্রদান (Supplier)' : '+ Give Cheque'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <ChequeSummaryCards />

      {/* Cheque Table */}
      <ChequeTable
        cheques={cheques}
        onAddCheque={(dir) => handleOpenAdd(dir || 'received')}
        onEditCheque={handleEditCheque}
      />

      {/* Modal */}
      {isAddChequeOpen && (
        <ChequeModal
          isOpen={isAddChequeOpen}
          chequeToEdit={editingCheque}
          defaultDirection={addDirection}
          onClose={() => {
            setIsAddChequeOpen(false);
            setEditingCheque(null);
          }}
        />
      )}
    </div>
  );
};
