import React, { useEffect, useMemo, useState } from 'react';
import {
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  FileText,
  Printer,
  RotateCcw,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getClientLedgerCollection,
  getClientsCollection,
  getTenantId,
  TENANTS_COLLECTION,
  TENANT_SUBCOLLECTIONS,
} from '../lib/db';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  Client,
  ClientLedgerEntry,
  ClientLedgerEntryType,
  FirestoreTimestamp,
  WithId,
} from '../types/database';

interface ClientLedgerProps {
  initialClientId?: string | null;
  onBack?: () => void;
}

const formatDateISO = (val: FirestoreTimestamp | undefined | null): string => {
  if (!val) return '';
  if (typeof val === 'string') return val.trim().slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (val instanceof Timestamp) return val.toDate().toISOString().slice(0, 10);
  if (typeof (val as unknown as { toDate?: () => Date }).toDate === 'function') {
    return (val as unknown as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  }
  return '';
};

const getSortableTime = (val: FirestoreTimestamp | undefined | null): number => {
  if (!val) return 0;
  if (val instanceof Date) return val.getTime();
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof (val as unknown as { toMillis?: () => number }).toMillis === 'function') {
    return (val as unknown as { toMillis: () => number }).toMillis();
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatBDT = (amount: number): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `৳ ${safe.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const getTodayDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMonthStartDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
};

const getDaysAgoDateString = (days: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() - days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getEntryTypeBadge = (
  entryType: ClientLedgerEntryType
): { label: string; badgeClass: string } => {
  switch (entryType) {
    case 'invoice':
      return {
        label: 'Invoice / ইনভয়েস',
        badgeClass: 'bg-[#EEEBFF] text-[#5B52D6] border-[#8178F2]/30',
      };
    case 'payment':
      return {
        label: 'Payment / পেমেন্ট',
        badgeClass: 'bg-[#E5F8F1] text-[#1D7F5F] border-[#38C99A]/35',
      };
    case 'adjustment':
    default:
      return {
        label: 'Adjustment / অ্যাডজাস্টমেন্ট',
        badgeClass: 'bg-[#FFF3DF] text-[#A86214] border-[#F3B562]/40',
      };
  }
};

const escapeCSV = (value: string | number | null | undefined): string => {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const ClientLedger: React.FC<ClientLedgerProps> = ({
  initialClientId = null,
  onBack,
}) => {
  const { user, loading: authLoading } = useAuth();
  const tenantId = getTenantId();
  const clientsPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.clients}`;
  const ledgerPath = `${TENANTS_COLLECTION}/${tenantId}/${TENANT_SUBCOLLECTIONS.clientLedger}`;

  const [clients, setClients] = useState<WithId<Client>[]>([]);
  const [loadingClients, setLoadingClients] = useState<boolean>(true);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');

  const [entries, setEntries] = useState<WithId<ClientLedgerEntry>[]>([]);
  const [loadingLedger, setLoadingLedger] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  useEffect(() => {
    if (!errorToast) return;
    const timer = setTimeout(() => setErrorToast(null), 6000);
    return () => clearTimeout(timer);
  }, [errorToast]);

  // 1. Subscribe to clients list (live openingDue / currentDue)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setClients([]);
      setLoadingClients(false);
      return;
    }

    setLoadingClients(true);
    const clientsQuery = query(getClientsCollection(tenantId), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      clientsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => docSnap.data());
        setClients(list);
        setLoadingClients(false);
        setSelectedClientId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev;
          if (initialClientId && list.some((c) => c.id === initialClientId)) {
            return initialClientId;
          }
          return list.length > 0 ? list[0].id : '';
        });
      },
      (error) => {
        setLoadingClients(false);
        try {
          handleFirestoreError(error, OperationType.LIST, clientsPath);
        } catch {
          setErrorToast(
            error.message || 'Failed to load clients / ক্লায়েন্ট তালিকা লোড ব্যর্থ হয়েছে।'
          );
        }
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, tenantId, clientsPath, initialClientId]);

  // 2. Query clientLedger where clientId == selected, orderBy entryDate
  //    Falls back cleanly to client-side entryDate sort if composite index is not yet created.
  useEffect(() => {
    if (authLoading || !user || !selectedClientId) {
      setEntries([]);
      setLoadingLedger(false);
      return;
    }

    setLoadingLedger(true);
    let active = true;
    let fallbackUnsub: (() => void) | null = null;

    const sortEntriesAsc = (list: WithId<ClientLedgerEntry>[]) =>
      [...list].sort((a, b) => {
        const dateA = formatDateISO(a.entryDate);
        const dateB = formatDateISO(b.entryDate);
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return getSortableTime(a.createdAt) - getSortableTime(b.createdAt);
      });

    const primaryQuery = query(
      getClientLedgerCollection(tenantId),
      where('clientId', '==', selectedClientId),
      orderBy('entryDate', 'asc')
    );

    const primaryUnsub = onSnapshot(
      primaryQuery,
      (snapshot) => {
        if (!active) return;
        const list = sortEntriesAsc(snapshot.docs.map((docSnap) => docSnap.data()));
        setEntries(list);
        setLoadingLedger(false);
      },
      (error) => {
        if (!active) return;
        const code = (error as { code?: string })?.code || '';
        const msg = (error.message || '').toLowerCase();
        const isMissingIndex =
          code === 'failed-precondition' || msg.includes('index');

        if (isMissingIndex) {
          // Automatic fallback without composite index while preserving exact ordering
          const fallbackQuery = query(
            getClientLedgerCollection(tenantId),
            where('clientId', '==', selectedClientId)
          );
          fallbackUnsub = onSnapshot(
            fallbackQuery,
            (snap) => {
              if (!active) return;
              setEntries(sortEntriesAsc(snap.docs.map((d) => d.data())));
              setLoadingLedger(false);
            },
            (fallbackErr) => {
              if (!active) return;
              setLoadingLedger(false);
              try {
                handleFirestoreError(fallbackErr, OperationType.LIST, ledgerPath);
              } catch {
                setErrorToast(
                  fallbackErr.message ||
                    'Failed to load client ledger / ক্লায়েন্ট লেজার লোড ব্যর্থ হয়েছে।'
                );
              }
            }
          );
          return;
        }

        setLoadingLedger(false);
        try {
          handleFirestoreError(error, OperationType.LIST, ledgerPath);
        } catch {
          setErrorToast(
            error.message || 'Failed to load client ledger / ক্লায়েন্ট লেজার লোড ব্যর্থ হয়েছে।'
          );
        }
      }
    );

    return () => {
      active = false;
      primaryUnsub();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, [user, authLoading, tenantId, selectedClientId, ledgerPath]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  // Compute running balance starting from client.openingDue and apply date range filter
  const ledgerSummary = useMemo(() => {
    const openingDue = Number(selectedClient?.openingDue) || 0;
    let running = openingDue;

    const computedAll = entries.map((entry) => {
      const debit = Number(entry.debit) || 0;
      const credit = Number(entry.credit) || 0;
      running = running + debit - credit;
      const computedBalance = Number.isFinite(Number(entry.balance))
        ? Number(entry.balance)
        : running;
      return {
        entry,
        dateStr: formatDateISO(entry.entryDate),
        debit,
        credit,
        balance: computedBalance,
      };
    });

    // Opening balance at the start of the selected date window
    let periodOpeningBalance = openingDue;
    if (startDate) {
      for (const row of computedAll) {
        if (row.dateStr && row.dateStr < startDate) {
          periodOpeningBalance = row.balance;
        }
      }
    }

    const filteredRows = computedAll.filter((row) => {
      if (startDate && row.dateStr && row.dateStr < startDate) return false;
      if (endDate && row.dateStr && row.dateStr > endDate) return false;
      return true;
    });

    const totalDebit = filteredRows.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = filteredRows.reduce((sum, r) => sum + r.credit, 0);
    const closingBalance =
      filteredRows.length > 0
        ? filteredRows[filteredRows.length - 1].balance
        : periodOpeningBalance;

    return {
      openingDue,
      periodOpeningBalance,
      filteredRows,
      totalDebit,
      totalCredit,
      closingBalance,
    };
  }, [entries, selectedClient, startDate, endDate]);

  const handleExportCSV = () => {
    if (!selectedClient) return;

    const header = [
      'Date',
      'Type',
      'Reference',
      'Remarks',
      'Debit',
      'Credit',
      'Balance',
    ];

    const openingLabel = startDate
      ? `Opening Balance (B/F as of ${startDate}) [Client Opening Due: ${ledgerSummary.openingDue}]`
      : `Opening Balance: ${ledgerSummary.openingDue}`;

    const rows: Array<Array<string | number>> = [
      [
        startDate || formatDateISO(selectedClient.createdAt) || '',
        'opening',
        openingLabel,
        '',
        '',
        '',
        ledgerSummary.periodOpeningBalance,
      ],
      ...ledgerSummary.filteredRows.map((row) => [
        row.dateStr,
        row.entry.entryType,
        row.entry.referenceId || row.entry.referenceType || '',
        row.entry.remarks || '',
        row.debit,
        row.credit,
        row.balance,
      ]),
      [
        endDate || getTodayDateString(),
        'total',
        'Closing Balance',
        '',
        ledgerSummary.totalDebit,
        ledgerSummary.totalCredit,
        ledgerSummary.closingBalance,
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [header, ...rows]
        .map((line) => line.map((cell) => escapeCSV(cell)).join(','))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (selectedClient.name || 'client')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.href = url;
    link.download = `client-ledger-${slug || selectedClient.id}-${getTodayDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-8 print:space-y-4 print:pb-0">
      {/* Error Toast */}
      {errorToast && (
        <div
          role="alert"
          className="no-print fixed bottom-5 right-5 z-50 max-w-md flex items-start gap-3 px-4 py-3.5 rounded-2xl border bg-[#FDECEF]/95 border-[#EA7185]/40 text-[#B4384E] shadow-floating backdrop-blur-xl"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#EA7185]" />
          <p className="text-xs sm:text-sm font-semibold leading-snug flex-1">{errorToast}</p>
          <button
            type="button"
            onClick={() => setErrorToast(null)}
            aria-label="Dismiss error"
            className="p-0.5 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-1 p-2 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#DDF4F3]/60 text-[#17383B] transition-colors cursor-pointer"
              title="Back to Clients / ক্লায়েন্ট তালিকায় ফিরুন"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17383B]">
              Client Ledger / ক্লায়েন্ট লেজার
            </h1>
            <p className="text-xs sm:text-sm text-[#688285] mt-1">
              Statement of invoices, payments, and running balance / ক্লায়েন্টের হিসাব বিবরণী
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-export-ledger-csv"
            disabled={!selectedClient || loadingLedger}
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] disabled:opacity-50 text-[#17383B] text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#0B9FA5]" />
            <span>Export CSV / সিএসভি</span>
          </button>

          <button
            type="button"
            id="btn-print-ledger-statement"
            disabled={!selectedClient || loadingLedger}
            onClick={handlePrintStatement}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B9FA5] to-[#16B8B0] hover:from-[#078A90] hover:to-[#0B9FA5] disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-[0_6px_20px_rgba(11,159,165,0.28)] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement / স্টেটমেন্ট প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Client Selector + Date Range Filter (hidden on print) */}
      <div className="no-print glass-panel rounded-3xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-end">
          {/* Client Selector */}
          <div className="lg:col-span-5">
            <label
              htmlFor="ledger-client-select"
              className="block text-xs font-bold text-[#17383B] mb-1.5"
            >
              Select Client / ক্লায়েন্ট নির্বাচন করুন
            </label>
            <select
              id="ledger-client-select"
              disabled={loadingClients}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-semibold text-[#17383B] focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
            >
              {loadingClients ? (
                <option value="">Loading clients... / ক্লায়েন্ট লোড হচ্ছে...</option>
              ) : clients.length === 0 ? (
                <option value="">No clients found / কোনো ক্লায়েন্ট নেই</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.companyName ? ` — ${c.companyName}` : ''} (Due: {formatBDT(c.currentDue)})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Start Date */}
          <div className="lg:col-span-3">
            <label
              htmlFor="ledger-start-date"
              className="block text-xs font-bold text-[#17383B] mb-1.5"
            >
              From Date / শুরুর তারিখ
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="ledger-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="lg:col-span-3">
            <label
              htmlFor="ledger-end-date"
              className="block text-xs font-bold text-[#17383B] mb-1.5"
            >
              To Date / শেষ তারিখ
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#8EA3A5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="ledger-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-[#F1FAFA] text-sm font-medium text-[#17383B] tabular-nums focus:bg-white focus:border-[#0B9FA5] focus:outline-none focus:ring-2 focus:ring-[#0B9FA5]/15"
              />
            </div>
          </div>

          {/* Reset Dates */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              disabled={!startDate && !endDate}
              title="Reset date range / তারিখ রিসেট"
              className="w-full lg:w-auto px-3 py-2.5 rounded-xl border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] disabled:opacity-40 text-xs font-bold text-[#688285] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="lg:hidden">Reset</span>
            </button>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-[#688285] mr-1">Quick Range:</span>
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className={`px-3 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
              !startDate && !endDate
                ? 'bg-[#DDF4F3] border-[#0B9FA5]/40 text-[#0B9FA5]'
                : 'bg-white border-[#D9EAEB] text-[#688285] hover:text-[#17383B]'
            }`}
          >
            All Time / সব সময়
          </button>
          <button
            type="button"
            onClick={() => {
              setStartDate(getMonthStartDateString());
              setEndDate(getTodayDateString());
            }}
            className="px-3 py-1 rounded-lg border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] font-semibold text-[#688285] hover:text-[#17383B] transition-colors cursor-pointer"
          >
            This Month / এই মাস
          </button>
          <button
            type="button"
            onClick={() => {
              setStartDate(getDaysAgoDateString(30));
              setEndDate(getTodayDateString());
            }}
            className="px-3 py-1 rounded-lg border border-[#D9EAEB] bg-white hover:bg-[#F1FAFA] font-semibold text-[#688285] hover:text-[#17383B] transition-colors cursor-pointer"
          >
            Last 30 Days / গত ৩০ দিন
          </button>
        </div>
      </div>

      {/* Printable Statement Container */}
      <div className="glass-panel rounded-3xl overflow-hidden print:bg-white print:border-none print:shadow-none print:rounded-none">
        {/* PDF / Print Statement Header */}
        {selectedClient && (
          <div className="p-6 border-b border-[#E6F0F1] bg-white/80 print:px-0 print:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="hidden print:block mb-2">
                  <p className="text-xl font-extrabold text-[#17383B]">
                    Mayer Doya Washing &amp; Dyeing
                  </p>
                  <p className="text-xs font-semibold text-[#688285] uppercase tracking-wider">
                    Client Account Statement / ক্লায়েন্ট হিসাব বিবরণী
                  </p>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#17383B]">
                  {selectedClient.name}
                  {selectedClient.companyName && (
                    <span className="text-sm font-semibold text-[#688285] ml-2">
                      ({selectedClient.companyName})
                    </span>
                  )}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#688285]">
                  {selectedClient.mobile && (
                    <span className="tabular-nums">Mobile: {selectedClient.mobile}</span>
                  )}
                  {selectedClient.address && <span>Address: {selectedClient.address}</span>}
                  <span>
                    Period:{' '}
                    <strong className="text-[#17383B]">
                      {startDate || 'Beginning'} — {endDate || getTodayDateString()}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
                <div className="px-3.5 py-2 rounded-xl bg-[#F1FAFA] border border-[#D9EAEB]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#688285]">
                    Opening Due
                  </p>
                  <p className="text-sm font-extrabold text-[#17383B] tabular-nums mt-0.5">
                    {formatBDT(ledgerSummary.openingDue)}
                  </p>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[#EEEBFF]/60 border border-[#8178F2]/25">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B52D6]">
                    Total Debit
                  </p>
                  <p className="text-sm font-extrabold text-[#5B52D6] tabular-nums mt-0.5">
                    {formatBDT(ledgerSummary.totalDebit)}
                  </p>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[#E5F8F1]/80 border border-[#38C99A]/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1D7F5F]">
                    Total Credit
                  </p>
                  <p className="text-sm font-extrabold text-[#1D7F5F] tabular-nums mt-0.5">
                    {formatBDT(ledgerSummary.totalCredit)}
                  </p>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[#DDF4F3]/75 border border-[#0B9FA5]/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0B9FA5]">
                    Closing Balance
                  </p>
                  <p className="text-sm font-extrabold text-[#17383B] tabular-nums mt-0.5">
                    {formatBDT(ledgerSummary.closingBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ledger Table Body */}
        {loadingClients || loadingLedger ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 border-3 border-[#0B9FA5] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-[#688285]">
              Loading client ledger... / লেজার তথ্য লোড হচ্ছে...
            </p>
          </div>
        ) : !selectedClient ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#DDF4F3] text-[#0B9FA5] flex items-center justify-center mb-3">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#17383B]">
              Select a client to view ledger / লেজার দেখতে ক্লায়েন্ট নির্বাচন করুন
            </h3>
            <p className="text-xs sm:text-sm text-[#688285] mt-1">
              Add a client first or choose one from the dropdown above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6F0F1] bg-[#F1FAFA]/90 text-[11px] font-bold uppercase tracking-wider text-[#688285] print:bg-gray-100">
                  <th className="py-3.5 px-5">Date / তারিখ</th>
                  <th className="py-3.5 px-5">Type / ধরন</th>
                  <th className="py-3.5 px-5">Reference / রেফারেন্স</th>
                  <th className="py-3.5 px-5 text-right">Debit / ডেবিট</th>
                  <th className="py-3.5 px-5 text-right">Credit / ক্রেডিট</th>
                  <th className="py-3.5 px-5 text-right">Balance / ব্যালেন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0F1] text-sm">
                {/* Opening Balance Row */}
                <tr className="bg-[#F1FAFA]/65 font-semibold">
                  <td className="py-3.5 px-5 text-xs text-[#688285] tabular-nums">
                    {startDate || formatDateISO(selectedClient.createdAt) || '—'}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D9EAEB] text-xs font-bold text-[#17383B]">
                      <FileText className="w-3.5 h-3.5 text-[#0B9FA5]" />
                      <span>Opening</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-[#17383B] font-bold">
                    Opening Balance: {formatBDT(ledgerSummary.openingDue)}
                    {startDate && ledgerSummary.periodOpeningBalance !== ledgerSummary.openingDue && (
                      <span className="block text-xs font-medium text-[#688285] mt-0.5">
                        Brought Forward as of {startDate}:{' '}
                        {formatBDT(ledgerSummary.periodOpeningBalance)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right text-[#8EA3A5] tabular-nums">—</td>
                  <td className="py-3.5 px-5 text-right text-[#8EA3A5] tabular-nums">—</td>
                  <td className="py-3.5 px-5 text-right font-extrabold text-[#17383B] tabular-nums">
                    {formatBDT(ledgerSummary.periodOpeningBalance)}
                  </td>
                </tr>

                {/* Ledger Entries */}
                {ledgerSummary.filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 px-5 text-center text-xs sm:text-sm text-[#688285]"
                    >
                      No ledger transactions recorded in this date range / এই সময়সীমায় কোনো লেনদেন
                      পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  ledgerSummary.filteredRows.map((row) => {
                    const typeBadge = getEntryTypeBadge(row.entry.entryType);
                    return (
                      <tr
                        key={row.entry.id}
                        className="hover:bg-[#F1FAFA]/50 transition-colors"
                      >
                        <td className="py-3.5 px-5 text-xs sm:text-sm font-medium text-[#17383B] tabular-nums whitespace-nowrap">
                          {row.dateStr || '—'}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${typeBadge.badgeClass}`}
                          >
                            {typeBadge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[#17383B]">
                            {row.entry.referenceId ? (
                              <span className="font-mono text-xs bg-[#F1FAFA] px-2 py-0.5 rounded border border-[#D9EAEB]">
                                {row.entry.referenceType ? `${row.entry.referenceType}: ` : ''}
                                {row.entry.referenceId}
                              </span>
                            ) : (
                              row.entry.referenceType || '—'
                            )}
                          </div>
                          {row.entry.remarks && (
                            <p className="text-xs text-[#688285] mt-1 max-w-md">
                              {row.entry.remarks}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold tabular-nums whitespace-nowrap">
                          {row.debit > 0 ? (
                            <span className="text-[#C94A60]">{formatBDT(row.debit)}</span>
                          ) : (
                            <span className="text-[#8EA3A5]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold tabular-nums whitespace-nowrap">
                          {row.credit > 0 ? (
                            <span className="text-[#1D7F5F]">{formatBDT(row.credit)}</span>
                          ) : (
                            <span className="text-[#8EA3A5]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-[#17383B] tabular-nums whitespace-nowrap">
                          {formatBDT(row.balance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Closing Totals Footer */}
              <tfoot>
                <tr className="border-t-2 border-[#0B9FA5]/30 bg-[#DDF4F3]/45 font-extrabold text-sm">
                  <td colSpan={3} className="py-3.5 px-5 text-[#17383B]">
                    Period Totals &amp; Closing Balance / মোট ও সমাপনী ব্যালেন্স
                  </td>
                  <td className="py-3.5 px-5 text-right text-[#C94A60] tabular-nums whitespace-nowrap">
                    {formatBDT(ledgerSummary.totalDebit)}
                  </td>
                  <td className="py-3.5 px-5 text-right text-[#1D7F5F] tabular-nums whitespace-nowrap">
                    {formatBDT(ledgerSummary.totalCredit)}
                  </td>
                  <td className="py-3.5 px-5 text-right text-[#17383B] tabular-nums whitespace-nowrap">
                    {formatBDT(ledgerSummary.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Print-only signature block */}
        {selectedClient && (
          <div className="hidden print:grid grid-cols-2 gap-12 pt-14 px-2 text-center text-xs text-[#688285]">
            <div className="border-t border-gray-400 pt-2">
              Client Confirmation / ক্লায়েন্ট স্বাক্ষর
            </div>
            <div className="border-t border-gray-400 pt-2">
              Accounts Department / হিসাব বিভাগ
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientLedger;
