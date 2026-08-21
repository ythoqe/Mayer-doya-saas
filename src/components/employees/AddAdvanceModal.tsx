import React, { useState } from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { AdvanceRecord } from './types';
import { formatCurrency } from '../../utils/translation';
import { X, DollarSign, Calendar, User, FileText, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSaveAdvance: (advance: Omit<AdvanceRecord, 'id' | 'status' | 'deductedAmount' | 'balance'>) => void;
}

export const AddAdvanceModal: React.FC<AddAdvanceModalProps> = ({
  isOpen,
  onClose,
  employees,
  onSaveAdvance
}) => {
  const { t, language } = useERP();

  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [amount, setAmount] = useState<number>(3000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedEmp = employees.find(e => e.id === employeeId) || employees[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      setError(language === 'bn' ? 'কর্মী নির্বাচন করুন' : 'Select an employee');
      return;
    }
    if (amount <= 0) {
      setError(language === 'bn' ? 'অগ্রিমের পরিমাণ সঠিক দিন' : 'Enter valid advance amount');
      return;
    }
    if (!purpose.trim()) {
      setError(language === 'bn' ? 'অগ্রিমের উদ্দেশ্য / কারণ লিখুন' : 'Enter reason for advance');
      return;
    }

    onSaveAdvance({
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      designation: selectedEmp.designation,
      department: selectedEmp.department,
      amount: Number(amount),
      date,
      purpose: purpose.trim(),
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-[#17383B]/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-[24px] shadow-[0_24px_60px_rgba(23,56,59,0.22)] border border-[#D9EAEB] overflow-hidden my-6"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E6F0F1] flex items-center justify-between bg-gradient-to-r from-[#F1FAFA] to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#17383B]">
                  {t('newAdvanceBtn')}
                </h3>
                <p className="text-xs text-[#688285]">
                  {language === 'bn' ? 'কর্মীদের জরুরি বা ফ্লোর অগ্রিম ঋণ অনুমোদন ও লগ করুন' : 'Issue staff advance loan to be deducted from monthly salary'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Employee Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0B9FA5]" />
                <span>{t('employeeCol')}</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation} • {emp.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  <span>{t('advanceAmountCol')} (৳)</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0B9FA5]" />
                  <span>{language === 'bn' ? 'ইস্যুর তারিখ' : 'Issue Date'}</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0B9FA5]" />
                <span>{t('purposeCol')}</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={language === 'bn' ? 'উদা: পারিবারিক চিকিৎসা বা বাসস্থান ভাড়া সংক্রান্ত' : 'e.g. Family emergency, house rent, festival advance'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
              />
            </div>

            {/* Notes / Terms */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17383B]">
                {language === 'bn' ? 'কর্তন শর্তাবলী / নোট' : 'Deduction Terms / Notes'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'bn' ? 'উদা: আগস্ট ও সেপ্টেম্বর মাসের বেতন হতে সমহারে কর্তন হবে।' : 'e.g. To be deducted in 2 equal monthly installments from payroll.'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#E6F0F1] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#688285] hover:text-[#17383B] hover:bg-black/5 rounded-xl transition-colors"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D98218] to-[#F3B562] hover:from-[#c27313] hover:to-[#D98218] text-white text-xs font-bold shadow-[0_4px_16px_rgba(217,130,24,0.28)] transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'bn' ? 'অগ্রিম মঞ্জুর করুন' : 'Issue Advance'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
