import React from 'react';
import { Order, Client, Language } from '../../types';
import { MayerLogo } from '../ui/MayerLogo';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { Printer, X, CheckSquare, Calendar, Building, Package, ShieldCheck } from 'lucide-react';

interface PrintJobCardProps {
  order: Order;
  client?: Client;
  language?: Language;
  onClose: () => void;
}

export const PrintJobCard: React.FC<PrintJobCardProps> = ({
  order,
  client,
  language = 'en',
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none text-[#17383B]">
        {/* Screen Controls Header - Hidden during print */}
        <div className="px-6 py-4 bg-[#F1FAFA] border-b border-[#D9EAEB] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#0B9FA5]" />
            <h3 className="font-bold text-sm text-[#17383B]">
              Print Factory Job Card & Challan ({order.orderNumber})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white text-[#8EA3A5] hover:text-[#17383B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Job Card Body */}
        <div className="p-8 sm:p-10 space-y-6 print:p-6 print:space-y-4 text-xs">
          {/* Official Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-[#17383B] pb-5">
            <div className="flex items-center gap-3.5">
              <MayerLogo size={48} />
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#17383B]">
                  MAYER DOYA WASHING & DYEING LTD.
                </h1>
                <p className="text-xs text-[#688285] font-semibold">
                  Industrial Garment Washing, Dyeing & Specialized Finishing Plant
                </p>
                <p className="text-[11px] text-[#8EA3A5]">
                  Plot 14-16, BSCIC Industrial Estate, Konabari, Gazipur, Bangladesh • Phone: +880 1711-000000
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-[#17383B] text-white font-mono font-bold text-xs uppercase tracking-wider rounded">
                JOB CARD & ROUTE SLIP
              </div>
              <p className="text-xs font-bold text-[#17383B] mt-1">
                JOB #: <span className="font-mono text-sm">{order.orderNumber}</span>
              </p>
              <p className="text-[11px] text-[#688285]">
                Date: {order.receivedDate || order.createdAt}
              </p>
            </div>
          </div>

          {/* Job Overview Grid (Client & Order Metadata) */}
          <div className="grid grid-cols-2 gap-4 border border-[#D9EAEB] rounded-xl p-4 bg-[#F9FBFC] print:bg-transparent">
            {/* Left: Client Info */}
            <div className="space-y-1.5 border-r border-[#D9EAEB] pr-4">
              <span className="text-[10px] font-bold uppercase text-[#8EA3A5] tracking-wider block">
                Client / Mill Details
              </span>
              <p className="text-sm font-extrabold text-[#17383B]">
                {order.clientName}
              </p>
              {client ? (
                <>
                  <p className="text-xs text-[#688285]">Attn: {client.name}</p>
                  <p className="text-xs text-[#688285]">Phone: {client.phone}</p>
                  <p className="text-xs text-[#8EA3A5] line-clamp-1">{client.address}</p>
                </>
              ) : (
                <p className="text-xs text-[#8EA3A5]">Direct Floor Order</p>
              )}
            </div>

            {/* Right: Job Specification */}
            <div className="space-y-1.5 pl-2">
              <div className="flex justify-between">
                <span className="text-[#688285]">Style No:</span>
                <strong className="font-mono text-[#17383B]">{order.styleNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#688285]">Garment Item:</span>
                <strong className="text-[#17383B]">{order.garmentType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#688285]">Lot Quantity:</span>
                <strong className="text-[#0B9FA5] text-sm">{formatNumber(order.quantityPcs, (language as Language) || 'en')} PCS</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#688285]">Delivery Deadline:</span>
                <strong className="text-[#C83F57]">{order.deliveryDate}</strong>
              </div>
            </div>
          </div>

          {/* Wash & Processing Specifications */}
          <div className="border border-[#D9EAEB] rounded-xl overflow-hidden">
            <div className="bg-[#17383B] text-white px-4 py-2 font-bold text-xs flex justify-between items-center">
              <span>WASH & DYEING FORMULATION SPECIFICATION</span>
              <span className="font-mono text-[11px]">PRIORITY: {order.priority.toUpperCase()}</span>
            </div>

            <div className="p-4 grid grid-cols-3 gap-4 bg-white">
              <div>
                <span className="text-[10px] uppercase text-[#8EA3A5] block">Wash Category / Recipe</span>
                <strong className="text-xs text-[#17383B] block mt-0.5">{order.washType}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8EA3A5] block">Color Standard / Shade</span>
                <strong className="text-xs text-[#17383B] block mt-0.5">{order.colorShade}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8EA3A5] block">Assigned Batch & Vessel</span>
                <strong className="text-xs font-mono text-[#0B9FA5] block mt-0.5">
                  {order.batchNumber || 'BATCH-W01'} / {order.machineNo || 'WASH-M01'}
                </strong>
              </div>
            </div>

            {order.remarks && (
              <div className="px-4 py-2.5 bg-[#F1FAFA] border-t border-[#D9EAEB] text-xs">
                <span className="font-bold text-[#17383B]">Special Recipe Instructions: </span>
                <span className="text-[#688285]">{order.remarks}</span>
              </div>
            )}
          </div>

          {/* Floor Process Sign-off Checklist Table */}
          <div className="border border-[#D9EAEB] rounded-xl overflow-hidden">
            <div className="bg-[#F1FAFA] px-4 py-2 font-bold text-xs text-[#17383B] border-b border-[#D9EAEB]">
              PRODUCTION ROUTE & STAGE SIGN-OFF
            </div>
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#D9EAEB] bg-slate-50 text-[#8EA3A5]">
                  <th className="py-2 px-3">Stage</th>
                  <th className="py-2 px-3">Process Name</th>
                  <th className="py-2 px-3">Machine / Vessel</th>
                  <th className="py-2 px-3">Pcs In / Out</th>
                  <th className="py-2 px-3">Operator / Master Sign</th>
                  <th className="py-2 px-3">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1]">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-[#17383B]">01</td>
                  <td className="py-2.5 px-3 font-semibold">Lot Receiving & Count Inspection</td>
                  <td className="py-2.5 px-3 font-mono">Receiving Deck</td>
                  <td className="py-2.5 px-3">{order.quantityPcs} pcs</td>
                  <td className="py-2.5 px-3 border-b border-dotted border-slate-400"></td>
                  <td className="py-2.5 px-3">___/___ 08:00</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-[#17383B]">02</td>
                  <td className="py-2.5 px-3 font-semibold">Batch Weighing & Chemical Dosing</td>
                  <td className="py-2.5 px-3 font-mono">Chem Lab</td>
                  <td className="py-2.5 px-3">---</td>
                  <td className="py-2.5 px-3 border-b border-dotted border-slate-400"></td>
                  <td className="py-2.5 px-3">___/___ 09:30</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-[#17383B]">03</td>
                  <td className="py-2.5 px-3 font-semibold">Industrial Washing / Desize / Stone</td>
                  <td className="py-2.5 px-3 font-mono">{order.machineNo || 'WASH-M01'}</td>
                  <td className="py-2.5 px-3">{order.quantityPcs} pcs</td>
                  <td className="py-2.5 px-3 border-b border-dotted border-slate-400"></td>
                  <td className="py-2.5 px-3">___/___ 11:45</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-[#17383B]">04</td>
                  <td className="py-2.5 px-3 font-semibold">High-Temp Dyeing / Tinting</td>
                  <td className="py-2.5 px-3 font-mono">DYE-M01</td>
                  <td className="py-2.5 px-3">{order.quantityPcs} pcs</td>
                  <td className="py-2.5 px-3 border-b border-dotted border-slate-400"></td>
                  <td className="py-2.5 px-3">___/___ 14:00</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-[#17383B]">05</td>
                  <td className="py-2.5 px-3 font-semibold">Hydro Extraction & Dewatering</td>
                  <td className="py-2.5 px-3 font-mono">HYDRO-01</td>
                  <td className="py-2.5 px-3">{order.quantityPcs} pcs</td>
                  <td className="py-2.5 px-3 border-b border-dotted border-slate-400"></td>
                  <td className="py-2.5 px-3">___/___ 15:30</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-[#17383B]">06</td>
                  <td className="py-2.5 px-3 font-semibold">Steam Drying & Softener Curing</td>
                  <td className="py-2.5 px-3 font-mono">FINISH-02</td>
                  <td className="py-2.5 px-3">{order.quantityPcs} pcs</td>
                  <td className="py-2.5 px-3 border-b border-dotted border-slate-400"></td>
                  <td className="py-2.5 px-3">___/___ 17:00</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-[#17383B]">07</td>
                  <td className="py-2.5 px-3 font-semibold text-[#229A73]">QC & Shade Matching Inspection</td>
                  <td className="py-2.5 px-3 font-mono">Light Box D65</td>
                  <td className="py-2.5 px-3">Pass: ____ Rej: ____</td>
                  <td className="py-2.5 px-3 border-b border-dotted border-slate-400"></td>
                  <td className="py-2.5 px-3">___/___ 18:30</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial & Delivery Summary */}
          <div className="grid grid-cols-2 gap-4 border border-[#D9EAEB] rounded-xl p-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8EA3A5] block">Commercial Agreement</span>
              <div className="mt-1 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#688285]">Unit Rate:</span>
                  <strong className="text-[#17383B]">{formatCurrency(order.unitRate, (language as Language) || 'en')} / pc</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#688285]">Total Bill:</span>
                  <strong className="text-[#17383B] font-bold">{formatCurrency(order.totalAmount, (language as Language) || 'en')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#688285]">Advance Received:</span>
                  <strong className="text-[#229A73]">{formatCurrency(order.advanceAmount, (language as Language) || 'en')}</strong>
                </div>
                <div className="flex justify-between border-t border-[#D9EAEB] pt-1">
                  <span className="text-[#17383B] font-bold">Due on Delivery:</span>
                  <strong className="text-[#0B9FA5] font-black">{formatCurrency(order.dueAmount, (language as Language) || 'en')}</strong>
                </div>
              </div>
            </div>

            <div className="border-l border-[#D9EAEB] pl-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#8EA3A5] block">Gate Pass & Dispatch Verification</span>
              <p className="text-[11px] text-[#688285]">
                Goods received in good condition according to standard wash recipe parameters.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[10px]">
                <div className="border-t border-slate-400 pt-1">
                  <strong>Production In-Charge</strong>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <strong>Client Receiver / Driver</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
