import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Edit3,
  MapPin,
  Package,
  Phone,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { FirestorePurchaseModal } from '../components/suppliers/FirestorePurchaseModal';
import { FirestoreSupplierPaymentModal } from '../components/suppliers/FirestoreSupplierPaymentModal';
import { useAuth } from '../contexts/AuthContext';
import {
  getPurchasesCollection,
  getSupplierDoc,
  getSuppliersCollection,
  getTenantId,
  TENANTS_COLLECTION,
  TENANT_SUBCOLLECTIONS,
} from '../lib/db';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import type { FirestoreTimestamp, Purchase, Supplier, WithId } from '../types/database';

interface SupplierFormState {
  name: string;
  companyName: string;
  address: string;
  mobile: string;
  product: string;
  openingDue: string;
}

const EMPTY_FORM: SupplierFormState = {
  name: '',
  companyName: '',
  address: '',
  mobile: '',
  product: '',
  openingDue: '0',
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

const formatDateValue = (val: FirestoreTimestamp | undefined | null): string => {
  if (!val) return '—';
  if (typeof val === 'string') return val.trim() || '—';
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (val instanceof Timestamp) return val.toDate().toISOString().slice(0, 10);
  if (typeof (val as unknown as { toDate?: () => Date }).toDate === 'function') {
    return (val as unknown as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  }
  return '—';
};

export const Suppliers: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const tenantId = getTenantId();
  const suppliersPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.suppliers}`;
  const purchasesPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.purchases}`;

  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchases'>('suppliers');

  const [suppliers, setSuppliers] = useState<WithId<Supplier>[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [purchases, setPurchases] = useState<WithId<Purchase>[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState<boolean>(true);
  const [purchaseSearch, setPurchaseSearch] = useState<string>('');

  // Add / Edit Supplier modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<WithId<Supplier> | null>(null);
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete confirmation modal state
  const [deletingSupplier, setDeletingSupplier] = useState<WithId<Supplier> | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Purchase entry modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState<string | null>(null);

  // Supplier payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentSupplierId, setPaymentSupplierId] = useState<string | null>(null);
  const [paymentPurchaseId, setPaymentPurchaseId] = useState<string | null>(null);

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

  // 1. Real-time Firestore listener on tenants/{tenantId}/suppliers
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSuppliers([]);
      setSuppliersLoading(false);
      return;
    }

    setSuppliersLoading(true);
    const suppliersQuery = query(
      getSuppliersCollection(tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      suppliersQuery,
      (snapshot) => {
        setSuppliers(snapshot.docs.map((docSnap) => docSnap.data()));
        setSuppliersLoading(false);
      },
      (error) => {
        setSuppliersLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, suppliersPath);
        } catch {
          showToast(
            'error',
            error.message || 'Failed to load suppliers / সাপ্লায়ার লোড করতে ব্যর্থ হয়েছে।'
          );
        }
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, tenantId, suppliersPath]);

  // 2. Real-time Firestore listener on tenants/{tenantId}/purchases
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPurchases([]);
      setPurchasesLoading(false);
      return;
    }

    setPurchasesLoading(true);
    const purchasesQuery = query(
      getPurchasesCollection(tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      purchasesQuery,
      (snapshot) => {
        setPurchases(snapshot.docs.map((docSnap) => docSnap.data()));
        setPurchasesLoading(false);
      },
      (error) => {
        setPurchasesLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, purchasesPath);
        } catch {
          showToast(
            'error',
            error.message || 'Failed to load purchases / ক্রয় তালিকা লোড করতে ব্যর্থ হয়েছে।'
          );
        }
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, tenantId, purchasesPath]);

  const filteredSuppliers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => {
      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const companyMatch = (s.companyName || '').toLowerCase().includes(q);
      const mobileMatch = (s.mobile || '').toLowerCase().includes(q);
      const productMatch = (s.product || '').toLowerCase().includes(q);
      return nameMatch || companyMatch || mobileMatch || productMatch;
    });
  }, [suppliers, searchTerm]);

  const filteredPurchases = useMemo(() => {
    const q = purchaseSearch.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p) => {
      const noMatch = (p.purchaseNo || '').toLowerCase().includes(q);
      const supMatch = (p.supplierName || '').toLowerCase().includes(q);
      const itemMatch = (p.items || []).some((it) =>
        (it.name || '').toLowerCase().includes(q)
      );
      return noMatch || supMatch || itemMatch;
    });
  }, [purchases, purchaseSearch]);

  const totalCurrentDue = useMemo(
    () => suppliers.reduce((sum, s) => sum + (Number(s.currentDue) || 0), 0),
    [suppliers]
  );

  const totalPurchasesValue = useMemo(
    () => purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0),
    [purchases]
  );

  const openAddModal = () => {
    setEditingSupplier(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: WithId<Supplier>) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      companyName: supplier.companyName || '',
      address: supplier.address || '',
      mobile: supplier.mobile || '',
      product: supplier.product || '',
      openingDue: String(supplier.openingDue ?? 0),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormError(null);
  };

  const openPurchaseModal = (supplierId?: string | null) => {
    setPurchaseSupplierId(supplierId ?? null);
    setIsPurchaseModalOpen(true);
  };

  const openPaymentModal = (supplierId?: string | null, purchaseId?: string | null) => {
    setPaymentSupplierId(supplierId ?? null);
    setPaymentPurchaseId(purchaseId ?? null);
    setIsPaymentModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const companyName = form.companyName.trim();
    const address = form.address.trim();
    const mobile = form.mobile.trim();
    const product = form.product.trim();
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
      setFormError(
        'Opening Due must be a valid number / প্রারম্ভিক বকেয়া সঠিক সংখ্যা হতে হবে।'
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingSupplier) {
        const prevOpeningDue = Number(editingSupplier.openingDue) || 0;
        const prevCurrentDue = Number(editingSupplier.currentDue) || 0;
        const updatedCurrentDue = prevCurrentDue + (openingDueNum - prevOpeningDue);

        await updateDoc(getSupplierDoc(editingSupplier.id, tenantId), {
          name: name.slice(0, 160),
          companyName: companyName.slice(0, 200),
          address: address.slice(0, 400),
          mobile: mobile.slice(0, 40),
          product: product.slice(0, 160),
          openingDue: openingDueNum,
          currentDue: updatedCurrentDue,
          updatedAt: serverTimestamp(),
        });

        showToast('success', 'Supplier updated successfully / সাপ্লায়ারের তথ্য আপডেট হয়েছে।');
      } else {
        const now = serverTimestamp();
        await addDoc(getSuppliersCollection(tenantId), {
          id: '',
          name: name.slice(0, 160),
          companyName: companyName.slice(0, 200),
          address: address.slice(0, 400),
          mobile: mobile.slice(0, 40),
          product: product.slice(0, 160),
          openingDue: openingDueNum,
          currentDue: openingDueNum,
          createdAt: now,
          updatedAt: now,
        });

        showToast('success', 'Supplier added successfully / নতুন সাপ্লায়ার যুক্ত হয়েছে।');
      }

      setIsModalOpen(false);
      setEditingSupplier(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      const op = editingSupplier ? OperationType.UPDATE : OperationType.CREATE;
      const targetPath = editingSupplier
        ? `${suppliersPath}/${editingSupplier.id}`
        : suppliersPath;
      try {
        handleFirestoreError(error, op, targetPath);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to save supplier / সাপ্লায়ার সংরক্ষণ করতে ব্যর্থ হয়েছে।';
        setFormError(message);
        showToast('error', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    setDeleting(true);
    try {
      await deleteDoc(getSupplierDoc(deletingSupplier.id, tenantId));
      showToast('success', 'Supplier deleted / সাপ্লায়ার মুছে ফেলা হয়েছে।');
      setDeletingSupplier(null);
    } catch (error) {
      try {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `${suppliersPath}/${deletingSupplier.id}`
        );
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete supplier / সাপ্লায়ার মুছতে ব্যর্থ হয়েছে।';
        showToast('error', message);
      }
    } finally {
      setDeleting(false);
    }
  };

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
            Suppliers & Purchases / সাপ্লায়ার ও ক্রয়
          </h1>
          <p className="text-xs sm:text-sm text-[#688285] mt-1">
            Manage chemical/raw-material suppliers, purchase entries, and running dues / সাপ্লায়ার ও ক্রয় হিসাব পরিচালনা করুন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-pay-supplier"
            onClick={() => openPaymentModal(null, null)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#38C99A]/45 bg-white hover:bg-[#E5F8F1]/70 text-[#1D7F5F] text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <Banknote className="w-4 h-4" />
            <span>Pay Supplier / পেমেন্ট প্রদান</span>
          </button>

          <button
            type="button"
            id="btn-new-purchase"
            onClick={() => openPurchaseModal(null)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#0B9FA5]/35 bg-white hover:bg-[#DDF4F3]/60 text-[#0B9FA5] text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Purchase / নতুন ক্রয়</span>
          </button>

          <button
            type="button"
            id="btn-add-supplier"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold shadow-[0_6px_20px_rgba(11,159,165,0.28)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier / নতুন সাপ্লায়ার</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Total Suppliers / মোট সাপ্লায়ার
            </p>
            <p className="text-xl font-extrabold text-[#17383B] tabular-nums mt-0.5">
              {suppliers.length}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#FFF3DF] text-[#D9822B] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Total Payable Due / মোট পাওনা বকেয়া
            </p>
            <p className="text-xl font-extrabold text-[#C94A60] tabular-nums mt-0.5">
              {formatBDT(totalCurrentDue)}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#EEEBFF] text-[#6156D6] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Total Purchases ({purchases.length}) / মোট ক্রয়
            </p>
            <p className="text-xl font-extrabold text-[#17383B] tabular-nums mt-0.5">
              {formatBDT(totalPurchasesValue)}
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher + Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-white border border-[#D9EAEB] self-start">
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-[#0B9FA5] text-white shadow-sm'
                : 'text-[#688285] hover:text-[#17383B]'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Suppliers / সাপ্লায়ার ({suppliers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-[#0B9FA5] text-white shadow-sm'
                : 'text-[#688285] hover:text-[#17383B]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Purchases / ক্রয় ইতিহাস ({purchases.length})</span>
          </button>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          {activeTab === 'suppliers' ? (
            <>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Name, Company, Mobile, Product..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs sm:text-sm font-medium text-[#17383B] placeholder:text-[#8EA3A5] focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
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
            </>
          ) : (
            <>
              <input
                type="text"
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
                placeholder="Search Purchase No, Supplier, Item..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-xs sm:text-sm font-medium text-[#17383B] placeholder:text-[#8EA3A5] focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 transition-all"
              />
              {purchaseSearch && (
                <button
                  type="button"
                  onClick={() => setPurchaseSearch('')}
                  aria-label="Clear search"
                  className="p-1 text-[#8EA3A5] hover:text-[#17383B] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'suppliers' ? (
        <div className="glass-panel rounded-3xl overflow-hidden">
          {suppliersLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <span className="w-8 h-8 border-3 border-[#0B9FA5] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs sm:text-sm font-semibold text-[#688285]">
                Loading suppliers... / সাপ্লায়ার তথ্য লোড হচ্ছে...
              </p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center mb-3">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#17383B]">
                {searchTerm
                  ? 'No matching suppliers / কোনো সাপ্লায়ার পাওয়া যায়নি'
                  : 'No suppliers added yet / এখনো কোনো সাপ্লায়ার যুক্ত করা হয়নি'}
              </h3>
              <p className="text-xs sm:text-sm text-[#688285] mt-1 max-w-md">
                {searchTerm
                  ? 'Try a different name, company, mobile, or product.'
                  : 'Click "Add Supplier / নতুন সাপ্লায়ার" to create your first supplier account.'}
              </p>
              {!searchTerm && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Supplier / নতুন সাপ্লায়ার</span>
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
                    <th className="py-3.5 px-5">Product / পণ্য</th>
                    <th className="py-3.5 px-5">Mobile / মোবাইল</th>
                    <th className="py-3.5 px-5 text-right">Current Due / বর্তমান বকেয়া</th>
                    <th className="py-3.5 px-5 text-right">Actions / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6F0F1] text-sm">
                  {filteredSuppliers.map((supplier) => {
                    const due = Number(supplier.currentDue) || 0;
                    return (
                      <tr
                        key={supplier.id}
                        className="hover:bg-[#F1FAFA]/60 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#17383B]">{supplier.name}</div>
                          <div className="text-[11px] text-[#688285] mt-0.5 tabular-nums">
                            Opening: {formatBDT(Number(supplier.openingDue) || 0)}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-medium text-[#17383B]">
                            {supplier.companyName || '—'}
                          </div>
                          {supplier.address && (
                            <div className="text-xs text-[#688285] flex items-center gap-1 mt-0.5 max-w-xs truncate">
                              <MapPin className="w-3 h-3 text-[#8EA3A5] shrink-0" />
                              <span className="truncate">{supplier.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          {supplier.product ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17383B] bg-[#F1FAFA] border border-[#D9EAEB] px-2.5 py-1 rounded-lg">
                              <Package className="w-3.5 h-3.5 text-[#0B9FA5]" />
                              <span>{supplier.product}</span>
                            </span>
                          ) : (
                            <span className="text-[#8EA3A5]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-[#17383B] tabular-nums">
                          {supplier.mobile ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#0B9FA5]" />
                              <span>{supplier.mobile}</span>
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
                              onClick={() => openPaymentModal(supplier.id, null)}
                              title="Pay Supplier / পেমেন্ট প্রদান"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#38C99A]/40 bg-[#E5F8F1]/70 hover:bg-[#E5F8F1] text-[#1D7F5F] text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Pay</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openPurchaseModal(supplier.id)}
                              title="New Purchase / নতুন ক্রয়"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#8178F2]/35 bg-[#EEEBFF]/70 hover:bg-[#EEEBFF] text-[#5B52D6] text-xs font-bold transition-colors cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Purchase</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(supplier)}
                              title="Edit / এডিট"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9EAEB] bg-white hover:bg-[#DDF4F3]/60 text-[#0B9FA5] text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSupplier(supplier)}
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
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden">
          {purchasesLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <span className="w-8 h-8 border-3 border-[#0B9FA5] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs sm:text-sm font-semibold text-[#688285]">
                Loading purchases... / ক্রয়ের তালিকা লোড হচ্ছে...
              </p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center mb-3">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#17383B]">
                {purchaseSearch
                  ? 'No matching purchases / কোনো ক্রয় পাওয়া যায়নি'
                  : 'No purchases recorded yet / এখনো কোনো ক্রয় এন্ট্রি করা হয়নি'}
              </h3>
              <p className="text-xs sm:text-sm text-[#688285] mt-1 max-w-md">
                {purchaseSearch
                  ? 'Try searching by purchase number, supplier name, or item name.'
                  : 'Click "New Purchase / নতুন ক্রয়" to record a supplier purchase.'}
              </p>
              {!purchaseSearch && (
                <button
                  type="button"
                  onClick={() => openPurchaseModal(null)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Purchase / নতুন ক্রয়</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/80 text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                    <th className="py-3.5 px-5">Purchase No / ক্রয় নং</th>
                    <th className="py-3.5 px-5">Date / তারিখ</th>
                    <th className="py-3.5 px-5">Supplier / সাপ্লায়ার</th>
                    <th className="py-3.5 px-5">Items / পণ্যের বিবরণ</th>
                    <th className="py-3.5 px-5 text-right">Total / মোট</th>
                    <th className="py-3.5 px-5 text-right">Paid / পরিশোধিত</th>
                    <th className="py-3.5 px-5 text-right">Due / বকেয়া</th>
                    <th className="py-3.5 px-5 text-right">Action / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6F0F1] text-sm">
                  {filteredPurchases.map((purchase) => {
                    const purchaseDue = Number(purchase.due) || 0;
                    return (
                      <tr
                        key={purchase.id}
                        className="hover:bg-[#F1FAFA]/60 transition-colors align-top"
                      >
                        <td className="py-3.5 px-5 font-extrabold text-[#0B9FA5] tabular-nums whitespace-nowrap">
                          {purchase.purchaseNo}
                        </td>
                        <td className="py-3.5 px-5 text-xs sm:text-sm font-medium text-[#17383B] tabular-nums whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#8EA3A5]" />
                            <span>{formatDateValue(purchase.purchaseDate)}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#17383B]">{purchase.supplierName}</div>
                          {purchase.remarks && (
                            <div className="text-xs text-[#688285] mt-0.5 max-w-xs truncate">
                              {purchase.remarks}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="space-y-1">
                            {(purchase.items || []).map((item, idx) => (
                              <div
                                key={`${purchase.id}-item-${idx}`}
                                className="text-xs text-[#17383B] flex items-center justify-between gap-3 max-w-sm"
                              >
                                <span className="font-semibold truncate">{item.name}</span>
                                <span className="text-[#688285] tabular-nums whitespace-nowrap">
                                  {item.qty} × {formatBDT(item.rate)} ={' '}
                                  <strong className="text-[#17383B]">
                                    {formatBDT(item.amount)}
                                  </strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-[#17383B] tabular-nums whitespace-nowrap">
                          {formatBDT(Number(purchase.total) || 0)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-[#229A73] tabular-nums whitespace-nowrap">
                          {formatBDT(Number(purchase.paid) || 0)}
                        </td>
                        <td
                          className={`py-3.5 px-5 text-right font-extrabold tabular-nums whitespace-nowrap ${
                            purchaseDue > 0 ? 'text-[#C94A60]' : 'text-[#229A73]'
                          }`}
                        >
                          {formatBDT(Math.max(0, purchaseDue))}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          {purchaseDue > 0 ? (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(purchase.supplierId, purchase.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#38C99A]/40 bg-[#E5F8F1]/80 hover:bg-[#E5F8F1] text-[#1D7F5F] text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E5F8F1] text-[#1D7F5F] text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Paid</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supplier-modal-title"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]/70">
              <h2 id="supplier-modal-title" className="text-lg font-extrabold text-[#17383B]">
                {editingSupplier
                  ? 'Edit Supplier / সাপ্লায়ার এডিট করুন'
                  : 'Add Supplier / নতুন সাপ্লায়ার যুক্ত করুন'}
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
                <label htmlFor="supplier-name" className="block text-xs font-bold text-[#17383B] mb-1">
                  Name / নাম <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  id="supplier-name"
                  type="text"
                  required
                  maxLength={160}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Md. Kamal Hossain"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="supplier-company" className="block text-xs font-bold text-[#17383B] mb-1">
                    Company / কোম্পানি
                  </label>
                  <input
                    id="supplier-company"
                    type="text"
                    maxLength={200}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="e.g. Bengal Chemicals Ltd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>

                <div>
                  <label htmlFor="supplier-mobile" className="block text-xs font-bold text-[#17383B] mb-1">
                    Mobile / মোবাইল
                  </label>
                  <input
                    id="supplier-mobile"
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
                  <label htmlFor="supplier-product" className="block text-xs font-bold text-[#17383B] mb-1">
                    Product / সরবরাহকৃত পণ্য
                  </label>
                  <input
                    id="supplier-product"
                    type="text"
                    maxLength={160}
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    placeholder="e.g. Dyes, Caustic Soda, Fuel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>

                <div>
                  <label htmlFor="supplier-opening-due" className="block text-xs font-bold text-[#17383B] mb-1">
                    Opening Due / প্রারম্ভিক বকেয়া (৳)
                  </label>
                  <input
                    id="supplier-opening-due"
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
                <label htmlFor="supplier-address" className="block text-xs font-bold text-[#17383B] mb-1">
                  Address / ঠিকানা
                </label>
                <input
                  id="supplier-address"
                  type="text"
                  maxLength={400}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Office / warehouse address"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
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
                    {editingSupplier
                      ? 'Update Supplier / আপডেট করুন'
                      : 'Save Supplier / সংরক্ষণ করুন'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSupplier && (
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
                  Delete Supplier / সাপ্লায়ার মুছুন
                </h3>
                <p className="text-xs sm:text-sm text-[#688285] mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-bold text-[#17383B]">{deletingSupplier.name}</span>? This
                  action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
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

      {/* Purchase Entry Modal (Firestore runTransaction) */}
      <FirestorePurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setPurchaseSupplierId(null);
        }}
        suppliers={suppliers}
        initialSupplierId={purchaseSupplierId}
        onSuccess={(msg) => showToast('success', msg)}
        onError={(msg) => showToast('error', msg)}
      />

      {/* Supplier Payment Modal (Firestore runTransaction + Thermal Voucher) */}
      <FirestoreSupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentSupplierId(null);
          setPaymentPurchaseId(null);
        }}
        suppliers={suppliers}
        initialSupplierId={paymentSupplierId}
        initialPurchaseId={paymentPurchaseId}
        onSuccess={(msg) => showToast('success', msg)}
        onError={(msg) => showToast('error', msg)}
      />
    </div>
  );
};

export default Suppliers;
