import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
  PartialWithFieldValue,
  SetOptions,
} from 'firebase/firestore';
import { db, cleanFirestoreData } from './firebase';
import type {
  Tenant,
  Client,
  Order,
  Delivery,
  Invoice,
  ClientLedgerEntry,
  Supplier,
  Purchase,
  SupplierLedgerEntry,
  Account,
  Transaction,
  Cheque,
  Chemical,
  ChemicalTransaction,
  Counter,
  WithId,
} from '../types/database';

export const DEFAULT_TENANT_ID = 'default';

/**
 * Returns the active tenant ID.
 * Currently returns the constant 'default' tenant; will be resolved from authenticated user context later.
 */
export function getTenantId(): string {
  return DEFAULT_TENANT_ID;
}

export const TENANTS_COLLECTION = 'tenants' as const;

export const TENANT_SUBCOLLECTIONS = {
  clients: 'clients',
  orders: 'orders',
  deliveries: 'deliveries',
  invoices: 'invoices',
  clientLedger: 'clientLedger',
  suppliers: 'suppliers',
  purchases: 'purchases',
  supplierLedger: 'supplierLedger',
  accounts: 'accounts',
  transactions: 'transactions',
  cheques: 'cheques',
  chemicals: 'chemicals',
  chemicalTransactions: 'chemicalTransactions',
  counters: 'counters',
} as const;

export type TenantSubcollectionName =
  (typeof TENANT_SUBCOLLECTIONS)[keyof typeof TENANT_SUBCOLLECTIONS];

/**
 * Generic FirestoreDataConverter that strips `id` and `undefined` fields on write
 * and attaches the document's `id` on read.
 */
function createConverter<T extends { id?: string }>(): FirestoreDataConverter<WithId<T>> {
  return {
    toFirestore(
      modelObject: WithFieldValue<WithId<T>> | PartialWithFieldValue<WithId<T>>,
      _options?: SetOptions
    ): DocumentData {
      const { id: _ignoredId, ...rest } = modelObject as Record<string, unknown>;
      return cleanFirestoreData(rest) as DocumentData;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions
    ): WithId<T> {
      const data = snapshot.data(options) as Omit<T, 'id'>;
      return {
        ...data,
        id: snapshot.id,
      } as WithId<T>;
    },
  };
}

function resolveTenantId(tenantId?: string): string {
  const resolved = (tenantId ?? getTenantId()).trim();
  if (!resolved) {
    throw new Error('A valid non-empty tenantId is required to access tenant collections.');
  }
  return resolved;
}

function getTenantSubcollection<T extends { id?: string }>(
  subcollection: TenantSubcollectionName,
  tenantId?: string
): CollectionReference<WithId<T>> {
  const tid = resolveTenantId(tenantId);
  return collection(db, TENANTS_COLLECTION, tid, subcollection).withConverter(
    createConverter<T>()
  );
}

function getTenantSubdocument<T extends { id?: string }>(
  subcollection: TenantSubcollectionName,
  docId: string,
  tenantId?: string
): DocumentReference<WithId<T>> {
  const tid = resolveTenantId(tenantId);
  return doc(db, TENANTS_COLLECTION, tid, subcollection, docId).withConverter(
    createConverter<T>()
  );
}

// ---------------------------------------------------------------------------
// Tenant Root References
// ---------------------------------------------------------------------------

export function getTenantsCollection(): CollectionReference<WithId<Tenant>> {
  return collection(db, TENANTS_COLLECTION).withConverter(createConverter<Tenant>());
}

export function getTenantDoc(tenantId?: string): DocumentReference<WithId<Tenant>> {
  const tid = resolveTenantId(tenantId);
  return doc(db, TENANTS_COLLECTION, tid).withConverter(createConverter<Tenant>());
}

// ---------------------------------------------------------------------------
// Typed Tenant Subcollection Helpers
// ---------------------------------------------------------------------------

export function getClientsCollection(tenantId?: string): CollectionReference<WithId<Client>> {
  return getTenantSubcollection<Client>(TENANT_SUBCOLLECTIONS.clients, tenantId);
}

export function getClientDoc(clientId: string, tenantId?: string): DocumentReference<WithId<Client>> {
  return getTenantSubdocument<Client>(TENANT_SUBCOLLECTIONS.clients, clientId, tenantId);
}

export function getOrdersCollection(tenantId?: string): CollectionReference<WithId<Order>> {
  return getTenantSubcollection<Order>(TENANT_SUBCOLLECTIONS.orders, tenantId);
}

export function getOrderDoc(orderId: string, tenantId?: string): DocumentReference<WithId<Order>> {
  return getTenantSubdocument<Order>(TENANT_SUBCOLLECTIONS.orders, orderId, tenantId);
}

export function getDeliveriesCollection(tenantId?: string): CollectionReference<WithId<Delivery>> {
  return getTenantSubcollection<Delivery>(TENANT_SUBCOLLECTIONS.deliveries, tenantId);
}

export function getDeliveryDoc(deliveryId: string, tenantId?: string): DocumentReference<WithId<Delivery>> {
  return getTenantSubdocument<Delivery>(TENANT_SUBCOLLECTIONS.deliveries, deliveryId, tenantId);
}

export function getInvoicesCollection(tenantId?: string): CollectionReference<WithId<Invoice>> {
  return getTenantSubcollection<Invoice>(TENANT_SUBCOLLECTIONS.invoices, tenantId);
}

export function getInvoiceDoc(invoiceId: string, tenantId?: string): DocumentReference<WithId<Invoice>> {
  return getTenantSubdocument<Invoice>(TENANT_SUBCOLLECTIONS.invoices, invoiceId, tenantId);
}

export function getClientLedgerCollection(tenantId?: string): CollectionReference<WithId<ClientLedgerEntry>> {
  return getTenantSubcollection<ClientLedgerEntry>(TENANT_SUBCOLLECTIONS.clientLedger, tenantId);
}

export function getClientLedgerDoc(entryId: string, tenantId?: string): DocumentReference<WithId<ClientLedgerEntry>> {
  return getTenantSubdocument<ClientLedgerEntry>(TENANT_SUBCOLLECTIONS.clientLedger, entryId, tenantId);
}

export function getSuppliersCollection(tenantId?: string): CollectionReference<WithId<Supplier>> {
  return getTenantSubcollection<Supplier>(TENANT_SUBCOLLECTIONS.suppliers, tenantId);
}

export function getSupplierDoc(supplierId: string, tenantId?: string): DocumentReference<WithId<Supplier>> {
  return getTenantSubdocument<Supplier>(TENANT_SUBCOLLECTIONS.suppliers, supplierId, tenantId);
}

export function getPurchasesCollection(tenantId?: string): CollectionReference<WithId<Purchase>> {
  return getTenantSubcollection<Purchase>(TENANT_SUBCOLLECTIONS.purchases, tenantId);
}

export function getPurchaseDoc(purchaseId: string, tenantId?: string): DocumentReference<WithId<Purchase>> {
  return getTenantSubdocument<Purchase>(TENANT_SUBCOLLECTIONS.purchases, purchaseId, tenantId);
}

export function getSupplierLedgerCollection(tenantId?: string): CollectionReference<WithId<SupplierLedgerEntry>> {
  return getTenantSubcollection<SupplierLedgerEntry>(TENANT_SUBCOLLECTIONS.supplierLedger, tenantId);
}

export function getSupplierLedgerDoc(entryId: string, tenantId?: string): DocumentReference<WithId<SupplierLedgerEntry>> {
  return getTenantSubdocument<SupplierLedgerEntry>(TENANT_SUBCOLLECTIONS.supplierLedger, entryId, tenantId);
}

export function getAccountsCollection(tenantId?: string): CollectionReference<WithId<Account>> {
  return getTenantSubcollection<Account>(TENANT_SUBCOLLECTIONS.accounts, tenantId);
}

export function getAccountDoc(accountId: string, tenantId?: string): DocumentReference<WithId<Account>> {
  return getTenantSubdocument<Account>(TENANT_SUBCOLLECTIONS.accounts, accountId, tenantId);
}

export function getTransactionsCollection(tenantId?: string): CollectionReference<WithId<Transaction>> {
  return getTenantSubcollection<Transaction>(TENANT_SUBCOLLECTIONS.transactions, tenantId);
}

export function getTransactionDoc(txnId: string, tenantId?: string): DocumentReference<WithId<Transaction>> {
  return getTenantSubdocument<Transaction>(TENANT_SUBCOLLECTIONS.transactions, txnId, tenantId);
}

export function getChequesCollection(tenantId?: string): CollectionReference<WithId<Cheque>> {
  return getTenantSubcollection<Cheque>(TENANT_SUBCOLLECTIONS.cheques, tenantId);
}

export function getChequeDoc(chequeId: string, tenantId?: string): DocumentReference<WithId<Cheque>> {
  return getTenantSubdocument<Cheque>(TENANT_SUBCOLLECTIONS.cheques, chequeId, tenantId);
}

export function getChemicalsCollection(tenantId?: string): CollectionReference<WithId<Chemical>> {
  return getTenantSubcollection<Chemical>(TENANT_SUBCOLLECTIONS.chemicals, tenantId);
}

export function getChemicalDoc(chemicalId: string, tenantId?: string): DocumentReference<WithId<Chemical>> {
  return getTenantSubdocument<Chemical>(TENANT_SUBCOLLECTIONS.chemicals, chemicalId, tenantId);
}

export function getChemicalTransactionsCollection(
  tenantId?: string
): CollectionReference<WithId<ChemicalTransaction>> {
  return getTenantSubcollection<ChemicalTransaction>(
    TENANT_SUBCOLLECTIONS.chemicalTransactions,
    tenantId
  );
}

export function getChemicalTransactionDoc(
  txnId: string,
  tenantId?: string
): DocumentReference<WithId<ChemicalTransaction>> {
  return getTenantSubdocument<ChemicalTransaction>(
    TENANT_SUBCOLLECTIONS.chemicalTransactions,
    txnId,
    tenantId
  );
}

export function getCountersCollection(tenantId?: string): CollectionReference<WithId<Counter>> {
  return getTenantSubcollection<Counter>(TENANT_SUBCOLLECTIONS.counters, tenantId);
}

export function getCounterDoc(
  counterId: string,
  tenantId?: string
): DocumentReference<WithId<Counter>> {
  return getTenantSubdocument<Counter>(TENANT_SUBCOLLECTIONS.counters, counterId, tenantId);
}
