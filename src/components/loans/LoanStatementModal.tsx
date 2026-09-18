import React, { useRef } from 'react';
import { BankLoan, LoanInstallmentPayment } from '../../types';
import { useERP } from '../../context/ERPContext';
import { X, Printer, Building2, Calendar, CheckCircle2, DollarSign, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/translation';

interface LoanStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: BankLoan | null;
  onPayInstallment?: (loan: BankLoan) => void;
}

export const LoanStatementModal: React.FC<LoanStatementModalProps> = ({
  isOpen,
  onClose,
  loan,
  onPayInstallment
}) => {
  const { loanInstallments, deleteLoanInstallment, language, t } = useERP();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !loan) return null;

  const installments = loanInstallments
    .filter(i => i.loanId === loan.id)
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());

  const progressPercent = loan.sanctionAmount > 0 
    ? Math.min(100, Math.round(((loan.totalPrincipalPaid || 0) / loan.sanctionAmount) * 100))
    : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteInstallment = async (id: string) => {
    if (window.confirm(language === 'bn' ? 'আপনি কি এই কিস্তির রেকর্ডটি মুছে ফেলতে চান?' : 'Delete this installment record?')) {
      await deleteLoanInstallment(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-[#D9EAEB] overflow-hidden my-6 print:shadow-none print:border-none print:m-0 print:max-w-none">
        {/* Modal Toolbar (hidden during print) */}
        <div className="p-4 bg-[#17383B] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#16B8B0]" />
            <div>
              <h3 className="text-sm font-black tracking-tight">
                {language === 'bn' ? 'ঋণ বিবরণী ও কিস্তি রেজিস্টার' : 'Loan Statement & Amortization'}
              </h3>
              <p className="text-[11px] text-white/70">
                {loan.bankName} - {loan.loanTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onPayInstallment && loan.status !== 'closed' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPayInstallment(loan);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0B9FA5] hover:bg-[#088287] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'কিস্তি জমা দিন' : 'Pay EMI'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Statement Content */}
        <div ref={printRef} className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-100px)] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Header Brand */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#17383B] pb-4 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#17383B] tracking-tight">
                MAYER DOYA WASHING PLANT
              </h1>
              <p className="text-xs font-semibold text-[#0B9FA5]">
                {language === 'bn' ? 'ব্যাংক ঋণ ও দায়বদ্ধতা বিবরণী' : 'Corporate Bank Loan & Facility Statement'}
              </p>
              <p className="text-[11px] text-[#688285]">
                Plot #42, Industrial Zone, Gazipur, Bangladesh
              </p>
            </div>
            <div className="sm:text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                loan.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : loan.status === 'closed'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {loan.status}
              </span>
              <p className="text-[11px] text-[#688285] mt-1 font-mono">
                Printed: {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
              </p>
            </div>
          </div>

          {/* Loan Overview Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F8FCFC] border border-[#D9EAEB]">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#688285]">{language === 'bn' ? 'ব্যাংক ও শাখা' : 'Bank & Branch'}</p>
              <p className="text-xs font-bold text-[#17383B] mt-0.5">{loan.bankName}</p>
              <p className="text-[11px] text-[#8EA3A5]">{loan.branchName || 'Head Office'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#688285]">{language === 'bn' ? 'অ্যাকাউন্ট নং' : 'Account No'}</p>
              <p className="text-xs font-mono font-bold text-[#17383B] mt-0.5">{loan.accountNumber || '—'}</p>
              <p className="text-[11px] text-[#0B9FA5] font-semibold">{loan.loanType.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#688285]">{language === 'bn' ? 'সুদের হার ও মেয়াদ' : 'Rate & Tenure'}</p>
              <p className="text-xs font-bold text-[#17383B] mt-0.5">{loan.interestRateAnnual}% p.a.</p>
              <p className="text-[11px] text-[#688285]">{loan.tenureMonths} Months</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#688285]">{language === 'bn' ? 'মাসিক কিস্তি (EMI)' : 'Monthly EMI'}</p>
              <p className="text-xs font-black text-[#0B9FA5] mt-0.5">{formatCurrency(loan.monthlyInstallment, language)}</p>
              <p className="text-[10px] text-[#8EA3A5]">Next: {loan.nextDueDate || '—'}</p>
            </div>
          </div>

          {/* 3 Major Financial Metric Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-[#D9EAEB] bg-white">
              <p className="text-[11px] font-bold text-[#688285]">{language === 'bn' ? 'অনুমোদিত ঋণ' : 'Sanction Amount'}</p>
              <h4 className="text-lg font-black text-[#17383B] mt-0.5">{formatCurrency(loan.sanctionAmount, language)}</h4>
              <p className="text-[10px] text-[#8EA3A5]">Disbursed: {loan.disbursementDate}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <p className="text-[11px] font-bold text-emerald-800">{language === 'bn' ? 'পরিশোধিত আসল' : 'Principal Repaid'}</p>
              <h4 className="text-lg font-black text-emerald-700 mt-0.5">{formatCurrency(loan.totalPrincipalPaid || 0, language)}</h4>
              <p className="text-[10px] text-emerald-600 font-semibold">Interest Paid: {formatCurrency(loan.totalInterestPaid || 0, language)}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
              <p className="text-[11px] font-bold text-rose-800">{language === 'bn' ? 'বর্তমান অবশিষ্ট বকেয়া' : 'Current Outstanding'}</p>
              <h4 className="text-lg font-black text-rose-600 mt-0.5">{formatCurrency(loan.currentOutstanding, language)}</h4>
              <p className="text-[10px] text-rose-500 font-semibold">{100 - progressPercent}% Remaining</p>
            </div>
          </div>

          {/* Repayment Progress Visual */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-[#17383B]">
              <span>{language === 'bn' ? 'ঋণ পরিশোধ অগ্রগতি' : 'Repayment Progress'}</span>
              <span className="text-[#0B9FA5]">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#E5F1F2] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0B9FA5] to-[#22C55E] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Installment History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-[#17383B]">
                {language === 'bn' ? 'পরিশোধিত কিস্তির তালিকা' : 'Installment Payment History'} ({installments.length})
              </h4>
            </div>

            {installments.length === 0 ? (
              <div className="p-8 text-center bg-[#F8FCFC] rounded-xl border border-dashed border-[#D9EAEB]">
                <Clock className="w-8 h-8 text-[#8EA3A5] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-[#688285]">
                  {language === 'bn' ? 'এখনও কোনো কিস্তি পরিশোধের রেকর্ড নেই।' : 'No installment payment recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#D9EAEB]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F1FAFA] text-[#688285] font-bold border-b border-[#D9EAEB]">
                    <tr>
                      <th className="p-2.5 sm:p-3">#</th>
                      <th className="p-2.5 sm:p-3">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th className="p-2.5 sm:p-3">{language === 'bn' ? 'মোট কিস্তি' : 'Total Paid'}</th>
                      <th className="p-2.5 sm:p-3">{language === 'bn' ? 'আসল' : 'Principal'}</th>
                      <th className="p-2.5 sm:p-3">{language === 'bn' ? 'সুদ' : 'Interest'}</th>
                      <th className="p-2.5 sm:p-3">{language === 'bn' ? 'অ্যাকাউন্ট / মাধ্যম' : 'Method'}</th>
                      <th className="p-2.5 sm:p-3">{language === 'bn' ? 'রেফারেন্স' : 'Ref'}</th>
                      <th className="p-2.5 sm:p-3 print:hidden text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9EAEB] text-[#17383B]">
                    {installments.map((inst, idx) => (
                      <tr key={inst.id} className="hover:bg-[#F8FCFC]">
                        <td className="p-2.5 sm:p-3 font-bold text-[#688285]">{inst.installmentNumber || idx + 1}</td>
                        <td className="p-2.5 sm:p-3 font-semibold whitespace-nowrap">{inst.paymentDate}</td>
                        <td className="p-2.5 sm:p-3 font-black text-[#0B9FA5] whitespace-nowrap">
                          {formatCurrency(inst.totalAmount, language)}
                        </td>
                        <td className="p-2.5 sm:p-3 font-semibold text-emerald-700 whitespace-nowrap">
                          {formatCurrency(inst.principalAmount || 0, language)}
                        </td>
                        <td className="p-2.5 sm:p-3 font-semibold text-rose-700 whitespace-nowrap">
                          {formatCurrency(inst.interestAmount || 0, language)}
                        </td>
                        <td className="p-2.5 sm:p-3 text-[11px] text-[#688285]">
                          {inst.paymentMethod} ({inst.fromAccountName})
                        </td>
                        <td className="p-2.5 sm:p-3 font-mono text-[11px] text-[#688285]">
                          {inst.reference || inst.chequeNumber || '—'}
                        </td>
                        <td className="p-2.5 sm:p-3 print:hidden text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteInstallment(inst.id)}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security & Guarantor Notes */}
          {(loan.collateralDetails || loan.guarantorName || loan.notes) && (
            <div className="p-4 rounded-xl bg-[#F8FCFC] border border-[#D9EAEB] text-xs space-y-1.5">
              <h5 className="font-black text-[#17383B] uppercase tracking-wider text-[10px]">
                {language === 'bn' ? 'জামানত ও গ্যারান্টি বিবরণ' : 'Security & Guarantor Notes'}
              </h5>
              {loan.collateralDetails && (
                <p className="text-[#688285]"><span className="font-bold text-[#17383B]">{language === 'bn' ? 'জামানত' : 'Collateral'}:</span> {loan.collateralDetails}</p>
              )}
              {loan.guarantorName && (
                <p className="text-[#688285]"><span className="font-bold text-[#17383B]">{language === 'bn' ? 'জামিনদার' : 'Guarantor'}:</span> {loan.guarantorName}</p>
              )}
              {loan.notes && (
                <p className="text-[#688285]"><span className="font-bold text-[#17383B]">{language === 'bn' ? 'নোট' : 'Notes'}:</span> {loan.notes}</p>
              )}
            </div>
          )}

          {/* Printable Signature Footers */}
          <div className="hidden print:grid grid-cols-3 gap-8 pt-16 text-center text-xs">
            <div className="border-t border-black pt-2">
              <p className="font-bold">Prepared By</p>
              <p className="text-[10px] text-gray-600">Accounts Officer</p>
            </div>
            <div className="border-t border-black pt-2">
              <p className="font-bold">Verified By</p>
              <p className="text-[10px] text-gray-600">Head of Finance</p>
            </div>
            <div className="border-t border-black pt-2">
              <p className="font-bold">Approved By</p>
              <p className="text-[10px] text-gray-600">Managing Director</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
