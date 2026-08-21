import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { useERP } from '../../context/ERPContext';
import { X, User, Phone, Briefcase, Calendar, DollarSign, Clock, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
  onSave: (employeeData: Omit<Employee, 'id'>) => void;
}

const DEPARTMENTS: Employee['department'][] = [
  'Washing',
  'Dyeing',
  'Hydro & Drying',
  'Finishing',
  'Quality Control',
  'Maintenance',
  'Accounts',
  'Administration'
];

const SHIFTS: Employee['shift'][] = ['day', 'night', 'general'];
const STATUSES: Employee['status'][] = ['active', 'on_leave', 'inactive'];

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
  onSave
}) => {
  const { t, language } = useERP();

  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState<Employee['department']>('Washing');
  const [phone, setPhone] = useState('+880 ');
  const [salary, setSalary] = useState<number>(20000);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<Employee['status']>('active');
  const [shift, setShift] = useState<Employee['shift']>('day');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name);
      setDesignation(employeeToEdit.designation);
      setDepartment(employeeToEdit.department);
      setPhone(employeeToEdit.phone || '+880 ');
      setSalary(employeeToEdit.salary || 0);
      setJoinDate(employeeToEdit.joinDate || new Date().toISOString().split('T')[0]);
      setStatus(employeeToEdit.status || 'active');
      setShift(employeeToEdit.shift || 'day');
    } else {
      setName('');
      setDesignation('');
      setDepartment('Washing');
      setPhone('+880 ');
      setSalary(20000);
      setJoinDate(new Date().toISOString().split('T')[0]);
      setStatus('active');
      setShift('day');
    }
    setErrors({});
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = language === 'bn' ? 'কর্মীর নাম দেওয়া আবশ্যক' : 'Employee name is required';
    if (!designation.trim()) errs.designation = language === 'bn' ? 'পদবী উল্লেখ করুন' : 'Designation is required';
    if (!phone.trim() || phone === '+880 ') errs.phone = language === 'bn' ? 'সঠিক ফোন নম্বর আবশ্যক' : 'Valid phone number is required';
    if (salary < 0) errs.salary = language === 'bn' ? 'বেতন ঋণাত্মক হতে পারে না' : 'Salary cannot be negative';
    if (!joinDate) errs.joinDate = language === 'bn' ? 'যোগদানের তারিখ দিন' : 'Joining date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      designation: designation.trim(),
      department,
      phone: phone.trim(),
      salary: Number(salary) || 0,
      joinDate,
      status,
      shift
    });

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
          className="relative w-full max-w-2xl bg-white rounded-[22px] shadow-[0_20px_50px_rgba(23,56,59,0.2)] border border-[#D9EAEB] overflow-hidden my-6"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E6F0F1] flex items-center justify-between bg-gradient-to-r from-[#F1FAFA] to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#17383B]">
                  {employeeToEdit ? t('editEmployeeBtn') : t('addEmployeeBtn')}
                </h3>
                <p className="text-xs text-[#688285]">
                  {language === 'bn' ? 'কর্মীর পদবী, বিভাগ, শিফট ও বেতন সংক্রান্ত তথ্য' : 'Factory workforce profile and job assignment'}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1">
                  <span>{t('employeeCol')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'bn' ? 'উদা: মো: দেলোয়ার হোসেন' : 'e.g. Md. Delwar Hossain'}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                      errors.name ? 'border-red-400 bg-red-50/20' : 'border-[#D9EAEB] bg-white'
                    } text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-red-500 font-medium">{errors.name}</p>}
              </div>

              {/* Designation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1">
                  <span>{t('designationCol')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder={language === 'bn' ? 'উদা: হেড ডাইং মাস্টার' : 'e.g. Head Dyeing Master'}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                      errors.designation ? 'border-red-400 bg-red-50/20' : 'border-[#D9EAEB] bg-white'
                    } text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all`}
                  />
                </div>
                {errors.designation && <p className="text-[11px] text-red-500 font-medium">{errors.designation}</p>}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">
                  {t('departmentCol')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Employee['department'])}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1">
                  <span>{t('phoneCol')}</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711-000000"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                      errors.phone ? 'border-red-400 bg-red-50/20' : 'border-[#D9EAEB] bg-white'
                    } text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all`}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-red-500 font-medium">{errors.phone}</p>}
              </div>

              {/* Monthly Salary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B] flex items-center gap-1">
                  <span>{t('salaryCol')} (৳)</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] font-bold focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                  />
                </div>
                {errors.salary && <p className="text-[11px] text-red-500 font-medium">{errors.salary}</p>}
              </div>

              {/* Joining Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">
                  {t('joiningDateCol')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                  />
                </div>
              </div>

              {/* Shift */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">
                  {t('shiftCol')}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as Employee['shift'])}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all capitalize"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s === 'day' ? t('dayShift') : s === 'night' ? t('nightShift') : t('generalShift')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17383B]">
                  {t('statusCol')}
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Employee['status'])}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D9EAEB] bg-white text-[#17383B] focus:outline-none focus:border-[#0B9FA5] focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st === 'active' ? t('activeStatus') : st === 'on_leave' ? t('leaveStatus') : t('inactiveStatus')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
                <span>{employeeToEdit ? (language === 'bn' ? 'হালনাগাদ সংরক্ষণ' : 'Save Changes') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Register Employee')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
