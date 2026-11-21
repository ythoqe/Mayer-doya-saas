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
  getPurchaseDoc,
  getPurchasesCollection,
  getSupplierDoc,
  getSupplierLedgerCollection,
  getSuppliersCollection,
  getTenantId,
  getTransactionsCollection,
  TENANTS_COLLECTION,
} from '../../lib/db';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import type {
  Account,
  AccountType,
  Purchase,
  Supplier,
  WithId,
} from '../../types/database';

export type SupplierPaymentMode = 'Cash' | 'Bank' | 'Mobile Banking' | 'Cheque';

interface FirestoreSupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers?: WithId<Supplier>[];
  initialSupplierId?: string | null;
  initialPurchaseId?: string | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface PaymentVoucherData {
  voucherNo: string;
  date: string;
  printedAt: string;
  supplierName: string;
  companyName: string;
  mobile: string;
  purchaseNo: string;
  paymentMode: SupplierPaymentMode;
  accountName: string;
  bankName: string;
  reference: string;
  notes: string;
  amount: number;
  purchaseTotal: number;
  newPurchasePaid: number;
  newPurchaseDue: number;
  previousSupplierDue: number;
  newSupplierDue: number;
  isCheque: boolean;
}

const PAYMENT_MODES: Array<{
  value: SupplierPaymentMode;
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

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const formatBDT = (amount: number): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `৳ ${safe.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const isUnpaidPurchase = (purchase: WithId<Purchase>): boolean => {
  return (Number(purchase.due) || 0) > 0;
};

export const FirestoreSupplierPaymentModal: React.FC<FirestoreSupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  suppliers: propSuppliers,
  initialSupplierId,
  initialPurchaseId,
  onSuccess,
  onError,
}) => {
  const { user } = useAuth();
  const tenantId = getTenantId();

  const [suppliers, setSuppliers] = useState<WithId<Supplier>[]>(propSuppliers || []);
  const [accounts, setAccounts] = useState<WithId<Account>[]>([]);
  const [purchases, setPurchases] = useState<WithId<Purchase>[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Form fields
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [paymentMode, setPaymentMode] = useState<SupplierPaymentMode>('Cash');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<PaymentVoucherData | null>(null);

  const isCheque = paymentMode === 'Cheque';

  // Keep suppliers synced with parent prop without wiping form drafts
  useEffect(() => {
    if (propSuppliers) {
      setSuppliers(propSuppliers);
    }
  }, [propSuppliers]);

  // Reset form and load reference data when modal opens
  useEffect(() => {
    if (!isOpen || !user) return;

    setVoucher(null);
    setFormError(null);
    setSelectedSupplierId(initialSupplierId || '');
    setSelectedPurchaseId(initialPurchaseId || '');
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
        setAccounts(accountsSnap.docs.map((d) => d.data()));

        if (!propSuppliers || propSuppliers.length === 0) {
          const suppliersSnap = await getDocs(getSuppliersCollection(tenantId));
          if (!active) return;
          setSuppliers(suppliersSnap.docs.map((d) => d.data()));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, tenantId, initialSupplierId, initialPurchaseId]);

  // Fetch unpaid purchases for selected supplier
  useEffect(() => {
    if (!isOpen || !user || !selectedSupplierId) {
      setPurchases([]);
      setSelectedPurchaseId('');
      return;
    }

    let active = true;
    const loadSupplierPurchases = async () => {
      setLoadingPurchases(true);
      setFormError(null);
      try {
        const purchaseQuery = query(
          getPurchasesCollection(tenantId),
          where('supplierId', '==', selectedSupplierId)
        );
        const snap = await getDocs(purchaseQuery);
        if (!active) return;
        const unpaid = snap.docs.map((d) => d.data()).filter(isUnpaidPurchase);
        setPurchases(unpaid);

        const matchedInitial =
          initialPurchaseId && unpaid.find((p) => p.id === initialPurchaseId);
        if (matchedInitial) {
          setSelectedPurchaseId(matchedInitial.id);
          setAmount(String(matchedInitial.due));
        } else if (unpaid.length === 1) {
          setSelectedPurchaseId(unpaid[0].id);
          setAmount(String(unpaid[0].due));
        } else {
          setSelectedPurchaseId('');
          setAmount('');
        }
      } catch (error) {
        try {
          handleFirestoreError(
            error,
            OperationType.LIST,
            `${TENANTS_COLLECTION}/${tenantId}/purchases`
          );
        } catch {
          if (active) {
            setFormError(
              error instanceof Error
                ? error.message
                : 'Failed to load supplier purchases / ক্রয় তালিকা লোড করতে ব্যর্থ হয়েছে।'
            );
          }
        }
      } finally {
        if (active) setLoadingPurchases(false);
      }
    };

    void loadSupplierPurchases();
    return () => {
      active = false;
    };
  }, [isOpen, user, tenantId, selectedSupplierId, initialPurchaseId]);

  // Filter accounts by selected payment mode (fallback to all accounts if none match type)
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

  // Clean up thermal print body class if modal unmounts mid-print
  useEffect(() => {
    return () => {
      document.body.classList.remove('printing-thermal-voucher');
    };
  }, []);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) || null,
    [suppliers, selectedSupplierId]
  );

  const selectedPurchase = useMemo(
    () => purchases.find((p) => p.id === selectedPurchaseId) || null,
    [purchases, selectedPurchaseId]
  );

  const handlePurchaseSelect = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    const pur = purchases.find((p) => p.id === purchaseId);
    if (pur) {
      setAmount(String(pur.due));
    }
  };

  const handlePrintThermalVoucher = () => {
    document.body.classList.add('printing-thermal-voucher');
    const cleanup = () => {
      document.body.classList.remove('printing-thermal-voucher');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    // Fallback cleanup in case afterprint does not fire in embedded preview
    window.setTimeout(cleanup, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const numericAmount = round2(Number(amount));

    if (!selectedSupplierId) {
      setFormError('Please select a supplier / অনুগ্রহ করে সাপ্লায়ার নির্বাচন করুন।');
      return;
    }
    if (!selectedPurchaseId) {
      setFormError('Please select an unpaid purchase / অনুগ্রহ করে একটি বকেয়া ক্রয় নির্বাচন করুন।');
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
        'Please select a paying account / অনুগ্রহ করে প্রদানকারী অ্যাকাউন্ট নির্বাচন করুন।'
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

    const purchaseRef = getPurchaseDoc(selectedPurchaseId, tenantId);
    const supplierRef = getSupplierDoc(selectedSupplierId, tenantId);
    const accountRef = !isCheque ? getAccountDoc(selectedAccountId, tenantId) : null;
    const ledgerRef = doc(getSupplierLedgerCollection(tenantId));
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
        const purchaseSnap = await tx.get(purchaseRef);
        const supplierSnap = await tx.get(supplierRef);
        const accountSnap = accountRef ? await tx.get(accountRef) : null;

        if (!purchaseSnap.exists()) {
          throw new Error('Selected purchase no longer exists / নির্বাচিত ক্রয়টি পাওয়া যায়নি।');
        }
        if (!supplierSnap.exists()) {
          throw new Error('Selected supplier no longer exists / নির্বাচিত সাপ্লায়ারটি পাওয়া যায়নি।');
        }
        if (!isCheque && (!accountSnap || !accountSnap.exists())) {
          throw new Error('Selected account no longer exists / নির্বাচিত অ্যাকাউন্টটি পাওয়া যায়নি।');
        }

        const purchaseData = purchaseSnap.data();
        const supplierData = supplierSnap.data();
        const accountData = accountSnap ? accountSnap.data() : null;

        // 2. COMPUTE PHASE
        const currentPurchasePaid = Number(purchaseData.paid) || 0;
        const currentPurchaseDue = Number(purchaseData.due) || 0;
        const purchaseTotal = Number(purchaseData.total) || 0;
        const newPurchasePaid = round2(currentPurchasePaid + numericAmount);
        const newPurchaseDue = round2(currentPurchaseDue - numericAmount);

        const previousSupplierDue = Number(supplierData.currentDue) || 0;
        const newSupplierDue = round2(previousSupplierDue - numericAmount);

        const newAccountBalance =
          !isCheque && accountData
            ? round2((Number(accountData.currentBalance) || 0) - numericAmount)
            : null;

        const now = serverTimestamp();

        // 3. WRITE PHASE (atomic commit)
        // a. Update purchase.paid += amount, due -= amount
        tx.update(purchaseRef, {
          paid: newPurchasePaid,
          due: newPurchaseDue,
        });

        // b. Update supplier.currentDue -= amount
        tx.update(supplierRef, {
          currentDue: newSupplierDue,
          updatedAt: now,
        });

        // c. Update account.currentBalance -= amount (skip if cheque)
        if (!isCheque && accountRef && newAccountBalance !== null) {
          tx.update(accountRef, {
            currentBalance: newAccountBalance,
          });
        }

        // d. Add supplierLedger entry (entryType='payment', debit=0, credit=amount)
        tx.set(ledgerRef, {
          id: ledgerRef.id,
          supplierId: supplierData.id,
          entryDate: paymentDate.trim(),
          entryType: 'payment',
          referenceId: purchaseData.id,
          referenceType: 'purchase',
          debit: 0,
          credit: numericAmount,
          balance: newSupplierDue,
          remarks: remarksText,
          createdAt: now,
        });

        // e. Add transactions doc (txnType='money_out', category='supplier_payment') when not cheque
        if (!isCheque && txnRef && accountData) {
          tx.set(txnRef, {
            id: txnRef.id,
            accountId: accountData.id,
            txnDate: paymentDate.trim(),
            txnType: 'money_out',
            category: 'supplier_payment',
            referenceId: purchaseData.id,
            referenceType: 'purchase',
            amount: numericAmount,
            remarks: remarksText,
            createdBy: user.uid,
            createdAt: now,
          });
        }

        // f. If cheque: create cheques doc (cheque given to supplier)
        if (isCheque && chequeRef) {
          tx.set(chequeRef, {
            id: chequeRef.id,
            chequeNo: cleanRef,
            bankName: cleanBank,
            amount: numericAmount,
            issueDate: paymentDate.trim(),
            receivedFromType: 'supplier',
            receivedFromId: supplierData.id,
            receivedFromName: (supplierData.name || 'Supplier').slice(0, 160),
            status: 'Pending',
            depositDate: null,
            endorsedToId: supplierData.id,
            endorsedToName: (supplierData.name || 'Supplier').slice(0, 160),
            clearedDate: null,
            createdAt: now,
          });
        }

        const printedAt = new Date().toLocaleString('en-BD', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });

        return {
          voucherNo: `PV-${paymentDate.replace(/-/g, '')}-${ledgerRef.id.slice(-4).toUpperCase()}`,
          date: paymentDate.trim(),
          printedAt,
          supplierName: supplierData.name,
          companyName: supplierData.companyName || '',
          mobile: supplierData.mobile || '',
          purchaseNo: purchaseData.purchaseNo || purchaseData.id,
          paymentMode,
          accountName: accountData ? accountData.name : '',
          bankName: cleanBank,
          reference: cleanRef,
          notes: cleanNotes,
          amount: numericAmount,
          purchaseTotal,
          newPurchasePaid,
          newPurchaseDue,
          previousSupplierDue,
          newSupplierDue,
          isCheque,
        } as PaymentVoucherData;
      });

      setVoucher(result);
      onSuccess?.(
        isCheque
          ? 'Supplier cheque issued (Pending clearing) / সাপ্লায়ার চেক সংরক্ষিত হয়েছে (ক্লিয়ারিং অপেক্ষমান)।'
          : 'Supplier payment recorded successfully / সাপ্লায়ার পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে।'
      );
    } catch (error) {
      const targetPath = `${TENANTS_COLLECTION}/${tenantId}/purchases/${selectedPurchaseId}`;
      try {
        handleFirestoreError(error, OperationType.WRITE, targetPath);
      } catch {
        const message =
          error instanceof Error
            ? error.message
            : 'Supplier payment failed / পেমেন্ট সংরক্ষণ করতে ব্যর্থ হয়েছে।';
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
      aria-labelledby="supplier-payment-modal-title"
    >
      {voucher ? (
        /* Success & Thermal Payment Voucher Preview */
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-w-none">
          {/* Action header (hidden on print) */}
          <div className="no-print px-5 py-3.5 bg-[#E5F8F1] border-b border-[#38C99A]/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#1D7F5F]">
              <CheckCircle2 className="w-5 h-5 text-[#38C99A]" />
              <span className="text-sm font-extrabold">
                Payment Recorded / পেমেন্ট সম্পন্ন
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

          {/* 80mm Thermal Payment Voucher Preview */}
          <div className="p-5 bg-[#F1FAFA]/60 max-h-[72vh] overflow-y-auto print:p-0 print:bg-white print:max-h-none print:overflow-visible">
            <div
              id="thermal-payment-voucher"
              className="thermal-payment-voucher mx-auto w-full max-w-[302px] bg-white text-[#111827] border border-dashed border-[#9CA3AF] rounded-xl p-4 font-mono text-[11px] leading-snug shadow-xs print:border-none print:rounded-none print:shadow-none print:max-w-none"
            >
              {/* Store Header */}
              <div className="text-center pb-2.5 border-b border-dashed border-[#4B5563]">
                <p className="text-[13px] font-extrabold tracking-tight uppercase text-black">
                  Mayer Doya Washing &amp; Dyeing
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  Payment Voucher / পেমেন্ট ভাউচার
                </p>
              </div>

              {/* Voucher Meta */}
              <div className="py-2 border-b border-dashed border-[#4B5563] space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">Voucher:</span>
                  <span className="font-bold text-black">{voucher.voucherNo}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">Date:</span>
                  <span className="font-semibold text-black">{voucher.date}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">Purchase:</span>
                  <span className="font-bold text-black">{voucher.purchaseNo}</span>
                </div>
              </div>

              {/* Payee Info */}
              <div className="py-2 border-b border-dashed border-[#4B5563] space-y-0.5">
                <p className="text-[10px] uppercase text-[#4B5563] font-bold">
                  Paid To / প্রাপক সাপ্লায়ার:
                </p>
                <p className="text-[12px] font-extrabold text-black">{voucher.supplierName}</p>
                {voucher.companyName && (
                  <p className="text-[10px] text-[#374151]">{voucher.companyName}</p>
                )}
                {voucher.mobile && (
                  <p className="text-[10px] text-[#374151]">Mob: {voucher.mobile}</p>
                )}
              </div>

              {/* Payment Method Details */}
              <div className="py-2 border-b border-dashed border-[#4B5563] space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">Mode:</span>
                  <span className="font-bold text-black">{voucher.paymentMode}</span>
                </div>
                {voucher.accountName && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[#4B5563]">Account:</span>
                    <span className="font-semibold text-black text-right">
                      {voucher.accountName}
                    </span>
                  </div>
                )}
                {voucher.bankName && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[#4B5563]">Bank:</span>
                    <span className="font-semibold text-black text-right">{voucher.bankName}</span>
                  </div>
                )}
                {voucher.reference && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[#4B5563]">
                      {voucher.isCheque ? 'Cheque No:' : 'Ref:'}
                    </span>
                    <span className="font-bold text-black text-right">{voucher.reference}</span>
                  </div>
                )}
              </div>

              {/* Paid Amount Highlight */}
              <div className="py-2.5 border-b border-dashed border-[#4B5563] flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-black">
                  Amount Paid:
                </span>
                <span className="text-[15px] font-extrabold text-black tabular-nums">
                  {formatBDT(voucher.amount)}
                </span>
              </div>

              {/* Balances Breakdown */}
              <div className="py-2 border-b border-dashed border-[#4B5563] space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">Purchase Total:</span>
                  <span className="tabular-nums">{formatBDT(voucher.purchaseTotal)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">Purchase Paid:</span>
                  <span className="tabular-nums">{formatBDT(voucher.newPurchasePaid)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#4B5563]">Purchase Due:</span>
                  <span className="font-bold tabular-nums">
                    {formatBDT(Math.max(0, voucher.newPurchaseDue))}
                  </span>
                </div>
                <div className="flex justify-between gap-2 pt-1 border-t border-dotted border-[#9CA3AF]">
                  <span className="text-[#4B5563]">Prev. Supplier Due:</span>
                  <span className="tabular-nums">{formatBDT(voucher.previousSupplierDue)}</span>
                </div>
                <div className="flex justify-between gap-2 font-extrabold text-black">
                  <span>Curr. Supplier Due:</span>
                  <span className="tabular-nums">{formatBDT(voucher.newSupplierDue)}</span>
                </div>
              </div>

              {voucher.isCheque && (
                <div className="py-1.5 border-b border-dashed border-[#4B5563] text-[10px] font-bold text-center text-black">
                  * CHEQUE ISSUED (PENDING CLEARING) *
                </div>
              )}

              {voucher.notes && (
                <div className="py-1.5 border-b border-dashed border-[#4B5563] text-[10px] text-[#374151]">
                  <span className="font-bold text-black">Note: </span>
                  {voucher.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="pt-7 pb-2 grid grid-cols-2 gap-4 text-center text-[10px]">
                <div className="border-t border-dashed border-[#4B5563] pt-1">
                  Receiver Sign
                </div>
                <div className="border-t border-dashed border-[#4B5563] pt-1">
                  Authorized Sign
                </div>
              </div>

              <p className="text-center text-[9px] text-[#6B7280] pt-1">
                Printed: {voucher.printedAt}
              </p>
            </div>
          </div>

          {/* Footer Buttons (hidden on print) */}
          <div className="no-print px-5 py-3.5 border-t border-[#E6F0F1] bg-white flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] text-xs sm:text-sm font-bold text-[#688285] cursor-pointer"
            >
              Close / বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={handlePrintThermalVoucher}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] text-white text-xs sm:text-sm font-bold shadow-[0_6px_18px_rgba(11,159,165,0.25)] inline-flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Voucher (Thermal)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Supplier Payment Form Modal */
        <div className="w-full max-w-xl bg-white rounded-3xl border border-[#D9EAEB] shadow-floating overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E6F0F1] flex items-center justify-between bg-[#F1FAFA]/75">
            <div>
              <h2
                id="supplier-payment-modal-title"
                className="text-lg font-extrabold text-[#17383B]"
              >
                Supplier Payment / সাপ্লায়ার পেমেন্ট প্রদান
              </h2>
              <p className="text-xs text-[#688285] mt-0.5">
                Atomically updates purchase, supplier due, ledger &amp; account
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

            {/* Supplier Dropdown */}
            <div>
              <label
                htmlFor="sup-payment-supplier"
                className="block text-xs font-bold text-[#17383B] mb-1"
              >
                Supplier / সাপ্লায়ার <span className="text-[#EA7185]">*</span>
              </label>
              <select
                id="sup-payment-supplier"
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              >
                <option value="">Select Supplier / সাপ্লায়ার নির্বাচন করুন...</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                    {sup.companyName ? ` — ${sup.companyName}` : ''} (Due:{' '}
                    {formatBDT(sup.currentDue)})
                  </option>
                ))}
              </select>
              {selectedSupplier && (
                <p className="text-[11px] font-semibold text-[#688285] mt-1 tabular-nums">
                  Current Running Due / বর্তমান বকেয়া:{' '}
                  <span className="text-[#C94A60] font-bold">
                    {formatBDT(selectedSupplier.currentDue)}
                  </span>
                </p>
              )}
            </div>

            {/* Unpaid Purchase Dropdown */}
            <div>
              <label
                htmlFor="sup-payment-purchase"
                className="block text-xs font-bold text-[#17383B] mb-1"
              >
                Unpaid Purchase / বকেয়া ক্রয় <span className="text-[#EA7185]">*</span>
              </label>
              <select
                id="sup-payment-purchase"
                required
                disabled={!selectedSupplierId || loadingPurchases}
                value={selectedPurchaseId}
                onChange={(e) => handlePurchaseSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] disabled:opacity-60 focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              >
                <option value="">
                  {!selectedSupplierId
                    ? 'Select a supplier first / আগে সাপ্লায়ার নির্বাচন করুন'
                    : loadingPurchases
                      ? 'Loading purchases... / ক্রয় তালিকা লোড হচ্ছে...'
                      : purchases.length === 0
                        ? 'No unpaid purchases for this supplier / কোনো বকেয়া ক্রয় নেই'
                        : 'Select Purchase / ক্রয় নির্বাচন করুন...'}
                </option>
                {purchases.map((pur) => (
                  <option key={pur.id} value={pur.id}>
                    {pur.purchaseNo} — Due: {formatBDT(pur.due)} (Total: {formatBDT(pur.total)})
                  </option>
                ))}
              </select>

              {selectedPurchase && (
                <div className="mt-2 p-3 rounded-xl bg-[#DDF4F3]/55 border border-[#0B9FA5]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#17383B]">
                    <FileText className="w-3.5 h-3.5 text-[#0B9FA5]" />
                    <span>{selectedPurchase.purchaseNo}</span>
                  </span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-[#688285]">
                      Total:{' '}
                      <strong className="text-[#17383B]">
                        {formatBDT(selectedPurchase.total)}
                      </strong>
                    </span>
                    <span className="text-[#688285]">
                      Paid:{' '}
                      <strong className="text-[#229A73]">
                        {formatBDT(selectedPurchase.paid)}
                      </strong>
                    </span>
                    <span className="text-[#688285]">
                      Due:{' '}
                      <strong className="text-[#C94A60]">
                        {formatBDT(selectedPurchase.due)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="sup-payment-amount"
                  className="block text-xs font-bold text-[#17383B] mb-1"
                >
                  Amount / পরিমাণ (৳) <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  id="sup-payment-amount"
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
                <label
                  htmlFor="sup-payment-date"
                  className="block text-xs font-bold text-[#17383B] mb-1"
                >
                  Date / তারিখ <span className="text-[#EA7185]">*</span>
                </label>
                <input
                  id="sup-payment-date"
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
                <label
                  htmlFor="sup-payment-account"
                  className="block text-xs font-bold text-[#17383B] mb-1"
                >
                  Pay From Account / প্রদানকারী অ্যাকাউন্ট <span className="text-[#EA7185]">*</span>
                </label>
                <select
                  id="sup-payment-account"
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
                  Cheque issued to supplier will be recorded with status <strong>Pending</strong>.
                  Account balance is skipped until the cheque clears.
                </p>
                <div>
                  <label
                    htmlFor="sup-cheque-bank-name"
                    className="block text-xs font-bold text-[#17383B] mb-1"
                  >
                    Bank Name / ব্যাংকের নাম <span className="text-[#EA7185]">*</span>
                  </label>
                  <input
                    id="sup-cheque-bank-name"
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
              <label
                htmlFor="sup-payment-reference"
                className="block text-xs font-bold text-[#17383B] mb-1"
              >
                {isCheque
                  ? 'Cheque No / চেক নম্বর'
                  : 'Reference (Txn ID / Voucher) / রেফারেন্স'}{' '}
                {isCheque && <span className="text-[#EA7185]">*</span>}
              </label>
              <input
                id="sup-payment-reference"
                type="text"
                required={isCheque}
                maxLength={64}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={isCheque ? 'e.g. CHQ-771240' : 'e.g. Bank Ref / bKash TrxID'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              />
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="sup-payment-notes"
                className="block text-xs font-bold text-[#17383B] mb-1"
              >
                Notes / নোট
              </label>
              <textarea
                id="sup-payment-notes"
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

export default FirestoreSupplierPaymentModal;
