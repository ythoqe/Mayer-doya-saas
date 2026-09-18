import React from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { 
  Building2, 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { motion } from 'motion/react';

interface DepartmentOverviewProps {
  employees: Employee[];
}

export const DepartmentOverview: React.FC<DepartmentOverviewProps> = ({ employees }) => {
  const { t, language, currentUser } = useERP();
  const canViewFinancials = currentUser && ['super_admin', 'admin', 'accounts_manager', 'auditor'].includes(currentUser.role);

  // Group by department
  const deptMap: Record<string, { total: number; active: number; onLeave: number; dayShift: number; nightShift: number; generalShift: number; totalSalary: number }> = {};

  employees.forEach(emp => {
    if (!deptMap[emp.department]) {
      deptMap[emp.department] = {
        total: 0,
        active: 0,
        onLeave: 0,
        dayShift: 0,
        nightShift: 0,
        generalShift: 0,
        totalSalary: 0
      };
    }

    const d = deptMap[emp.department];
    d.total += 1;
    if (emp.status === 'active') d.active += 1;
    if (emp.status === 'on_leave') d.onLeave += 1;

    if (emp.shift === 'day') d.dayShift += 1;
    else if (emp.shift === 'night') d.nightShift += 1;
    else d.generalShift += 1;

    d.totalSalary += emp.salary;
  });

  const deptList = Object.entries(deptMap).map(([deptName, data]) => ({
    deptName,
    ...data,
    avgSalary: data.total > 0 ? Math.round(data.totalSalary / data.total) : 0
  }));

  // Overall shift metrics
  const totalDayShift = employees.filter(e => e.shift === 'day').length;
  const totalNightShift = employees.filter(e => e.shift === 'night').length;
  const totalGeneralShift = employees.filter(e => e.shift === 'general').length;

  return (
    <div className="space-y-6">
      {/* Shift Health & Workforce Allocation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Day Shift */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#688285] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B9FA5]" />
              <span>{t('dayShift')} (Floor Operations)</span>
            </span>
            <div className="text-2xl font-black text-[#17383B]">
              {totalDayShift} <span className="text-xs font-bold text-[#8EA3A5]">workers</span>
            </div>
            <span className="text-[11px] text-[#0B9FA5] font-semibold block">
              {employees.length > 0 ? Math.round((totalDayShift / employees.length) * 100) : 0}% of factory capacity
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-black">
            ☀️
          </div>
        </div>

        {/* Night Shift */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#688285] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8178F2]" />
              <span>{t('nightShift')} (Continuous Line)</span>
            </span>
            <div className="text-2xl font-black text-[#17383B]">
              {totalNightShift} <span className="text-xs font-bold text-[#8EA3A5]">workers</span>
            </div>
            <span className="text-[11px] text-[#8178F2] font-semibold block">
              {employees.length > 0 ? Math.round((totalNightShift / employees.length) * 100) : 0}% continuous shift
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EEEBFF] text-[#8178F2] flex items-center justify-center font-black">
            🌙
          </div>
        </div>

        {/* General Shift */}
        <div className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#688285] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D98218]" />
              <span>{t('generalShift')} (Admin & QC)</span>
            </span>
            <div className="text-2xl font-black text-[#17383B]">
              {totalGeneralShift} <span className="text-xs font-bold text-[#8EA3A5]">staff</span>
            </div>
            <span className="text-[11px] text-[#D98218] font-semibold block">
              {employees.length > 0 ? Math.round((totalGeneralShift / employees.length) * 100) : 0}% support & lab
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-black">
            🏢
          </div>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-[#17383B] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#0B9FA5]" />
          <span>{language === 'bn' ? 'ডিপার্টমেন্ট অনুসারে কর্মী ও বেতন বিবরণ' : 'Departmental Breakdown & Headcount'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptList.length === 0 ? (
            <div className="col-span-full py-12 px-4 bg-white rounded-[22px] border border-[#D9EAEB] text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-[#F1FAFA] text-[#0B9FA5] flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#17383B]">
                  {language === 'bn' ? 'এখনো কোনো কর্মী বা ডিপার্টমেন্ট যোগ করা হয়নি' : 'No staff or departments registered yet'}
                </p>
                <p className="text-xs text-[#8EA3A5] max-w-sm">
                  {language === 'bn' ? 'স্টাফ ডিরেক্টরি থেকে নতুন কর্মী যুক্ত করুন।' : 'Add new staff members from the Staff Directory tab.'}
                </p>
              </div>
            </div>
          ) : (
            deptList.map((d) => (
            <motion.div
              key={d.deptName}
              whileHover={{ y: -2 }}
              className="bg-white p-5 rounded-[22px] border border-[#D9EAEB] shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-black text-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#17383B]">{d.deptName}</h4>
                    <span className="text-[11px] text-[#8EA3A5] font-medium">{d.total} Assigned Staff</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5F8F1] text-[#1E9B71]">
                  {d.active} Active
                </span>
              </div>

              {/* Shift distribution progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-[#688285]">
                  <span>Shift Split</span>
                  <span className="font-semibold">{d.dayShift} Day • {d.nightShift} Night • {d.generalShift} Gen</span>
                </div>
                <div className="h-2 w-full bg-[#EAF6F6] rounded-full overflow-hidden flex">
                  {d.dayShift > 0 && (
                    <div 
                      style={{ width: `${(d.dayShift / d.total) * 100}%` }} 
                      className="bg-[#0B9FA5] h-full" 
                      title={`Day: ${d.dayShift}`}
                    />
                  )}
                  {d.nightShift > 0 && (
                    <div 
                      style={{ width: `${(d.nightShift / d.total) * 100}%` }} 
                      className="bg-[#8178F2] h-full" 
                      title={`Night: ${d.nightShift}`}
                    />
                  )}
                  {d.generalShift > 0 && (
                    <div 
                      style={{ width: `${(d.generalShift / d.total) * 100}%` }} 
                      className="bg-[#D98218] h-full" 
                      title={`General: ${d.generalShift}`}
                    />
                  )}
                </div>
              </div>

              {/* Financial metric if authorized */}
              {canViewFinancials && (
                <div className="pt-3 border-t border-[#E6F0F1] flex items-center justify-between text-xs">
                  <span className="text-[#8EA3A5]">{language === 'bn' ? 'মাসিক পে-রোল:' : 'Monthly Budget:'}</span>
                  <span className="font-extrabold text-[#17383B]">{formatCurrency(d.totalSalary, language)}</span>
                </div>
              )}
            </motion.div>
          )))}
        </div>
      </div>
    </div>
  );
};
