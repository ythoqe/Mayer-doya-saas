import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Employee } from '../../types';
import { PayrollRecord, AttendanceRecord } from './types';
import { formatCurrency } from '../../utils/translation';
import { MayerLogo } from '../ui/MayerLogo';
import { X, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrintPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'payroll' | 'attendance';
  payrollRecords?: PayrollRecord[];
  attendanceRecords?: AttendanceRecord[];
  currentMonth?: string;
  currentDate?: string;
}

export const PrintPayrollModal: React.FC<PrintPayrollModalProps> = ({
  isOpen,
  onClose,
  mode,
  payrollRecords = [],
  attendanceRecords = [],
  currentMonth = '2026-08',
  currentDate = new Date().toISOString().split('T')[0]
}) => {
  const { t, language } = useERP();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalBasic = payrollRecords.reduce((acc, p) => acc + p.basicSalary, 0);
  const totalAdvances = payrollRecords.reduce((acc, p) => acc + p.advanceDeduction, 0);
  const totalBonuses = payrollRecords.reduce((acc, p) => acc + p.bonus, 0);
  const totalNet = payrollRecords.reduce((acc, p) => acc + p.netSalary, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-[#17383B]/50 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-2xl border border-[#D9EAEB] overflow-hidden my-6 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Actions (hidden during print) */}
          <div className="px-6 py-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F8FCFC] print:hidden">
            <span className="text-xs font-extrabold text-[#17383B]">
              {mode === 'payroll' ? (language === 'bn' ? 'ফ্যাক্টরি মাসিক বেতন শিট' : 'Factory Monthly Salary Sheet') : (language === 'bn' ? 'দৈনিক কর্মী উপস্থিতি খাতা' : 'Daily Factory Attendance Sheet')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#08868C] text-white text-xs font-bold shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'bn' ? 'প্রিন্ট করুন' : 'Print Document'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 text-[#8EA3A5] hover:text-[#17383B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Sheet */}
          <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible space-y-6 text-[#17383B] font-sans">
            {/* Header / Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-[#17383B]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="scale-90 origin-left">
                  <MayerLogo />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-[#17383B]">
                    MAYER DOYA WASHING & DYEING LTD.
                  </h1>
                  <p className="text-xs text-[#688285]">
                    Plot 124/B, Tongi Industrial Area, Gazipur, Bangladesh
                  </p>
                  <p className="text-[11px] text-[#8EA3A5]">
                    Govt. Reg # IND-GZP-89412 • Tel: +880 2-9812450
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-[#17383B] text-white font-extrabold text-xs uppercase tracking-wider rounded-md">
                  {mode === 'payroll' ? 'MONTHLY SALARY SHEET' : 'ATTENDANCE REGISTER'}
                </span>
                <p className="text-xs font-bold text-[#17383B] mt-1.5">
                  Period: {mode === 'payroll' ? currentMonth : currentDate}
                </p>
                <p className="text-[11px] text-[#8EA3A5]">
                  Generated: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>

            {/* Payroll Sheet */}
            {mode === 'payroll' && (
              <div className="space-y-4">
                <table className="w-full text-left text-xs border border-gray-300 border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-[#17383B] border-b border-gray-300 font-bold">
                      <th className="p-2 border-r border-gray-300">#</th>
                      <th className="p-2 border-r border-gray-300">Employee Name</th>
                      <th className="p-2 border-r border-gray-300">Designation</th>
                      <th className="p-2 border-r border-gray-300">Dept</th>
                      <th className="p-2 text-right border-r border-gray-300">Basic (৳)</th>
                      <th className="p-2 text-right border-r border-gray-300">Advance (৳)</th>
                      <th className="p-2 text-right border-r border-gray-300">Overtime (৳)</th>
                      <th className="p-2 text-right border-r border-gray-300">Net Payable (৳)</th>
                      <th className="p-2 text-center border-r border-gray-300">Status</th>
                      <th className="p-2 text-center">Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRecords.map((p, idx) => (
                      <tr key={p.id} className="border-b border-gray-200">
                        <td className="p-2 border-r border-gray-200 font-medium">{idx + 1}</td>
                        <td className="p-2 border-r border-gray-200 font-bold text-[#17383B]">{p.employeeName}</td>
                        <td className="p-2 border-r border-gray-200 text-gray-700">{p.designation}</td>
                        <td className="p-2 border-r border-gray-200 text-gray-700">{p.department}</td>
                        <td className="p-2 text-right border-r border-gray-200">{p.basicSalary.toLocaleString()}</td>
                        <td className="p-2 text-right border-r border-gray-200 text-red-600">{p.advanceDeduction > 0 ? `-${p.advanceDeduction.toLocaleString()}` : '0'}</td>
                        <td className="p-2 text-right border-r border-gray-200 text-emerald-700">{p.bonus > 0 ? `+${p.bonus.toLocaleString()}` : '0'}</td>
                        <td className="p-2 text-right border-r border-gray-200 font-bold text-[#17383B]">{p.netSalary.toLocaleString()}</td>
                        <td className="p-2 text-center border-r border-gray-200 font-semibold uppercase text-[10px]">
                          {p.paymentStatus}
                        </td>
                        <td className="p-2 text-center text-gray-400 font-mono text-[10px]">
                          {p.paymentStatus === 'paid' ? 'Paid / Signed' : '________________'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                      <td colSpan={4} className="p-2 text-right uppercase border-r border-gray-300">Total Factory Payroll:</td>
                      <td className="p-2 text-right border-r border-gray-300">৳ {totalBasic.toLocaleString()}</td>
                      <td className="p-2 text-right border-r border-gray-300 text-red-600">৳ {totalAdvances.toLocaleString()}</td>
                      <td className="p-2 text-right border-r border-gray-300 text-emerald-700">৳ {totalBonuses.toLocaleString()}</td>
                      <td className="p-2 text-right border-r border-gray-300 text-base font-black">৳ {totalNet.toLocaleString()}</td>
                      <td colSpan={2} className="p-2 bg-gray-100"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Attendance Sheet */}
            {mode === 'attendance' && (
              <div className="space-y-4">
                <table className="w-full text-left text-xs border border-gray-300 border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-[#17383B] border-b border-gray-300 font-bold">
                      <th className="p-2 border-r border-gray-300">#</th>
                      <th className="p-2 border-r border-gray-300">Employee Name</th>
                      <th className="p-2 border-r border-gray-300">Designation</th>
                      <th className="p-2 border-r border-gray-300">Dept</th>
                      <th className="p-2 text-center border-r border-gray-300">Status</th>
                      <th className="p-2 text-center border-r border-gray-300">In Time</th>
                      <th className="p-2 text-center border-r border-gray-300">Out Time</th>
                      <th className="p-2 text-center border-r border-gray-300">Duty Hrs</th>
                      <th className="p-2">Supervisor Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((att, idx) => (
                      <tr key={att.id} className="border-b border-gray-200">
                        <td className="p-2 border-r border-gray-200 font-medium">{idx + 1}</td>
                        <td className="p-2 border-r border-gray-200 font-bold text-[#17383B]">{att.employeeName}</td>
                        <td className="p-2 border-r border-gray-200 text-gray-700">{att.designation}</td>
                        <td className="p-2 border-r border-gray-200 text-gray-700">{att.department}</td>
                        <td className="p-2 text-center border-r border-gray-200 font-bold uppercase text-[10px]">
                          {att.status}
                        </td>
                        <td className="p-2 text-center border-r border-gray-200">{att.checkIn || '-'}</td>
                        <td className="p-2 text-center border-r border-gray-200">{att.checkOut || '-'}</td>
                        <td className="p-2 text-center border-r border-gray-200 font-medium">{att.workingHours || 0}</td>
                        <td className="p-2 text-gray-600 text-[11px]">{att.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Block */}
            <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs text-[#17383B]">
              <div>
                <div className="border-t border-gray-400 pt-1.5 font-bold">Prepared By / Floor In-Charge</div>
                <div className="text-[10px] text-gray-500">Mayer Doya Operations</div>
              </div>
              <div>
                <div className="border-t border-gray-400 pt-1.5 font-bold">Accounts / HR Manager</div>
                <div className="text-[10px] text-gray-500">Audit & Verification</div>
              </div>
              <div>
                <div className="border-t border-gray-400 pt-1.5 font-bold">Managing Director</div>
                <div className="text-[10px] text-gray-500">Approved & Authorized</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
