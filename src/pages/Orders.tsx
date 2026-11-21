import React, { useEffect, useMemo, useState } from 'react';
import {
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  Filter,
  Package,
  Plus,
  Ruler,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getClientsCollection,
  getCounterDoc,
  getOrderDoc,
  getOrdersCollection,
  getTenantId,
  TENANTS_COLLECTION,
  TENANT_SUBCOLLECTIONS,
} from '../lib/db';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { Client, FirestoreTimestamp, Order, OrderStatus, WithId } from '../types/database';

const FABRIC_TYPES = [
  'মার্কিন',
  'লংক্লথ',
  'ভয়েল',
  'পপলিন',
  'ইউনিটিকা',
  'আস্তর',
  'অন্যান্য',
] as const;

const PROCESSING_PRESETS = [
  'Washing / ওয়াশিং',
  'Bleaching / ব্লিচিং',
  'Dyeing / ডাইং',
  'Mercerizing / মার্সারাইজিং',
  'Finishing / ফিনিশিং',
  'Enzyme Wash / এনজাইম ওয়াশ',
];

const ORDER_STATUS_OPTIONS: Array<{
  value: OrderStatus;
  label: string;
  badgeClass: string;
}> = [
  { value: 'received', label: 'Received / গৃহীত', badgeClass: 'bg-[#E6F4FE] text-[#0277BD] border-[#B3E5FC]' },
  { value: 'processing', label: 'Processing / প্রসেসিং', badgeClass: 'bg-[#FFF3DF] text-[#B76E15] border-[#F8D7A4]' },
  { value: 'washing', label: 'Washing / ওয়াশিং', badgeClass: 'bg-[#DDF4F3] text-[#0B9FA5] border-[#A7E2DF]' },
  { value: 'dyeing', label: 'Dyeing / ডাইং', badgeClass: 'bg-[#EEEBFF] text-[#6156D6] border-[#D2CDFC]' },
  { value: 'finishing', label: 'Finishing / ফিনিশিং', badgeClass: 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' },
  { value: 'ready', label: 'Ready / প্রস্তুত', badgeClass: 'bg-[#E0F7FA] text-[#00838F] border-[#B2EBF2]' },
  { value: 'delivered', label: 'Delivered / ডেলিভারড', badgeClass: 'bg-[#E5F8F1] text-[#1D7F5F] border-[#A6E6CE]' },
  { value: 'cancelled', label: 'Cancelled / বাতিল', badgeClass: 'bg-[#FDECEF] text-[#C94A60] border-[#F6C2CB]' },
];

const getTodayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

const formatBDT = (amount: number): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `৳ ${safe.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const getStatusStyle = (status: OrderStatus): string => {
  const found = ORDER_STATUS_OPTIONS.find((s) => s.value === status);
  return found?.badgeClass || 'bg-[#F1FAFA] text-[#17383B] border-[#D9EAEB]';
};

interface OrderFormState {
  clientId: string;
  orderDate: string;
  deliveryDate: string;
  fabricType: string;
  processingType: string;
  colorQuality: string;
  greyThan: string;
  greyGaz: string;
  ratePerGaz: string;
  status: OrderStatus;
  specialInstruction: string;
}

const createEmptyForm = (): OrderFormState => ({
  clientId: '',
  orderDate: getTodayIso(),
  deliveryDate: '',
  fabricType: FABRIC_TYPES[0],
  processingType: '',
  colorQuality: '',
  greyThan: '0',
  greyGaz: '0',
  ratePerGaz: '0',
  status: 'received',
  specialInstruction: '',
});

interface ToastState {
  type: 'error' | 'success';
  message: string;
}

export const Orders: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const tenantId = getTenantId();
  const ordersPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.orders}`;
  const clientsPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.clients}`;

  const [orders, setOrders] = useState<WithId<Order>[]>([]);
  const [clients, setClients] = useState<WithId<Client>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [clientsLoading, setClientsLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<WithId<Order> | null>(null);
  const [form, setForm] = useState<OrderFormState>(createEmptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Row status update state
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Delete confirmation modal
  const [deletingOrder, setDeletingOrder] = useState<WithId<Order> | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 1. Real-time Firestore listener for orders
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersQuery = query(
      getOrdersCollection(tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        setOrders(snapshot.docs.map((docSnap) => docSnap.data()));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, ordersPath);
        } catch {
          showToast(
            'error',
            error.message || 'Failed to load orders / অর্ডার লোড করতে ব্যর্থ হয়েছে।'
          );
        }
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, tenantId, ordersPath]);

  // 2. Fetch clients ONCE for dropdown & filter
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setClients([]);
      setClientsLoading(false);
      return;
    }

    let cancelled = false;
    setClientsLoading(true);

    getDocs(query(getClientsCollection(tenantId), orderBy('name', 'asc')))
      .then((snapshot) => {
        if (cancelled) return;
        setClients(snapshot.docs.map((docSnap) => docSnap.data()));
        setClientsLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setClientsLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, clientsPath);
        } catch {
          showToast(
            'error',
            error.message || 'Failed to load clients / ক্লায়েন্ট তালিকা লোড করতে ব্যর্থ হয়েছে।'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, tenantId, clientsPath]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (clientFilter !== 'all' && order.clientId !== clientFilter) return false;
      if (q) {
        const orderNoMatch = (order.orderNo || '').toLowerCase().includes(q);
        const clientMatch = (order.clientName || '').toLowerCase().includes(q);
        const fabricMatch = (order.fabricType || '').toLowerCase().includes(q);
        if (!orderNoMatch && !clientMatch && !fabricMatch) return false;
      }
      return true;
    });
  }, [orders, statusFilter, clientFilter, searchTerm]);

  const totalGreyGaz = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (Number(o.greyGaz) || 0), 0),
    [filteredOrders]
  );

  const estimatedFormTotal = useMemo(() => {
    const gaz = Number(form.greyGaz) || 0;
    const rate = Number(form.ratePerGaz) || 0;
    return gaz * rate;
  }, [form.greyGaz, form.ratePerGaz]);

  const openNewModal = () => {
    setEditingOrder(null);
    setForm({
      ...createEmptyForm(),
      clientId: clients[0]?.id || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (order: WithId<Order>) => {
    setEditingOrder(order);
    setForm({
      clientId: order.clientId || '',
      orderDate: formatDateValue(order.orderDate) === '—' ? getTodayIso() : formatDateValue(order.orderDate),
      deliveryDate: formatDateValue(order.deliveryDate) === '—' ? '' : formatDateValue(order.deliveryDate),
      fabricType: order.fabricType || FABRIC_TYPES[0],
      processingType: order.processingType || '',
      colorQuality: order.colorQuality || '',
      greyThan: String(order.greyThan ?? 0),
      greyGaz: String(order.greyGaz ?? 0),
      ratePerGaz: String(order.ratePerGaz ?? 0),
      status: order.status || 'received',
      specialInstruction: order.specialInstruction || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingOrder(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = clients.find((c) => c.id === form.clientId);
    const clientId = form.clientId.trim();
    const clientName = (selectedClient?.name || editingOrder?.clientName || '').trim();
    const orderDate = form.orderDate.trim() || getTodayIso();
    const deliveryDate = form.deliveryDate.trim();
    const fabricType = form.fabricType.trim() || FABRIC_TYPES[0];
    const processingType = form.processingType.trim();
    const colorQuality = form.colorQuality.trim();
    const specialInstruction = form.specialInstruction.trim();
    const greyThan = form.greyThan.trim() === '' ? 0 : Number(form.greyThan);
    const greyGaz = form.greyGaz.trim() === '' ? 0 : Number(form.greyGaz);
    const ratePerGaz = form.ratePerGaz.trim() === '' ? 0 : Number(form.ratePerGaz);

    if (!clientId || !clientName) {
      setFormError('Please select a client / অনুগ্রহ করে একটি ক্লায়েন্ট নির্বাচন করুন।');
      return;
    }
    if (!Number.isFinite(greyThan) || greyThan < 0) {
      setFormError('Grey Than must be a valid non-negative number.');
      return;
    }
    if (!Number.isFinite(greyGaz) || greyGaz < 0) {
      setFormError('Grey Gaz must be a valid non-negative number.');
      return;
    }
    if (!Number.isFinite(ratePerGaz) || ratePerGaz < 0) {
      setFormError('Rate per Gaz must be a valid non-negative number.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingOrder) {
        await updateDoc(getOrderDoc(editingOrder.id, tenantId), {
          clientId,
          clientName: clientName.slice(0, 160),
          orderDate,
          deliveryDate,
          fabricType: fabricType.slice(0, 120),
          processingType: processingType.slice(0, 120),
          colorQuality: colorQuality.slice(0, 120),
          greyThan,
          greyGaz,
          ratePerGaz,
          status: form.status,
          specialInstruction: specialInstruction.slice(0, 1000),
          updatedAt: serverTimestamp(),
        });

        showToast(
          'success',
          `Order ${editingOrder.orderNo} updated / অর্ডার আপডেট হয়েছে।`
        );
      } else {
        // Atomic transaction: read & increment tenants/{tenantId}/counters/orders, then create order
        const generatedOrderNo = await runTransaction(db, async (transaction) => {
          const counterRef = getCounterDoc('orders', tenantId);
          const counterSnap = await transaction.get(counterRef);
          const currentVal = counterSnap.exists()
            ? Number(counterSnap.data().current) || 0
            : 0;
          const nextSeq = currentVal + 1;
          const year = new Date().getFullYear();
          const orderNo = `ORD-${year}-${String(nextSeq).padStart(4, '0')}`;

          const now = serverTimestamp();

          transaction.set(counterRef, {
            id: 'orders',
            current: nextSeq,
            updatedAt: now,
          });

          const newOrderRef = doc(getOrdersCollection(tenantId));
          transaction.set(newOrderRef, {
            id: newOrderRef.id,
            orderNo,
            clientId,
            clientName: clientName.slice(0, 160),
            orderDate,
            deliveryDate,
            fabricType: fabricType.slice(0, 120),
            processingType: processingType.slice(0, 120),
            colorQuality: colorQuality.slice(0, 120),
            greyThan,
            greyGaz,
            ratePerGaz,
            status: 'received',
            specialInstruction: specialInstruction.slice(0, 1000),
            createdAt: now,
            updatedAt: now,
          });

          return orderNo;
        });

        showToast(
          'success',
          `Order ${generatedOrderNo} created / নতুন অর্ডার তৈরি হয়েছে।`
        );
      }

      setIsModalOpen(false);
      setEditingOrder(null);
      setForm(createEmptyForm());
    } catch (error) {
      const op = editingOrder ? OperationType.UPDATE : OperationType.CREATE;
      const targetPath = editingOrder ? `${ordersPath}/${editingOrder.id}` : ordersPath;
      try {
        handleFirestoreError(error, op, targetPath);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to save order / অর্ডার সংরক্ষণ করতে ব্যর্থ হয়েছে।';
        setFormError(message);
        showToast('error', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (order: WithId<Order>, nextStatus: OrderStatus) => {
    if (order.status === nextStatus) return;
    setUpdatingStatusId(order.id);
    try {
      await updateDoc(getOrderDoc(order.id, tenantId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(
        'success',
        `${order.orderNo} status updated / স্ট্যাটাস আপডেট হয়েছে।`
      );
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `${ordersPath}/${order.id}`);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update status / স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।';
        showToast('error', message);
      }
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    setDeleting(true);
    try {
      await deleteDoc(getOrderDoc(deletingOrder.id, tenantId));
      showToast(
        'success',
        `Order ${deletingOrder.orderNo} deleted / অর্ডার মুছে ফেলা হয়েছে।`
      );
      setDeletingOrder(null);
    } catch (error) {
      try {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `${ordersPath}/${deletingOrder.id}`
        );
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to delete order / অর্ডার মুছতে ব্যর্থ হয়েছে।';
        showToast('error', message);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Notification */}
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
            Orders / অর্ডার তালিকা
          </h1>
          <p className="text-xs sm:text-sm text-[#688285] mt-1">
            Track grey fabric intake, processing stages, and delivery schedules / গ্রে কাপড় গ্রহণ ও প্রোডাকশন অর্ডার পরিচালনা করুন
          </p>
        </div>

        <button
          type="button"
          id="btn-new-order"
          onClick={openNewModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold shadow-[0_6px_20px_rgba(11,159,165,0.28)] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Order / নতুন অর্ডার</span>
        </button>
      </div>

      {/* Summary Cards + Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Orders Shown / অর্ডার সংখ্যা
            </p>
            <p className="text-xl font-extrabold text-[#17383B] tabular-nums mt-0.5">
              {filteredOrders.length}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#EEEBFF] text-[#6156D6] flex items-center justify-center shrink-0">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Total Grey Gaz / মোট গ্রে গজ
            </p>
            <p className="text-xl font-extrabold text-[#17383B] tabular-nums mt-0.5">
              {totalGreyGaz.toLocaleString('en-BD')}
            </p>
          </div>
        </div>

        {/* Filter by Status */}
        <div className="glass-panel rounded-2xl p-3.5 flex flex-col justify-center">
          <label
            htmlFor="filter-order-status"
            className="text-[10px] font-bold uppercase tracking-wider text-[#688285] mb-1 flex items-center gap-1"
          >
            <Filter className="w-3 h-3 text-[#0B9FA5]" />
            <span>Status / স্ট্যাটাস</span>
          </label>
          <select
            id="filter-order-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
          >
            <option value="all">All Statuses / সকল স্ট্যাটাস</option>
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Client */}
        <div className="glass-panel rounded-2xl p-3.5 flex flex-col justify-center">
          <label
            htmlFor="filter-order-client"
            className="text-[10px] font-bold uppercase tracking-wider text-[#688285] mb-1 flex items-center gap-1"
          >
            <Filter className="w-3 h-3 text-[#0B9FA5]" />
            <span>Client / ক্লায়েন্ট</span>
          </label>
          <select
            id="filter-order-client"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none"
          >
            <option value="all">All Clients / সকল ক্লায়েন্ট</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.companyName ? ` (${c.companyName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="glass-panel rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8EA3A5] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order No, Client, or Fabric / অর্ডার নং, ক্লায়েন্ট বা কাপড় খুঁজুন..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] placeholder:text-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
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

        {(statusFilter !== 'all' || clientFilter !== 'all' || searchTerm) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setClientFilter('all');
              setSearchTerm('');
            }}
            className="px-3.5 py-2 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs font-bold text-[#688285] transition-colors cursor-pointer shrink-0"
          >
            Reset Filters / রিসেট
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 border-3 border-[#0B9FA5] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-[#688285]">
              Loading orders... / অর্ডার লোড হচ্ছে...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#17383B]">
              {orders.length > 0
                ? 'No matching orders / কোনো অর্ডার পাওয়া যায়নি'
                : 'No orders yet / এখনো কোনো অর্ডার নেই'}
            </h3>
            <p className="text-xs sm:text-sm text-[#688285] mt-1 max-w-md">
              {orders.length > 0
                ? 'Adjust your status, client, or search filters.'
                : 'Click "New Order / নতুন অর্ডার" to create your first production lot.'}
            </p>
            {orders.length === 0 && (
              <button
                type="button"
                onClick={openNewModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Order / নতুন অর্ডার</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/80 text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                  <th className="py-3.5 px-4">Order No / অর্ডার নং</th>
                  <th className="py-3.5 px-4">Client / ক্লায়েন্ট</th>
                  <th className="py-3.5 px-4">Order Date / তারিখ</th>
                  <th className="py-3.5 px-4">Delivery Date / ডেলিভারি</th>
                  <th className="py-3.5 px-4">Fabric / কাপড়</th>
                  <th className="py-3.5 px-4 text-right">Grey Gaz / গ্রে গজ</th>
                  <th className="py-3.5 px-4 text-right">Rate / দর</th>
                  <th className="py-3.5 px-4">Status / স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">Actions / অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1] text-sm">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#F1FAFA]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-[#0B9FA5] tabular-nums">
                        {order.orderNo}
                      </span>
                      {order.processingType && (
                        <div className="text-[11px] text-[#688285] mt-0.5 max-w-[160px] truncate">
                          {order.processingType}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#17383B]">{order.clientName}</div>
                      {order.colorQuality && (
                        <div className="text-[11px] text-[#688285] mt-0.5">
                          {order.colorQuality}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-[#17383B] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8EA3A5]" />
                        {formatDateValue(order.orderDate)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-[#688285] tabular-nums">
                      {formatDateValue(order.deliveryDate)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#17383B]">{order.fabricType}</div>
                      {Number(order.greyThan) > 0 && (
                        <div className="text-[11px] text-[#688285] tabular-nums">
                          {order.greyThan} Than / থান
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#17383B] tabular-nums whitespace-nowrap">
                      {(Number(order.greyGaz) || 0).toLocaleString('en-BD')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#17383B] tabular-nums whitespace-nowrap">
                      {formatBDT(Number(order.ratePerGaz) || 0)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        aria-label={`Change status for ${order.orderNo}`}
                        value={order.status}
                        disabled={updatingStatusId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value as OrderStatus)
                        }
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/25 disabled:opacity-50 ${getStatusStyle(order.status)}`}
                      >
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-white text-[#17383B]"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(order)}
                          title="Edit / এডিট"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9EAEB] bg-white hover:bg-[#DDF4F3]/60 text-[#0B9FA5] text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingOrder(order)}
                          title="Delete / মুছুন"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EA7185]/30 bg-white hover:bg-[#FDECEF] text-[#EA7185] text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New / Edit Order Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]/70">
              <div>
                <h2 id="order-modal-title" className="text-lg font-extrabold text-[#17383B]">
                  {editingOrder
                    ? `Edit Order (${editingOrder.orderNo}) / অর্ডার এডিট করুন`
                    : 'New Order / নতুন অর্ডার তৈরি করুন'}
                </h2>
                {!editingOrder && (
                  <p className="text-[11px] font-medium text-[#688285] mt-0.5">
                    Order number (ORD-{new Date().getFullYear()}-XXXX) is auto-generated on save
                  </p>
                )}
              </div>
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-[#FDECEF] border border-[#EA7185]/35 text-xs font-semibold text-[#C94A60] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EA7185]" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Client Dropdown */}
              <div>
                <label htmlFor="order-client" className="block text-xs font-bold text-[#17383B] mb-1">
                  Client / ক্লায়েন্ট <span className="text-[#EA7185]">*</span>
                </label>
                <select
                  id="order-client"
                  required
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  disabled={clientsLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                >
                  <option value="">
                    {clientsLoading
                      ? 'Loading clients...'
                      : clients.length === 0
                        ? 'No clients found — add a client first'
                        : 'Select Client / ক্লায়েন্ট নির্বাচন করুন'}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.companyName ? ` — ${c.companyName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Date & Delivery Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="order-date" className="block text-xs font-bold text-[#17383B] mb-1">
                    Order Date / অর্ডার তারিখ <span className="text-[#EA7185]">*</span>
                  </label>
                  <input
                    id="order-date"
                    type="date"
                    required
                    value={form.orderDate}
                    onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>

                <div>
                  <label htmlFor="order-delivery-date" className="block text-xs font-bold text-[#17383B] mb-1">
                    Delivery Date / ডেলিভারি তারিখ
                  </label>
                  <input
                    id="order-delivery-date"
                    type="date"
                    value={form.deliveryDate}
                    onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>
              </div>

              {/* Fabric Type, Processing Type, Color/Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="order-fabric" className="block text-xs font-bold text-[#17383B] mb-1">
                    Fabric Type / কাপড়ের ধরন <span className="text-[#EA7185]">*</span>
                  </label>
                  <select
                    id="order-fabric"
                    required
                    value={form.fabricType}
                    onChange={(e) => setForm({ ...form, fabricType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  >
                    {FABRIC_TYPES.map((fabric) => (
                      <option key={fabric} value={fabric}>
                        {fabric}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="order-processing" className="block text-xs font-bold text-[#17383B] mb-1">
                    Processing Type / প্রসেসিং
                  </label>
                  <input
                    id="order-processing"
                    type="text"
                    list="processing-type-presets"
                    maxLength={120}
                    value={form.processingType}
                    onChange={(e) => setForm({ ...form, processingType: e.target.value })}
                    placeholder="e.g. Bleaching / Dyeing"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                  <datalist id="processing-type-presets">
                    {PROCESSING_PRESETS.map((preset) => (
                      <option key={preset} value={preset} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="order-color" className="block text-xs font-bold text-[#17383B] mb-1">
                    Color / Quality / রঙ ও মান
                  </label>
                  <input
                    id="order-color"
                    type="text"
                    maxLength={120}
                    value={form.colorQuality}
                    onChange={(e) => setForm({ ...form, colorQuality: e.target.value })}
                    placeholder="e.g. Optical White / Navy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>
              </div>

              {/* Grey Than, Grey Gaz, Rate per Gaz */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="order-grey-than" className="block text-xs font-bold text-[#17383B] mb-1">
                    Grey Than / গ্রে থান
                  </label>
                  <input
                    id="order-grey-than"
                    type="number"
                    min="0"
                    step="any"
                    value={form.greyThan}
                    onChange={(e) => setForm({ ...form, greyThan: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>

                <div>
                  <label htmlFor="order-grey-gaz" className="block text-xs font-bold text-[#17383B] mb-1">
                    Grey Gaz / গ্রে গজ <span className="text-[#EA7185]">*</span>
                  </label>
                  <input
                    id="order-grey-gaz"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.greyGaz}
                    onChange={(e) => setForm({ ...form, greyGaz: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>

                <div>
                  <label htmlFor="order-rate" className="block text-xs font-bold text-[#17383B] mb-1">
                    Rate per Gaz / গজ প্রতি দর (৳) <span className="text-[#EA7185]">*</span>
                  </label>
                  <input
                    id="order-rate"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.ratePerGaz}
                    onChange={(e) => setForm({ ...form, ratePerGaz: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>
              </div>

              {/* Estimated Value Preview */}
              <div className="px-4 py-2.5 rounded-xl bg-[#DDF4F3]/60 border border-[#0B9FA5]/20 flex items-center justify-between text-xs font-bold text-[#17383B]">
                <span>Estimated Order Value / আনুমানিক বিল (Grey Gaz × Rate)</span>
                <span className="text-sm font-extrabold text-[#0B9FA5] tabular-nums">
                  {formatBDT(estimatedFormTotal)}
                </span>
              </div>

              {/* Status (when editing) */}
              {editingOrder && (
                <div>
                  <label htmlFor="order-status" className="block text-xs font-bold text-[#17383B] mb-1">
                    Status / স্ট্যাটাস
                  </label>
                  <select
                    id="order-status"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as OrderStatus })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  >
                    {ORDER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Special Instruction */}
              <div>
                <label
                  htmlFor="order-instruction"
                  className="block text-xs font-bold text-[#17383B] mb-1"
                >
                  Special Instruction / বিশেষ নির্দেশনা
                </label>
                <textarea
                  id="order-instruction"
                  rows={3}
                  maxLength={1000}
                  value={form.specialInstruction}
                  onChange={(e) =>
                    setForm({ ...form, specialInstruction: e.target.value })
                  }
                  placeholder="Shade matching, starching, shrinkage notes..."
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
                    {editingOrder
                      ? 'Update Order / আপডেট করুন'
                      : 'Create Order / অর্ডার সংরক্ষণ করুন'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
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
                  Delete Order / অর্ডার মুছুন
                </h3>
                <p className="text-xs sm:text-sm text-[#688285] mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-bold text-[#17383B]">{deletingOrder.orderNo}</span>{' '}
                  ({deletingOrder.clientName})? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
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
    </div>
  );
};

export default Orders;
