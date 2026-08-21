import React from 'react';
import { Transaction, Account } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, FileText, Calendar, Tag, Landmark, SearchX } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, accounts }) => {
  const { language, t } = useERP();

  const getAccountName = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.accountName : accId;
  };

  const getTypeVisual = (type: Transaction['type']) => {
    switch (type) {
      case 'credit':
        return {
          icon: ArrowDownLeft,
          label: language === 'bn' ? 'জমা' : 'Inflow',
          badge: 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/20',
          amountClass: 'text-[#229A73]',
          prefix: '+'
        };
      case 'debit':
        return {
          icon: ArrowUpRight,
          label: language === 'bn' ? 'খরচ' : 'Outflow',
          badge: 'bg-[#FDECEF] text-[#C93B55] border-[#EA7185]/20',
          amountClass: 'text-[#C93B55]',
          prefix: '-'
        };
      case 'transfer':
      default:
        return {
          icon: ArrowRightLeft,
          label: language === 'bn' ? 'ট্রান্সফার' : 'Transfer',
          badge: 'bg-[#EEEBFF] text-[#8178F2] border-[#8178F2]/20',
          amountClass: 'text-[#8178F2]',
          prefix: '↔'
        };
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center bg-white/80 backdrop-blur-xs rounded-2xl border border-[#D9EAEB] shadow-2xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#F1FAFA] text-[#8EA3A5] flex items-center justify-center mx-auto">
          <SearchX className="w-6 h-6" />
        </div>
        <h4 className="font-extrabold text-sm text-[#17383B]">
          {t('noTransactionsYet')}
        </h4>
        <p className="text-xs text-[#688285] max-w-sm mx-auto">
          {language === 'bn' ? 'কোনো লেনদেন রেকর্ড মেলেনি। ফিল্টার রিসেট করুন অথবা নতুন লেনদেন সম্পন্ন করুন।' : 'No financial transaction records matched your filter criteria.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur-sm border border-[#D9EAEB] shadow-2xs overflow-hidden">
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/70 text-[#8EA3A5] font-extrabold uppercase tracking-wider">
              <th className="py-3.5 px-4">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'ধরন' : 'Type'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'বিবরণ' : 'Description'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'একাউন্ট' : 'Account'}</th>
              <th className="py-3.5 px-4">{language === 'bn' ? 'রেফারেন্স' : 'Reference'}</th>
              <th className="py-3.5 px-4 text-right">{language === 'bn' ? 'পরিমাণ (৳)' : 'Amount'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1FAFA]">
            {transactions.map((tx) => {
              const visual = getTypeVisual(tx.type);
              const IconComponent = visual.icon;
              const accountName = getAccountName(tx.accountId);
              const destAccountName = tx.toAccountId ? getAccountName(tx.toAccountId) : null;

              return (
                <tr key={tx.id} className="hover:bg-[#F1FAFA]/50 transition-colors group">
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#688285]">
                    {tx.date}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${visual.badge}`}>
                      <IconComponent className="w-3 h-3" />
                      <span>{visual.label}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#17383B]">
                    {tx.category}
                  </td>

                  <td className="py-3.5 px-4 text-[#17383B] max-w-xs truncate font-medium" title={tx.description}>
                    {tx.description}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-[#688285] font-semibold">
                    <div className="flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-[#0B9FA5] shrink-0" />
                      <span>{accountName}</span>
                      {destAccountName && (
                        <span className="text-[#8178F2]">➔ {destAccountName}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-[#8EA3A5]">
                    {tx.referenceId || '—'}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className={`font-black text-sm ${visual.amountClass}`}>
                      {visual.prefix} {formatCurrency(tx.amount, language)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden divide-y divide-[#E6F0F1]">
        {transactions.map((tx) => {
          const visual = getTypeVisual(tx.type);
          const IconComponent = visual.icon;
          const accountName = getAccountName(tx.accountId);
          const destAccountName = tx.toAccountId ? getAccountName(tx.toAccountId) : null;

          return (
            <div key={tx.id} className="p-4 space-y-2 hover:bg-[#F1FAFA]/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${visual.badge}`}>
                    <IconComponent className="w-3 h-3" />
                    <span>{visual.label}</span>
                  </span>
                  <span className="text-xs font-bold text-[#17383B]">{tx.category}</span>
                </div>
                <span className={`font-black text-sm ${visual.amountClass}`}>
                  {visual.prefix} {formatCurrency(tx.amount, language)}
                </span>
              </div>

              <p className="text-xs text-[#17383B] font-medium leading-snug">
                {tx.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-[#8EA3A5] pt-1">
                <div className="flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-[#0B9FA5]" />
                  <span className="font-semibold text-[#688285]">{accountName}</span>
                  {destAccountName && <span>➔ {destAccountName}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{tx.date}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
