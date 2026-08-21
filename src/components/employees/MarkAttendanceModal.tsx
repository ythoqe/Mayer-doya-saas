import React, { useState } from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { AttendanceRecord, AttendanceStatus } from './types';
import { X, Calendar, Clock, Check, CheckCircle2, XCircle, Clock3, AlertCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  selectedDate: string;
  onSaveAttendance: (newRecords: AttendanceRecord[]) => void;
  existingRecords: AttendanceRecord[];
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  employees,
  selectedDate,
  onSaveAttendance,
  existingRecords
}) => {
  const { t, language } = useERP();

  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState<Record<string, { status: AttendanceStatus; checkIn: string; checkOut: string; remarks: string }>>(() => {
    const initial: Record<string, { status: AttendanceStatus; checkIn: string; checkOut: string; remarks: string }> = {};
    employees.forEach(emp => {
      const match = existingRecords.find(r => r.employeeId === emp.id && r.date === selectedDate);
      if (match) {
        initial[emp.id] = {
          status: match.status,
          checkIn: match.checkIn || '08:00 AM',
          checkOut: match.checkOut || '05:00 PM',
          remarks: match.remarks || ''
        };
      } else {
        initial[emp.id] = {
          status: emp.status === 'on_leave' ? 'on_leave' : 'present',
          checkIn: '08:00 AM',
          checkOut: '05:00 PM',
          remarks: emp.status === 'on_leave' ? 'Approved leave' : 'Normal duty'
        };
      }
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleStatusChange = (empId: string, status: AttendanceStatus) => {
    setAttendances(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        status,
        checkIn: status === 'absent' || status === 'on_leave' ? '-' : (prev[empId]?.checkIn || '08:00 AM'),
        checkOut: status === 'absent' || status === 'on_leave' ? '-' : (prev[empId]?.checkOut || '05:00 PM')
      }
    }));
  };

  const handleMarkAllPresent = () => {
    setAttendances(prev => {
      const updated = { ...prev };
      employees.forEach(emp => {
        if (emp.status !== 'on_leave') {
          updated[emp.id] = {
            status: 'present',
            checkIn: '08:00 AM',
            checkOut: '05:00 PM',
            remarks: 'On-time factory attendance'
          };
        }
      });
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const records: AttendanceRecord[] = employees.map(emp => {
      const state = attendances[emp.id] || { status: 'present', checkIn: '08:00 AM', checkOut: '05:00 PM', remarks: '' };
      return {
        id: `att-${date}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        department: emp.department,
        date,
        status: state.status,
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        workingHours: state.status === 'present' || state.status === 'late' ? 9 : 0,
        remarks: state.remarks
      };
    });

    onSaveAttendance(records);
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
          className="relative w-full max-w-3xl bg-white rounded-[24px] shadow-[0_24px_60px_rgba(23,56,59,0.22)] border border-[#D9EAEB] overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E6F0F1] flex items-center justify-between bg-gradient-to-r from-[#F1FAFA] to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#17383B]">
                  {t('markAttendanceBtn')}
                </h3>
                <p className="text-xs text-[#688285]">
                  {language === 'bn' ? 'ফ্যাক্টরির কর্মীদের দৈনিক উপস্থিতি ও শিফটের সময় নির্ধারণ করুন' : 'Log factory attendance, check-in times and remarks for the shift'}
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

          {/* Date & Bulk Controls */}
          <div className="px-6 py-4 bg-[#F8FCFC] border-b border-[#E6F0F1] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-[#17383B] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0B9FA5]" />
                <span>{language === 'bn' ? 'তারিখ নির্বাচন:' : 'Attendance Date:'}</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
              />
            </div>

            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#DDF4F3] hover:bg-[#c9eeec] text-[#0B9FA5] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সকলকে উপস্থিত চিহ্নিত করুন' : 'Mark All Active Present'}</span>
            </button>
          </div>

          {/* Table Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="border border-[#D9EAEB] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FCFC] border-b border-[#D9EAEB] text-[#688285]">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">{t('employeeCol')}</th>
                    <th className="py-2.5 px-4 font-bold">{t('departmentCol')}</th>
                    <th className="py-2.5 px-4 font-bold">{t('statusCol')}</th>
                    <th className="py-2.5 px-4 font-bold">{t('remarksCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6F0F1]">
                  {employees.map((emp) => {
                    const current = attendances[emp.id] || { status: 'present', checkIn: '08:00 AM', checkOut: '05:00 PM', remarks: '' };

                    return (
                      <tr key={emp.id} className="hover:bg-[#F1FAFA]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-[#17383B] block leading-tight">{emp.name}</span>
                              <span className="text-[10px] text-[#8EA3A5] leading-tight">{emp.designation}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[#688285] font-medium">
                          {emp.department}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'present')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                current.status === 'present'
                                  ? 'bg-[#1E9B71] text-white shadow-xs'
                                  : 'bg-[#F1FAFA] text-[#688285] hover:bg-[#E5F8F1] hover:text-[#1E9B71]'
                              }`}
                            >
                              {t('presentCount')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'late')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                current.status === 'late'
                                  ? 'bg-[#D98218] text-white shadow-xs'
                                  : 'bg-[#F1FAFA] text-[#688285] hover:bg-[#FFF6E6] hover:text-[#D98218]'
                              }`}
                            >
                              {t('lateCount')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'on_leave')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                current.status === 'on_leave'
                                  ? 'bg-[#8178F2] text-white shadow-xs'
                                  : 'bg-[#F1FAFA] text-[#688285] hover:bg-[#EEEBFF] hover:text-[#8178F2]'
                              }`}
                            >
                              {t('leaveCount')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'absent')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                current.status === 'absent'
                                  ? 'bg-red-500 text-white shadow-xs'
                                  : 'bg-[#F1FAFA] text-[#688285] hover:bg-red-50 hover:text-red-500'
                              }`}
                            >
                              {t('absentCount')}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={current.remarks}
                            onChange={(e) => setAttendances(prev => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], remarks: e.target.value }
                            }))}
                            placeholder={language === 'bn' ? 'মন্তব্য...' : 'Notes...'}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Actions */}
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
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#08868C] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-[0_4px_16px_rgba(11,159,165,0.28)] transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'bn' ? 'উপস্থিতি সংরক্ষণ করুন' : 'Save Attendance Register'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
