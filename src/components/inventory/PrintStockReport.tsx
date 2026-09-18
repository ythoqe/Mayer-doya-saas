import React from 'react';
import { useERP } from '../../context/ERPContext';
import { InventoryItem } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { getCategoryLabel } from '../../utils/chemicalCategories';
import { Printer, X } from 'lucide-react';

interface PrintStockReportProps {
  isOpen: boolean;
  onClose: () => void;
  singleItem?: InventoryItem | null;
}

export const PrintStockReport: React.FC<PrintStockReportProps> = ({
  isOpen,
  onClose,
  singleItem
}) => {
  const { inventory, language } = useERP();

  if (!isOpen) return null;

  const itemsToPrint = singleItem ? [singleItem] : inventory;
  const totalValuation = itemsToPrint.reduce((sum, i) => sum + (i.currentStockKg * i.unitPrice), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="p-4 bg-[#17383B] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#0B9FA5]" />
            <h3 className="font-bold text-sm">
              {singleItem ? 'Print Material Stock Card' : 'Print Factory Inventory Statement'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-1.5 px-4 rounded-xl bg-[#0B9FA5] hover:bg-[#088287] text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white text-[#17383B] font-sans flex-1" id="printable-stock-report">
          {/* Header with Mayer Doya Letterhead */}
          <div className="border-b-2 border-[#17383B] pb-5 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17383B]">
                MAYER DOYA
              </h1>
              <p className="text-xs font-bold text-[#0B9FA5] tracking-widest uppercase mt-0.5">
                Washing & Dyeing Factory Management
              </p>
              <p className="text-[11px] text-[#688285] mt-1 max-w-sm">
                Plot 42, BSCIC Industrial Area, Gazipur, Dhaka, Bangladesh<br />
                Phone: +880 1711-234567 • Email: store@mayerdoya.com
              </p>
            </div>

            <div className="sm:text-right">
              <div className="inline-block px-3 py-1 bg-[#17383B] text-white text-xs font-black rounded-lg uppercase tracking-wider">
                {singleItem ? 'MATERIAL BIN / STOCK CARD' : 'INVENTORY VALUATION & STOCK REPORT'}
              </div>
              <div className="text-xs font-medium text-[#688285] mt-2">
                Report Date: <strong className="text-[#17383B]">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </div>
              <div className="text-xs font-medium text-[#688285]">
                Shift: <strong className="text-[#17383B]">Day Shift (Chemical Store)</strong>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full text-left text-xs border-collapse border border-[#D9EAEB]">
              <thead>
                <tr className="bg-[#F1FAFA] text-[#17383B] font-bold border-b border-[#D9EAEB]">
                  <th className="py-2.5 px-3 border-r border-[#D9EAEB]">#</th>
                  <th className="py-2.5 px-3 border-r border-[#D9EAEB]">Chemical / Material</th>
                  <th className="py-2.5 px-3 border-r border-[#D9EAEB]">Category</th>
                  <th className="py-2.5 px-3 border-r border-[#D9EAEB]">Storage Zone</th>
                  <th className="py-2.5 px-3 border-r border-[#D9EAEB]">Supplier</th>
                  <th className="py-2.5 px-3 text-right border-r border-[#D9EAEB]">Current Stock</th>
                  <th className="py-2.5 px-3 text-right border-r border-[#D9EAEB]">Safety Min</th>
                  <th className="py-2.5 px-3 text-right border-r border-[#D9EAEB]">Rate (৳)</th>
                  <th className="py-2.5 px-3 text-right">Total Value (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1]">
                {itemsToPrint.map((item, index) => {
                  const isLow = item.currentStockKg <= item.minAlertLevel;
                  const itemValuation = item.currentStockKg * item.unitPrice;

                  return (
                    <tr key={item.id} className={isLow ? 'bg-[#FFFDF8]' : ''}>
                      <td className="py-2 px-3 border-r border-[#D9EAEB] font-mono text-[11px] text-[#688285]">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-[#D9EAEB]">
                        <span className="font-bold text-[#17383B] block">{item.name}</span>
                        {isLow && (
                          <span className="text-[9px] font-extrabold text-[#C47D1C]">
                            * REORDER REQUIRED
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 border-r border-[#D9EAEB] font-medium">
                        {getCategoryLabel(item.category, language)}
                      </td>
                      <td className="py-2 px-3 border-r border-[#D9EAEB] text-[#688285]">
                        {item.location || 'Chemical Store'}
                      </td>
                      <td className="py-2 px-3 border-r border-[#D9EAEB] text-[#688285]">
                        {item.supplierName || 'General Supply'}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-[#D9EAEB] font-black">
                        {formatNumber(item.currentStockKg, language)} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-[#D9EAEB] text-[#688285]">
                        {formatNumber(item.minAlertLevel, language)} {item.unit}
                      </td>
                      <td className="py-2 px-3 text-right border-r border-[#D9EAEB] font-semibold">
                        {formatCurrency(item.unitPrice, language)}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-[#0B9FA5]">
                        {formatCurrency(itemValuation, language)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F1FAFA] border-t-2 border-[#17383B] font-black text-xs">
                  <td colSpan={5} className="py-3 px-3 text-right border-r border-[#D9EAEB]">
                    GRAND TOTAL INVENTORY VALUATION:
                  </td>
                  <td className="py-3 px-3 text-right border-r border-[#D9EAEB]">
                    {itemsToPrint.length} Items
                  </td>
                  <td colSpan={2} className="border-r border-[#D9EAEB]"></td>
                  <td className="py-3 px-3 text-right text-sm text-[#0B9FA5]">
                    {formatCurrency(totalValuation, language)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Verification & Certification Note */}
          <p className="text-[11px] text-[#688285] italic mb-12">
            This inventory physical count report is generated from the Mayer Doya Factory Enterprise Resource Planning system. All safety threshold alerts and stock balances have been inspected against physical barrel and drum quantities.
          </p>

          {/* Three-Tier Authorization Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-[#D9EAEB] text-center text-xs">
            <div>
              <div className="border-b border-[#17383B] pb-8 mb-2 font-mono"></div>
              <div className="font-extrabold text-[#17383B]">Store Keeper / Incharge</div>
              <div className="text-[10px] text-[#8EA3A5]">Physical Count Verifier</div>
            </div>

            <div>
              <div className="border-b border-[#17383B] pb-8 mb-2 font-mono"></div>
              <div className="font-extrabold text-[#17383B]">Head Dyeing Master</div>
              <div className="text-[10px] text-[#8EA3A5]">Chemical & Recipe Auditor</div>
            </div>

            <div>
              <div className="border-b border-[#17383B] pb-8 mb-2 font-mono"></div>
              <div className="font-extrabold text-[#17383B]">Factory Operations Manager</div>
              <div className="text-[10px] text-[#8EA3A5]">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
