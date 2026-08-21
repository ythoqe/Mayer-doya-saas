import React, { useState } from 'react';
import { Client } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { X, CreditCard, DollarSign, Landmark, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientPaymentModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({
  client,
  isOpen,
  onClose
}) => {
  const { clients, accounts, updateClient, language, t } = useERP();

  const [selectedClientId, setSelectedClientId] = useState(client?.id || clients[0]?.id || '');
  const [amount, setAmount] = useState<number>(client?.balance && client.balance > 0 ? client.balance : 25000);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState(`REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState('Payment received against delivery challan');
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync client when prop changes
  React.useEffect(() => {
    if (client) {
      setSelectedClientId(client.id);
      setAmount(client.balance > 0 ? client.balance : 25000);
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const currentClient = clients.find(c => c.id === selectedClientId) || client || clients[0];
  const selectedAccount = accounts.find(a => a.id === accountId) || accounts[0];

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient || amount <= 0) return;

    const numAmount = Number(amount);
    const newTotalPaid = (currentClient.totalPaid || 0) + numAmount;
    const newBalance = Math.max(0, (currentClient.totalBilled || 0) - newTotalPaid);

    updateClient(currentClient.id, {
      totalPaid: newTotalPaid,
      balance: newBalance
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="w-full max-w-lg bg-white rounded-3xl border border-[#D9EAEB] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-[#F1FAFA] border-b border-[#D9EAEB] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0B9FA5] text-white flex items-center justify-center shadow-md">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#17383B]">
                  {t('receivePaymentTitle')}
                </h3>
                <p className="text-xs text-[#688285]">
                  {t('receivePaymentDesc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white text-[#8EA3A5] hover:text-[#17383B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isSuccess ? (
            <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#E5F8F1] text-[#229A73] flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-base text-[#17383B]">{t('paymentRecordedSuccess')}</h4>
              <p className="text-xs text-[#688285]">
                {formatCurrency(Number(amount), language)} credited to {currentClient?.companyName}
              </p>
            </div>
          ) : (
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {/* Select Client */}
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('clientCompanyCol')}
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    const selected = clients.find(c => c.id === e.target.value);
                    if (selected && selected.balance > 0) {
                      setAmount(selected.balance);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} (Due: {formatCurrency(c.balance, language)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Balance Snapshot Banner */}
              {currentClient && (
                <div className="p-3 rounded-2xl bg-[#F9FBFC] border border-[#E6F0F1] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#8EA3A5] font-bold uppercase block">Current Due Balance</span>
                    <strong className="text-sm font-black text-[#C47D1C]">
                      {formatCurrency(currentClient.balance, language)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8EA3A5] font-bold uppercase block">Contact</span>
                    <span className="text-xs font-medium text-[#17383B]">{currentClient.name}</span>
                  </div>
                </div>
              )}

              {/* Amount & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('paymentAmount')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs font-bold text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2">৳</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs sm:text-sm font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('selectAccount')}
                  </label>
                  <div className="relative">
                    <Landmark className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs font-bold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none cursor-pointer"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName} ({acc.accountType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Date & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('paymentDate')}
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                    {t('paymentReference')}
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. MR-9942 or Cheque #4920"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                  {t('paymentNotes')}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-xs text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                  placeholder="Additional payment details or remarks..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6F0F1]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-extrabold shadow-md transition-all active:scale-95"
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
