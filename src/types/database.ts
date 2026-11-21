import type { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Firestore timestamp representation across reads (Timestamp) and writes (Timestamp | FieldValue | Date | string).
 */
export type FirestoreTimestamp = Timestamp | FieldValue | Date | string;

/**
 * Utility type representing a persisted Firestore document that always includes its document ID.
 */
export type WithId<T> = T & { id: string };

/**
 * Utility type for creating a new Firestore document before an ID is assigned.
 */
export type NewDocument<T extends { id?: string }> = Omit<T, 'id'>;

// ---------------------------------------------------------------------------
// Tenants
// ---------------------------------------------------------------------------

export type TenantPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Tenant {
  id?: string;
  name: string;
  createdAt: FirestoreTimestamp;
  plan: TenantPlan;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export interface Client {
  id?: string;
  name: string;
  companyName: string;
  address: string;
  mobile: string;
  email: string;
  openingDue: number;
  currentDue: number;
  notes: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Counters
// ---------------------------------------------------------------------------

export interface Counter {
  id?: string;
  current: number;
  updatedAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type OrderStatus =
  | 'received'
  | 'pending'
  | 'processing'
  | 'washing'
  | 'dyeing'
  | 'finishing'
  | 'ready'
  | 'partial_delivered'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id?: string;
  orderNo: string;
  clientId: string;
  clientName: string;
  orderDate: FirestoreTimestamp;
  deliveryDate: FirestoreTimestamp;
  fabricType: string;
  processingType: string;
  colorQuality: string;
  greyThan: number;
  greyGaz: number;
  ratePerGaz: number;
  status: OrderStatus;
  specialInstruction: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------------

export interface Delivery {
  id?: string;
  challanNo: string;
  orderId: string;
  clientId: string;
  clientName: string;
  deliveryDate: FirestoreTimestamp;
  processedGaz: number;
  finalGaz: number;
  wastageGaz: number;
  ratePerGaz: number;
  invoiceId: string;
  remarks: string;
  createdAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface Invoice {
  id?: string;
  invoiceNo: string;
  orderId: string;
  deliveryId: string;
  clientId: string;
  clientName: string;
  invoiceDate: FirestoreTimestamp;
  subtotal: number;
  discount: number;
  previousDue: number;
  total: number;
  paid: number;
  currentDue: number;
  status: InvoiceStatus;
  createdAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Client Ledger
// ---------------------------------------------------------------------------

export type ClientLedgerEntryType = 'invoice' | 'payment' | 'adjustment';

export interface ClientLedgerEntry {
  id?: string;
  clientId: string;
  entryDate: FirestoreTimestamp;
  entryType: ClientLedgerEntryType;
  referenceId: string;
  referenceType: string;
  debit: number;
  credit: number;
  balance: number;
  remarks: string;
  createdBy: string;
  createdAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export interface Supplier {
  id?: string;
  name: string;
  companyName: string;
  address: string;
  mobile: string;
  product: string;
  openingDue: number;
  currentDue: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Purchases
// ---------------------------------------------------------------------------

export interface PurchaseItem {
  name: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Purchase {
  id?: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: FirestoreTimestamp;
  items: PurchaseItem[];
  total: number;
  paid: number;
  due: number;
  remarks: string;
  createdAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Supplier Ledger
// ---------------------------------------------------------------------------

export type SupplierLedgerEntryType = 'purchase' | 'payment';

export interface SupplierLedgerEntry {
  id?: string;
  supplierId: string;
  entryDate: FirestoreTimestamp;
  entryType: SupplierLedgerEntryType;
  referenceId: string;
  referenceType: string;
  debit: number;
  credit: number;
  balance: number;
  remarks: string;
  createdAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export type AccountType = 'cash' | 'bank' | 'mobile';

export interface Account {
  id?: string;
  name: string;
  accountType: AccountType;
  openingBalance: number;
  currentBalance: number;
  createdAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export type TransactionType = 'money_in' | 'money_out' | 'transfer';

export interface Transaction {
  id?: string;
  accountId: string;
  txnDate: FirestoreTimestamp;
  txnType: TransactionType;
  category: string;
  referenceId: string;
  referenceType: string;
  amount: number;
  remarks: string;
  createdBy: string;
  createdAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Cheques
// ---------------------------------------------------------------------------

export type ChequeStatus = 'Pending' | 'Deposited' | 'Endorsed' | 'Cleared' | 'Bounced';

export type ChequeReceivedFromType = 'client' | 'supplier' | 'other';

export interface Cheque {
  id?: string;
  chequeNo: string;
  bankName: string;
  amount: number;
  issueDate: FirestoreTimestamp;
  receivedFromType: ChequeReceivedFromType;
  receivedFromId: string;
  receivedFromName: string;
  status: ChequeStatus;
  depositDate?: FirestoreTimestamp | null;
  endorsedToId?: string | null;
  endorsedToName?: string | null;
  clearedDate?: FirestoreTimestamp | null;
  createdAt: FirestoreTimestamp;
}

// ---------------------------------------------------------------------------
// Chemicals & Chemical Transactions
// ---------------------------------------------------------------------------

export interface Chemical {
  id?: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  purchaseRate: number;
  supplier: string;
  createdAt: FirestoreTimestamp;
}

export type ChemicalTransactionType = 'purchase' | 'usage' | 'adjustment';

export interface ChemicalTransaction {
  id?: string;
  chemicalId: string;
  txnDate: FirestoreTimestamp;
  txnType: ChemicalTransactionType;
  qty: number;
  rate: number;
  referenceId: string;
  remarks: string;
  createdAt: FirestoreTimestamp;
}
