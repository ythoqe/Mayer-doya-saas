import React, { useEffect, useMemo, useState } from 'react';
import {
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Printer,
  Smartphone,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAccountDoc,
  getAccountsCollection,
  getChequesCollection,
  getClientDoc,
  getClientLedgerCollection,
  getClientsCollection,
  getInvoiceDoc,
  getInvoicesCollection,
  getTenantId,
  getTransactionsCollection,
  TENANTS_COLLECTION,
} from '../../lib/db';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import type {
  Account,
  AccountType,
  Client,
  Invoice,
  InvoiceStatus,
  WithId,
} from '../../types/database';

export type PaymentMode = 'Cash' | 'Bank' | 'Mobile Banking' | 'Cheque';

interface FirestoreClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: WithId<Client>[];
  initialClientId?: string | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface PaymentReceiptData {
  receiptNo: string;
  date: string;
  clientName: string;
  companyName: string;
  mobile: string;
  invoiceNo: string;
  paymentMode: PaymentMode;
  accountName: string;
  bankName: string;
  reference: string;
  notes: string;
  amount: number;
  previousClientDue: number;
  newClientDue: number;
  newInvoicePaid: number;
  newInvoiceDue: number;
  invoiceTotal: number;
  newInvoiceStatus: InvoiceStatus;
  isCheque: boolean;
}

const PAYMENT_MODES: Array<{
  value: PaymentMode;
  label: string;
  accountType?: AccountType;
  icon: React.ElementType;
}> = [
  { value: 'Cash', label: 'Cash / নগদ', accountType: 'cash', icon: Banknote },
  { value: 'Bank', label: 'Bank / ব্যাংক', accountType: 'bank', icon: Building2 },
  {
    value: 'Mobile Banking',
    label: 'Mobile Banking / মোবাইল ব্যাংকিং',
    accountType: 'mobile',
    icon: Smartphone,
  },
  { value: 'Cheque', label: 'Cheque / চেক', icon: CreditCard },
];

const getTodayDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatBDT = (amount: number): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `৳ ${safe.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const isUnpaidInvoice = (inv: WithId<Invoice>): boolean => {
  const statusLower = String(inv.status || '').toLowerCase();
  if (statusLower === 'paid' || statusLower === 'cancelled') return false;
  return (Number(inv.currentDue) || 0) > 0;
};

export const FirestoreClientPaymentModal: React.FC<FirestoreClientPaymentModalProps> = ({
  isOpen,
  onClose,
  clients: propClients,
  initialClientId,
  onSuccess,
  onError,
}) => {
  const { user } = useAuth();
  const tenantId = getTenantId();

  const [clients, setClients] = useState<WithId<Client>[]>(propClients || []);
  const [accounts, setAccounts] = useState<WithId<Account>[]>([]);
  const [invoices, setInvoices] = useState<WithId<Invoice>[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Form fields
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);

  const isCheque = paymentMode === 'Cheque';

  // Sync external clients prop if provided
  useEffect(() => {
    if (propClients) {
      setClients(propClients);
    }
  }, [propClients]);

  // Reset form and fetch accounts (+ clients if not provided) when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;

    setReceipt(null);
    setFormError(null);
    setSelectedClientId(initialClientId || '');
    setSelectedInvoiceId('');
    setAmount('');
    setPaymentDate(getTodayDateString());
    setPaymentMode('Cash');
    setSelectedAccountId('');
    setBankName('');
    setReference('');
    setNotes('');

    let active = true;

    const loadReferenceData = async () => {
      setLoadingAccounts(true);
      try {
        const accountsSnap = await getDocs(getAccountsCollection(tenantId));
        if (!active) return;
        const accList = accountsSnap.docs.map((d) => d.data());
        setAccounts(accList);

        if (!propClients || propClients.length === 0) {
          const clientsSnap = await getDocs(getClientsCollection(tenantId));
          if (!active) return;
          setClients(clientsSnap.docs.map((d) => d.data()));
        }
      } catch (error) {
        try {
          handleFirestoreError(
            error,
            OperationType.LIST,
            `${TENANTS_COLLECTION}/${tenantId}/accounts`
          );
        } catch {
          if (active) {
            setFormError(
              error instanceof Error
                ? error.message
                : 'Failed to load accounts / অ্যাকাউন্ট লোড করতে ব্যর্থ হয়েছে।'
            );
          }
        }
      } finally {
        if (active) setLoadingAccounts(false);
      }
    };

    void loadReferenceData();
    return () => {
      active = false;
    };
  }, [isOpen, user, tenantId, initialClientId, propClients]);

  // Fetch unpaid invoices for the selected client
  useEffect(() => {
    if (!isOpen || !user || !selectedClientId) {
      setInvoices([]);
      setSelectedInvoiceId('');
      return;
    }

    let active = true;
    const loadClientInvoices = async () => {
      setLoadingInvoices(true);
      setFormError(null);
      try {
        const invQuery = query(
          getInvoicesCollection(tenantId),
          where('clientId', '==', selectedClientId)
        );
        const snap = await getDocs(invQuery);
        if (!active) return;
        const unpaid = snap.docs.map((d) => d.data()).filter(isUnpaidInvoice);
        setInvoices(unpaid);
        if (unpaid.length === 1) {
          setSelectedInvoiceId(unpaid[0].id);
          setAmount(String(unpaid[0].currentDue));
        } else {
          setSelectedInvoiceId('');
          setAmount('');
        }
      } catch (error) {
        try {
          handleFirestoreError(
            error,
            OperationType.LIST,
            `${TENANTS_COLLECTION}/${tenantId}/invoices`
          );
        } catch {
          if (active) {
            setFormError(
              error instanceof Error
                ? error.message
                : 'Failed to load client invoices / ইনভয়েস লোড করতে ব্যর্থ হয়েছে।'
            );
          }
        }
      } finally {
        if (active) setLoadingInvoices(false);
      }
    };

    void loadClientInvoices();
    return () => {
      active = false;
    };
  }, [isOpen, user, tenantId, selectedClientId]);

  // Filter accounts by selected payment mode (with fallback to all accounts if none match type)
  const availableAccounts = useMemo(() => {
    if (isCheque) return [];
    const modeMeta = PAYMENT_MODES.find((m) => m.value === paymentMode);
    if (!modeMeta?.accountType) return accounts;
    const matched = accounts.filter((a) => a.accountType === modeMeta.accountType);
    return matched.length > 0 ? matched : accounts;
  }, [accounts, paymentMode, isCheque]);

  // Auto-select first matching account when mode or accounts change
  useEffect(() => {
    if (isCheque) {
      setSelectedAccountId('');
      return;
    }
    if (availableAccounts.length === 0) {
      setSelectedAccountId('');
      return;
    }
    const stillValid = availableAccounts.some((a) => a.id === selectedAccountId);
    if (!stillValid) {
      setSelectedAccountId(availableAccounts[0].id);
    }
  }, [availableAccounts, isCheque, selectedAccountId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId]
  );

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      setAmount(String(inv.currentDue));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const numericAmount = Number(amount);

    if (!selectedClientId) {
      setFormError('Please select a client / অনুগ্রহ করে ক্লায়েন্ট নির্বাচন করুন।');
      return;
    }
    if (!selectedInvoiceId) {
      setFormError('Please select an unpaid invoice / অনুগ্রহ করে একটি বকেয়া ইনভয়েস নির্বাচন করুন।');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Amount must be greater than 0 / পরিমাণ ০-এর বেশি হতে হবে।');
      return;
    }
    if (!paymentDate.trim()) {
      setFormError('Payment date is required / পেমেন্টের তারিখ আবশ্যক।');
      return;
    }
    if (!isCheque && !selectedAccountId) {
      setFormError(
        'Please select a receiving account / অনুগ্রহ করে গ্রহণকারী অ্যাকাউন্ট নির্বাচন করুন।'
      );
      return;
    }
    if (isCheque && !reference.trim()) {
      setFormError('Cheque number is required / চেক নম্বর আবশ্যক।');
      return;
    }
    if (isCheque && !bankName.trim()) {
      setFormError('Bank name is required for cheque payments / চেকের জন্য ব্যাংকের নাম আবশ্যক।');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const invoiceRef = getInvoiceDoc(selectedInvoiceId, tenantId);
    const clientRef = getClientDoc(selectedClientId, tenantId);
    const accountRef = !isCheque ? getAccountDoc(selectedAccountId, tenantId) : null;
    const ledgerRef = doc(getClientLedgerCollection(tenantId));
    const txnRef = !isCheque ? doc(getTransactionsCollection(tenantId)) : null;
    const chequeRef = isCheque ? doc(getChequesCollection(tenantId)) : null;

    const cleanRef = reference.trim().slice(0, 64);
    const cleanBank = bankName.trim().slice(0, 160);
    const cleanNotes = notes.trim();
    const remarksText = [
      `Mode: ${paymentMode}`,
      cleanRef ? `Ref: ${cleanRef}` : '',
      isCheque && cleanBank ? `Bank: ${cleanBank}` : '',
      cleanNotes,
    ]
      .filter(Boolean)
      .join(' | ')
      .slice(0, 1000);

    try {
      const result = await runTransaction(db, async (tx) => {
        // 1. READ PHASE (all reads before any writes)
        const invoiceSnap = await tx.get(invoiceRef);
        const clientSnap = await tx.get(clientRef);
        const accountSnap = accountRef ? await tx.get(accountRef) : null;

        if (!invoiceSnap.exists()) {
          throw new Error('Selected invoice no longer exists / নির্বাচিত ইনভয়েসটি পাওয়া যায়নি।');
        }
        if (!clientSnap.exists()) {
          throw new Error('Selected client no longer exists / নির্বাচিত ক্লায়েন্টটি পাওয়া যায়নি।');
        }
        if (!isCheque && (!accountSnap || !accountSnap.exists())) {
          throw new Error('Selected account no longer exists / নির্বাচিত অ্যাকাউন্টটি পাওয়া যায়নি।');
        }

        const invoiceData = invoiceSnap.data();
        const clientData = clientSnap.data();
        const accountData = accountSnap ? accountSnap.data() : null;

        // 2. COMPUTE PHASE
        const currentInvoicePaid = Number(invoiceData.paid) || 0;
        const invoiceTotal = Number(invoiceData.total) || 0;
        const newInvoicePaid = currentInvoicePaid + numericAmount;
        const newInvoiceDue = invoiceTotal - newInvoicePaid;
        const newStatus: InvoiceStatus = newInvoiceDue <= 0 ? 'Paid' : 'Partially Paid';

        const previousClientDue = Number(clientData.currentDue) || 0;
        const newClientDue = previousClientDue - numericAmount;

        const newAccountBalance =
          !isCheque && accountData
            ? (Number(accountData.currentBalance) || 0) + numericAmount
            : null;

        const now = serverTimestamp();

        // 3. WRITE PHASE (atomic commit)
        tx.update(invoiceRef, {
          paid: newInvoicePaid,
          currentDue: newInvoiceDue,
          status: newStatus,
        });

        tx.update(clientRef, {
          currentDue: newClientDue,
          updatedAt: now,
        });

        if (!isCheque && accountRef && newAccountBalance !== null) {
          tx.update(accountRef, {
            currentBalance: newAccountBalance,
          });
        }

        tx.set(ledgerRef, {
          id: ledgerRef.id,
          clientId: clientData.id,
          entryDate: paymentDate.trim(),
          entryType: 'payment',
          referenceId: invoiceData.id,
          referenceType: 'invoice',
          debit: 0,
          credit: numericAmount,
          balance: newClientDue,
          remarks: remarksText,
          createdBy: user.uid,
          createdAt: now,
        });

        if (!isCheque && txnRef && accountData) {
          tx.set(txnRef, {
            id: txnRef.id,
            accountId: accountData.id,
            txnDate: paymentDate.trim(),
            txnType: 'money_in',
            category: 'client_payment',
            referenceId: invoiceData.id,
            referenceType: 'invoice',
            amount: numericAmount,
            remarks: remarksText,
            createdBy: user.uid,
            createdAt: now,
          });
        }

        if (isCheque && chequeRef) {
          tx.set(chequeRef, {
            id: chequeRef.id,
            chequeNo: cleanRef,
            bankName: cleanBank,
            amount: numericAmount,
            issueDate: paymentDate.trim(),
            receivedFromType: 'client',
            receivedFromId: clientData.id,
            receivedFromName: clientData.name,
            status: 'Pending',
            depositDate: null,
            endorsedToId: null,
            endorsedToName: null,
            clearedDate: null,
            createdAt: now,
          });
        }

        return {
          receiptNo: `MR-${paymentDate.replace(/-/g, '')}-${ledgerRef.id.slice(-4).toUpperCase()}`,
          date: paymentDate.trim(),
          clientName: clientData.name,
          companyName: clientData.companyName || '',
          mobile: clientData.mobile || '',
          invoiceNo: invoiceData.invoiceNo || invoiceData.id,
          paymentMode,
          accountName: accountData ? accountData.name : '',
          bankName: cleanBank,
          reference: cleanRef,
          notes: cleanNotes,
          amount: numericAmount,
          previousClientDue,
          newClientDue,
          newInvoicePaid,
          newInvoiceDue,
          invoiceTotal,
          newInvoiceStatus: newStatus,
          isCheque,
        } as PaymentReceiptData;
      });

      setReceipt(result);
      onSuccess?.(
        isCheque
          ? 'Cheque payment recorded (Pending clearing) / চেক পেমেন্ট সংরক্ষিত হয়েছে (ক্লিয়ারিং অপেক্ষমান)।'
          : 'Client payment recorded successfully / ক্লায়েন্ট পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে।'
      );
    } catch (error) {
      const targetPath = `${TENANTS_COLLECTION}/${tenantId}/invoices/${selectedInvoiceId}`;
      try {
        handleFirestoreError(error, OperationType.WRITE, targetPath);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Payment transaction failed / পেমেন্ট সংরক্ষণ করতে ব্যর্থ হয়েছে।';
        setFormError(message);
        onError?.(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17383B]/45 backdrop-blur-sm print:bg-white print:p-0 print:static"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-payment-modal-title"
    >
      {receipt ? (
        /* Success & Printable Money Receipt View */
        <div className="w-full max-w-xl bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-w-none">
          {/* Action header (hidden on print) */}
          <div className="no-print px-6 py-4 bg-[#E5F8F1] border-b border-[#38C99A]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#1D7F5F]">
              <CheckCircle2 className="w-5 h-5 text-[#38C99A]" />
              <span className="text-sm font-extrabold">
                Payment Recorded / পেমেন্ট সম্পন্ন হয়েছে
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#1D7F5F] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Money Receipt Body */}
          <div className="p-6 sm:p-8 space-y-5 text-[#17383B] max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible">
            <div className="flex items-start justify-between border-b-2 border-[#0B9FA5]/30 pb-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-[#17383B]">
                  Mayer Doya Washing &amp; Dyeing
                </h2>
                <p className="text-xs font-semibold text-[#688285] mt-0.5">
                  Official Money Receipt / মানি রিসিট
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#0B9FA5] uppercase tracking-wider">
                  {receipt.receiptNo}
                </p>
                <p className="text-xs text-[#688285] mt-0.5 tabular-nums">
                  Date / তারিখ: {receipt.date}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm bg-[#F1FAFA] rounded-2xl p-4 border border-[#D9EAEB]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                  Received From / প্রাপক ক্লায়েন্ট
                </p>
                <p className="font-extrabold text-[#17383B] mt-0.5">{receipt.clientName}</p>
                {receipt.companyName && (
                  <p className="text-xs text-[#688285]">{receipt.companyName}</p>
                )}
                {receipt.mobile && (
                  <p className="text-xs text-[#688285] tabular-nums">{receipt.mobile}</p>
                )}
              </div>

              <div className="sm:text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#688285]">
                  Payment Details / পেমেন্ট বিবরণ
                </p>
                <p className="font-bold text-[#17383B] mt-0.5">
                  Invoice / ইনভয়েস: {receipt.invoiceNo}
                </p>
                <p className="text-xs text-[#688285]">
                  Mode: {receipt.paymentMode}
                  {receipt.accountName ? ` (${receipt.accountName})` : ''}
                </p>
                {receipt.bankName && (
                  <p className="text-xs text-[#688285]">Bank: {receipt.bankName}</p>
                )}
                {receipt.reference && (
                  <p className="text-xs text-[#688285] tabular-nums">
                    Ref / Cheque: {receipt.reference}
                  </p>
                )}
              </div>
            </div>

            {/* Amount Summary Table */}
            <div className="rounded-2xl border border-[#D9EAEB] overflow-hidden">
              <div className="px-4 py-3 bg-[#0B9FA5]/10 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-[#17383B]">
                  Amount Received / গৃহীত পরিমাণ
                </span>
                <span className="text-xl font-extrabold text-[#0B9FA5] tabular-nums">
                  {formatBDT(receipt.amount)}
                </span>
              </div>

              <div className="divide-y divide-[#E6F0F1] text-xs sm:text-sm">
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[#688285]">Invoice Status / ইনভয়েস স্ট্যাটাস</span>
                  <span className="font-bold text-[#17383B]">{receipt.newInvoiceStatus}</span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[#688285]">Invoice Remaining Due / ইনভয়েস বকেয়া</span>
                  <span className="font-bold tabular-nums text-[#17383B]">
                    {formatBDT(Math.max(0, receipt.newInvoiceDue))}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[#688285]">Previous Client Due / পূর্বের বকেয়া</span>
                  <span className="font-semibold tabular-nums text-[#688285]">
                    {formatBDT(receipt.previousClientDue)}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between bg-[#F1FAFA]/60">
                  <span className="font-bold text-[#17383B]">
                    Updated Client Due / বর্তমান মোট বকেয়া
                  </span>
                  <span className="font-extrabold tabular-nums text-[#17383B]">
                    {formatBDT(receipt.newClientDue)}
                  </span>
                </div>
              </div>
            </div>

            {receipt.isCheque && (
              <p className="text-xs font-semibold text-[#92400E] bg-[#FFF3DF] border border-[#F3B562]/40 rounded-xl px-3.5 py-2.5">
                Note: Cheque recorded with status <strong>Pending</strong>. Account balance will
                update automatically once the cheque is cleared.
              </p>
            )}

            {receipt.notes && (
              <div className="text-xs text-[#688285]">
                <span className="font-bold text-[#17383B]">Notes / নোট: </span>
                {receipt.notes}
              </div>
            )}

            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-[#688285]">
              <div className="border-t border-[#D9EAEB] pt-2">Client Signature / ক্লায়েন্ট স্বাক্ষর</div>
              <div className="border-t border-[#D9EAEB] pt-2">Authorized Signature / অনুমোদিত স্বাক্ষর</div>
            </div>
          </div>

          {/* Footer Buttons (hidden on print) */}
          <div className="no-print px-6 py-4 border-t border-[#E6F0F1] bg-[#F1FAFA]/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs sm:text-sm font-bold text-[#688285] cursor-pointer"
            >
              Close / বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold shadow-[0_6px_18px_rgba(11,159,165,0.25)] inline-flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Money Receipt / রিসিট প্রিন্ট</span>
            </button>
          </div>
        </div>
      ) : (
        /* Payment Form Modal */
        <div className="w-full max-w-xl bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]/75">
            <div>
              <h2 id="client-payment-modal-title" className="text-lg font-extrabold text-[#17383B]">
                Receive Client Payment / ক্লায়েন্ট পেমেন্ট গ্রহণ
              </h2>
              <p className="text-xs text-[#688285] mt-0.5">
                Atomically updates invoice, client due, ledger &amp; account
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close modal"
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#688285] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {formError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#FDECEF] border border-[#EA7185]/35 text-xs font-semibold text-[#C94A60] flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EA7185]" />
                <span>{formError}</span>
              </div>
            )}

            {/* Client Dropdown */}
            <div>
              <label htmlFor="payment-client" className="block text-xs font-bold text-[#17383B] mb-1">
                Client / ক্লায়েন্ট <span className="text-[#EA7185]">*</span>
              </label>
              <select
                id="payment-client"
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              >
                <option value="">Select Client / ক্লায়েন্ট নির্বাচন করুন...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.companyName ? ` — ${c.companyName}` : ''} (Due: {formatBDT(c.currentDue)})
                  </option>
                ))}
              </select>
              {selectedClient && (
                <p className="text-[11px] font-semibold text-[#688285] mt-1 tabular-nums">
                  Current Running Due / বর্তমান বকেয়া:{' '}
                  <span className="text-[#17383B] font-bold">
                    {formatBDT(selectedClient.currentDue)}
                  </span>
                </p>
              )}
            </div>

            {/* Unpaid Invoice Dropdown */}
            <div>
              <label htmlFor="payment-invoice" className="block text-xs font-bold text-[#17383B] mb-1">
                Unpaid Invoice / বকেয়া ইনভয়েস <span className="text-[#EA7185]">*</span>
              </label>
              <div className="relative">
                <select
                  id="payment-invoice"
                  required
                  disabled={!selectedClientId || loadingInvoices}
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] disabled:opacity-60 focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                >
                  <option value="">
                    {!selectedClientId
                      ? 'Select a client first / আগে ক্লায়েন্ট নির্বাচন করুন'
                      : loadingInvoices
                        ? 'Loading invoices... / ইনভয়েস লোড হচ্ছে...'
                        : invoices.length === 0
                          ? 'No unpaid invoices for this client / কোনো বকেয়া ইনভয়েস নেই'
                          : 'Select Invoice / ইনভয়েস নির্বাচন করুন...'}
                  </option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} — Due: {formatBDT(inv.currentDue)} (Total:{' '}
                      {formatBDT(inv.total)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="mt-2 p-3 rounded-xl bg-[#DDF4F3]/55 border border-[#0B9FA5]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#17383B]">
                    <FileText className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    <span>{selectedInvoice.invoiceNo}</span>
                  </span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-[#688285]">
                      Total: <strong className="text-[#17383B]">{formatBDT(selectedInvoice.total)}</strong>
                    </span>
                    <span className="text-[#688285]">
                      Paid: <strong className="text-[#229A73]">{formatBDT(selectedInvoice.paid)}</strong>
                    </span>
                    <span className="text-[#688285]">
                      Due: <strong className="text-[#C94A60]">{formatBDT(selectedInvoice.currentDue)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="payment-amount" className="block text-xs font-bold text-[#17383B] mb-1">
                  Amount / পরিমাণ (৳) <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-bold text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                />
              </div>

              <div>
                <label htmlFor="payment-date" className="block text-xs font-bold text-[#17383B] mb-1">
                  Date / তারিখ <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  id="payment-date"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                />
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <span className="block text-xs font-bold text-[#17383B] mb-1.5">
                Payment Mode / পেমেন্ট মাধ্যম <span className="text-[#EA7185]">*</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const active = paymentMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setPaymentMode(mode.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#DDF4F3] border-[#0B9FA5] text-[#0B9FA5] shadow-xs'
                          : 'bg-[#F1FAFA]/60 border-[#D9EAEB] text-[#688285] hover:bg-white hover:text-[#17383B]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account dropdown (Cash / Bank / Mobile Banking) OR Bank Name (Cheque) */}
            {!isCheque ? (
              <div>
                <label htmlFor="payment-account" className="block text-xs font-bold text-[#17383B] mb-1">
                  Account / অ্যাকাউন্ট <span className="text-[#EA7185]">*</span>
                </label>
                <select
                  id="payment-account"
                  required
                  disabled={loadingAccounts}
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] disabled:opacity-60 focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                >
                  <option value="">
                    {loadingAccounts
                      ? 'Loading accounts... / অ্যাকাউন্ট লোড হচ্ছে...'
                      : availableAccounts.length === 0
                        ? 'No accounts found / কোনো অ্যাকাউন্ট পাওয়া যায়নি'
                        : 'Select Account / অ্যাকাউন্ট নির্বাচন করুন...'}
                  </option>
                  {availableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountType}) — Bal: {formatBDT(acc.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3 p-3.5 rounded-2xl bg-[#FFF3DF]/50 border border-[#F3B562]/40">
                <p className="text-[11px] font-semibold text-[#92400E]">
                  Cheque will be registered with status <strong>Pending</strong>. Your bank account
                  balance will not change until the cheque is cleared.
                </p>
                <div>
                  <label htmlFor="cheque-bank-name" className="block text-xs font-bold text-[#17383B] mb-1">
                    Bank Name / ব্যাংকের নাম <span className="text-[#EA7185]">*</span>
                  </label>
                  <input
                    id="cheque-bank-name"
                    type="text"
                    required
                    maxLength={160}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Dutch-Bangla Bank, Islami Bank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-white text-sm font-medium text-[#17383B] focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
                  />
                </div>
              </div>
            )}

            {/* Reference (Cheque No / Txn ID) */}
            <div>
              <label htmlFor="payment-reference" className="block text-xs font-bold text-[#17383B] mb-1">
                {isCheque
                  ? 'Cheque No / চেক নম্বর'
                  : 'Reference (Txn ID / Voucher) / রেফারেন্স'}{' '}
                {isCheque && <span className="text-[#EA7185]">*</span>}
              </label>
              <input
                id="payment-reference"
                type="text"
                required={isCheque}
                maxLength={64}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={isCheque ? 'e.g. CHQ-448921' : 'e.g. bKash TrxID / Bank Ref'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="payment-notes" className="block text-xs font-bold text-[#17383B] mb-1">
                Notes / নোট
              </label>
              <textarea
                id="payment-notes"
                rows={2}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional payment notes / অতিরিক্ত তথ্য..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E6F0F1]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs sm:text-sm font-bold text-[#688285] cursor-pointer"
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
                <span>Confirm Payment / পেমেন্ট সংরক্ষণ</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FirestoreClientPaymentModal;
