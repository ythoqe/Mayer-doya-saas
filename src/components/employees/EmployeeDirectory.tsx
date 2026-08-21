import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrency } from '../../utils/translation';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Calendar, 
  Briefcase, 
  Eye, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  LayoutGrid, 
  List,
  UserCheck,
  Building2,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface EmployeeDirectoryProps {
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  employees,
  onSelectEmployee,
  onEditEmployee,
  onDeleteEmployee
}) => {
  const { t, language, currentUser } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const canViewSalary = currentUser && ['super_admin', 'admin', 'accounts_manager', 'auditor'].includes(currentUser.role);
  const canEdit = currentUser && ['super_admin', 'admin', 'hr_manager', 'general_manager'].includes(currentUser.role);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.phone && emp.phone.includes(searchQuery));

      const matchDept = selectedDepartment === 'all' || emp.department === selectedDepartment;
      const matchShift = selectedShift === 'all' || emp.shift === selectedShift;
      const matchStatus = selectedStatus === 'all' || emp.status === selectedStatus;

      return matchSearch && matchDept && matchShift && matchStatus;
    });
  }, [employees, searchQuery, selectedDepartment, selectedShift, selectedStatus]);

  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department));
    return Array.from(set);
  }, [employees]);

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5F8F1] text-[#1E9B71] border border-[#27B082]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E9B71]" />
            {t('activeStatus')}
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF6E6] text-[#D98218] border border-[#D98218]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D98218]" />
            {t('leaveStatus')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {t('inactiveStatus')}
          </span>
        );
    }
  };

  const getShiftBadge = (shift: Employee['shift']) => {
    switch (shift) {
      case 'night':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EEEBFF] text-[#8178F2]">
            <Clock className="w-3 h-3" /> {t('nightShift')}
          </span>
        );
      case 'general':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF3DF] text-[#D98218]">
            <Clock className="w-3 h-3" /> {t('generalShift')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#DDF4F3] text-[#0B9FA5]">
            <Clock className="w-3 h-3" /> {t('dayShift')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-[20px] border border-[#D9EAEB] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchEmployeesPlaceholder')}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-[#F8FCFC] text-[#17383B] placeholder-[#8EA3A5] focus:outline-none focus:border-[#0B9FA5] focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            aria-label={t('filterDepartment')}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          >
            <option value="all">{t('allDepartments')}</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            aria-label={t('filterShift')}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          >
            <option value="all">{t('allShifts')}</option>
            <option value="day">{t('dayShift')}</option>
            <option value="night">{t('nightShift')}</option>
            <option value="general">{t('generalShift')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label={t('statusCol')}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5]"
          >
            <option value="all">All Status</option>
            <option value="active">{t('activeStatus')}</option>
            <option value="on_leave">{t('leaveStatus')}</option>
            <option value="inactive">{t('inactiveStatus')}</option>
          </select>

          {/* View toggle */}
          <div className="hidden sm:flex items-center bg-[#F1FAFA] p-1 rounded-xl border border-[#D9EAEB]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#0B9FA5] shadow-xs' : 'text-[#8EA3A5] hover:text-[#17383B]'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-white text-[#0B9FA5] shadow-xs' : 'text-[#8EA3A5] hover:text-[#17383B]'
              }`}
              title="Card Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="bg-white rounded-[22px] border border-[#D9EAEB] p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] mx-auto flex items-center justify-center">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-extrabold text-[#17383B]">{t('noEmployeesFound')}</h3>
          <p className="text-xs text-[#688285] max-w-md mx-auto">{t('noEmployeesDesc')}</p>
        </div>
      )}

      {/* Table View */}
      {filteredEmployees.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-[22px] border border-[#D9EAEB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8FCFC] border-b border-[#D9EAEB] text-[#688285] font-bold">
                <tr>
                  <th className="py-3 px-4">{t('employeeCol')}</th>
                  <th className="py-3 px-4">{t('departmentCol')}</th>
                  <th className="py-3 px-4">{t('shiftCol')}</th>
                  <th className="py-3 px-4">{t('phoneCol')}</th>
                  <th className="py-3 px-4">{t('joiningDateCol')}</th>
                  {canViewSalary && <th className="py-3 px-4 text-right">{t('salaryCol')}</th>}
                  <th className="py-3 px-4">{t('statusCol')}</th>
                  <th className="py-3 px-4 text-right">{t('actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1]">
                {filteredEmployees.map((emp) => (
                  <tr 
                    key={emp.id}
                    className="hover:bg-[#F1FAFA]/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectEmployee(emp)}
                  >
                    {/* Employee Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B9FA5] to-[#2FD1C5] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-[#17383B] group-hover:text-[#0B9FA5] transition-colors block">
                            {emp.name}
                          </span>
                          <span className="text-[11px] text-[#8EA3A5] block">
                            {emp.designation}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#17383B]">
                        <Building2 className="w-3.5 h-3.5 text-[#0B9FA5]" />
                        <span>{emp.department}</span>
                      </span>
                    </td>

                    {/* Shift */}
                    <td className="py-3 px-4">
                      {getShiftBadge(emp.shift)}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 text-[#688285] font-mono text-[11px]">
                      {emp.phone}
                    </td>

                    {/* Joining Date */}
                    <td className="py-3 px-4 text-[#688285]">
                      {emp.joinDate}
                    </td>

                    {/* Salary (Guarded) */}
                    {canViewSalary && (
                      <td className="py-3 px-4 text-right font-bold text-[#17383B]">
                        {formatCurrency(emp.salary, language)}
                      </td>
                    )}

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(emp.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectEmployee(emp)}
                          className="p-1.5 rounded-lg text-[#8EA3A5] hover:text-[#0B9FA5] hover:bg-[#DDF4F3] transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditEmployee(emp)}
                              className="p-1.5 rounded-lg text-[#8EA3A5] hover:text-[#17383B] hover:bg-[#F1FAFA] transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত এই কর্মীকে মুছে ফেলতে চান?' : 'Are you sure you want to remove this employee?')) {
                                  onDeleteEmployee(emp.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-[#8EA3A5] hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards View (Grid for mobile & responsive) */}
      {filteredEmployees.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <motion.div
              key={emp.id}
              whileHover={{ y: -3 }}
              onClick={() => onSelectEmployee(emp)}
              className="bg-white rounded-[22px] border border-[#D9EAEB] p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0B9FA5] to-[#2FD1C5] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#17383B] leading-tight">{emp.name}</h4>
                    <p className="text-xs font-semibold text-[#0B9FA5]">{emp.designation}</p>
                  </div>
                </div>
                {getStatusBadge(emp.status)}
              </div>

              <div className="pt-2 border-t border-[#E6F0F1] space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#688285]">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    <span>{emp.department}</span>
                  </span>
                  {getShiftBadge(emp.shift)}
                </div>

                <div className="flex justify-between items-center text-[#688285]">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    <span>{emp.phone}</span>
                  </span>
                  {canViewSalary && (
                    <span className="font-bold text-[#17383B]">
                      {formatCurrency(emp.salary, language)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6F0F1] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-[#8EA3A5]">Joined {emp.joinDate}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectEmployee(emp)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#0B9FA5] hover:bg-[#DDF4F3] transition-colors"
                  >
                    {language === 'bn' ? 'প্রোফাইল' : 'View'}
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEditEmployee(emp)}
                      className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#17383B] hover:bg-[#F1FAFA] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
