import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { GlassCard } from '../ui/GlassCard';
import { User, UserRole, UserStatus } from '../../types';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Check, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Crown,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  RefreshCw,
  Lock,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UsersSettings: React.FC = () => {
  const { 
    users, 
    currentUser, 
    approveUser, 
    rejectUser, 
    deleteUser, 
    updateUserRole, 
    registerUser,
    t, 
    language 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoleUser, setEditingRoleUser] = useState<User | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('employee');

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('production_manager');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = async (user: User) => {
    try {
      await approveUser(user.id);
      showToast(
        language === 'bn' 
          ? `${user.name}-এর একাউন্ট সফলভাবে অনুমোদন করা হয়েছে!` 
          : `Account for ${user.name} approved successfully!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleReject = async (user: User) => {
    try {
      await rejectUser(user.id);
      showToast(
        language === 'bn' 
          ? `${user.name}-এর একাউন্ট বাতিল করা হয়েছে।` 
          : `Account for ${user.name} was rejected.`,
        'error'
      );
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleDelete = async (user: User) => {
    if (user.email.toLowerCase() === 'hmmojjammalhoq@gmail.com') {
      showToast('Cannot delete primary super admin account!', 'error');
      return;
    }

    const confirmText = language === 'bn' 
      ? `আপনি কি নিশ্চিত যে ${user.name}-এর একাউন্ট স্থায়ীভাবে মুছে ফেলতে চান?` 
      : `Are you sure you want to permanently delete ${user.name}'s account?`;
    
    if (window.confirm(confirmText)) {
      try {
        await deleteUser(user.id);
        showToast(
          language === 'bn' ? 'ব্যবহারকারী মুছে ফেলা হয়েছে।' : 'User deleted successfully.',
          'success'
        );
      } catch (err: any) {
        showToast(err.message || 'Delete failed', 'error');
      }
    }
  };

  const handleRoleUpdate = async () => {
    if (!editingRoleUser) return;
    try {
      await updateUserRole(editingRoleUser.id, newSelectedRole);
      showToast(
        language === 'bn' ? 'ব্যবহারকারীর রোল পরিবর্তন করা হয়েছে।' : 'User role updated successfully.',
        'success'
      );
      setEditingRoleUser(null);
    } catch (err: any) {
      showToast(err.message || 'Role update failed', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName || !newUserPassword) {
      showToast('All required fields must be filled', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await registerUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        phone: newUserPhone,
        role: newUserRole
      });
      // Immediately approve if created by admin directly
      if (res.success) {
        // Find and approve
        showToast(
          language === 'bn' 
            ? 'নতুন ব্যবহারকারী সফলভাবে তৈরি করা হয়েছে।' 
            : 'New user created successfully.',
          'success'
        );
        setShowAddModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPhone('');
        setNewUserPassword('');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const approvedCount = users.filter(u => u.status === 'approved').length;
  const rejectedCount = users.filter(u => u.status === 'rejected').length;

  const filteredUsers = users.filter(u => {
    if (activeTab === 'pending') return u.status === 'pending';
    if (activeTab === 'approved') return u.status === 'approved';
    if (activeTab === 'rejected') return u.status === 'rejected';
    return true;
  }).filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return { bg: 'bg-[#DDF4F3]', text: 'text-[#0B9FA5]', border: 'border-[#16B8B0]/30', label: 'Super Admin' };
      case 'admin':
        return { bg: 'bg-[#DDF4F3]', text: 'text-[#0B9FA5]', border: 'border-[#16B8B0]/30', label: 'Admin' };
      case 'production_manager':
        return { bg: 'bg-[#E5F8F1]', text: 'text-[#229A73]', border: 'border-[#38C99A]/30', label: 'Production Mgr' };
      case 'dyeing_master':
        return { bg: 'bg-[#EEEBFF]', text: 'text-[#6357E8]', border: 'border-[#8178F2]/30', label: 'Dyeing Master' };
      case 'washing_manager':
        return { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]', border: 'border-[#38BDF8]/30', label: 'Washing Mgr' };
      case 'accounts_manager':
        return { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#F59E0B]/30', label: 'Accounts Mgr' };
      case 'store_keeper':
        return { bg: 'bg-[#FFF3DF]', text: 'text-[#C47D1C]', border: 'border-[#F3B562]/30', label: 'Store Keeper' };
      default:
        return { bg: 'bg-[#F1FAFA]', text: 'text-[#688285]', border: 'border-[#D9EAEB]', label: role };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 p-3.5 rounded-2xl border text-xs font-bold shadow-sm ${
              toastMessage.type === 'success'
                ? 'bg-[#E5F8F1] border-[#38C99A]/40 text-[#229A73]'
                : 'bg-[#FDEDF0] border-[#EA7185]/40 text-[#EA7185]'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#38C99A] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#EA7185] shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Stats Card */}
      <GlassCard variant="white" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D9EAEB]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#17383B]">
                  {language === 'bn' ? 'ব্যবহারকারী ও একাউন্ট অনুমোদন' : 'User Management & Approvals'}
                </h3>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EA7185] text-white text-[11px] font-extrabold animate-pulse">
                    {pendingCount} {language === 'bn' ? 'নতুন অপেক্ষমান' : 'Pending'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#688285] mt-0.5">
                {language === 'bn'
                  ? 'নতুন নিবন্ধিত একাউন্ট অনুমোদন, রোল বরাদ্দ ও ইউজার কন্ট্রোল পরিচালনা করুন।'
                  : 'Manage user registrations, approve new accounts, assign roles and security.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-[0_4px_12px_rgba(11,159,165,0.25)] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন ব্যবহারকারী যুক্ত করুন' : 'Add New User'}</span>
          </button>
        </div>

        {/* 4 Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {language === 'bn' ? 'মোট ব্যবহারকারী' : 'Total Users'}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold text-[#17383B]">{users.length}</span>
              <Users className="w-4 h-4 text-[#0B9FA5]" />
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border transition-all ${
            pendingCount > 0 
              ? 'bg-[#FEF3C7]/40 border-[#F59E0B]/40 ring-2 ring-[#F59E0B]/20' 
              : 'bg-[#F1FAFA] border-[#D9EAEB]/70'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {language === 'bn' ? 'অপেক্ষমান অনুমোদন' : 'Pending Approvals'}
            </span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-extrabold ${pendingCount > 0 ? 'text-[#D97706]' : 'text-[#17383B]'}`}>
                {pendingCount}
              </span>
              <Clock className={`w-4 h-4 ${pendingCount > 0 ? 'text-[#D97706] animate-spin' : 'text-[#8EA3A5]'}`} />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {language === 'bn' ? 'অনুমোদিত' : 'Approved Active'}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold text-[#229A73]">{approvedCount}</span>
              <UserCheck className="w-4 h-4 text-[#229A73]" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F1FAFA] border border-[#D9EAEB]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8EA3A5] block mb-1">
              {language === 'bn' ? 'বাতিলকৃত' : 'Rejected'}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold text-[#EA7185]">{rejectedCount}</span>
              <UserX className="w-4 h-4 text-[#EA7185]" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F1FAFA] border border-[#D9EAEB] rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#0B9FA5] shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              {language === 'bn' ? 'সকল' : 'All'} ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-[#D97706] shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              <span>{language === 'bn' ? 'অপেক্ষমান' : 'Pending'}</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#EA7185] animate-ping" />
              )}
              <span>({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'approved'
                  ? 'bg-white text-[#229A73] shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              {language === 'bn' ? 'অনুমোদিত' : 'Approved'} ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'rejected'
                  ? 'bg-white text-[#EA7185] shadow-xs'
                  : 'text-[#688285] hover:text-[#17383B]'
              }`}
            >
              {language === 'bn' ? 'বাতিল' : 'Rejected'} ({rejectedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'নাম, ইমেইল বা ফোন দিয়ে খুঁজুন...' : 'Search name, email, phone...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#D9EAEB] bg-white text-xs text-[#17383B] focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
            />
          </div>
        </div>

        {/* Users List Table / Cards */}
        <div className="mt-5 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center bg-[#F1FAFA] rounded-2xl border border-dashed border-[#D9EAEB]">
              <Users className="w-8 h-8 text-[#8EA3A5] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-[#688285]">
                {language === 'bn' ? 'কোনো ব্যবহারকারী পাওয়া যায়নি।' : 'No users found matching this filter.'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isPrimaryAdmin = user.email.toLowerCase() === 'hmmojjammalhoq@gmail.com';
              const roleBadge = getRoleBadge(user.role);

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    user.status === 'pending'
                      ? 'bg-[#FEFCE8] border-[#FDE047] shadow-[0_2px_10px_rgba(234,179,8,0.1)]'
                      : isPrimaryAdmin
                      ? 'bg-gradient-to-r from-[#F1FAFA] to-white border-[#0B9FA5] shadow-xs'
                      : 'bg-white border-[#D9EAEB] hover:border-[#D9EAEB]/90'
                  }`}
                >
                  {/* Left: User Identity */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isPrimaryAdmin 
                        ? 'bg-gradient-to-br from-[#0B9FA5] to-[#16B8B0] text-white shadow-md' 
                        : user.status === 'pending'
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : 'bg-[#E5F8F1] text-[#229A73]'
                    }`}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-[#17383B]">
                          {user.name}
                        </span>
                        {isPrimaryAdmin && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DDF4F3] text-[#0B9FA5] border border-[#16B8B0]/30 text-[10px] font-black">
                            <Crown className="w-3 h-3" />
                            Primary Super Admin
                          </span>
                        )}
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          user.status === 'approved'
                            ? 'bg-[#E5F8F1] text-[#229A73] border-[#38C99A]/30'
                            : user.status === 'pending'
                            ? 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/40 animate-pulse'
                            : 'bg-[#FDEDF0] text-[#EA7185] border-[#EA7185]/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'approved' ? 'bg-[#38C99A]' : user.status === 'pending' ? 'bg-[#F59E0B]' : 'bg-[#EA7185]'
                          }`} />
                          {user.status === 'approved' 
                            ? (language === 'bn' ? 'অনুমোদিত' : 'Approved')
                            : user.status === 'pending'
                            ? (language === 'bn' ? 'অপেক্ষমান অনুমোদন' : 'Pending Approval')
                            : (language === 'bn' ? 'বাতিলকৃত' : 'Rejected')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#688285] flex-wrap">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-[#8EA3A5]" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#8EA3A5]" />
                            {user.phone}
                          </span>
                        )}
                        {user.createdAt && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#8EA3A5]" />
                            {new Date(user.createdAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Role & Actions */}
                  <div className="flex items-center gap-2 flex-wrap justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#D9EAEB]/60">
                    {/* Role Pill */}
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{roleBadge.label}</span>
                    </span>

                    {/* Action buttons based on status */}
                    {user.status === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApprove(user)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#229A73] hover:bg-[#1E8664] text-white text-xs font-bold shadow-xs transition-all"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{language === 'bn' ? 'অনুমোদন করুন' : 'Approve'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(user)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FDEDF0] hover:bg-[#FCD8DE] text-[#EA7185] border border-[#EA7185]/30 text-xs font-bold transition-all"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{language === 'bn' ? 'বাতিল' : 'Reject'}</span>
                        </button>
                      </div>
                    )}

                    {user.status === 'approved' && !isPrimaryAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoleUser(user);
                            setNewSelectedRole(user.role);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[#F1FAFA] hover:bg-[#DDF4F3] text-[#0B9FA5] border border-[#D9EAEB] text-xs font-bold transition-all"
                          title="Change Role"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(user)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#FDEDF0] hover:bg-[#FCD8DE] text-[#EA7185] border border-[#EA7185]/30 text-xs font-bold transition-all"
                          title="Revoke / Reject"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FDEDF0] text-[#8EA3A5] hover:text-[#EA7185] border border-[#D9EAEB] text-xs font-bold transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {user.status === 'rejected' && !isPrimaryAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApprove(user)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E5F8F1] hover:bg-[#D1F2E5] text-[#229A73] border border-[#38C99A]/40 text-xs font-bold transition-all"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পুনরায় অনুমোদন' : 'Re-Approve'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FDEDF0] text-[#8EA3A5] hover:text-[#EA7185] border border-[#D9EAEB] text-xs font-bold transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      {/* Role Edit Modal */}
      {editingRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#D9EAEB] space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D9EAEB]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0B9FA5]" />
                <h4 className="text-sm font-bold text-[#17383B]">
                  {language === 'bn' ? 'রোল পরিবর্তন করুন' : 'Change User Role'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoleUser(null)}
                className="p-1 rounded-lg text-[#8EA3A5] hover:text-[#17383B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F1FAFA] rounded-2xl text-xs space-y-1">
              <p className="font-bold text-[#17383B]">{editingRoleUser.name}</p>
              <p className="text-[#688285] font-mono">{editingRoleUser.email}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17383B] mb-1.5">
                {language === 'bn' ? 'নতুন রোল নির্বাচন করুন' : 'Select New Role'}
              </label>
              <select
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs font-semibold text-[#17383B] focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              >
                <option value="admin">Admin</option>
                <option value="production_manager">Production Manager</option>
                <option value="dyeing_master">Dyeing Master</option>
                <option value="washing_manager">Washing Manager</option>
                <option value="accounts_manager">Accounts Manager</option>
                <option value="store_keeper">Store Keeper</option>
                <option value="employee">Employee</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditingRoleUser(null)}
                className="px-4 py-2 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA]"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleRoleUpdate}
                className="px-5 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold shadow-sm"
              >
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#D9EAEB] space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D9EAEB]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#DDF4F3] text-[#0B9FA5]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#17383B]">
                    {language === 'bn' ? 'নতুন ব্যবহারকারী তৈরি করুন' : 'Create New User Account'}
                  </h4>
                  <p className="text-xs text-[#688285]">
                    {language === 'bn' ? 'এডমিন হিসেবে সরাসরি একাউন্ট তৈরি করুন' : 'Directly register & activate a user account'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-[#8EA3A5] hover:text-[#17383B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#17383B] mb-1">
                  {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Rafiqul Islam"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">
                    {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@mayerdoya.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">
                    {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">
                    {language === 'bn' ? 'লগইন পাসওয়ার্ড' : 'Account Password'} *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17383B] mb-1">
                    {language === 'bn' ? 'পদবী / রোল' : 'Assigned Role'} *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#F1FAFA] border border-[#D9EAEB] text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
                  >
                    <option value="production_manager">Production Manager</option>
                    <option value="dyeing_master">Dyeing Master</option>
                    <option value="washing_manager">Washing Manager</option>
                    <option value="accounts_manager">Accounts Manager</option>
                    <option value="store_keeper">Store Keeper</option>
                    <option value="employee">Employee</option>
                    <option value="auditor">Auditor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#D9EAEB]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D9EAEB] text-xs font-bold text-[#688285] hover:bg-[#F1FAFA]"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{language === 'bn' ? 'তৈরি করুন' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
