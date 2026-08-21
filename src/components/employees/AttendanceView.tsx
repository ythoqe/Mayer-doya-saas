import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { AttendanceRecord, AttendanceStatus } from './types';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  AlertCircle, 
  Search, 
  Printer, 
  Plus, 
  Filter,
  Users,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface AttendanceViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onOpenMarkModal: (date: string) => void;
  onOpenPrintModal: (date: string) => void;
  onQuickStatusChange: (recordId: string, newStatus: AttendanceStatus) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  employees,
  attendanceRecords,
  onOpenMarkModal,
  onOpenPrintModal,
  onQuickStatusChange
}) => {
  const { t, language } = useERP();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Filter records for selected date
  const dateRecords = useMemo(() => {
    // Look up attendance records for this date
    let records = attendanceRecords.filter(r => r.date === selectedDate);

    // If no records for this date yet, dynamically generate default rows from active employees
    if (records.length === 0) {
      records = employees.map(emp => ({
        id: `att-${selectedDate}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        department: emp.department,
        date: selectedDate,
        status: emp.status === 'on_leave' ? 'on_leave' : 'present',
        checkIn: emp.status === 'on_leave' ? '-' : '08:00 AM',
        checkOut: emp.status === 'on_leave' ? '-' : '05:00 PM',
        workingHours: emp.status === 'on_leave' ? 0 : 9,
        remarks: emp.status === 'on_leave' ? 'Approved leave' : 'Scheduled shift'
      }));
    }

    return records.filter(r => {
      const matchSearch = r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDepartment === 'all' || r.department === selectedDepartment;
      return matchSearch && matchDept;
    });
  }, [attendanceRecords, selectedDate, employees, searchQuery, selectedDepartment]);

  // KPI calculations for selected date
  const presentCount = dateRecords.filter(r => r.status === 'present').length;
  const lateCount = dateRecords.filter(r => r.status === 'late').length;
  const leaveCount = dateRecords.filter(r => r.status === 'on_leave').length;
  const absentCount = dateRecords.filter(r => r.status === 'absent').length;
  const totalCount = dateRecords.length || employees.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department)));
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* Attendance KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('presentCount')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#1E9B71]">{presentCount}</span>
              <span className="text-[11px] font-bold text-[#1E9B71] bg-[#E5F8F1] px-1.5 py-0.5 rounded-md">
                {attendanceRate}% rate
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E5F8F1] text-[#1E9B71] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Late Arrival */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('lateCount')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#D98218]">{lateCount}</span>
              <span className="text-[11px] text-[#8EA3A5]">Floor delayed</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FFF6E6] text-[#D98218] flex items-center justify-center">
            <Clock3 className="w-6 h-6" />
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('leaveCount')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#8178F2]">{leaveCount}</span>
              <span className="text-[11px] text-[#8EA3A5]">Approved leave</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#EEEBFF] text-[#8178F2] flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#688285] block">{t('absentCount')}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-red-500">{absentCount}</span>
              <span className="text-[11px] text-[#8EA3A5]">Unnotified</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Date Bar & Action Controls */}
      <div className="bg-white p-4 rounded-[20px] border border-[#D9EAEB] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Date Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate === todayStr
                ? 'bg-[#0B9FA5] text-white shadow-xs'
                : 'bg-[#F1FAFA] text-[#688285] hover:text-[#17383B]'
            }`}
          >
            {t('todayBtn')}
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDate === yesterdayStr
                ? 'bg-[#0B9FA5] text-white shadow-xs'
                : 'bg-[#F1FAFA] text-[#688285] hover:text-[#17383B]'
            }`}
          >
            {t('yesterdayBtn')}
          </button>
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#D9EAEB]">
            <Calendar className="w-3.5 h-3.5 text-[#0B9FA5]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
            />
          </div>
        </div>

        {/* Search & Dept */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'কর্মী খুঁজুন...' : 'Search staff...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          >
            <option value="all">{t('allDepartments')}</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={() => onOpenPrintModal(selectedDate)}
            className="px-3 py-1.5 rounded-xl border border-[#D9EAEB] hover:bg-[#F1FAFA] text-[#17383B] text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#0B9FA5]" />
            <span className="hidden sm:inline">{t('printAttendanceRegisterBtn')}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenMarkModal(selectedDate)}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#08868C] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-[0_4px_14px_rgba(11,159,165,0.25)] flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('markAttendanceBtn')}</span>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-[22px] border border-[#D9EAEB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FCFC] border-b border-[#D9EAEB] text-[#688285] font-bold">
              <tr>
                <th className="py-3 px-4">{t('employeeCol')}</th>
                <th className="py-3 px-4">{t('departmentCol')}</th>
                <th className="py-3 px-4">{t('statusCol')}</th>
                <th className="py-3 px-4">{t('checkInCol')}</th>
                <th className="py-3 px-4">{t('checkOutCol')}</th>
                <th className="py-3 px-4">{t('hoursCol')}</th>
                <th className="py-3 px-4">{t('remarksCol')}</th>
                <th className="py-3 px-4 text-right">Quick Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0F1]">
              {dateRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[#F1FAFA]/60 transition-colors">
                  {/* Name & Designation */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold text-xs shrink-0">
                        {record.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-[#17383B] block">{record.employeeName}</span>
                        <span className="text-[10px] text-[#8EA3A5] block">{record.designation}</span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4 font-semibold text-[#17383B]">
                    {record.department}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {record.status === 'present' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5F8F1] text-[#1E9B71] border border-[#27B082]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1E9B71]" />
                        {t('presentCount')}
                      </span>
                    )}
                    {record.status === 'late' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF6E6] text-[#D98218] border border-[#D98218]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D98218]" />
                        {t('lateCount')}
                      </span>
                    )}
                    {record.status === 'on_leave' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEEBFF] text-[#8178F2] border border-[#8178F2]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8178F2]" />
                        {t('leaveCount')}
                      </span>
                    )}
                    {record.status === 'absent' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {t('absentCount')}
                      </span>
                    )}
                  </td>

                  {/* Check In */}
                  <td className="py-3 px-4 text-[#688285] font-mono text-[11px]">
                    {record.checkIn || '-'}
                  </td>

                  {/* Check Out */}
                  <td className="py-3 px-4 text-[#688285] font-mono text-[11px]">
                    {record.checkOut || '-'}
                  </td>

                  {/* Working Hours */}
                  <td className="py-3 px-4 font-bold text-[#17383B]">
                    {record.workingHours ? `${record.workingHours} hrs` : '-'}
                  </td>

                  {/* Remarks */}
                  <td className="py-3 px-4 text-[#8EA3A5] truncate max-w-[180px]">
                    {record.remarks || '-'}
                  </td>

                  {/* Quick status change buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickStatusChange(record.id, 'present')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.status === 'present' ? 'bg-[#1E9B71] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#E5F8F1]'
                        }`}
                        title="Mark Present"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickStatusChange(record.id, 'late')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.status === 'late' ? 'bg-[#D98218] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#FFF6E6]'
                        }`}
                        title="Mark Late"
                      >
                        L
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickStatusChange(record.id, 'absent')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                        }`}
                        title="Mark Absent"
                      >
                        A
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
