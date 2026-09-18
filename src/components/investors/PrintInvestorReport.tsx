import React, { useRef } from 'react';
import { Investor, Investment, InvestorWithdrawal, ProfitDistribution, Language } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Printer, X, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrintInvestorReportProps {
  isOpen: boolean;
  onClose: () => void;
  investors: Investor[];
  investments: Investment[];
  withdrawals: InvestorWithdrawal[];
  profitDistributions: ProfitDistribution[];
  language: Language;
  t: (key: string) => string;
}

export const PrintInvestorReport: React.FC<PrintInvestorReportProps> = ({
  isOpen,
  onClose,
  investors,
  investments,
  withdrawals,
  profitDistributions,
  language,
  t
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalInvestors = investors.length;
  const activeInvestors = investors.filter(i => i.status === 'active').length;
  const totalInvested = investors.reduce((s, i) => s + (i.totalInvested || 0), 0);
  const totalWithdrawn = investors.reduce((s, i) => s + (i.totalWithdrawn || 0), 0);
  const netPrincipalCapital = totalInvested - totalWithdrawn;
  const totalProfitDistributed = investors.reduce((s, i) => s + (i.totalProfitReceived || 0), 0);
  const totalPendingProfit = investors.reduce((s, i) => s + (i.pendingProfit || 0), 0);
  const grandTotalEquityPosition = netPrincipalCapital + totalPendingProfit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#D9EAEB] w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col print:shadow-none print:border-none print:max-w-none print:max-h-none print:m-0 print:rounded-none">
        
        {/* Action Controls - Hidden on Print */}
        <div className="p-4 bg-[#17383B] text-white flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#16B8B0]" />
            <h3 className="font-bold text-sm">
              {language === 'bn' ? 'মুদারাবা বিনিয়োগকারী ও মূলধন প্রতিবেদন প্রিন্ট' : 'Print Mudaraba Investor & Capital Report'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#229A73] hover:bg-[#1C8260] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div ref={reportRef} className="p-8 sm:p-10 space-y-6 text-[#17383B] bg-white print:p-6 print:space-y-4">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#17383B] pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#17383B] text-white flex items-center justify-center font-black text-2xl shadow-md">
                MD
              </div>
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
                {language === 'bn' ? 'মুদারাবা মূলধন ও অংশীদারিত্ব প্রতিবেদন' : 'MUDARABA CAPITAL & EQUITY REPORT'}
              </span>
              <p className="text-[11px] text-[#688285]">
                {language === 'bn' ? 'তারিখ:' : 'Report Date:'} {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
              </p>
            </div>
          </div>

          {/* Mudaraba Policy Note */}
          <div className="p-3 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0B9FA5] shrink-0" />
            <span className="text-[#486B6E]">
              <strong>{language === 'bn' ? 'মুদারাবা নীতি:' : 'Mudaraba Principle:'}</strong> {language === 'bn' 
                ? 'কারখানার নিজস্ব মূলধন এবং বিনিয়োগকারীদের মূলধন সমন্বয়ে অর্জিত নিট মুনাফায় চুক্তিভিত্তিক অনুপাতে লভ্যাংশ বণ্টিত হয়।' 
                : 'Profit is distributed in accordance with capital ownership share and contracted Mudaraba percentages.'}
            </span>
          </div>

          {/* Executive Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB]">
              <span className="text-[10px] text-[#688285] font-bold uppercase block">
                {t('totalInvestors')}
              </span>
              <span className="text-lg font-black text-[#17383B]">
                {formatNumber(totalInvestors, language)}
              </span>
              <span className="text-[10px] text-[#0B9FA5] block font-semibold mt-0.5">
                {formatNumber(activeInvestors, language)} Active Partners
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB]">
              <span className="text-[10px] text-[#688285] font-bold uppercase block">
                Total Injected Capital
              </span>
              <span className="text-lg font-black text-[#0B9FA5]">
                {formatCurrency(totalInvested, language)}
              </span>
              <span className="text-[10px] text-[#EA7185] block font-semibold mt-0.5">
                Withdrawn: {formatCurrency(totalWithdrawn, language)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB]">
              <span className="text-[10px] text-[#688285] font-bold uppercase block">
                Net Active Principal
              </span>
              <span className="text-lg font-black text-[#229A73]">
                {formatCurrency(netPrincipalCapital, language)}
              </span>
              <span className="text-[10px] text-[#688285] block font-semibold mt-0.5">
                Paid Profit: {formatCurrency(totalProfitDistributed, language)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#17383B] text-white">
              <span className="text-[10px] text-white/70 font-bold uppercase block">
                Net Position & Liability
              </span>
              <span className="text-lg font-black text-[#16B8B0]">
                {formatCurrency(grandTotalEquityPosition, language)}
              </span>
              <span className="text-[10px] text-[#F3B562] block font-semibold mt-0.5">
                Pending: {formatCurrency(totalPendingProfit, language)}
              </span>
            </div>
          </div>

          {/* Detailed Cap Table */}
          <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden">
            <div className="p-3.5 bg-[#F1FAFA] font-bold text-xs text-[#17383B] uppercase tracking-wider border-b border-[#D9EAEB]">
              Partner Equity, Mudaraba Contract & Position Breakdown (Cap Table)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#17383B] text-white font-bold">
                <tr>
                  <th className="p-2.5 pl-3">Investor Name & Phone</th>
                  <th className="p-2.5 text-center">Mudaraba %</th>
                  <th className="p-2.5 text-right">Total Invested</th>
                  <th className="p-2.5 text-right">Withdrawn</th>
                  <th className="p-2.5 text-right">Net Principal</th>
                  <th className="p-2.5 text-right">Profit Paid</th>
                  <th className="p-2.5 text-right">Pending Profit</th>
                  <th className="p-2.5 pr-3 text-right">Current Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1]">
                {investors.map(inv => {
                  const netPrinc = (inv.totalInvested || 0) - (inv.totalWithdrawn || 0);
                  const pos = inv.currentPosition || (netPrinc + (inv.pendingProfit || 0));
                  const mudarabaRate = inv.mudarabaProfitSharePercentage ?? (inv.sharePercentage ?? 30);
                  return (
                    <tr key={inv.id} className="hover:bg-[#F9FCFC]">
                      <td className="p-2.5 pl-3">
                        <div className="font-bold text-[#17383B]">{inv.name}</div>
                        <div className="text-[10px] text-[#688285]">{inv.phone}</div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-[#229A73]">
                        {mudarabaRate}%
                      </td>
                      <td className="p-2.5 text-right font-semibold text-[#0B9FA5]">
                        {formatCurrency(inv.totalInvested || 0, language)}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-[#EA7185]">
                        {formatCurrency(inv.totalWithdrawn || 0, language)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#17383B]">
                        {formatCurrency(netPrinc, language)}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-[#229A73]">
                        {formatCurrency(inv.totalProfitReceived || 0, language)}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-[#F3B562]">
                        {formatCurrency(inv.pendingProfit || 0, language)}
                      </td>
                      <td className="p-2.5 pr-3 text-right font-black text-[#17383B] bg-[#F1FAFA]/50">
                        {formatCurrency(pos, language)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#F1FAFA] font-bold border-t-2 border-[#17383B]">
                <tr>
                  <td colSpan={2} className="p-3 pl-3 uppercase tracking-wider text-[#17383B]">
                    Grand Totals
                  </td>
                  <td className="p-3 text-right font-black text-[#0B9FA5]">
                    {formatCurrency(totalInvested, language)}
                  </td>
                  <td className="p-3 text-right font-black text-[#EA7185]">
                    {formatCurrency(totalWithdrawn, language)}
                  </td>
                  <td className="p-3 text-right font-black text-[#17383B]">
                    {formatCurrency(netPrincipalCapital, language)}
                  </td>
                  <td className="p-3 text-right font-black text-[#229A73]">
                    {formatCurrency(totalProfitDistributed, language)}
                  </td>
                  <td className="p-3 text-right font-black text-[#F3B562]">
                    {formatCurrency(totalPendingProfit, language)}
                  </td>
                  <td className="p-3 pr-3 text-right font-black text-sm text-[#17383B] bg-[#E6F0F1]">
                    {formatCurrency(grandTotalEquityPosition, language)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Distribution History Summary */}
          {profitDistributions.length > 0 && (
            <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden">
              <div className="p-3 bg-[#F1FAFA] font-bold text-xs text-[#17383B] uppercase tracking-wider border-b border-[#D9EAEB]">
                Recent Profit Distribution History
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E6F0F1] text-[#688285] font-bold">
                  <tr>
                    <th className="p-2.5 pl-3">Period</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5 text-right">Net Profit</th>
                    <th className="p-2.5 text-right">Investor Payout</th>
                    <th className="p-2.5 text-right">Factory Retained</th>
                    <th className="p-2.5 pr-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6F0F1]">
                  {profitDistributions.slice(0, 5).map(d => (
                    <tr key={d.id}>
                      <td className="p-2.5 pl-3 font-bold text-[#17383B]">{d.period}</td>
                      <td className="p-2.5 text-[#688285]">{d.endDate || d.createdAt}</td>
                      <td className="p-2.5 font-semibold text-[#0B9FA5]">{d.distributionRule.replace('_', ' ')}</td>
                      <td className="p-2.5 text-right font-semibold text-[#17383B]">
                        {formatCurrency(d.totalCompanyNetProfit || d.totalDistributableProfit || 0, language)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#229A73]">
                        {formatCurrency(d.totalAllocated, language)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#D98A1B]">
                        {formatCurrency(d.totalFactoryRetainedProfit || Math.max(0, (d.totalCompanyNetProfit || 0) - d.totalAllocated), language)}
                      </td>
                      <td className="p-2.5 pr-3 text-center font-bold text-[#0B9FA5] uppercase text-[10px]">
                        {d.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs">
            <div className="border-t border-[#688285] pt-2">
              <span className="font-bold text-[#17383B] block">Accounts Officer</span>
              <span className="text-[10px] text-[#688285]">Prepared By</span>
            </div>
            <div className="border-t border-[#688285] pt-2">
              <span className="font-bold text-[#17383B] block">Managing Director</span>
              <span className="text-[10px] text-[#688285]">Approved By</span>
            </div>
            <div className="border-t border-[#688285] pt-2">
              <span className="font-bold text-[#17383B] block">Investor / Partner</span>
              <span className="text-[10px] text-[#688285]">Acknowledged</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-[#8EA3A5] pt-4">
            Mayer Doya Washing & Dyeing Factory ERP • Generated on {new Date().toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
          </div>
        </div>
      </div>
    </div>
  );
};
