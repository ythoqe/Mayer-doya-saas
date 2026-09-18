import React, { useMemo, useState } from 'react';
import { 
  UserCheck, 
  Search, 
  DollarSign, 
  Users, 
  Briefcase, 
  Clock, 
  ShieldCheck, 
  Phone,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatNumber } from '../../utils/translation';
import { DateRange } from './types';

interface EmployeeReportProps {
  dateRange: DateRange;
}

const DEPT_COLORS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

export const EmployeeReport: React.FC<EmployeeReportProps> = ({ dateRange }) => {
  const { employees, currentUser, language, t } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');

  const isFinancialAllowed = ['super_admin', 'admin', 'accounts_manager', 'auditor'].includes(currentUser?.role || 'super_admin');

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => {
      const matchesSearch = 
        (emp.name || '').toLowerCase().includes(term) ||
        (emp.designation || '').toLowerCase().includes(term) ||
        (emp.department || '').toLowerCase().includes(term) ||
        (emp.phone || '').toLowerCase().includes(term);
      
      const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
      const matchesShift = shiftFilter === 'all' || emp.shift === shiftFilter;

      return matchesSearch && matchesDept && matchesShift;
    });
  }, [employees, searchTerm, deptFilter, shiftFilter]);

  // Aggregate Metrics
  const totalHeadcount = employees.length;
  const activeCount = employees.filter(e => e.status === 'active').length;
  const totalMonthlyPayroll = useMemo(() => {
    return employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  }, [employees]);

  const avgSalary = totalHeadcount > 0 ? Math.round(totalMonthlyPayroll / totalHeadcount) : 0;

  // Chart: Headcount by Department
  const deptDistributionData = useMemo(() => {
    const map: Record<string, { count: number; salaryTotal: number }> = {};
    employees.forEach(e => {
      if (!map[e.department]) {
        map[e.department] = { count: 0, salaryTotal: 0 };
      }
      map[e.department].count += 1;
      map[e.department].salaryTotal += e.salary || 0;
    });

    return Object.entries(map).map(([dept, data]) => ({
      name: dept,
      count: data.count,
      salary: data.salaryTotal
    }));
  }, [employees]);

  // Shift Distribution
  const shiftData = useMemo(() => {
    const map: Record<string, number> = { day: 0, night: 0, general: 0 };
    employees.forEach(e => {
      if (map[e.shift] !== undefined) map[e.shift] += 1;
    });

    return [
      { name: language === 'bn' ? 'ডে শিফট (Day)' : 'Day Shift', value: map.day || 0, fill: '#0d9488' },
      { name: language === 'bn' ? 'নাইট শিফট (Night)' : 'Night Shift', value: map.night || 0, fill: '#6366f1' },
      { name: language === 'bn' ? 'জেনারেল (General)' : 'General Shift', value: map.general || 0, fill: '#f59e0b' },
    ];
  }, [employees, language]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Headcount */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মোট কারখানা জনবল' : 'Total Workforce Headcount'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatNumber(totalHeadcount, language)} <span className="text-xs font-normal text-slate-500">{language === 'bn' ? 'জন কর্মী' : 'Workers'}</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'সক্রিয় কর্মী:' : 'Active Staff:'}</span>
            <span className="font-semibold text-emerald-600">{activeCount}</span>
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'মাসিক পে-রোল বাজেট' : 'Monthly Payroll Budget'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {isFinancialAllowed ? formatCurrency(totalMonthlyPayroll, language) : '••••••'}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'গড় বেতন:' : 'Avg Salary:'}</span>
            <span className="font-semibold text-slate-700">
              {isFinancialAllowed ? formatCurrency(avgSalary, language) : '••••••'}
            </span>
          </div>
        </div>

        {/* Shift Allocation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'ডে শিফট বরাদ্দ' : 'Day Shift Floor Workers'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">
            {formatNumber(employees.filter(e => e.shift === 'day').length, language)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'নাইট শিফট:' : 'Night Shift:'}</span>
            <span className="font-semibold text-slate-700">{employees.filter(e => e.shift === 'night').length}</span>
          </div>
        </div>

        {/* Floor Health */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              {language === 'bn' ? 'জনবল সক্রিয়তা' : 'Workforce Availability'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {totalHeadcount > 0 ? `${((activeCount / totalHeadcount) * 100).toFixed(0)}%` : '100%'}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{language === 'bn' ? 'ছুটি / নিষ্ক্রিয়:' : 'On Leave:'}</span>
            <span className="font-semibold text-amber-600">{totalHeadcount - activeCount}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Headcount by Department */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {language === 'bn' ? 'বিভাগ অনুসারে জনবল বণ্টন' : 'Workforce by Department'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'bn' ? 'ওয়াশিং, ডাইং, ফিনিশিং ও রক্ষণাবেক্ষণ বিভাগের কর্মী সংখ্যা' : 'Employee count distributed across factory units'}
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDistributionData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} Workers`, 'Headcount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Shift Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {language === 'bn' ? 'শিফট অনুসারে কর্মী বণ্টন' : 'Shift Allocation Distribution'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'bn' ? 'ডে ও নাইট শিফটে ফ্লোর কর্মীদের উপস্থিতি' : 'Day, Night and General shift workforce breakdown'}
          </p>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shiftData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {shiftData.map((entry, index) => (
                    <Cell key={`shift-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`${val} Staff`, 'Shift Allocation']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'bn' ? 'কর্মচারী ও জনবল রেজিস্টার' : 'Workforce Master Register'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn' ? `মোট ${filteredEmployees.length} জন কর্মী তালিকাভুক্ত` : `Showing ${filteredEmployees.length} workforce profiles`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-employee-report"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'নাম, পদবি বা ফোন খুঁজুন...' : 'Search name, designation...'}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <select
              id="filter-emp-dept"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল বিভাগ' : 'All Departments'}</option>
              <option value="Washing">Washing</option>
              <option value="Dyeing">Dyeing</option>
              <option value="Hydro & Drying">Hydro & Drying</option>
              <option value="Finishing">Finishing</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Accounts">Accounts</option>
              <option value="Administration">Administration</option>
            </select>

            <select
              id="filter-emp-shift"
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">{language === 'bn' ? 'সকল শিফট' : 'All Shifts'}</option>
              <option value="day">{language === 'bn' ? 'ডে শিফট' : 'Day Shift'}</option>
              <option value="night">{language === 'bn' ? 'নাইট শিফট' : 'Night Shift'}</option>
              <option value="general">{language === 'bn' ? 'জেনারেল শিফট' : 'General'}</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{language === 'bn' ? 'কর্মীর নাম' : 'Employee Name'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'পদবি ও বিভাগ' : 'Designation & Unit'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'যোগাযোগ' : 'Contact'}</th>
                <th className="py-3 px-4 text-center">{language === 'bn' ? 'শিফট' : 'Shift'}</th>
                <th className="py-3 px-4">{language === 'bn' ? 'যোগদানের তারিখ' : 'Join Date'}</th>
                <th className="py-3 px-4 text-right">{language === 'bn' ? 'মাসিক বেতন' : 'Monthly Salary'}</th>
                <th className="py-3 px-4 text-center">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{emp.designation}</div>
                      <div className="text-[11px] text-slate-500">{emp.department}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {emp.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium capitalize">
                        {emp.shift}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{emp.joinDate}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {isFinancialAllowed ? formatCurrency(emp.salary, language) : '••••••'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {emp.status === 'active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                          {emp.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{language === 'bn' ? 'কোনো কর্মী তথ্য পাওয়া যায়নি' : 'No employees found'}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
