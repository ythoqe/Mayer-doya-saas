import React, { useRef } from 'react';
import { Investor, Investment, InvestorWithdrawal, ProfitDistribution, Language } from '../../types';
import { formatCurrency } from '../../utils/translation';
import { Printer, X } from 'lucide-react';
import { MayerLogo } from '../ui/MayerLogo';

interface PrintInvestorStatementProps {
  isOpen: boolean;
  onClose: () => void;
  investor: Investor;
  investments: Investment[];
  withdrawals: InvestorWithdrawal[];
  profitDistributions: ProfitDistribution[];
  language: Language;
  t: (key: string) => string;
}

interface StatementItem {
  id: string;
  date: string;
  type: 'investment' | 'withdrawal' | 'profit_allocation' | 'profit_payout';
  description: string;
  reference?: string;
  capitalCredit: number; // Investment (+)
  capitalDebit: number;  // Withdrawal (-)
  profitEarned: number;  // Profit Allocation (+)
  profitPaid: number;    // Profit Payout (-)
  runningCapitalBalance: number;
  runningProfitBalance: number;
}

export const PrintInvestorStatement: React.FC<PrintInvestorStatementProps> = ({
  isOpen,
  onClose,
  investor,
  investments,
  withdrawals,
  profitDistributions,
  language,
  t
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !investor) return null;

  // Build unified chronological statement
  const investorInvestments = investments.filter(i => i.investorId === investor.id);
  const investorWithdrawals = withdrawals.filter(w => w.investorId === investor.id);

  const rawEvents: Array<{
    date: string;
    createdAt?: string;
    type: 'investment' | 'withdrawal' | 'profit_allocation' | 'profit_payout';
    amount: number;
    description: string;
    reference?: string;
  }> = [];

  investorInvestments.forEach(inv => {
    rawEvents.push({
      date: inv.date,
      createdAt: inv.createdAt,
      type: 'investment',
      amount: inv.amount,
      description: `Capital Investment (${inv.investmentType.replace('_', ' ')}) - ${inv.accountName || 'Cash'}`,
      reference: inv.reference
    });
  });

  investorWithdrawals.forEach(wd => {
    rawEvents.push({
      date: wd.date,
      createdAt: wd.createdAt,
      type: 'withdrawal',
      amount: wd.amount,
      description: `Capital Withdrawal (${wd.reason.replace('_', ' ')}) - ${wd.accountName || 'Cash'}`,
      reference: wd.reference
    });
  });

  profitDistributions.forEach(dist => {
    const alloc = dist.allocations.find(a => a.investorId === investor.id);
    if (alloc) {
      rawEvents.push({
        date: dist.endDate || dist.createdAt || new Date().toISOString().split('T')[0],
        type: 'profit_allocation',
        amount: alloc.allocatedProfit,
        description: `Profit Allocation: ${dist.period} (${alloc.sharePercentage}%)`,
        reference: dist.period
      });

      if (alloc.status === 'paid') {
        rawEvents.push({
          date: alloc.paidAt || dist.endDate || dist.createdAt || new Date().toISOString().split('T')[0],
          type: 'profit_payout',
          amount: alloc.allocatedProfit,
          description: `Profit Disbursed - ${alloc.accountName || 'Account'} (${dist.period})`,
          reference: alloc.paymentReference
        });
      }
    }
  });

  // Sort ascending by date
  rawEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute running balances
  let runningCap = 0;
  let runningProf = 0;
  const statementRows: StatementItem[] = rawEvents.map((evt, idx) => {
    let capCredit = 0;
    let capDebit = 0;
    let profEarned = 0;
    let profPaid = 0;

    if (evt.type === 'investment') {
      capCredit = evt.amount;
      runningCap += evt.amount;
    } else if (evt.type === 'withdrawal') {
      capDebit = evt.amount;
      runningCap -= evt.amount;
    } else if (evt.type === 'profit_allocation') {
      profEarned = evt.amount;
      runningProf += evt.amount;
    } else if (evt.type === 'profit_payout') {
      profPaid = evt.amount;
      runningProf -= evt.amount;
    }

    return {
      id: `row-${idx}`,
      date: evt.date,
      type: evt.type,
      description: evt.description,
      reference: evt.reference,
      capitalCredit: capCredit,
      capitalDebit: capDebit,
      profitEarned: profEarned,
      profitPaid: profPaid,
      runningCapitalBalance: runningCap,
      runningProfitBalance: runningProf
    };
  });

  const totalInvested = investorInvestments.reduce((s, i) => s + i.amount, 0);
  const totalWithdrawn = investorWithdrawals.reduce((s, w) => s + w.amount, 0);
  const netActivePrincipal = totalInvested - totalWithdrawn;
  const totalProfitEarned = statementRows.reduce((s, r) => s + r.profitEarned, 0);
  const totalProfitPaid = statementRows.reduce((s, r) => s + r.profitPaid, 0);
  const totalPendingProfit = totalProfitEarned - totalProfitPaid;
  const currentTotalEquityLiability = netActivePrincipal + totalPendingProfit;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:h-auto">
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-[#17383B] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#16B8B0]" />
            <span className="font-bold text-sm">
              {language === 'bn' ? 'বিনিয়োগকারী লেজার ও হিসাব বিবরণী' : 'Investor Statement & Ledger'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#0B9FA5] hover:bg-[#09878C] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div ref={printRef} className="flex-1 p-8 sm:p-10 overflow-y-auto font-sans text-[#17383B] print:p-8">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#17383B] pb-6 mb-6">
            <div className="flex items-center gap-4">
              <MayerLogo size={48} />
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#17383B]">
                  {t('appName')}
                </h1>
                <p className="text-xs font-bold text-[#0B9FA5] tracking-widest uppercase">
                  {t('appSubtitle')}
                </p>
                <p className="text-[11px] text-[#688285] mt-1">
                  Kamarpara, Tongi, Gazipur, Bangladesh • Phone: +880 1711-000000
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#17383B] text-white text-xs font-extrabold rounded-lg tracking-wider uppercase mb-1">
                {language === 'bn' ? 'বিনিয়োগ বিবরণী' : 'INVESTOR STATEMENT'}
              </span>
              <p className="text-[11px] text-[#688285]">
                {language === 'bn' ? 'প্রস্তুতের তারিখ:' : 'Statement Date:'} {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
              </p>
            </div>
          </div>

          {/* Investor & Equity Profile Card */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB] mb-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#0B9FA5] block">
                {t('investorDetails')}
              </span>
              <h2 className="text-base font-extrabold text-[#17383B] mt-0.5">
                {investor.name}
              </h2>
              <div className="text-xs text-[#688285] space-y-0.5 mt-1">
                <p><strong>{t('investorPhone')}:</strong> {investor.phone}</p>
                {investor.email && <p><strong>{t('investorEmail')}:</strong> {investor.email}</p>}
                {investor.nidOrPassport && <p><strong>{t('nidOrPassport')}:</strong> {investor.nidOrPassport}</p>}
                {investor.address && <p><strong>{t('investorAddress')}:</strong> {investor.address}</p>}
              </div>
            </div>

            <div className="text-right flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#688285] block">
                  {t('sharePercentage')}
                </span>
                <span className="text-xl font-black text-[#0B9FA5]">
                  {investor.sharePercentage ? `${investor.sharePercentage}%` : 'N/A'}
                </span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between border-t border-[#D9EAEB] pt-1">
                  <span className="text-[#688285]">{t('totalInvestment')}:</span>
                  <span className="font-bold text-[#0B9FA5]">{formatCurrency(totalInvested, language)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#688285]">{t('totalWithdrawals')}:</span>
                  <span className="font-bold text-[#EA7185]">{formatCurrency(totalWithdrawn, language)}</span>
                </div>
                <div className="flex justify-between border-t border-[#D9EAEB] pt-1">
                  <span className="font-bold text-[#17383B]">{t('currentPosition')}:</span>
                  <span className="font-black text-sm text-[#17383B]">{formatCurrency(currentTotalEquityLiability, language)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statement Table */}
          <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#17383B] text-white font-bold">
                <tr>
                  <th className="p-2.5 pl-3">Date</th>
                  <th className="p-2.5">Description & Ref</th>
                  <th className="p-2.5 text-right">Capital In (+)</th>
                  <th className="p-2.5 text-right">Capital Out (-)</th>
                  <th className="p-2.5 text-right">Profit Earned (+)</th>
                  <th className="p-2.5 text-right">Profit Paid (-)</th>
                  <th className="p-2.5 pr-3 text-right">Net Capital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1]">
                {statementRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#8EA3A5] italic">
                      No transaction history found for this investor.
                    </td>
                  </tr>
                ) : (
                  statementRows.map(row => (
                    <tr key={row.id} className="hover:bg-[#F9FCFC]">
                      <td className="p-2.5 pl-3 whitespace-nowrap font-medium text-[#688285]">
                        {row.date}
                      </td>
                      <td className="p-2.5 font-semibold text-[#17383B]">
                        {row.description}
                        {row.reference && (
                          <span className="text-[10px] text-[#8EA3A5] block">Ref: {row.reference}</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#0B9FA5]">
                        {row.capitalCredit > 0 ? formatCurrency(row.capitalCredit, language) : '—'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#EA7185]">
                        {row.capitalDebit > 0 ? formatCurrency(row.capitalDebit, language) : '—'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#229A73]">
                        {row.profitEarned > 0 ? formatCurrency(row.profitEarned, language) : '—'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#688285]">
                        {row.profitPaid > 0 ? formatCurrency(row.profitPaid, language) : '—'}
                      </td>
                      <td className="p-2.5 pr-3 text-right font-black text-[#17383B] bg-[#F1FAFA]/50">
                        {formatCurrency(row.runningCapitalBalance, language)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-[#F1FAFA] font-bold border-t-2 border-[#17383B]">
                <tr>
                  <td colSpan={2} className="p-3 pl-3 uppercase tracking-wider text-[#17383B]">
                    Totals
                  </td>
                  <td className="p-3 text-right font-black text-[#0B9FA5]">
                    {formatCurrency(totalInvested, language)}
                  </td>
                  <td className="p-3 text-right font-black text-[#EA7185]">
                    {formatCurrency(totalWithdrawn, language)}
                  </td>
                  <td className="p-3 text-right font-black text-[#229A73]">
                    {formatCurrency(totalProfitEarned, language)}
                  </td>
                  <td className="p-3 text-right font-black text-[#688285]">
                    {formatCurrency(totalProfitPaid, language)}
                  </td>
                  <td className="p-3 pr-3 text-right font-black text-sm text-[#17383B] bg-[#E6F0F1]">
                    {formatCurrency(netActivePrincipal, language)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Equity Summary Boxes */}
          <div className="grid grid-cols-3 gap-4 mb-10 text-center">
            <div className="p-3 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB]">
              <span className="text-[10px] text-[#688285] font-bold uppercase block">
                Net Active Principal
              </span>
              <span className="text-base font-black text-[#0B9FA5]">
                {formatCurrency(netActivePrincipal, language)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#FFE3B8]">
              <span className="text-[10px] text-[#688285] font-bold uppercase block">
                Pending Profit
              </span>
              <span className="text-base font-black text-[#F3B562]">
                {formatCurrency(totalPendingProfit, language)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#17383B] text-white">
              <span className="text-[10px] text-white/70 font-bold uppercase block">
                Total Factory Liability / Balance
              </span>
              <span className="text-base font-black text-[#16B8B0]">
                {formatCurrency(currentTotalEquityLiability, language)}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between pt-12 text-xs font-bold text-[#17383B] border-t border-[#D9EAEB]">
            <div className="text-center w-48">
              <div className="border-t border-[#688285] pt-1">
                Investor's Signature
              </div>
            </div>
            <div className="text-center w-48">
              <div className="border-t border-[#688285] pt-1">
                Accountant / Managing Partner
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
