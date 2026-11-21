import React, { useEffect, useMemo, useState } from 'react';
import { onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle2,
  Package,
  PackageCheck,
  Printer,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDeliveriesCollection,
  getInvoicesCollection,
  getOrdersCollection,
  getTenantId,
  TENANTS_COLLECTION,
  TENANT_SUBCOLLECTIONS,
} from '../lib/db';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import type { Delivery, Invoice, Order, WithId } from '../types/database';
import {
  DeliverOrderModal,
  DeliveryTransactionResult,
} from '../components/deliveries/DeliverOrderModal';
import {
  ThermalInvoiceData,
  ThermalInvoiceModal,
} from '../components/deliveries/ThermalInvoiceModal';

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

const DELIVERABLE_STATUSES = new Set([
  'ready',
  'processing',
  'pending',
  'washing',
  'dyeing',
  'finishing',
  'partial_delivered',
  'partial delivered',
]);

const formatBDT = (amount: number): string =>
  `৳${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDateValue = (val: unknown): string => {
  if (!val) return '—';
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  }
  return String(val);
};

export const Deliveries: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const tenantId = getTenantId();

  const [orders, setOrders] = useState<WithId<Order>[]>([]);
  const [deliveries, setDeliveries] = useState<WithId<Delivery>[]>([]);
  const [invoices, setInvoices] = useState<WithId<Invoice>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ready' | 'history'>('ready');

  const [orderToDeliver, setOrderToDeliver] = useState<WithId<Order> | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<ThermalInvoiceData | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Real-time Firestore subscriptions for orders, deliveries, and invoices
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setDeliveries([]);
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let ordersLoaded = false;
    let deliveriesLoaded = false;
    const checkLoaded = () => {
      if (ordersLoaded && deliveriesLoaded) setLoading(false);
    };

    const ordersPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.orders}`;
    const deliveriesPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.deliveries}`;
    const invoicesPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.invoices}`;

    const unsubOrders = onSnapshot(
      query(getOrdersCollection(tenantId), orderBy('createdAt', 'desc')),
      (snap) => {
        setOrders(snap.docs.map((d) => d.data()));
        ordersLoaded = true;
        checkLoaded();
      },
      (error) => {
        ordersLoaded = true;
        checkLoaded();
        try {
          handleFirestoreError(error, OperationType.LIST, ordersPath);
        } catch {
          setToast({ type: 'error', message: error.message || 'Failed to load orders.' });
        }
      }
    );

    const unsubDeliveries = onSnapshot(
      query(getDeliveriesCollection(tenantId), orderBy('createdAt', 'desc')),
      (snap) => {
        setDeliveries(snap.docs.map((d) => d.data()));
        deliveriesLoaded = true;
        checkLoaded();
      },
      (error) => {
        deliveriesLoaded = true;
        checkLoaded();
        try {
          handleFirestoreError(error, OperationType.LIST, deliveriesPath);
        } catch {
          setToast({ type: 'error', message: error.message || 'Failed to load deliveries.' });
        }
      }
    );

    const unsubInvoices = onSnapshot(
      query(getInvoicesCollection(tenantId), orderBy('createdAt', 'desc')),
      (snap) => {
        setInvoices(snap.docs.map((d) => d.data()));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, invoicesPath);
        } catch {
          // Non-blocking for main list; logged via handleFirestoreError
        }
      }
    );

    return () => {
      unsubOrders();
      unsubDeliveries();
      unsubInvoices();
    };
  }, [user, authLoading, tenantId]);

  const invoiceMap = useMemo(() => {
    const map = new Map<string, WithId<Invoice>>();
    invoices.forEach((inv) => map.set(inv.id, inv));
    return map;
  }, [invoices]);

  const orderMap = useMemo(() => {
    const map = new Map<string, WithId<Order>>();
    orders.forEach((ord) => map.set(ord.id, ord));
    return map;
  }, [orders]);

  const deliverableOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((o) => {
      const normalizedStatus = String(o.status || '').toLowerCase();
      if (!DELIVERABLE_STATUSES.has(normalizedStatus)) return false;
      if (!q) return true;
      return (
        (o.orderNo || '').toLowerCase().includes(q) ||
        (o.clientName || '').toLowerCase().includes(q) ||
        (o.fabricType || '').toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm]);

  const filteredDeliveries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return deliveries;
    return deliveries.filter((d) => {
      const linkedInvoice = invoiceMap.get(d.invoiceId);
      return (
        (d.challanNo || '').toLowerCase().includes(q) ||
        (d.clientName || '').toLowerCase().includes(q) ||
        (linkedInvoice?.invoiceNo || '').toLowerCase().includes(q)
      );
    });
  }, [deliveries, invoiceMap, searchTerm]);

  const handleDeliverySuccess = (result: DeliveryTransactionResult) => {
    setOrderToDeliver(null);
    setToast({
      type: 'success',
      message: `Invoice ${result.invoiceNo} created for ৳${result.total.toLocaleString('en-BD')}`,
    });
    setInvoiceToPrint(result.invoiceData);
  };

  const handlePrintExistingDelivery = (delivery: WithId<Delivery>) => {
    const inv = invoiceMap.get(delivery.invoiceId);
    const ord = orderMap.get(delivery.orderId);
    const subtotal = inv?.subtotal ?? Number((delivery.finalGaz * delivery.ratePerGaz).toFixed(2));
    const total = inv?.total ?? subtotal;
    const previousDue = inv?.previousDue ?? 0;

    setInvoiceToPrint({
      invoiceNo: inv?.invoiceNo || delivery.invoiceId,
      challanNo: delivery.challanNo,
      orderNo: ord?.orderNo,
      clientName: delivery.clientName,
      deliveryDate: formatDateValue(delivery.deliveryDate),
      greyGaz: ord?.greyGaz,
      processedGaz: delivery.processedGaz,
      finalGaz: delivery.finalGaz,
      wastageGaz: delivery.wastageGaz,
      ratePerGaz: delivery.ratePerGaz,
      subtotal,
      discount: inv?.discount ?? 0,
      previousDue,
      total,
      currentDue: Number((previousDue + total - (inv?.paid ?? 0)).toFixed(2)),
      status: inv?.status || 'Unpaid',
      remarks: delivery.remarks,
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Banner */}
      {toast && (
        <div
          role="alert"
          className={`fixed bottom-5 right-5 z-50 max-w-md flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-floating backdrop-blur-xl ${
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
          <p className="text-xs sm:text-sm font-bold leading-snug flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="p-0.5 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17383B]">
            Deliveries &amp; Auto Invoice / ডেলিভারি ও ইনভয়েস
          </h1>
          <p className="text-xs sm:text-sm text-[#688285] mt-1">
            Atomic delivery challan, wastage calculation, auto-invoicing &amp; client ledger sync
          </p>
        </div>

        {/* View Switcher */}
        <div className="p-1 bg-white/80 border border-[#D9EAEB] rounded-2xl inline-flex items-center gap-1 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('ready')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ready'
                ? 'bg-[#0B9FA5] text-white shadow-sm'
                : 'text-[#688285] hover:text-[#17383B]'
            }`}
          >
            Ready to Deliver ({deliverableOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#0B9FA5] text-white shadow-sm'
                : 'text-[#688285] hover:text-[#17383B]'
            }`}
          >
            Delivery History ({deliveries.length})
          </button>
        </div>
      </div>

      {/* Summary & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Orders Ready / প্রসেসিং অর্ডার
            </p>
            <p className="text-xl font-extrabold text-[#17383B] tabular-nums mt-0.5">
              {deliverableOrders.length}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E5F8F1] text-[#229A73] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
              Total Deliveries / মোট ডেলিভারি
            </p>
            <p className="text-xl font-extrabold text-[#17383B] tabular-nums mt-0.5">
              {deliveries.length}
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
              placeholder="Search order, challan, client..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-xs sm:text-sm font-medium text-[#17383B] placeholder:text-[#8EA3A5] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-[#8EA3A5] hover:text-[#17383B] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 border-3 border-[#0B9FA5] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-[#688285]">
              Loading deliveries &amp; orders...
            </p>
          </div>
        ) : activeTab === 'ready' ? (
          deliverableOrders.length === 0 ? (
            <div className="py-16 px-6 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center mb-3">
                <PackageCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#17383B]">
                No pending/ready orders to deliver
              </h3>
              <p className="text-xs sm:text-sm text-[#688285] mt-1 max-w-md">
                Orders with status Ready or Processing in{' '}
                <code className="font-mono text-xs">tenants/{tenantId}/orders</code> will appear
                here with a Deliver action.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/80 text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                    <th className="py-3.5 px-5">Order No / অর্ডার</th>
                    <th className="py-3.5 px-5">Client / ক্লায়েন্ট</th>
                    <th className="py-3.5 px-5">Fabric / কাপড়</th>
                    <th className="py-3.5 px-5 text-right">Grey Gaz / গ্রে গজ</th>
                    <th className="py-3.5 px-5 text-right">Rate / দর</th>
                    <th className="py-3.5 px-5">Status / অবস্থা</th>
                    <th className="py-3.5 px-5 text-right">Action / অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6F0F1] text-sm">
                  {deliverableOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F1FAFA]/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#17383B] tabular-nums">
                        {order.orderNo}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#17383B]">
                        {order.clientName}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#688285]">
                        {order.fabricType || '—'}
                        {order.processingType ? ` • ${order.processingType}` : ''}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold tabular-nums text-[#17383B]">
                        {(Number(order.greyGaz) || 0).toLocaleString('en-BD')}
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold tabular-nums text-[#688285]">
                        {formatBDT(order.ratePerGaz)}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#DDF4F3] text-[#0B9FA5] text-[11px] font-bold capitalize">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => setOrderToDeliver(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Deliver / ডেলিভারি</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredDeliveries.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E5F8F1] text-[#229A73] flex items-center justify-center mb-3">
              <Truck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#17383B]">
              No deliveries recorded yet / এখনো কোনো ডেলিভারি হয়নি
            </h3>
            <p className="text-xs sm:text-sm text-[#688285] mt-1">
              Completed delivery challans and auto-generated invoices will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/80 text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                  <th className="py-3.5 px-5">Challan / চালান</th>
                  <th className="py-3.5 px-5">Invoice / ইনভয়েস</th>
                  <th className="py-3.5 px-5">Client / ক্লায়েন্ট</th>
                  <th className="py-3.5 px-5">Date / তারিখ</th>
                  <th className="py-3.5 px-5 text-right">Final Gaz</th>
                  <th className="py-3.5 px-5 text-right">Wastage</th>
                  <th className="py-3.5 px-5 text-right">Total / মোট</th>
                  <th className="py-3.5 px-5 text-right">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1] text-sm">
                {filteredDeliveries.map((delivery) => {
                  const inv = invoiceMap.get(delivery.invoiceId);
                  const total =
                    inv?.total ??
                    Number((delivery.finalGaz * delivery.ratePerGaz).toFixed(2));
                  return (
                    <tr key={delivery.id} className="hover:bg-[#F1FAFA]/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#17383B] tabular-nums">
                        {delivery.challanNo}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#0B9FA5] tabular-nums">
                        {inv?.invoiceNo || '—'}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#17383B]">
                        {delivery.clientName}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#688285] tabular-nums">
                        {formatDateValue(delivery.deliveryDate)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold tabular-nums text-[#17383B]">
                        {(Number(delivery.finalGaz) || 0).toLocaleString('en-BD')}
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold tabular-nums text-[#A86214]">
                        {(Number(delivery.wastageGaz) || 0).toLocaleString('en-BD')}
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold tabular-nums text-[#17383B]">
                        {formatBDT(total)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handlePrintExistingDelivery(delivery)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D9EAEB] bg-white hover:bg-[#DDF4F3]/60 text-[#0B9FA5] text-xs font-bold cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>4×3"</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Atomic Delivery Modal */}
      <DeliverOrderModal
        order={orderToDeliver}
        tenantId={tenantId}
        createdBy={user?.uid || user?.email || 'system'}
        onClose={() => setOrderToDeliver(null)}
        onSuccess={handleDeliverySuccess}
        onError={(msg) => setToast({ type: 'error', message: msg })}
      />

      {/* Thermal 4x3 Inch Print Invoice Modal */}
      <ThermalInvoiceModal
        invoice={invoiceToPrint}
        onClose={() => setInvoiceToPrint(null)}
      />
    </div>
  );
};

export default Deliveries;
