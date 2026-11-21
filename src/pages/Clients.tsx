import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  Banknote,
  BookOpen,
  Building2,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { FirestoreClientPaymentModal } from '../components/clients/FirestoreClientPaymentModal';
import { ClientLedger } from './ClientLedger';
import { useAuth } from '../contexts/AuthContext';
import {
  getClientDoc,
  getClientsCollection,
  getTenantId,
  TENANTS_COLLECTION,
  TENANT_SUBCOLLECTIONS,
} from '../lib/db';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import type { Client, WithId } from '../types/database';

interface ClientFormState {
  name: string;
  companyName: string;
  address: string;
  mobile: string;
  email: string;
  openingDue: string;
  notes: string;
}

const EMPTY_FORM: ClientFormState = {
  name: '',
  companyName: '',
  address: '',
  mobile: '',
  email: '',
  openingDue: '0',
  notes: '',
};

interface ToastState {
  type: 'error' | 'success';
  message: string;
}

const formatBDT = (amount: number): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `৳ ${safe.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const Clients: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const tenantId = getTenantId();
  const clientsPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.clients}`;

  const [clients, setClients] = useState<WithId<Client>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<WithId<Client> | null>(null);
  const [form, setForm] = useState<ClientFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete confirmation modal state
  const [deletingClient, setDeletingClient] = useState<WithId<Client> | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentClientId, setPaymentClientId] = useState<string | null>(null);

  // Ledger view state
  const [ledgerViewOpen, setLedgerViewOpen] = useState<boolean>(false);
  const [ledgerClientId, setLedgerClientId] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Real-time Firestore listener on tenants/{tenantId}/clients
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const clientsQuery = query(
      getClientsCollection(tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      clientsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => docSnap.data());
        setClients(list);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, clientsPath);
        } catch {
          showToast(
            'error',
            error.message || 'Failed to load clients / ক্লায়েন্ট লোড করতে ব্যর্থ হয়েছে।'
          );
        }
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, tenantId, clientsPath]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const mobileMatch = (c.mobile || '').toLowerCase().includes(q);
      return nameMatch || mobileMatch;
    });
  }, [clients, searchTerm]);

  const totalCurrentDue = useMemo(
    () => clients.reduce((sum, c) => sum + (Number(c.currentDue) || 0), 0),
    [clients]
  );

  const openAddModal = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: WithId<Client>) => {
    setEditingClient(client);
    setForm({
      name: client.name || '',
      companyName: client.companyName || '',
      address: client.address || '',
      mobile: client.mobile || '',
      email: client.email || '',
      openingDue: String(client.openingDue ?? 0),
      notes: client.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingClient(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const companyName = form.companyName.trim();
    const address = form.address.trim();
    const mobile = form.mobile.trim();
    const email = form.email.trim();
    const notes = form.notes.trim();
    const openingDueNum = form.openingDue.trim() === '' ? 0 : Number(form.openingDue);

    if (!name) {
      setFormError('Name is required / নাম আবশ্যক।');
      return;
    }
    if (name.length > 160) {
      setFormError('Name must be 160 characters or fewer.');
      return;
    }
    if (!Number.isFinite(openingDueNum)) {
      setFormError('Opening Due must be a valid number / প্রারম্ভিক বকেয়া সঠিক সংখ্যা হতে হবে।');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingClient) {
        const prevOpeningDue = Number(editingClient.openingDue) || 0;
        const prevCurrentDue = Number(editingClient.currentDue) || 0;
        const updatedCurrentDue = prevCurrentDue + (openingDueNum - prevOpeningDue);

        await updateDoc(getClientDoc(editingClient.id, tenantId), {
          name: name.slice(0, 160),
          companyName: companyName.slice(0, 200),
          address: address.slice(0, 400),
          mobile: mobile.slice(0, 40),
          email: email.slice(0, 200),
          openingDue: openingDueNum,
          currentDue: updatedCurrentDue,
          notes: notes.slice(0, 1000),
          updatedAt: serverTimestamp(),
        });

        showToast('success', 'Client updated successfully / ক্লায়েন্টের তথ্য আপডেট হয়েছে।');
      } else {
        const now = serverTimestamp();
        await addDoc(getClientsCollection(tenantId), {
          id: '',
          name: name.slice(0, 160),
          companyName: companyName.slice(0, 200),
          address: address.slice(0, 400),
          mobile: mobile.slice(0, 40),
          email: email.slice(0, 200),
          openingDue: openingDueNum,
          currentDue: openingDueNum,
          notes: notes.slice(0, 1000),
          createdAt: now,
          updatedAt: now,
        });

        showToast('success', 'Client added successfully / নতুন ক্লায়েন্ট যুক্ত হয়েছে।');
      }

      setIsModalOpen(false);
      setEditingClient(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      const op = editingClient ? OperationType.UPDATE : OperationType.CREATE;
      const targetPath = editingClient ? `${clientsPath}/${editingClient.id}` : clientsPath;
      try {
        handleFirestoreError(error, op, targetPath);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to save client / ক্লায়েন্ট সংরক্ষণ করতে ব্যর্থ হয়েছে।';
        setFormError(message);
        showToast('error', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    setDeleting(true);
    try {
      await deleteDoc(getClientDoc(deletingClient.id, tenantId));
      showToast('success', 'Client deleted / ক্লায়েন্ট মুছে ফেলা হয়েছে।');
      setDeletingClient(null);
    } catch (error) {
      try {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `${clientsPath}/${deletingClient.id}`
        );
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete client / ক্লায়েন্ট মুছতে ব্যর্থ হয়েছে।';
        showToast('error', message);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (ledgerViewOpen) {
    return (
      <ClientLedger
        initialClientId={ledgerClientId}
        onBack={() => {
          setLedgerViewOpen(false);
          setLedgerClientId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Banner */}
      {toast && (
        <div
          role="alert"
          className={`fixed bottom-5 right-5 z-50 max-w-md flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-floating backdrop-blur-xl transition-all ${
            toast.type === 'error'
              ? 'bg-[#FDECEF]/95 border-[#EA7185]/40 text-[#B4384E]'
              : 'bg-[#E5F8F1]/95 border-[#38C99A]/40 text-[#1D7F5F]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#EA7185]" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#38C99A]" />
          )}
          <p className="text-xs sm:text-sm font-semibold leading-snug flex-1">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="p-0.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17383B]">
            Clients / ক্লায়েন্ট তালিকা
          </h1>
          <p className="text-xs sm:text-sm text-[#688285] mt-1">
            Manage client profiles and running dues / ক্লায়েন্টের তথ্য ও বকেয়া হিসাব পরিচালনা করুন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-open-client-ledger"
            onClick={() => {
              setLedgerClientId(null);
              setLedgerViewOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-[#17383B] text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#0B9FA5]" />
            <span>Ledger / লেজার</span>
          </button>

          <button
            type="button"
            id="btn-receive-payment"
            onClick={() => {
              setPaymentClientId(null);
              setIsPaymentModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#0B9FA5]/35 bg-white hover:bg-[#DDF4F3]/60 text-[#0B9FA5] text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <Banknote className="w-4 h-4" />
            <span>Receive Payment / পেমেন্ট গ্রহণ</span>
          </button>

          <button
            type="button"
            id="btn-add-client"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold shadow-[0_6px_20px_rgba(11,159,165,0.28)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client / নতুন ক্লায়েন্ট</span>
          </button>
        </div>
      </div>

      {/* Summary Strip + Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Total Clients / মোট ক্লায়েন্ট
            </p>
            <p className="text-xl font-extrabold text-[#17383B] tabular-nums mt-0.5">
              {clients.length}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#FFF3DF] text-[#D9822B] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Total Current Due / মোট বকেয়া
            </p>
            <p className="text-xl font-extrabold text-[#17383B] tabular-nums mt-0.5">
              {formatBDT(totalCurrentDue)}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name or Mobile / নাম বা মোবাইল দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] placeholder:text-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="p-1 text-[#8EA3A5] hover:text-[#17383B] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 border-3 border-[#0B9FA5] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-[#688285]">
              Loading clients... / ক্লায়েন্ট তথ্য লোড হচ্ছে...
            </p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#17383B]">
              {searchTerm
                ? 'No matching clients / কোনো ক্লায়েন্ট পাওয়া যায়নি'
                : 'No clients added yet / এখনো কোনো ক্লায়েন্ট যুক্ত করা হয়নি'}
            </h3>
            <p className="text-xs sm:text-sm text-[#688285] mt-1 max-w-md">
              {searchTerm
                ? 'Try a different name or mobile number.'
                : 'Click "Add Client / নতুন ক্লায়েন্ট" to create your first client ledger.'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client / নতুন ক্লায়েন্ট</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/80 text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                  <th className="py-3.5 px-5">Name / নাম</th>
                  <th className="py-3.5 px-5">Company / কোম্পানি</th>
                  <th className="py-3.5 px-5">Mobile / মোবাইল</th>
                  <th className="py-3.5 px-5 text-right">Current Due / বর্তমান বকেয়া</th>
                  <th className="py-3.5 px-5 text-right">Actions / অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1] text-sm">
                {filteredClients.map((client) => {
                  const due = Number(client.currentDue) || 0;
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[#F1FAFA]/60 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-[#17383B]">{client.name}</div>
                        {client.email && (
                          <div className="text-xs text-[#688285] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-[#8EA3A5]" />
                            <span>{client.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[#17383B]">
                          {client.companyName || '—'}
                        </div>
                        {client.address && (
                          <div className="text-xs text-[#688285] flex items-center gap-1 mt-0.5 max-w-xs truncate">
                            <MapPin className="w-3 h-3 text-[#8EA3A5] shrink-0" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#17383B] tabular-nums">
                        {client.mobile ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#0B9FA5]" />
                            <span>{client.mobile}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right tabular-nums">
                        <span
                          className={`inline-block font-extrabold ${
                            due > 0
                              ? 'text-[#C94A60]'
                              : due < 0
                                ? 'text-[#229A73]'
                                : 'text-[#17383B]'
                          }`}
                        >
                          {formatBDT(due)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setLedgerClientId(client.id);
                              setLedgerViewOpen(true);
                            }}
                            title="View Ledger / লেজার দেখুন"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#8178F2]/35 bg-[#EEEBFF]/70 hover:bg-[#EEEBFF] text-[#5B52D6] text-xs font-bold transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Ledger</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentClientId(client.id);
                              setIsPaymentModalOpen(true);
                            }}
                            title="Receive Payment / পেমেন্ট গ্রহণ"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#38C99A]/40 bg-[#E5F8F1]/70 hover:bg-[#E5F8F1] text-[#1D7F5F] text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pay</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(client)}
                            title="Edit / এডিট"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9EAEB] bg-white hover:bg-[#DDF4F3]/60 text-[#0B9FA5] text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingClient(client)}
                            title="Delete / মুছুন"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EA7185]/30 bg-white hover:bg-[#FDECEF] text-[#EA7185] text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-modal-title"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]/70">
              <h2 id="client-modal-title" className="text-lg font-extrabold text-[#17383B]">
                {editingClient
                  ? 'Edit Client / ক্লায়েন্ট এডিট করুন'
                  : 'Add Client / নতুন ক্লায়েন্ট যুক্ত করুন'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close modal"
                className="p-1.5 rounded-lg hover:bg-black/5 text-[#688285] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-[#FDECEF] border border-[#EA7185]/35 text-xs font-semibold text-[#C94A60] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EA7185]" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label htmlFor="client-name" className="block text-xs font-bold text-[#17383B] mb-1">
                  Name / নাম <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  id="client-name"
                  type="text"
                  required
                  maxLength={160}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Md. Rafiqul Islam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="client-company" className="block text-xs font-bold text-[#17383B] mb-1">
                    Company / কোম্পানি
                  </label>
                  <input
                    id="client-company"
                    type="text"
                    maxLength={200}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="e.g. Padma Textiles Ltd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>

                <div>
                  <label htmlFor="client-mobile" className="block text-xs font-bold text-[#17383B] mb-1">
                    Mobile / মোবাইল
                  </label>
                  <input
                    id="client-mobile"
                    type="tel"
                    maxLength={40}
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="+880 17XX-XXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="client-email" className="block text-xs font-bold text-[#17383B] mb-1">
                    Email / ইমেইল
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    maxLength={200}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="client@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>

                <div>
                  <label htmlFor="client-opening-due" className="block text-xs font-bold text-[#17383B] mb-1">
                    Opening Due / প্রারম্ভিক বকেয়া (৳)
                  </label>
                  <input
                    id="client-opening-due"
                    type="number"
                    step="any"
                    value={form.openingDue}
                    onChange={(e) => setForm({ ...form, openingDue: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="client-address" className="block text-xs font-bold text-[#17383B] mb-1">
                  Address / ঠিকানা
                </label>
                <input
                  id="client-address"
                  type="text"
                  maxLength={400}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Factory / office address"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                />
              </div>

              <div>
                <label htmlFor="client-notes" className="block text-xs font-bold text-[#17383B] mb-1">
                  Notes / নোট
                </label>
                <textarea
                  id="client-notes"
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Payment terms, special instructions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E6F0F1]">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs sm:text-sm font-bold text-[#688285] transition-colors cursor-pointer"
                >
                  Cancel / বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-[0_6px_18px_rgba(11,159,165,0.25)] transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {editingClient
                      ? 'Update Client / আপডেট করুন'
                      : 'Save Client / সংরক্ষণ করুন'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#D9EAEB] shadow-floating p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDECEF] text-[#EA7185] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#17383B]">
                  Delete Client / ক্লায়েন্ট মুছুন
                </h3>
                <p className="text-xs sm:text-sm text-[#688285] mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-bold text-[#17383B]">{deletingClient.name}</span>? This
                  action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClient(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs sm:text-sm font-bold text-[#688285] cursor-pointer"
              >
                Cancel / বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-[#EA7185] hover:bg-[#d85c71] disabled:opacity-60 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
              >
                {deleting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Delete / মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Client Payment Modal (Firestore runTransaction) */}
      <FirestoreClientPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentClientId(null);
        }}
        clients={clients}
        initialClientId={paymentClientId}
        onSuccess={(msg) => showToast('success', msg)}
        onError={(msg) => showToast('error', msg)}
      />
    </div>
  );
};

export default Clients;
