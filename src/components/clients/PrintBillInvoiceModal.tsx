import React from 'react';
import { X, Printer, Download, CheckCircle2, Factory } from 'lucide-react';
import { ClientBill, Client } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';

interface PrintBillInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: ClientBill;
  client?: Client;
}

export const PrintBillInvoiceModal: React.FC<PrintBillInvoiceModalProps> = ({
  isOpen,
  onClose,
  bill,
  client
}) => {
  const { language } = useERP();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div 
        id="print-bill-invoice-modal"
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Modal Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {language === 'bn' ? 'চালান ও ডেলিভারি বিল প্রিভিউ' : 'Delivery Bill & Invoice Preview'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'bn' ? 'প্রিন্ট করুন' : 'Print Invoice'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 bg-white text-slate-900 print:p-0 print:m-0" id="bill-invoice-print-area">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Factory className="w-7 h-7 text-teal-700" />
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    মেসার্স মায়ের দোয়া ওয়াশিং ও ডায়িং কারখানা
                  </h1>
                </div>
                <p className="text-sm font-semibold text-teal-800 mt-0.5">
                  M/S MAYER DOYA WASHING & DYEING PLANT
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  কোনাবাড়ী, জরুন রোড, কাশিমপুর, গাজীপুর • মোবাইল: ০১৭০০-০০০০০০, ০১৮০০-০০০০০০
                </p>
                <p className="text-xs text-slate-500">
                  বিশেষজ্ঞ: ওয়াশিং, ডায়িং, এসিড ওয়াশ, এনজাইম, সিলিকন ও ফিনিশিং
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded">
                  {language === 'bn' ? 'ডেলিভারি বিল ও চালান' : 'DELIVERY BILL & INVOICE'}
                </div>
                <div className="mt-2 text-xs font-bold text-slate-700">
                  বিল নং: <span className="font-mono text-sm text-teal-800">{bill.billNumber}</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  তারিখ: <span className="font-medium">{bill.deliveryDate}</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  অর্ডার/জব নং: <span className="font-mono font-bold">#{bill.orderNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Delivery Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                {language === 'bn' ? 'গ্রাহকের বিবরণ (Billed To):' : 'Billed To:'}
              </div>
              <div className="text-sm font-bold text-slate-900">{client?.companyName || bill.clientName}</div>
              <div className="text-slate-700 mt-0.5">স্বত্বাধিকারী / যোগাযোগ: {client?.name || bill.clientName}</div>
              {client?.phone && <div className="text-slate-600 mt-0.5">মোবাইল: {client.phone}</div>}
              {client?.address && <div className="text-slate-600 mt-0.5">ঠিকানা: {client.address}</div>}
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                {language === 'bn' ? 'ডেলিভারি ও চালান বিবরণ:' : 'Delivery Details:'}
              </div>
              <div><span className="text-slate-500">ডেলিভারি তারিখ:</span> <span className="font-bold">{bill.deliveryDate}</span></div>
              <div className="mt-0.5"><span className="text-slate-500">কাজের ধরন:</span> <span className="font-semibold">{bill.orderDescription}</span></div>
              <div className="mt-0.5">
                <span className="text-slate-500">বিল স্ট্যাটাস:</span>{' '}
                <span className={`inline-flex px-2 py-0.5 rounded font-bold text-[10px] ${
                  bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                  bill.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {bill.status}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left border-collapse mb-6 text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100">
                <th className="py-2.5 px-3 font-bold text-slate-800">ক্রমিক</th>
                <th className="py-2.5 px-3 font-bold text-slate-800">কাজের বিবরণ (Description)</th>
                <th className="py-2.5 px-3 font-bold text-slate-800 text-right">পরিমাণ (ফিনিশিং গজ)</th>
                <th className="py-2.5 px-3 font-bold text-slate-800 text-right">দর (৳/গজ)</th>
                <th className="py-2.5 px-3 font-bold text-slate-800 text-right">মোট টাকা (৳)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-3 px-3 text-slate-600">০১</td>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{bill.orderDescription}</div>
                  <div className="text-[11px] text-slate-500">অর্ডার ট্র্যাকিং কোড: #{bill.orderNumber}</div>
                  {bill.notes && <div className="text-[11px] text-slate-500 italic mt-0.5">নোট: {bill.notes}</div>}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                  {formatNumber(bill.quantity, language)} গজ
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-800">
                  ৳{formatNumber(bill.rate, language)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  ৳{formatNumber(bill.totalBill, language)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600 font-medium">মোট বিল (Total Bill):</span>
                <span className="font-bold font-mono text-slate-900">৳{formatNumber(bill.totalBill, language)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 text-emerald-700">
                <span className="font-medium">পরিশোধিত টাকা (Paid Amount):</span>
                <span className="font-bold font-mono">-৳{formatNumber(bill.paidAmount, language)}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-bold">
                <span className="text-red-700">অবশিষ্ট বকেয়া (Due Amount):</span>
                <span className="font-mono text-red-700">৳{formatNumber(bill.dueAmount, language)}</span>
              </div>
            </div>
          </div>

          {/* Signature Lines */}
          <div className="grid grid-cols-3 gap-8 pt-12 mt-12 border-t border-slate-300 text-center text-xs text-slate-600">
            <div>
              <div className="border-t border-dashed border-slate-400 pt-1.5 font-medium">
                গ্রহণকারীর স্বাক্ষর ও সিল
              </div>
            </div>
            <div>
              <div className="border-t border-dashed border-slate-400 pt-1.5 font-medium">
                ডেলিভারি ইনচার্জ
              </div>
            </div>
            <div>
              <div className="border-t border-dashed border-slate-400 pt-1.5 font-medium">
                কারখানা হিসাবরক্ষক / পরিচালক
              </div>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 text-center">
            * এটি মেসার্স মায়ের দোয়া ওয়াশিং কারখানার একটি কম্পিউটার জেনারেটেড ডেলিভারি চালান ও বিল। কোনো অসঙ্গতি থাকলে ৭ দিনের মধ্যে হিসাব বিভাগে যোগাযোগ করুন।
          </div>
        </div>
      </div>
    </div>
  );
};
