import React, { useState } from 'react';
import { Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { Landmark, X, Printer, ArrowRightLeft, FileText, Calendar, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrintAccountStatement } from './PrintAccountStatement';

interface AccountDetailsModalProps {
  account: Account | null;
  onClose: () => void;
  onTransfer: (account: Account) => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  account,
  onClose,
  onTransfer
}) => {
  const { transactions, language, t } = useERP();
  const [showPrintStatement, setShowPrintStatement] = useState(false);

  if (!account) return null;

  const accountTxs = transactions.filter(t => t.accountId === account.id || t.toAccountId === account.id);
  const totalInflows = accountTxs.filter(t => t.type === 'credit' || (t.type === 'transfer' && t.toAccountId === account.id)).reduce((s, t) => s + t.amount, 0);
  const totalOutflows = accountTxs.filter(t => t.type === 'debit' || (t.type === 'transfer' && t.accountId === account.id)).reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#F1FAFA] to-[#E5F8F1] border-b border-[#D9EAEB] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0] text-white flex items-center justify-center shadow-xs shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#17383B]">
                  {account.accountName}
                </h3>
                <p className="text-xs text-[#688285]">
                  {account.accountType} {account.bankName ? `• ${account.bankName}` : ''} {account.branch ? `(${account.branch})` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/80 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Account KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#F1FAFA] border border-[#0B9FA5]/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                  {language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}
                </span>
                <span className="text-xl font-black text-[#0B9FA5] tracking-tight">
                  {formatCurrency(account.currentBalance, language)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#E5F8F1] border border-[#38C99A]/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                  {language === 'bn' ? 'মোট জমা (ইনফ্লো)' : 'Total Inflow'}
                </span>
                <span className="text-lg font-black text-[#229A73] tracking-tight">
                  {formatCurrency(totalInflows, language)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FDECEF] border border-[#EA7185]/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8EA3A5] block mb-1">
                  {language === 'bn' ? 'মোট খরচ (আউটফ্লো)' : 'Total Outflow'}
                </span>
                <span className="text-lg font-black text-[#C93B55] tracking-tight">
                  {formatCurrency(totalOutflows, language)}
                </span>
              </div>
            </div>

            {/* Account Details Specs */}
            <div className="p-4 rounded-xl bg-white border border-[#E6F0F1] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F1FAFA]">
                <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'হিসাব নম্বর:' : 'Account Number:'}</span>
                <span className="font-mono font-bold text-[#17383B]">{account.accountNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1FAFA]">
                <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'একাউন্টের অবস্থা:' : 'Status:'}</span>
                <span className={`font-bold flex items-center gap-1 ${account.status === 'active' ? 'text-[#229A73]' : 'text-[#8EA3A5]'}`}>
                  {account.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{account.status === 'active' ? 'Active' : 'Inactive'}</span>
                </span>
              </div>
              {account.bankName && (
                <div className="flex justify-between py-1">
                  <span className="text-[#8EA3A5] font-semibold">{language === 'bn' ? 'ব্যাংক ও শাখা:' : 'Bank & Branch:'}</span>
                  <span className="font-semibold text-[#17383B]">{account.bankName} ({account.branch || 'Main Branch'})</span>
                </div>
              )}
            </div>

            {/* Account Transactions List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-xs text-[#17383B] uppercase tracking-wider">
                  {t('recentTransactions')} ({accountTxs.length})
                </h4>
              </div>

              {accountTxs.length === 0 ? (
                <div className="p-6 text-center bg-[#F1FAFA] rounded-xl text-xs text-[#8EA3A5]">
                  {language === 'bn' ? 'এই একাউন্টে এখনও কোনো লেনদেন রেকর্ড নেই।' : 'No transaction history found for this account.'}
                </div>
              ) : (
                <div className="border border-[#E6F0F1] rounded-xl overflow-hidden divide-y divide-[#E6F0F1] max-h-60 overflow-y-auto">
                  {accountTxs.map((tx) => {
                    const isInflow = tx.type === 'credit' || (tx.type === 'transfer' && tx.toAccountId === account.id);
                    const isOutflow = tx.type === 'debit' || (tx.type === 'transfer' && tx.accountId === account.id);

                    return (
                      <div key={tx.id} className="p-3 hover:bg-[#F1FAFA]/60 transition-colors flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isInflow ? 'bg-[#E5F8F1] text-[#229A73]' : 'bg-[#FDECEF] text-[#C93B55]'}`}>
                            {isInflow ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-[#17383B] block">{tx.category}</span>
                            <span className="text-[11px] text-[#8EA3A5]">{tx.date} • {tx.description}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-xs ${isInflow ? 'text-[#229A73]' : 'text-[#C93B55]'}`}>
                            {isInflow ? '+' : '-'} {formatCurrency(tx.amount, language)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-[#F1FAFA] border-t border-[#D9EAEB] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setShowPrintStatement(true)}
              className="px-4 py-2 rounded-xl bg-white border border-[#D9EAEB] hover:bg-[#E6F0F1] text-xs font-bold text-[#17383B] flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#0B9FA5]" />
              <span>{t('printStatementBtn')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTransfer(account);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{t('transferFundsBtn')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {showPrintStatement && (
        <PrintAccountStatement
          account={account}
          transactions={transactions}
          onClose={() => setShowPrintStatement(false)}
        />
      )}
    </>
  );
};
