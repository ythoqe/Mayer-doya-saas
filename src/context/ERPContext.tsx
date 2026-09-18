import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Language, 
  User, 
  UserRole,
  UserStatus,
  Order, 
  Client, 
  Supplier, 
  InventoryItem, 
  Expense, 
  Account, 
  Transaction, 
  Cheque, 
  ChequeStatus,
  ChequeDirection,
  Employee, 
  Notification,
  OrderStatus,
  Investor,
  Investment,
  InvestorWithdrawal,
  ProfitDistribution,
  ClientBill,
  BillStatus,
  SupplierPurchase,
  SupplierPayment,
  BankLoan,
  LoanInstallmentPayment,
  LoanType,
  LoanStatus
} from '../types';
import { translations } from '../utils/translation';
import { db, firebaseConfig, testFirestoreConnection, cleanFirestoreData } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc as rawSetDoc, 
  deleteDoc, 
  updateDoc as rawUpdateDoc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

/**
 * Safe Firestore writers:
 * Recursively removes all `undefined` values from data objects before invoking Firestore,
 * preventing 'Unsupported field value: undefined' runtime errors.
 */
const setDoc = (docRef: any, data: any, options?: any) => {
  try {
    const cleaned = cleanFirestoreData(data);
    return options ? rawSetDoc(docRef, cleaned, options) : rawSetDoc(docRef, cleaned);
  } catch (err) {
    console.warn('Firestore setDoc invocation warning:', err);
    return Promise.reject(err);
  }
};

const updateDoc = (docRef: any, data: any) => {
  try {
    const cleaned = cleanFirestoreData(data);
    return rawUpdateDoc(docRef, cleaned);
  } catch (err) {
    console.warn('Firestore updateDoc invocation warning:', err);
    return Promise.reject(err);
  }
};

export const DEFAULT_ADMIN: User = {
  id: 'usr-admin-primary',
  name: 'Mojammal Hoq',
  email: 'hmmojjammalhoq@gmail.com',
  password: '@hoq@95036042HM',
  role: 'super_admin',
  status: 'approved',
  phone: '+880 1700-000000',
  createdAt: '2026-01-01T00:00:00.000Z',
  approvedAt: '2026-01-01T00:00:00.000Z',
  approvedBy: 'System',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

interface ERPContextType {
  // Localization & Auth
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  pendingUsersCount: number;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (userData: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    phone?: string;
  }) => Promise<{ success: boolean; message: string }>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  isOnline: boolean;
  isSyncing: boolean;
  firebaseConnected: boolean;
  firebaseProjectId: string;
  syncAllToFirebase: () => Promise<boolean>;

  // Collections
  orders: Order[];
  clients: Client[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  expenses: Expense[];
  accounts: Account[];
  transactions: Transaction[];
  cheques: Cheque[];
  employees: Employee[];
  notifications: Notification[];
  investors: Investor[];
  investments: Investment[];
  withdrawals: InvestorWithdrawal[];
  profitDistributions: ProfitDistribution[];
  clientBills: ClientBill[];
  supplierPurchases: SupplierPurchase[];
  supplierPayments: SupplierPayment[];
  bankLoans: BankLoan[];
  loanInstallments: LoanInstallmentPayment[];

  // CRUD & Mutations
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  payEmployeeSalary: (salaryData: {
    employeeId: string;
    employeeName: string;
    payrollRecordId?: string;
    month: string;
    amount: number;
    accountId: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message?: string }>;

  // Investors CRUD & Accounting Mutations
  addInvestor: (investor: Omit<Investor, 'id' | 'createdAt' | 'totalInvested' | 'totalWithdrawn' | 'totalProfitReceived' | 'pendingProfit' | 'currentPosition'>) => Promise<string>;
  updateInvestor: (id: string, updates: Partial<Investor>) => Promise<void>;
  deleteInvestor: (id: string) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt'>) => Promise<string>;
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addWithdrawal: (withdrawal: Omit<InvestorWithdrawal, 'id' | 'createdAt'>) => Promise<string>;
  updateWithdrawal: (id: string, updates: Partial<InvestorWithdrawal>) => Promise<void>;
  deleteWithdrawal: (id: string) => Promise<void>;
  distributeProfit: (distribution: Omit<ProfitDistribution, 'id' | 'createdAt'>) => Promise<string>;
  payoutInvestorProfit: (distributionId: string, investorId: string, accountId: string, reference?: string, notes?: string) => Promise<void>;

  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  deliverOrder: (id: string, deliveryData: {
    finishingYards: number;
    unitRate?: number;
    deliveryNotes?: string;
    paymentAmount?: number;
    paymentAccountId?: string;
    deliveryDate?: string;
  }) => Promise<void>;

  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Running Bills & Bill Payments
  addClientBill: (bill: Omit<ClientBill, 'id' | 'createdAt'>) => Promise<string>;
  updateClientBill: (id: string, updates: Partial<ClientBill>) => Promise<void>;
  deleteClientBill: (id: string) => Promise<void>;
  recordBillPayment: (paymentData: {
    billId: string;
    clientId: string;
    paymentDate: string;
    paymentAmount: number;
    paymentAccountId: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  recordClientPayment: (paymentData: {
    clientId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: 'old_dues' | 'current_order';
    selectedYear?: string;
    orderId?: string;
    billId?: string;
    reference?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message?: string }>;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  paySupplier: (paymentData: {
    supplierId: string;
    amount: number;
    accountId: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  recordChemicalPurchase: (purchaseData: {
    supplierId: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
    purchaseDate: string;
    invoiceRef?: string;
    paymentStatus: 'Paid' | 'Partial' | 'Due';
    paidAmount?: number;
    paymentAccountId?: string;
    location?: string;
    notes?: string;
  }) => Promise<{ success: boolean; purchaseId?: string; message?: string }>;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  updateInventoryStock: (id: string, newStock: number) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addCheque: (cheque: Omit<Cheque, 'id' | 'createdAt'>) => Promise<string>;
  updateCheque: (id: string, updates: Partial<Cheque>) => Promise<void>;
  deleteCheque: (id: string) => Promise<void>;
  updateChequeStatus: (id: string, status: ChequeStatus, reason?: string) => Promise<void>;
  endorseChequeToSupplier: (sourceChequeId: string, supplierId: string, supplierName: string, notes?: string) => Promise<void>;

  addBankLoan: (loanData: Omit<BankLoan, 'id' | 'createdAt' | 'updatedAt' | 'totalPrincipalPaid' | 'totalInterestPaid' | 'currentOutstanding'>) => Promise<boolean>;
  updateBankLoan: (id: string, updates: Partial<BankLoan>) => Promise<boolean>;
  deleteBankLoan: (id: string) => Promise<boolean>;
  addLoanInstallment: (installmentData: Omit<LoanInstallmentPayment, 'id' | 'createdAt'>) => Promise<boolean>;
  deleteLoanInstallment: (id: string) => Promise<boolean>;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'time'>) => void;

  // Metrics
  metrics: {
    totalRevenue: number;
    activeBatchesCount: number;
    pendingDeliveriesCount: number;
    chemicalStockValue: number;
    netCashBalance: number;
    totalReceivables: number;
    totalPayables: number;
    todayWashOutput: number;
    totalClients: number;
    activeOrdersCount: number;
    completedDeliveriesCount: number;
    runningBillsCount: number;
    runningBillsTotalDue: number;
    cashBalance: number;
    bankBalance: number;
    mfsBalance: number;
    totalExpenses: number;
    lowStockCount: number;
    supplierDue: number;
    monthlyPayroll: number;
    investorCapital: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    netCashFlow: number;
  };

  // Quick Action Modal Controller
  quickActionModal: 'order' | 'expense' | 'payment' | 'chemical' | null;
  openQuickAction: (action: 'order' | 'expense' | 'payment' | 'chemical' | null) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

// Safe Storage Loading Helper - Ensures user deletions persist permanently
function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      // Return parsed array even if empty ([]) so user deletions are not reverted
      return (Array.isArray(parsed) ? (parsed as unknown as T) : fallback);
    }
    return (parsed !== null && parsed !== undefined ? parsed : fallback) as T;
  } catch (err) {
    return fallback;
  }
}

export const DEFAULT_INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    accountName: 'কারখানা প্রধান ক্যাশ (Main Cash)',
    accountNumber: 'CASH-01',
    bankName: 'কারখানা ক্যাশ ভল্ট (Factory Vault)',
    branch: 'হেড অফিস',
    currentBalance: 75000,
    accountType: 'Cash',
    status: 'active'
  },
  {
    id: 'acc-ibbl',
    accountName: 'মেসার্স মায়ের দোয়া ওয়াশিং ও ডায়িং কারখানা',
    accountNumber: '2050213020012345',
    bankName: 'Islami Bank Bangladesh PLC',
    branch: 'গাজীপুর শাখা',
    currentBalance: 150000,
    accountType: 'Bank',
    status: 'active'
  },
  {
    id: 'acc-dbbl',
    accountName: 'M/S Mayer Doya Washing Plant',
    accountNumber: '115.120.98765',
    bankName: 'Dutch-Bangla Bank PLC',
    branch: 'টঙ্গী শাখা',
    currentBalance: 95000,
    accountType: 'Bank',
    status: 'active'
  }
];

export const DEFAULT_INITIAL_BANK_LOANS: BankLoan[] = [
  {
    id: 'loan-1',
    loanTitle: 'Working Capital Term Loan (চলতি মূলধন ঋণ)',
    bankName: 'Islami Bank Bangladesh PLC',
    branchName: 'Narayanganj Main Branch',
    accountNumber: 'IBBL-TERM-2024-8842',
    loanType: 'term_loan',
    disbursementDate: '2024-06-15',
    sanctionAmount: 2500000,
    interestRateAnnual: 9.0,
    tenureMonths: 36,
    monthlyInstallment: 79499,
    disbursedToAccountId: 'acc-ibbl',
    disbursedToAccountName: 'Islami Bank - Factory Current',
    status: 'active',
    totalPrincipalPaid: 850000,
    totalInterestPaid: 183988,
    currentOutstanding: 1650000,
    nextDueDate: '2026-03-15',
    collateralDetails: 'Factory Land & Shed Title Deed #4402/Narayanganj',
    guarantorName: 'Alhaj Rafiqul Islam (Managing Director)',
    notes: 'Loan sanctioned for raw chemical inventory & daily operations',
    createdAt: '2024-06-15T10:00:00.000Z',
    updatedAt: '2026-02-15T14:30:00.000Z'
  },
  {
    id: 'loan-2',
    loanTitle: 'Industrial Boiler & Machinery Expansion Loan',
    bankName: 'Dutch-Bangla Bank PLC',
    branchName: 'Siddhirganj SME Branch',
    accountNumber: 'DBBL-CC-84920',
    loanType: 'machinery_loan',
    disbursementDate: '2025-01-10',
    sanctionAmount: 1500000,
    interestRateAnnual: 10.0,
    tenureMonths: 24,
    monthlyInstallment: 69219,
    disbursedToAccountId: 'acc-dbbl',
    disbursedToAccountName: 'Dutch Bangla Bank - Ops',
    status: 'active',
    totalPrincipalPaid: 450000,
    totalInterestPaid: 103752,
    currentOutstanding: 1050000,
    nextDueDate: '2026-03-10',
    collateralDetails: 'Factory Machinery Hypothecation (Boiler #2 & Hydro-extractor #4)',
    guarantorName: 'Mayer Doya Board of Directors',
    notes: 'High-efficiency industrial boiler and finishing dryer installation',
    createdAt: '2025-01-10T11:00:00.000Z',
    updatedAt: '2026-02-10T12:00:00.000Z'
  }
];

export const DEFAULT_INITIAL_LOAN_INSTALLMENTS: LoanInstallmentPayment[] = [
  {
    id: 'inst-1',
    loanId: 'loan-1',
    loanTitle: 'Working Capital Term Loan (চলতি মূলধন ঋণ)',
    bankName: 'Islami Bank Bangladesh PLC',
    paymentDate: '2026-01-15',
    installmentNumber: 19,
    totalAmount: 79499,
    principalAmount: 64200,
    interestAmount: 15299,
    fromAccountId: 'acc-ibbl',
    fromAccountName: 'Islami Bank - Factory Current',
    paymentMethod: 'Auto-Debit',
    reference: 'IBBL-AUTO-DEBIT-JAN26',
    notes: 'January 2026 EMI debited by bank',
    createdAt: '2026-01-15T09:30:00.000Z'
  },
  {
    id: 'inst-2',
    loanId: 'loan-1',
    loanTitle: 'Working Capital Term Loan (চলতি মূলধন ঋণ)',
    bankName: 'Islami Bank Bangladesh PLC',
    paymentDate: '2026-02-15',
    installmentNumber: 20,
    totalAmount: 79499,
    principalAmount: 64800,
    interestAmount: 14699,
    fromAccountId: 'acc-ibbl',
    fromAccountName: 'Islami Bank - Factory Current',
    paymentMethod: 'Bank Transfer',
    reference: 'BEFTN-FEB26-8821',
    notes: 'February 2026 EMI transfer voucher',
    createdAt: '2026-02-15T11:00:00.000Z'
  },
  {
    id: 'inst-3',
    loanId: 'loan-2',
    loanTitle: 'Industrial Boiler & Machinery Expansion Loan',
    bankName: 'Dutch-Bangla Bank PLC',
    paymentDate: '2026-02-10',
    installmentNumber: 13,
    totalAmount: 69219,
    principalAmount: 58500,
    interestAmount: 10719,
    fromAccountId: 'acc-dbbl',
    fromAccountName: 'Dutch Bangla Bank - Ops',
    paymentMethod: 'Auto-Debit',
    reference: 'DBBL-STANDING-INSTR-FEB26',
    notes: 'February 2026 EMI auto payment',
    createdAt: '2026-02-10T10:15:00.000Z'
  }
];

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Localization
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mayer_doya_lang');
    return (saved === 'bn' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mayer_doya_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  // Auth & Session
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mayer_doya_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        const hasAdmin = parsed.some(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
        return hasAdmin ? parsed : [DEFAULT_ADMIN, ...parsed];
      } catch {
        return [DEFAULT_ADMIN];
      }
    }
    return [DEFAULT_ADMIN];
  });

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem('mayer_doya_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email?.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()) {
          return DEFAULT_ADMIN;
        }
        if (parsed.status === 'approved') {
          return parsed;
        }
        return null;
      } catch {
        return DEFAULT_ADMIN;
      }
    }
    return DEFAULT_ADMIN;
  });

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('mayer_doya_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mayer_doya_user');
    }
  };

  const login = async (emailInput: string, passwordInput?: string): Promise<boolean> => {
    const emailClean = (emailInput || '').trim().toLowerCase();
    const passClean = (passwordInput || '').trim();

    if (!emailClean) {
      throw new Error(language === 'bn' ? 'ইমেইল অ্যাড্রেস লিখুন!' : 'Please enter your email!');
    }

    // Check if primary admin
    if (emailClean === DEFAULT_ADMIN.email.toLowerCase()) {
      if (passClean === DEFAULT_ADMIN.password || passClean === '@hoq@95036042HM') {
        setCurrentUser(DEFAULT_ADMIN);
        return true;
      } else {
        throw new Error(language === 'bn' ? 'এডমিন পাসওয়ার্ড ভুল হয়েছে!' : 'Incorrect Admin Password!');
      }
    }

    // Find user in registered list
    const user = users.find(u => u.email.toLowerCase() === emailClean);
    if (!user) {
      throw new Error(
        language === 'bn' 
          ? 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে রেজিস্ট্রেশন করুন।' 
          : 'No account found with this email. Please register first.'
      );
    }

    // Check password
    if (user.password && user.password !== passClean) {
      throw new Error(language === 'bn' ? 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।' : 'Incorrect password! Please try again.');
    }

    // Check approval status
    if (user.status === 'pending') {
      throw new Error(
        language === 'bn'
          ? 'আপনার অ্যাকাউন্টটি এখনো এডমিন অনুমোদনের অপেক্ষায় রয়েছে। এডমিন অনুমোদন দেওয়ার পর লগইন করতে পারবেন।'
          : 'Your account is pending admin approval. You will be able to log in once approved.'
      );
    }

    if (user.status === 'rejected') {
      throw new Error(
        language === 'bn'
          ? 'আপনার অ্যাকাউন্টটি এডমিন কর্তৃক বাতিল করা হয়েছে।'
          : 'Your account registration was rejected by the administrator.'
      );
    }

    // Approved user login
    setCurrentUser(user);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const registerUser = async (userData: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    phone?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const emailClean = userData.email.trim().toLowerCase();

    if (emailClean === DEFAULT_ADMIN.email.toLowerCase()) {
      return {
        success: false,
        message: language === 'bn' ? 'এই ইমেইলটি এডমিন অ্যাকাউন্ট হিসেবে সংরক্ষিত!' : 'This email is reserved for the primary admin!'
      };
    }

    const existing = users.find(u => u.email.toLowerCase() === emailClean);
    if (existing) {
      return {
        success: false,
        message: language === 'bn' ? 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে!' : 'An account with this email already exists!'
      };
    }

    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: userData.name.trim(),
      email: emailClean,
      password: userData.password?.trim() || '',
      role: userData.role || 'employee',
      phone: userData.phone?.trim() || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [newUser, ...prev]);

    try {
      await setDoc(doc(db, 'users', newId), newUser);
    } catch (err) {
      console.warn('Persisted user locally, firestore queue:', err);
    }

    addNotification({
      title: 'New Account Approval Request',
      message: `${newUser.name} (${newUser.email}) registered as ${newUser.role} and is waiting for approval.`,
      type: 'alert',
      read: false
    });

    return {
      success: true,
      message: language === 'bn'
        ? 'আপনার রেজিস্ট্রেশন সফল হয়েছে! এডমিন অনুমোদনের পর আপনি লগইন করতে পারবেন।'
        : 'Registration submitted successfully! You will be able to log in once the admin approves your account.'
    };
  };

  const approveUser = async (userId: string): Promise<void> => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const updates: Partial<User> = {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser?.name || 'Mojammal Hoq'
    };

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      console.warn('Approve user sync queue:', err);
    }

    addNotification({
      title: 'User Approved',
      message: `${target.name}'s account has been approved.`,
      type: 'order',
      read: false
    });
  };

  const rejectUser = async (userId: string): Promise<void> => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const updates: Partial<User> = { status: 'rejected' };
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      console.warn('Reject user sync queue:', err);
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    const target = users.find(u => u.id === userId);
    if (target?.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()) {
      throw new Error('Cannot delete primary super admin account');
    }

    setUsers(prev => prev.filter(u => u.id !== userId));

    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.warn('Delete user sync queue:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      console.warn('Update user role queue:', err);
    }
  };

  const pendingUsersCount = useMemo(() => {
    return users.filter(u => u.status === 'pending').length;
  }, [users]);

  // Collections state - initialized safely from LocalStorage cache
  const [clients, setClients] = useState<Client[]>(() => loadStorage('mayer_doya_clients', []));
  const [orders, setOrders] = useState<Order[]>(() => loadStorage('mayer_doya_orders', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStorage('mayer_doya_suppliers', []));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadStorage('mayer_doya_inventory', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStorage('mayer_doya_expenses', []));
  const [accounts, setAccounts] = useState<Account[]>(() => loadStorage('mayer_doya_accounts', DEFAULT_INITIAL_ACCOUNTS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStorage('mayer_doya_transactions', []));
  const [cheques, setCheques] = useState<Cheque[]>(() => loadStorage('mayer_doya_cheques', []));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStorage('mayer_doya_employees', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadStorage('mayer_doya_notifications', []));
  const [investors, setInvestors] = useState<Investor[]>(() => loadStorage('mayer_doya_investors', []));
  const [investments, setInvestments] = useState<Investment[]>(() => loadStorage('mayer_doya_investments', []));
  const [withdrawals, setWithdrawals] = useState<InvestorWithdrawal[]>(() => loadStorage('mayer_doya_investor_withdrawals', []));
  const [profitDistributions, setProfitDistributions] = useState<ProfitDistribution[]>(() => loadStorage('mayer_doya_profit_distributions', []));
  const [clientBills, setClientBills] = useState<ClientBill[]>(() => loadStorage('mayer_doya_client_bills', []));
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchase[]>(() => loadStorage('mayer_doya_supplier_purchases', []));
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => loadStorage('mayer_doya_supplier_payments', []));
  const [bankLoans, setBankLoans] = useState<BankLoan[]>(() => loadStorage('mayer_doya_bank_loans', DEFAULT_INITIAL_BANK_LOANS));
  const [loanInstallments, setLoanInstallments] = useState<LoanInstallmentPayment[]>(() => loadStorage('mayer_doya_loan_installments', DEFAULT_INITIAL_LOAN_INSTALLMENTS));

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [quickActionModal, openQuickAction] = useState<'order' | 'expense' | 'payment' | 'chemical' | null>(null);

  // Persistent LocalStorage Auto-Sync Effects (Instant Multi-Tier Protection)
  useEffect(() => {
    localStorage.setItem('mayer_doya_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_client_bills', JSON.stringify(clientBills));
  }, [clientBills]);

  // Auto-reconcile delivered orders to running bills (prevents missing or duplicate bills)
  useEffect(() => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    if (deliveredOrders.length === 0) return;

    setClientBills(prevBills => {
      let hasChanges = false;
      const existingBillOrderIds = new Set(prevBills.map(b => b.orderId));
      const newBills = [...prevBills];

      deliveredOrders.forEach(ord => {
        if (!existingBillOrderIds.has(ord.id)) {
          hasChanges = true;
          const qty = ord.finishingYards && ord.finishingYards > 0 
            ? ord.finishingYards 
            : (ord.greyYards || ord.quantityPcs || 0);
          const rate = ord.unitRate || 0;
          const total = ord.totalAmount && ord.totalAmount > 0 ? ord.totalAmount : (qty * rate);
          const paid = ord.advanceAmount || 0;
          const due = ord.dueAmount !== undefined ? ord.dueAmount : Math.max(0, total - paid);
          const status: BillStatus = due <= 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
          const cleanNo = ord.orderNumber.replace(/[^a-zA-Z0-9-]/g, '');

          const newBill: ClientBill = {
            id: `bill-${ord.id}`,
            billNumber: `BILL-${cleanNo}`,
            orderId: ord.id,
            orderNumber: ord.orderNumber,
            clientId: ord.clientId,
            clientName: ord.clientName,
            deliveryDate: ord.deliveryDate || ord.receivedDate || new Date().toISOString().split('T')[0],
            orderDescription: `${ord.fabricQuality || ord.garmentType || 'Fabrics'} - ${ord.washType || 'Standard Wash'}`,
            quantity: qty,
            rate: rate,
            totalBill: total,
            paidAmount: paid,
            dueAmount: due,
            status: status,
            createdAt: ord.createdAt || new Date().toISOString()
          };
          newBills.push(newBill);
          existingBillOrderIds.add(ord.id);
        }
      });

      return hasChanges ? newBills : prevBills;
    });
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_cheques', JSON.stringify(cheques));
  }, [cheques]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_investors', JSON.stringify(investors));
  }, [investors]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_investments', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_investor_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_profit_distributions', JSON.stringify(profitDistributions));
  }, [profitDistributions]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_supplier_purchases', JSON.stringify(supplierPurchases));
  }, [supplierPurchases]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_supplier_payments', JSON.stringify(supplierPayments));
  }, [supplierPayments]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_bank_loans', JSON.stringify(bankLoans));
  }, [bankLoans]);

  useEffect(() => {
    localStorage.setItem('mayer_doya_loan_installments', JSON.stringify(loanInstallments));
  }, [loanInstallments]);

  // Online status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time Firestore Subscriptions with Clean Offline Local Fallback
  useEffect(() => {
    let isMounted = true;
    let unsubs: (() => void)[] = [];

    const initializeSubscriptions = async () => {
      setIsSyncing(true);

      // Probe if Firestore backend is reachable on Google Cloud
      const isReachable = await testFirestoreConnection(1800);
      if (!isMounted) return;

      if (!isReachable) {
        // Backend not provisioned or offline: Operate strictly in 100% reliable Local Storage Mode
        setFirebaseConnected(false);
        setIsSyncing(false);
        return;
      }

      setFirebaseConnected(true);

      const handleSyncError = () => {
        if (!isMounted) return;
        setFirebaseConnected(false);
        // Unsubscribe active listeners so they don't loop or retry failing connections
        unsubs.forEach(u => {
          try { u(); } catch {}
        });
        unsubs = [];
      };

      try {
        // 1. Orders
        const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
          if (!snap.empty && snap.docs.length > 0) {
            const list: Order[] = snap.docs.map((docSnap) => ({
              ...docSnap.data(),
              id: docSnap.id
            } as Order));
            setOrders(list);
            localStorage.setItem('mayer_doya_orders', JSON.stringify(list));
            if (!snap.metadata.fromCache) setFirebaseConnected(true);
          }
        }, handleSyncError);
        unsubs.push(unsubOrders);

      // 2. Clients
      const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Client[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Client));
          setClients(list);
          localStorage.setItem('mayer_doya_clients', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubClients);

      // 3. Suppliers
      const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Supplier[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Supplier));
          setSuppliers(list);
          localStorage.setItem('mayer_doya_suppliers', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubSuppliers);

      // 4. Inventory / Chemicals
      const unsubInventory = onSnapshot(collection(db, 'inventory'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: InventoryItem[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as InventoryItem));
          setInventory(list);
          localStorage.setItem('mayer_doya_inventory', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubInventory);

      // 5. Expenses
      const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Expense[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Expense));
          setExpenses(list);
          localStorage.setItem('mayer_doya_expenses', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubExpenses);

      // 6. Accounts
      const unsubAccounts = onSnapshot(collection(db, 'accounts'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Account[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Account));
          setAccounts(list);
          localStorage.setItem('mayer_doya_accounts', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubAccounts);

      // 7. Transactions
      const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Transaction[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Transaction));
          setTransactions(list);
          localStorage.setItem('mayer_doya_transactions', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubTransactions);

      // 8. Cheques
      const unsubCheques = onSnapshot(collection(db, 'cheques'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Cheque[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Cheque));
          setCheques(list);
          localStorage.setItem('mayer_doya_cheques', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubCheques);

      // 9. Employees
      const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Employee[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Employee));
          setEmployees(list);
          localStorage.setItem('mayer_doya_employees', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubEmployees);

      // 10. Notifications
      const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Notification[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Notification));
          setNotifications(list);
          localStorage.setItem('mayer_doya_notifications', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubNotifs);

      // 11. Users
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: User[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as User));
          const hasAdmin = list.some(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
          const combined = hasAdmin ? list : [DEFAULT_ADMIN, ...list];
          setUsers(combined);
          localStorage.setItem('mayer_doya_users', JSON.stringify(combined));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubUsers);

      // 12. Investors
      const unsubInvestors = onSnapshot(collection(db, 'investors'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Investor[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Investor));
          setInvestors(list);
          localStorage.setItem('mayer_doya_investors', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubInvestors);

      // 13. Investments
      const unsubInvestments = onSnapshot(collection(db, 'investments'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: Investment[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as Investment));
          setInvestments(list);
          localStorage.setItem('mayer_doya_investments', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubInvestments);

      // 14. Investor Withdrawals
      const unsubWithdrawals = onSnapshot(collection(db, 'investor_withdrawals'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: InvestorWithdrawal[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as InvestorWithdrawal));
          setWithdrawals(list);
          localStorage.setItem('mayer_doya_investor_withdrawals', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubWithdrawals);

      // 15. Profit Distributions
      const unsubDistributions = onSnapshot(collection(db, 'profit_distributions'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: ProfitDistribution[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as ProfitDistribution));
          setProfitDistributions(list);
          localStorage.setItem('mayer_doya_profit_distributions', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubDistributions);

      // 16. Client Bills (Running Bills)
      const unsubBills = onSnapshot(collection(db, 'client_bills'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: ClientBill[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as ClientBill));
          setClientBills(list);
          localStorage.setItem('mayer_doya_client_bills', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubBills);

      // 17. Supplier Purchases
      const unsubPurchases = onSnapshot(collection(db, 'supplier_purchases'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: SupplierPurchase[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as SupplierPurchase));
          setSupplierPurchases(list);
          localStorage.setItem('mayer_doya_supplier_purchases', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubPurchases);

      // 18. Supplier Payments
      const unsubSupplierPmts = onSnapshot(collection(db, 'supplier_payments'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: SupplierPayment[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as SupplierPayment));
          setSupplierPayments(list);
          localStorage.setItem('mayer_doya_supplier_payments', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubSupplierPmts);

      // 19. Bank Loans
      const unsubBankLoans = onSnapshot(collection(db, 'bankLoans'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: BankLoan[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as BankLoan));
          setBankLoans(list);
          localStorage.setItem('mayer_doya_bank_loans', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubBankLoans);

      // 20. Loan Installment Payments
      const unsubLoanInstallments = onSnapshot(collection(db, 'loanInstallments'), (snap) => {
        if (!snap.empty && snap.docs.length > 0) {
          const list: LoanInstallmentPayment[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as LoanInstallmentPayment));
          setLoanInstallments(list);
          localStorage.setItem('mayer_doya_loan_installments', JSON.stringify(list));
          if (!snap.metadata.fromCache) setFirebaseConnected(true);
        }
      }, handleSyncError);
      unsubs.push(unsubLoanInstallments);

      } catch (error) {
        if (isMounted) setFirebaseConnected(false);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    initializeSubscriptions();

    return () => {
      isMounted = false;
      unsubs.forEach(unsub => {
        try { unsub(); } catch {}
      });
    };
  }, []);

  // Helper function to sync local records to Firebase batch
  const syncAllToFirebase = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);

      orders.forEach(item => {
        const ref = doc(db, 'orders', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      clients.forEach(item => {
        const ref = doc(db, 'clients', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      suppliers.forEach(item => {
        const ref = doc(db, 'suppliers', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      inventory.forEach(item => {
        const ref = doc(db, 'inventory', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      expenses.forEach(item => {
        const ref = doc(db, 'expenses', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      accounts.forEach(item => {
        const ref = doc(db, 'accounts', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      transactions.forEach(item => {
        const ref = doc(db, 'transactions', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      cheques.forEach(item => {
        const ref = doc(db, 'cheques', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      employees.forEach(item => {
        const ref = doc(db, 'employees', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      investors.forEach(item => {
        const ref = doc(db, 'investors', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      investments.forEach(item => {
        const ref = doc(db, 'investments', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      withdrawals.forEach(item => {
        const ref = doc(db, 'investor_withdrawals', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      profitDistributions.forEach(item => {
        const ref = doc(db, 'profit_distributions', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      clientBills.forEach(item => {
        const ref = doc(db, 'client_bills', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      supplierPurchases.forEach(item => {
        const ref = doc(db, 'supplier_purchases', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      supplierPayments.forEach(item => {
        const ref = doc(db, 'supplier_payments', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      bankLoans.forEach(item => {
        const ref = doc(db, 'bankLoans', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      loanInstallments.forEach(item => {
        const ref = doc(db, 'loanInstallments', item.id);
        batch.set(ref, cleanFirestoreData(item), { merge: true });
      });

      await batch.commit();
      setFirebaseConnected(true);
      return true;
    } catch (e) {
      console.error('Error syncing data to Firebase:', e);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Operations with Firestore persistence
  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...employeeData,
      id
    };
    setEmployees(prev => [newEmp, ...prev]);

    try {
      await setDoc(doc(db, 'employees', id), newEmp);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }

    addNotification({
      title: 'New Employee Registered',
      message: `${newEmp.name} joined as ${newEmp.designation} (${newEmp.department}).`,
      type: 'alert',
      read: false,
      linkTab: 'employees'
    });
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
    try {
      await updateDoc(doc(db, 'employees', id), updates);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const deleteEmployee = async (id: string) => {
    setEmployees(prev => {
      const updated = prev.filter(emp => emp.id !== id);
      try { localStorage.setItem('mayer_doya_employees', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const payEmployeeSalary = async (salaryData: {
    employeeId: string;
    employeeName: string;
    payrollRecordId?: string;
    month: string;
    amount: number;
    accountId: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const numAmount = Number(salaryData.amount);
    if (numAmount <= 0) {
      return { success: false, message: 'সঠিক বেতন পরিমাণ প্রদান করুন।' };
    }

    const targetAccount = accounts.find(a => a.id === salaryData.accountId) || accounts[0];
    const pDate = salaryData.paymentDate || new Date().toISOString().split('T')[0];
    const ref = salaryData.reference?.trim() || `SAL-${salaryData.month}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Decrement Account balance exactly once
    if (targetAccount) {
      const updatedAcc: Account = {
        ...targetAccount,
        currentBalance: (Number(targetAccount.currentBalance) || 0) - numAmount
      };
      setAccounts(prev => prev.map(a => a.id === targetAccount.id ? updatedAcc : a));
      updateDoc(doc(db, 'accounts', targetAccount.id), { currentBalance: updatedAcc.currentBalance }).catch(() => {});
    }

    // 2. Create Debit Transaction with category 'Employee Salary'
    const txId = `tx-sal-${Date.now()}`;
    const txDesc = `Salary payment for ${salaryData.employeeName} (${salaryData.month})${salaryData.notes ? ` • ${salaryData.notes}` : ''} • Ref: ${ref}`;
    const tx: Transaction = {
      id: txId,
      type: 'debit',
      accountId: targetAccount ? targetAccount.id : 'acc-1',
      amount: numAmount,
      date: pDate,
      category: 'Employee Salary',
      referenceId: ref,
      description: txDesc,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

    // 3. Create Expense Record (so expenses table reflects Labor without deducting account twice)
    const expId = `exp-sal-${Date.now()}`;
    const newExp: Expense = {
      id: expId,
      voucherNo: ref,
      category: 'Labor',
      amount: numAmount,
      date: pDate,
      accountId: targetAccount ? targetAccount.id : 'acc-1',
      accountName: targetAccount ? targetAccount.accountName : 'Cash/Bank',
      paidBy: currentUser?.name || 'Accounts Dept',
      notes: salaryData.notes || `Salary disbursement for ${salaryData.employeeName} (${salaryData.month})`,
      createdAt: pDate
    };
    setExpenses(prev => [newExp, ...prev]);
    setDoc(doc(db, 'expenses', expId), newExp).catch(() => {});

    // 4. Notification
    addNotification({
      title: 'বেতন পরিশোধ সম্পন্ন',
      message: `${salaryData.employeeName} (${salaryData.month}) এর বেতন ৳${numAmount.toLocaleString()} পরিশোধ করা হয়েছে (${targetAccount?.accountName || 'Cash'})।`,
      type: 'payment',
      read: false,
      linkTab: 'employees'
    });

    return {
      success: true,
      message: `${salaryData.employeeName} এর ৳${numAmount.toLocaleString()} বেতন সফলভাবে পরিশোধ করা হয়েছে।`
    };
  };

  const addOrder = async (newOrderData: Omit<Order, 'id' | 'createdAt'>) => {
    const id = `ord-${Date.now()}`;
    const newOrder: Order = {
      ...newOrderData,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOrders(prev => [newOrder, ...prev]);

    try {
      await setDoc(doc(db, 'orders', id), newOrder);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }

    const isDeliveredImmediate = newOrder.status === 'delivered';
    const finalBill = isDeliveredImmediate ? (Number(newOrder.totalAmount) || 0) : 0;
    const advancePaid = Number(newOrder.advanceAmount) || 0;

    // Update Client Billed, Paid & Balance
    setClients(prev => prev.map(c => {
      if (c.id === newOrder.clientId) {
        const billed = (c.totalBilled || 0) + finalBill;
        const paid = (c.totalPaid || 0) + advancePaid;
        const opBal = Number(c.openingBalance) || 0;
        const newBal = Math.max(0, billed + opBal - paid);
        const updatedClient = { ...c, totalBilled: billed, totalPaid: paid, balance: newBal };
        updateDoc(doc(db, 'clients', c.id), { totalBilled: billed, totalPaid: paid, balance: newBal }).catch(() => {});
        return updatedClient;
      }
      return c;
    }));

    // If advance paid, record transaction and credit factory cash/bank account
    if (advancePaid > 0) {
      const primaryAcc = accounts[0];
      const accId = primaryAcc?.id || 'acc-1';
      const txId = `tx-${Date.now()}`;
      const tx: Transaction = {
        id: txId,
        type: 'credit',
        accountId: accId,
        amount: advancePaid,
        date: new Date().toISOString().split('T')[0],
        category: 'Order Advance',
        referenceId: id,
        description: `Advance for Order ${newOrder.orderNumber} (${newOrder.clientName})`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setTransactions(prev => [tx, ...prev]);
      setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

      if (primaryAcc) {
        const updatedAcc = { ...primaryAcc, currentBalance: (Number(primaryAcc.currentBalance) || 0) + advancePaid };
        setAccounts(prev => prev.map(a => a.id === accId ? updatedAcc : a));
        updateDoc(doc(db, 'accounts', accId), { currentBalance: updatedAcc.currentBalance }).catch(() => {});
      }
    }

    if (isDeliveredImmediate) {
      const billId = `bill-${id}`;
      const due = Math.max(0, (newOrder.totalAmount || 0) - advancePaid);
      const cleanNo = newOrder.orderNumber.replace(/[^a-zA-Z0-9-]/g, '');
      const billObj: ClientBill = {
        id: billId,
        billNumber: `BILL-${cleanNo}`,
        orderId: id,
        orderNumber: newOrder.orderNumber,
        clientId: newOrder.clientId,
        clientName: newOrder.clientName,
        deliveryDate: newOrder.deliveryDate || new Date().toISOString().split('T')[0],
        orderDescription: `${newOrder.fabricQuality || newOrder.garmentType || 'Fabrics'} - ${newOrder.washType || 'Standard Wash'}`,
        quantity: newOrder.finishingYards || newOrder.quantityPcs || 0,
        rate: newOrder.unitRate,
        totalBill: newOrder.totalAmount,
        paidAmount: advancePaid,
        dueAmount: due,
        status: due <= 0 ? 'Paid' : (advancePaid > 0 ? 'Partially Paid' : 'Unpaid'),
        createdAt: new Date().toISOString()
      };
      setClientBills(prev => [billObj, ...prev]);
      setDoc(doc(db, 'client_bills', billId), billObj).catch(() => {});
    }

    addNotification({
      title: 'নতুন অর্ডার বুকিং সম্পন্ন',
      message: `${newOrder.clientName}-এর জন্য অর্ডার #${newOrder.orderNumber} বুক করা হয়েছে।${advancePaid > 0 ? ` অগ্রিম জমা: ৳${advancePaid.toLocaleString()}` : ''}`,
      type: 'order',
      read: false,
      linkTab: 'orders'
    });
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const existingOrder = orders.find(o => o.id === id);
    if (!existingOrder) return;

    const prevStatus = existingOrder.status;
    setOrders(prev => prev.map(ord => {
      if (ord.id === id) {
        return { ...ord, status };
      }
      return ord;
    }));
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }

    if (status === 'delivered' && prevStatus !== 'delivered') {
      // Work is COMPLETED: Calculate final total, bill, and add remaining due (অবশিষ্ট মূল্য) to client card
      const qty = existingOrder.finishingYards && existingOrder.finishingYards > 0 
        ? existingOrder.finishingYards 
        : (existingOrder.greyYards || existingOrder.quantityPcs || 0);
      const rate = existingOrder.unitRate || 0;
      const total = existingOrder.totalAmount || (qty * rate);
      const paid = existingOrder.advanceAmount || 0;
      const due = Math.max(0, total - paid); // কাজের অবশিষ্ট মূল্য

      // Update Client Card: add completed work total to billed, and অবশিষ্ট মূল্য automatically reflects in balance
      setClients(prev => prev.map(c => {
        if (c.id === existingOrder.clientId) {
          const updatedBilled = (c.totalBilled || 0) + total;
          const opBal = Number(c.openingBalance) || 0;
          const updatedBal = Math.max(0, updatedBilled + opBal - (c.totalPaid || 0));
          const updatedClient = {
            ...c,
            totalBilled: updatedBilled,
            balance: updatedBal
          };
          updateDoc(doc(db, 'clients', c.id), {
            totalBilled: updatedBilled,
            balance: updatedBal
          }).catch(() => {});
          return updatedClient;
        }
        return c;
      }));

      const billId = `bill-${id}`;
      const bStatus: BillStatus = due <= 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
      const cleanNo = existingOrder.orderNumber.replace(/[^a-zA-Z0-9-]/g, '');

      const billObj: ClientBill = {
        id: billId,
        billNumber: `BILL-${cleanNo}`,
        orderId: id,
        orderNumber: existingOrder.orderNumber,
        clientId: existingOrder.clientId,
        clientName: existingOrder.clientName,
        deliveryDate: existingOrder.deliveryDate || new Date().toISOString().split('T')[0],
        orderDescription: `${existingOrder.fabricQuality || existingOrder.garmentType || 'Fabrics'} - ${existingOrder.washType || 'Standard Wash'}`,
        quantity: qty,
        rate: rate,
        totalBill: total,
        paidAmount: paid,
        dueAmount: due,
        status: bStatus,
        createdAt: new Date().toISOString()
      };

      setClientBills(prev => {
        if (prev.some(b => b.orderId === id || b.id === billId)) {
          return prev.map(b => (b.orderId === id || b.id === billId) ? { ...b, ...billObj } : b);
        }
        return [billObj, ...prev];
      });
      setDoc(doc(db, 'client_bills', billId), billObj).catch(() => {});

      addNotification({
        title: 'কাজ সম্পন্ন ও ক্লায়েন্ট কার্ডে যুক্ত',
        message: `${existingOrder.clientName}-এর অর্ডার #${existingOrder.orderNumber} কাজ সম্পন্ন হয়েছে। কাজের অবশিষ্ট মূল্য ৳${due.toLocaleString()} ক্লায়েন্টের কার্ডে যুক্ত হয়েছে।`,
        type: 'order',
        read: false,
        linkTab: 'clients'
      });
    } else if (prevStatus === 'delivered' && status !== 'delivered') {
      // If delivery is reverted: subtract from client's totalBilled and balance
      const totalToRevert = existingOrder.totalAmount || 0;
      setClients(prev => prev.map(c => {
        if (c.id === existingOrder.clientId) {
          const updatedBilled = Math.max(0, (c.totalBilled || 0) - totalToRevert);
          const opBal = Number(c.openingBalance) || 0;
          const updatedBal = Math.max(0, updatedBilled + opBal - (c.totalPaid || 0));
          const updatedClient = {
            ...c,
            totalBilled: updatedBilled,
            balance: updatedBal
          };
          updateDoc(doc(db, 'clients', c.id), {
            totalBilled: updatedBilled,
            balance: updatedBal
          }).catch(() => {});
          return updatedClient;
        }
        return c;
      }));

      setClientBills(prev => {
        const target = prev.find(b => b.orderId === id);
        if (target && target.paidAmount <= (existingOrder.advanceAmount || 0)) {
          deleteDoc(doc(db, 'client_bills', target.id)).catch(() => {});
          return prev.filter(b => b.orderId !== id);
        }
        return prev;
      });
    }
  };

  const deliverOrder = async (id: string, deliveryData: {
    finishingYards: number;
    unitRate?: number;
    deliveryNotes?: string;
    paymentAmount?: number;
    paymentAccountId?: string;
    deliveryDate?: string;
  }) => {
    const existingOrder = orders.find(o => o.id === id);
    if (!existingOrder) return;

    const rate = deliveryData.unitRate ?? existingOrder.unitRate;
    const finalFinishingYards = deliveryData.finishingYards;
    const finalTotalAmount = Math.max(0, Math.round(finalFinishingYards * rate * 100) / 100);
    const advancePaid = existingOrder.advanceAmount || 0;
    const additionalPayment = Math.max(0, Number(deliveryData.paymentAmount) || 0);
    const newTotalPaid = advancePaid + additionalPayment;
    const newDueAmount = Math.max(0, finalTotalAmount - newTotalPaid); // কাজের অবশিষ্ট মূল্য!
    const dDate = deliveryData.deliveryDate || new Date().toISOString().split('T')[0];

    const orderUpdates: Partial<Order> = {
      status: 'delivered',
      finishingYards: finalFinishingYards,
      unitRate: rate,
      totalAmount: finalTotalAmount,
      advanceAmount: newTotalPaid,
      dueAmount: newDueAmount,
      deliveryDate: dDate,
      remarks: deliveryData.deliveryNotes 
        ? (existingOrder.remarks ? `${existingOrder.remarks} | ${deliveryData.deliveryNotes}` : deliveryData.deliveryNotes)
        : existingOrder.remarks
    };

    // 1. Update Order locally and in Firebase
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...orderUpdates } : o));
    try {
      await updateDoc(doc(db, 'orders', id), orderUpdates);
    } catch (e) {
      console.warn('Order persisted locally, Firebase queued:', e);
    }

    // 2. Adjust Client Total Billed, Total Paid, and Balance (কাজের অবশিষ্ট মূল্য ক্লায়েন্টের কার্ডে যুক্ত হবে)
    const wasAlreadyDelivered = existingOrder.status === 'delivered';
    const priorBilledForThisOrder = wasAlreadyDelivered ? (existingOrder.totalAmount || 0) : 0;
    const diffBilled = finalTotalAmount - priorBilledForThisOrder;

    setClients(prev => prev.map(c => {
      if (c.id === existingOrder.clientId) {
        const updatedBilled = Math.max(0, (c.totalBilled || 0) + diffBilled);
        const updatedPaid = (c.totalPaid || 0) + additionalPayment;
        const opBal = Number(c.openingBalance) || 0;
        const updatedBalance = Math.max(0, updatedBilled + opBal - updatedPaid);
        const updatedClient = {
          ...c,
          totalBilled: updatedBilled,
          totalPaid: updatedPaid,
          balance: updatedBalance
        };
        updateDoc(doc(db, 'clients', c.id), {
          totalBilled: updatedBilled,
          totalPaid: updatedPaid,
          balance: updatedBalance
        }).catch(() => {});
        return updatedClient;
      }
      return c;
    }));

    // 2.5 Generate / Update Client Running Bill
    const billId = `bill-${id}`;
    const cleanNo = existingOrder.orderNumber.replace(/[^a-zA-Z0-9-]/g, '');
    const billNumber = `BILL-${cleanNo}`;
    const billStatus: BillStatus = newDueAmount <= 0 ? 'Paid' : (newTotalPaid > 0 ? 'Partially Paid' : 'Unpaid');

    const billObj: ClientBill = {
      id: billId,
      billNumber,
      orderId: id,
      orderNumber: existingOrder.orderNumber,
      clientId: existingOrder.clientId,
      clientName: existingOrder.clientName,
      deliveryDate: dDate,
      orderDescription: `${existingOrder.fabricQuality || existingOrder.garmentType || 'Fabrics'} - ${existingOrder.washType || 'Standard Wash'}`,
      quantity: finalFinishingYards,
      rate: rate,
      totalBill: finalTotalAmount,
      paidAmount: newTotalPaid,
      dueAmount: newDueAmount,
      status: billStatus,
      notes: deliveryData.deliveryNotes,
      createdAt: new Date().toISOString()
    };

    setClientBills(prev => {
      const idx = prev.findIndex(b => b.orderId === id || b.id === billId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...billObj };
        return copy;
      }
      return [billObj, ...prev];
    });
    setDoc(doc(db, 'client_bills', billId), billObj).catch(() => {});

    // 3. If additional payment received at delivery, record in transaction and update account
    if (additionalPayment > 0) {
      const accId = deliveryData.paymentAccountId || accounts[0]?.id || 'acc-1';
      const txId = `tx-${Date.now()}`;
      const tx: Transaction = {
        id: txId,
        type: 'credit',
        accountId: accId,
        amount: additionalPayment,
        date: dDate,
        category: 'Delivery Settlement',
        referenceId: billNumber,
        description: `Payment received upon delivery of Order ${existingOrder.orderNumber} (${existingOrder.clientName})`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setTransactions(prev => [tx, ...prev]);
      setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

      // Add funds to the account
      setAccounts(prev => prev.map(a => {
        if (a.id === accId) {
          const updated = { ...a, currentBalance: a.currentBalance + additionalPayment };
          updateDoc(doc(db, 'accounts', a.id), updated).catch(() => {});
          return updated;
        }
        return a;
      }));
    }

    // 4. Notification
    addNotification({
      title: 'কাজ সম্পন্ন ও ক্লায়েন্ট কার্ডে যুক্ত',
      message: `${existingOrder.clientName}-এর কাজ সম্পন্ন ও চালিত হয়েছে। ফিনিশিং গজ: ${finalFinishingYards}, মোট বিল: ৳${finalTotalAmount.toLocaleString()}, কাজের অবশিষ্ট মূল্য ৳${newDueAmount.toLocaleString()} ক্লায়েন্টের কার্ডে যুক্ত হয়েছে।`,
      type: 'order',
      read: false,
      linkTab: 'clients'
    });
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(ord => ord.id === id ? { ...ord, ...updates } : ord));
    try {
      await updateDoc(doc(db, 'orders', id), updates);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const deleteOrder = async (id: string) => {
    const orderToDelete = orders.find(o => o.id === id);
    if (orderToDelete) {
      setClients(prev => prev.map(c => {
        if (c.id === orderToDelete.clientId) {
          const isDelivered = orderToDelete.status === 'delivered';
          const billedReduction = isDelivered ? (orderToDelete.totalAmount || 0) : 0;
          const paidReduction = orderToDelete.advanceAmount || 0;
          const newBilled = Math.max(0, (c.totalBilled || 0) - billedReduction);
          const newPaid = Math.max(0, (c.totalPaid || 0) - paidReduction);
          const opBal = Number(c.openingBalance) || 0;
          const newBal = Math.max(0, newBilled + opBal - newPaid);
          const updatedClient = {
            ...c,
            totalBilled: newBilled,
            totalPaid: newPaid,
            balance: newBal
          };
          updateDoc(doc(db, 'clients', c.id), {
            totalBilled: newBilled,
            totalPaid: newPaid,
            balance: newBal
          }).catch(() => {});
          return updatedClient;
        }
        return c;
      }));
    }

    setOrders(prev => {
      const updated = prev.filter(ord => ord.id !== id);
      try { localStorage.setItem('mayer_doya_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setClientBills(prev => {
      const updated = prev.filter(b => b.orderId !== id);
      try { localStorage.setItem('mayer_doya_client_bills', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'orders', id));
        await deleteDoc(doc(db, 'client_bills', `bill-${id}`));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const id = `c-${Date.now()}`;
    const opBal = Number(clientData.openingBalance) || 0;
    const billed = Number(clientData.totalBilled) || 0;
    const paid = Number(clientData.totalPaid) || 0;
    const newClient: Client = {
      ...clientData,
      id,
      openingBalance: opBal,
      totalBilled: billed,
      totalPaid: paid,
      balance: billed + opBal - paid,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [newClient, ...prev]);
    try {
      await setDoc(doc(db, 'clients', id), newClient);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        const opBal = Number(updated.openingBalance) || 0;
        const billed = Number(updated.totalBilled) || 0;
        const paid = Number(updated.totalPaid) || 0;
        updated.balance = billed + opBal - paid;
        updateDoc(doc(db, 'clients', id), updated).catch(() => {});
        return updated;
      }
      return c;
    }));
  };

  const deleteClient = async (id: string) => {
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      try { localStorage.setItem('mayer_doya_clients', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  // Running Bills & Bill Payments Mutations
  const addClientBill = async (billData: Omit<ClientBill, 'id' | 'createdAt'>): Promise<string> => {
    const id = `bill-${Date.now()}`;
    const newBill: ClientBill = {
      ...billData,
      id,
      createdAt: new Date().toISOString()
    };
    setClientBills(prev => [newBill, ...prev]);
    try {
      await setDoc(doc(db, 'client_bills', id), newBill);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
    return id;
  };

  const updateClientBill = async (id: string, updates: Partial<ClientBill>): Promise<void> => {
    setClientBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    try {
      await updateDoc(doc(db, 'client_bills', id), updates);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const deleteClientBill = async (id: string): Promise<void> => {
    setClientBills(prev => {
      const updated = prev.filter(b => b.id !== id);
      try { localStorage.setItem('mayer_doya_client_bills', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'client_bills', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const recordBillPayment = async (paymentData: {
    billId: string;
    clientId: string;
    paymentDate: string;
    paymentAmount: number;
    paymentAccountId: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const numAmount = Number(paymentData.paymentAmount);
    if (!paymentData.billId || numAmount <= 0) {
      return { success: false, message: 'সঠিক পেমেন্ট পরিমাণ প্রদান করুন।' };
    }

    const targetBill = clientBills.find(b => b.id === paymentData.billId);
    if (!targetBill) {
      return { success: false, message: 'বিল খুঁজে পাওয়া যায়নি।' };
    }

    const targetClient = clients.find(c => c.id === paymentData.clientId || c.id === targetBill.clientId);
    if (!targetClient) {
      return { success: false, message: 'গ্রাহক খুঁজে পাওয়া যায়নি।' };
    }

    const targetAccount = accounts.find(a => a.id === paymentData.paymentAccountId) || accounts[0];
    const pDate = paymentData.paymentDate || new Date().toISOString().split('T')[0];

    // 1. Update Bill Paid & Due Amounts and Status
    const newBillPaid = (targetBill.paidAmount || 0) + numAmount;
    const newBillDue = Math.max(0, targetBill.totalBill - newBillPaid);
    const newBillStatus: BillStatus = newBillDue <= 0 ? 'Paid' : (newBillPaid > 0 ? 'Partially Paid' : 'Unpaid');

    const updatedBill: ClientBill = {
      ...targetBill,
      paidAmount: newBillPaid,
      dueAmount: newBillDue,
      status: newBillStatus
    };

    setClientBills(prev => prev.map(b => b.id === targetBill.id ? updatedBill : b));
    setDoc(doc(db, 'client_bills', targetBill.id), updatedBill).catch(() => {});

    // 2. Update Associated Order if applicable
    if (targetBill.orderId) {
      setOrders(prev => prev.map(o => {
        if (o.id === targetBill.orderId) {
          const ordPaid = (o.advanceAmount || 0) + numAmount;
          const ordDue = Math.max(0, (o.totalAmount || 0) - ordPaid);
          const updatedOrd = { ...o, advanceAmount: ordPaid, dueAmount: ordDue };
          updateDoc(doc(db, 'orders', o.id), updatedOrd).catch(() => {});
          return updatedOrd;
        }
        return o;
      }));
    }

    // 3. Update Client Total Paid and Balance
    const newClientPaid = (targetClient.totalPaid || 0) + numAmount;
    const opBal = Number(targetClient.openingBalance) || 0;
    const billed = Number(targetClient.totalBilled) || 0;
    const newClientBal = Math.max(0, billed + opBal - newClientPaid);

    const updatedClient: Client = {
      ...targetClient,
      totalPaid: newClientPaid,
      balance: newClientBal
    };
    setClients(prev => prev.map(c => c.id === targetClient.id ? updatedClient : c));
    updateDoc(doc(db, 'clients', targetClient.id), { totalPaid: newClientPaid, balance: newClientBal }).catch(() => {});

    // 4. Update Cash/Bank/MFS Account Balance
    if (targetAccount) {
      const updatedAcc = {
        ...targetAccount,
        currentBalance: (Number(targetAccount.currentBalance) || 0) + numAmount
      };
      setAccounts(prev => prev.map(a => a.id === targetAccount.id ? updatedAcc : a));
      updateDoc(doc(db, 'accounts', targetAccount.id), updatedAcc).catch(() => {});
    }

    // 5. Create Credit Transaction for the Client Payment
    const txId = `tx-bill-${Date.now()}`;
    const txRef = paymentData.reference?.trim() || `RCPT-${targetBill.billNumber}-${Math.floor(100 + Math.random() * 900)}`;
    const txDesc = `${targetClient.companyName} - বিল পরিশোধ #${targetBill.billNumber} (জব #${targetBill.orderNumber}) • ${paymentData.paymentMethod}${paymentData.reference ? ` • Ref: ${paymentData.reference}` : ''}${paymentData.notes ? ` • নোট: ${paymentData.notes}` : ''}`;

    const tx: Transaction = {
      id: txId,
      type: 'credit',
      accountId: targetAccount ? targetAccount.id : 'acc-1',
      amount: numAmount,
      date: pDate,
      category: 'Client Bill Payment (রানিং বিল জমা)',
      referenceId: txRef,
      description: txDesc,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

    // 6. Notification
    addNotification({
      title: 'রানিং বিল পরিশোধ গ্রহণ',
      message: `${targetClient.companyName} থেকে বিল #${targetBill.billNumber} বাবদ ৳${numAmount.toLocaleString()} জমা হয়েছে (${targetAccount?.accountName || 'Cash'})। অবশিষ্ট বকেয়া: ৳${newBillDue.toLocaleString()}।`,
      type: 'payment',
      read: false,
      linkTab: 'clients'
    });

    return {
      success: true,
      message: `বিল #${targetBill.billNumber} এর বিপরীতে ৳${numAmount.toLocaleString()} সফলভাবে জমা নেওয়া হয়েছে।`
    };
  };

  const recordClientPayment = async (paymentData: {
    clientId: string;
    amount: number;
    accountId: string;
    date: string;
    paymentMode: 'old_dues' | 'current_order';
    selectedYear?: string;
    orderId?: string;
    billId?: string;
    reference?: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const numAmount = Number(paymentData.amount);
    if (numAmount <= 0) {
      return { success: false, message: 'সঠিক পরিশোধ পরিমাণ প্রদান করুন।' };
    }

    const targetClient = clients.find(c => c.id === paymentData.clientId);
    if (!targetClient) {
      return { success: false, message: 'ক্লায়েন্ট খুঁজে পাওয়া যায়নি।' };
    }

    const targetAccount = accounts.find(a => a.id === paymentData.accountId) || accounts[0];
    const pDate = paymentData.date || new Date().toISOString().split('T')[0];
    const ref = paymentData.reference?.trim() || `RCPT-${Math.floor(1000 + Math.random() * 9000)}`;

    const prevTotalPaid = Number(targetClient.totalPaid) || 0;
    const newTotalPaid = prevTotalPaid + numAmount;

    let updatedOpeningBal = Number(targetClient.openingBalance) || 0;
    let updatedPreviousYearsDues = targetClient.previousYearsDues ? [...targetClient.previousYearsDues] : [];
    let selectedOrderObj: Order | null = null;

    if (paymentData.paymentMode === 'old_dues') {
      updatedOpeningBal = Math.max(0, updatedOpeningBal - numAmount);
      if (paymentData.selectedYear && paymentData.selectedYear !== 'all' && updatedPreviousYearsDues.length > 0) {
        updatedPreviousYearsDues = updatedPreviousYearsDues.map(d => {
          if (String(d.year) === String(paymentData.selectedYear)) {
            return { ...d, amount: Math.max(0, (Number(d.amount) || 0) - numAmount) };
          }
          return d;
        });
      }
    } else {
      // If specific order
      if (paymentData.orderId) {
        const ord = orders.find(o => o.id === paymentData.orderId);
        if (ord) {
          selectedOrderObj = ord;
          const currentAdv = Number(ord.advanceAmount) || 0;
          const currentOrdDue = Number(ord.dueAmount) || 0;
          const updatedOrd = {
            ...ord,
            advanceAmount: currentAdv + numAmount,
            dueAmount: Math.max(0, currentOrdDue - numAmount)
          };
          setOrders(prev => prev.map(o => o.id === ord.id ? updatedOrd : o));
          updateDoc(doc(db, 'orders', ord.id), { advanceAmount: updatedOrd.advanceAmount, dueAmount: updatedOrd.dueAmount }).catch(() => {});
        }
      }

      // Reconcile clientBills
      let remainingPayment = numAmount;
      setClientBills(prev => {
        const updatedBills = prev.map(b => {
          if (b.clientId === targetClient.id && b.dueAmount > 0 && remainingPayment > 0) {
            const billPay = Math.min(b.dueAmount, remainingPayment);
            remainingPayment -= billPay;
            const newPaid = (b.paidAmount || 0) + billPay;
            const newDue = Math.max(0, (b.totalBill || 0) - newPaid);
            const newStatus: BillStatus = newDue === 0 ? 'Paid' : 'Partially Paid';
            const updatedBill: ClientBill = {
              ...b,
              paidAmount: newPaid,
              dueAmount: newDue,
              status: newStatus
            };
            updateDoc(doc(db, 'client_bills', b.id), { paidAmount: newPaid, dueAmount: newDue, status: newStatus }).catch(() => {});
            return updatedBill;
          }
          return b;
        });
        try { localStorage.setItem('mayer_doya_client_bills', JSON.stringify(updatedBills)); } catch {}
        return updatedBills;
      });
    }

    // Update Client balance and paid totals
    const billed = Number(targetClient.totalBilled) || 0;
    const newClientBal = Math.max(0, billed + updatedOpeningBal - newTotalPaid);
    const updatedClient: Client = {
      ...targetClient,
      openingBalance: updatedOpeningBal,
      previousYearsDues: updatedPreviousYearsDues,
      totalPaid: newTotalPaid,
      balance: newClientBal
    };
    setClients(prev => prev.map(c => c.id === targetClient.id ? updatedClient : c));
    updateDoc(doc(db, 'clients', targetClient.id), {
      openingBalance: updatedOpeningBal,
      previousYearsDues: updatedPreviousYearsDues,
      totalPaid: newTotalPaid,
      balance: newClientBal
    }).catch(() => {});

    // Update Account balance atomically exactly ONCE
    if (targetAccount) {
      const updatedAcc: Account = {
        ...targetAccount,
        currentBalance: (Number(targetAccount.currentBalance) || 0) + numAmount
      };
      setAccounts(prev => prev.map(a => a.id === targetAccount.id ? updatedAcc : a));
      updateDoc(doc(db, 'accounts', targetAccount.id), { currentBalance: updatedAcc.currentBalance }).catch(() => {});
    }

    // Create Credit Transaction
    const txId = `tx-client-${Date.now()}`;
    const txCategory = paymentData.paymentMode === 'old_dues'
      ? 'Client Payment (Old Dues / পুরাতন বকেয়া জমা)'
      : 'Client Payment (Current Bill / চলতি বিল জমা)';
    const txDesc = paymentData.paymentMode === 'old_dues'
      ? `${targetClient.companyName} - পুরাতন হিসেবে টাকা জমা${paymentData.selectedYear && paymentData.selectedYear !== 'all' ? ` [${paymentData.selectedYear} সাল]` : ''} • Ref: ${ref}`
      : `${targetClient.companyName} - ${selectedOrderObj ? `চলতি অর্ডার #${selectedOrderObj.orderNumber} বাবদ জমা` : 'চলতি বিল বাবদ টাকা জমা'} • Ref: ${ref}`;

    const tx: Transaction = {
      id: txId,
      type: 'credit',
      accountId: targetAccount ? targetAccount.id : 'acc-1',
      amount: numAmount,
      date: pDate,
      category: txCategory,
      referenceId: ref,
      description: txDesc,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

    // Notification
    addNotification({
      title: paymentData.paymentMode === 'old_dues' ? 'পুরাতন হিসেবে টাকা জমা গ্রহণ' : 'চলতি বিল জমা গ্রহণ',
      message: `${targetClient.companyName} থেকে ৳${numAmount.toLocaleString()} জমা হয়েছে (${targetAccount?.accountName || 'Cash'})। রসিদ নং: ${ref}`,
      type: 'payment',
      read: false,
      linkTab: 'clients'
    });

    return {
      success: true,
      message: `${targetClient.companyName} থেকে ৳${numAmount.toLocaleString()} সফলভাবে জমা নেওয়া হয়েছে।`
    };
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const id = `s-${Date.now()}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id,
      balance: supplierData.totalPurchases - supplierData.totalPaid,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    try {
      await setDoc(doc(db, 'suppliers', id), newSupplier);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        updated.balance = updated.totalPurchases - updated.totalPaid;
        updateDoc(doc(db, 'suppliers', id), updated).catch(() => {});
        return updated;
      }
      return s;
    }));
  };

  const deleteSupplier = async (id: string) => {
    setSuppliers(prev => {
      const updated = prev.filter(s => s.id !== id);
      try { localStorage.setItem('mayer_doya_suppliers', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const recordChemicalPurchase = async (purchaseData: {
    supplierId: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
    purchaseDate: string;
    invoiceRef?: string;
    paymentStatus: 'Paid' | 'Partial' | 'Due';
    paidAmount?: number;
    paymentAccountId?: string;
    location?: string;
    notes?: string;
  }): Promise<{ success: boolean; purchaseId?: string; message?: string }> => {
    const qty = Number(purchaseData.quantity) || 0;
    const price = Number(purchaseData.unitPrice) || 0;
    const totalAmount = qty * price;

    if (qty <= 0 || price <= 0) {
      return { success: false, message: 'সঠিক পরিমাণ এবং দর উল্লেখ করুন।' };
    }

    const targetSupplier = suppliers.find(s => s.id === purchaseData.supplierId);
    if (!targetSupplier) {
      return { success: false, message: 'সাপ্লায়ার খুঁজে পাওয়া যায়নি।' };
    }

    const targetItem = inventory.find(i => i.id === purchaseData.itemId);
    if (!targetItem) {
      return { success: false, message: 'কেমিক্যাল আইটেম খুঁজে পাওয়া যায়নি।' };
    }

    let actualPaid = 0;
    if (purchaseData.paymentStatus === 'Paid') {
      actualPaid = totalAmount;
    } else if (purchaseData.paymentStatus === 'Partial') {
      actualPaid = Math.min(totalAmount, Math.max(0, Number(purchaseData.paidAmount) || 0));
    }
    const dueAmount = Math.max(0, totalAmount - actualPaid);

    const targetAccount = actualPaid > 0 && purchaseData.paymentAccountId
      ? (accounts.find(a => a.id === purchaseData.paymentAccountId) || accounts[0])
      : null;

    const purchaseId = `pur-${Date.now()}`;
    const pDate = purchaseData.purchaseDate || new Date().toISOString().split('T')[0];
    const invoiceRef = purchaseData.invoiceRef?.trim() || `INV-PUR-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create SupplierPurchase Record
    const newPurchase: SupplierPurchase = {
      id: purchaseId,
      purchaseNumber: invoiceRef,
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.name,
      itemId: targetItem.id,
      itemName: targetItem.name,
      quantity: qty,
      unit: targetItem.unit || 'kg',
      unitPrice: price,
      totalAmount,
      paidAmount: actualPaid,
      dueAmount,
      purchaseDate: pDate,
      invoiceRef,
      paymentStatus: purchaseData.paymentStatus,
      accountId: targetAccount ? targetAccount.id : '',
      accountName: targetAccount ? targetAccount.accountName : '',
      notes: purchaseData.notes || '',
      createdAt: new Date().toISOString()
    };
    setSupplierPurchases(prev => [newPurchase, ...prev]);
    setDoc(doc(db, 'supplier_purchases', purchaseId), newPurchase).catch(() => {});

    // 2. Update Supplier (totalPurchases, totalPaid, balance)
    const newTotalPurchases = (targetSupplier.totalPurchases || 0) + totalAmount;
    const newTotalPaid = (targetSupplier.totalPaid || 0) + actualPaid;
    const newSupplierBalance = newTotalPurchases - newTotalPaid;

    const updatedSupplier: Supplier = {
      ...targetSupplier,
      totalPurchases: newTotalPurchases,
      totalPaid: newTotalPaid,
      balance: newSupplierBalance
    };
    setSuppliers(prev => prev.map(s => s.id === targetSupplier.id ? updatedSupplier : s));
    updateDoc(doc(db, 'suppliers', targetSupplier.id), {
      totalPurchases: newTotalPurchases,
      totalPaid: newTotalPaid,
      balance: newSupplierBalance
    }).catch(() => {});

    // 3. Update Inventory Item (Stock & Price)
    const newStock = (targetItem.currentStockKg || 0) + qty;
    const updatedInventoryItem: InventoryItem = {
      ...targetItem,
      currentStockKg: newStock,
      unitPrice: price,
      location: purchaseData.location || targetItem.location,
      lastRestocked: pDate
    };
    setInventory(prev => prev.map(i => i.id === targetItem.id ? updatedInventoryItem : i));
    updateDoc(doc(db, 'inventory', targetItem.id), {
      currentStockKg: newStock,
      unitPrice: price,
      location: updatedInventoryItem.location,
      lastRestocked: pDate
    }).catch(() => {});

    // 4. If payment made, update Account, create Transaction, and record SupplierPayment
    if (actualPaid > 0 && targetAccount) {
      // Deduct from Account exactly once
      const updatedAcc: Account = {
        ...targetAccount,
        currentBalance: (Number(targetAccount.currentBalance) || 0) - actualPaid
      };
      setAccounts(prev => prev.map(a => a.id === targetAccount.id ? updatedAcc : a));
      updateDoc(doc(db, 'accounts', targetAccount.id), { currentBalance: updatedAcc.currentBalance }).catch(() => {});

      // Debit Transaction
      const txId = `tx-pur-${Date.now()}`;
      const txDesc = `Chemical Purchase: ${qty} KG ${targetItem.name} @ ৳${price} from ${targetSupplier.name} (Ref: ${invoiceRef})`;
      const tx: Transaction = {
        id: txId,
        type: 'debit',
        accountId: targetAccount.id,
        amount: actualPaid,
        date: pDate,
        category: 'Chemical Purchase',
        referenceId: invoiceRef,
        description: txDesc,
        createdAt: new Date().toISOString()
      };
      setTransactions(prev => [tx, ...prev]);
      setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

      // SupplierPayment Record
      const pmtId = `spmt-${Date.now()}`;
      const newPayment: SupplierPayment = {
        id: pmtId,
        paymentNumber: `PMT-${invoiceRef}`,
        supplierId: targetSupplier.id,
        supplierName: targetSupplier.name,
        amount: actualPaid,
        paymentDate: pDate,
        accountId: targetAccount.id,
        accountName: targetAccount.accountName,
        reference: invoiceRef,
        notes: `Purchase initial payment: ${targetItem.name} (${qty} KG)`,
        createdAt: new Date().toISOString()
      };
      setSupplierPayments(prev => [newPayment, ...prev]);
      setDoc(doc(db, 'supplier_payments', pmtId), newPayment).catch(() => {});
    }

    // 5. Notification
    addNotification({
      title: 'নতুন কেমিক্যাল ক্রয় যুক্ত হয়েছে',
      message: `${targetSupplier.name} থেকে ${qty} KG ${targetItem.name} (৳${totalAmount.toLocaleString()}) ক্রয় করা হয়েছে। পরিশোধ: ৳${actualPaid.toLocaleString()}, বকেয়া: ৳${dueAmount.toLocaleString()}।`,
      type: 'inventory',
      read: false,
      linkTab: 'inventory'
    });

    return {
      success: true,
      purchaseId,
      message: `${qty} KG ${targetItem.name} ক্রয় সফলভাবে সংরক্ষণ করা হয়েছে।`
    };
  };

  const paySupplier = async (paymentData: {
    supplierId: string;
    amount: number;
    accountId: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const numAmount = Number(paymentData.amount);
    if (numAmount <= 0) {
      return { success: false, message: 'সঠিক পরিশোধ পরিমাণ প্রদান করুন।' };
    }

    const targetSupplier = suppliers.find(s => s.id === paymentData.supplierId);
    if (!targetSupplier) {
      return { success: false, message: 'সাপ্লায়ার খুঁজে পাওয়া যায়নি।' };
    }

    const targetAccount = accounts.find(a => a.id === paymentData.accountId) || accounts[0];
    const pDate = paymentData.paymentDate || new Date().toISOString().split('T')[0];
    const ref = paymentData.reference?.trim() || `SPAY-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Decrement Account balance exactly once
    if (targetAccount) {
      const updatedAcc: Account = {
        ...targetAccount,
        currentBalance: (Number(targetAccount.currentBalance) || 0) - numAmount
      };
      setAccounts(prev => prev.map(a => a.id === targetAccount.id ? updatedAcc : a));
      updateDoc(doc(db, 'accounts', targetAccount.id), { currentBalance: updatedAcc.currentBalance }).catch(() => {});
    }

    // 2. Create Debit Transaction
    const txId = `tx-spay-${Date.now()}`;
    const txDesc = `Payment to Supplier: ${targetSupplier.name}${paymentData.notes ? ` • ${paymentData.notes}` : ''} • Ref: ${ref}`;
    const tx: Transaction = {
      id: txId,
      type: 'debit',
      accountId: targetAccount ? targetAccount.id : 'acc-1',
      amount: numAmount,
      date: pDate,
      category: 'Supplier Payment',
      referenceId: ref,
      description: txDesc,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

    // 3. Update Supplier (totalPaid, balance)
    const newTotalPaid = (targetSupplier.totalPaid || 0) + numAmount;
    const newBalance = (targetSupplier.totalPurchases || 0) - newTotalPaid;
    const updatedSupplier: Supplier = {
      ...targetSupplier,
      totalPaid: newTotalPaid,
      balance: newBalance
    };
    setSuppliers(prev => prev.map(s => s.id === targetSupplier.id ? updatedSupplier : s));
    updateDoc(doc(db, 'suppliers', targetSupplier.id), {
      totalPaid: newTotalPaid,
      balance: newBalance
    }).catch(() => {});

    // 4. Create SupplierPayment Record
    const pmtId = `spmt-${Date.now()}`;
    const newPayment: SupplierPayment = {
      id: pmtId,
      paymentNumber: ref,
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.name,
      amount: numAmount,
      paymentDate: pDate,
      accountId: targetAccount ? targetAccount.id : 'acc-1',
      accountName: targetAccount ? targetAccount.accountName : 'Cash/Bank',
      reference: ref,
      notes: paymentData.notes || '',
      createdAt: new Date().toISOString()
    };
    setSupplierPayments(prev => [newPayment, ...prev]);
    setDoc(doc(db, 'supplier_payments', pmtId), newPayment).catch(() => {});

    // 5. Notification
    addNotification({
      title: 'সাপ্লায়ার বিল পরিশোধ সম্পন্ন',
      message: `${targetSupplier.name} কে ৳${numAmount.toLocaleString()} পরিশোধ করা হয়েছে (${targetAccount?.accountName || 'Cash'})। অবশিষ্ট বকেয়া: ৳${newBalance.toLocaleString()}।`,
      type: 'payment',
      read: false,
      linkTab: 'suppliers'
    });

    return {
      success: true,
      message: `${targetSupplier.name} কে ৳${numAmount.toLocaleString()} সফলভাবে পরিশোধ করা হয়েছে।`
    };
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id'>) => {
    const id = `inv-${Date.now()}`;
    const newItem: InventoryItem = { ...itemData, id };
    setInventory(prev => [newItem, ...prev]);
    try {
      await setDoc(doc(db, 'inventory', id), newItem);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }

    // Automatically sync Supplier's card if registered with initial stock and an assigned supplier
    const initialQty = Number(newItem.currentStockKg) || 0;
    const itemRate = Number(newItem.unitPrice) || 0;
    const initialPurchaseCost = initialQty * itemRate;

    if (newItem.supplierId && initialPurchaseCost > 0) {
      const targetSup = suppliers.find(s => s.id === newItem.supplierId);
      if (targetSup) {
        const newTotalPurchases = (targetSup.totalPurchases || 0) + initialPurchaseCost;
        const newBal = newTotalPurchases - (targetSup.totalPaid || 0);
        const updatedSupplier: Supplier = {
          ...targetSup,
          totalPurchases: newTotalPurchases,
          balance: newBal
        };
        setSuppliers(prev => prev.map(s => s.id === targetSup.id ? updatedSupplier : s));
        updateDoc(doc(db, 'suppliers', targetSup.id), {
          totalPurchases: newTotalPurchases,
          balance: newBal
        }).catch(() => {});

        const purchaseId = `pur-${Date.now()}`;
        const newPurchase: SupplierPurchase = {
          id: purchaseId,
          purchaseNumber: `PUR-INIT-${Math.floor(1000 + Math.random() * 9000)}`,
          supplierId: targetSup.id,
          supplierName: targetSup.company || targetSup.name,
          itemId: id,
          itemName: newItem.name,
          quantity: initialQty,
          unit: newItem.unit || 'kg',
          unitPrice: itemRate,
          totalAmount: initialPurchaseCost,
          paidAmount: 0,
          dueAmount: initialPurchaseCost,
          purchaseDate: new Date().toISOString().split('T')[0],
          paymentStatus: 'Due',
          notes: 'প্রাথমিক স্টক ইনটেক / Initial Stock Register',
          createdAt: new Date().toISOString()
        };
        setSupplierPurchases(prev => [newPurchase, ...prev]);
        setDoc(doc(db, 'supplier_purchases', purchaseId), newPurchase).catch(() => {});
      }
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    try {
      await updateDoc(doc(db, 'inventory', id), updates);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setInventory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try { localStorage.setItem('mayer_doya_inventory', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const updateInventoryStock = async (id: string, newStock: number) => {
    const updates = { currentStockKg: newStock, lastRestocked: new Date().toISOString().split('T')[0] };
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    }));
    try {
      await updateDoc(doc(db, 'inventory', id), updates);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const id = `exp-${Date.now()}`;
    const newExp: Expense = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [newExp, ...prev]);

    try {
      await setDoc(doc(db, 'expenses', id), newExp);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }

    // Deduct from account
    setAccounts(prev => prev.map(acc => {
      if (acc.id === newExp.accountId) {
        const updatedAcc = { ...acc, currentBalance: acc.currentBalance - newExp.amount };
        updateDoc(doc(db, 'accounts', acc.id), { currentBalance: updatedAcc.currentBalance }).catch(() => {});
        return updatedAcc;
      }
      return acc;
    }));

    // Record Transaction
    const txId = `tx-${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      type: 'debit',
      accountId: newExp.accountId,
      amount: newExp.amount,
      date: newExp.date,
      category: newExp.category,
      referenceId: id,
      description: `Expense voucher ${newExp.voucherNo}: ${newExp.notes || newExp.category}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const existing = expenses.find(e => e.id === id);
    if (existing && updates.amount !== undefined && updates.amount !== existing.amount) {
      const diff = Number(updates.amount) - Number(existing.amount);
      const accId = updates.accountId || existing.accountId;
      setAccounts(prev => prev.map(acc => {
        if (acc.id === accId) {
          const updated = { ...acc, currentBalance: acc.currentBalance - diff };
          updateDoc(doc(db, 'accounts', acc.id), { currentBalance: updated.currentBalance }).catch(() => {});
          return updated;
        }
        return acc;
      }));
    }

    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    try {
      await updateDoc(doc(db, 'expenses', id), updates);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const deleteExpense = async (id: string) => {
    const target = expenses.find(e => e.id === id);
    if (target) {
      // Refund back to account balance
      setAccounts(prev => prev.map(acc => {
        if (acc.id === target.accountId) {
          const updated = { ...acc, currentBalance: acc.currentBalance + (Number(target.amount) || 0) };
          updateDoc(doc(db, 'accounts', acc.id), { currentBalance: updated.currentBalance }).catch(() => {});
          return updated;
        }
        return acc;
      }));
      // Remove linked transaction
      setTransactions(prev => prev.filter(tx => tx.referenceId !== id));
    }

    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== id);
      try { localStorage.setItem('mayer_doya_expenses', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const addAccount = async (accData: Omit<Account, 'id'>) => {
    const id = `acc-${Date.now()}`;
    const newAcc: Account = { ...accData, id };
    setAccounts(prev => {
      const updated = [...prev, newAcc];
      try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
      return updated;
    });

    addNotification({
      title: language === 'bn' ? 'নতুন হিসাব যুক্ত হয়েছে' : 'New Account Added',
      message: language === 'bn' 
        ? `নতুন হিসাব "${newAcc.accountName}" সফলভাবে যুক্ত করা হয়েছে।` 
        : `Account "${newAcc.accountName}" was added successfully.`,
      type: 'payment',
      read: false,
      linkTab: 'accounts'
    });

    if (firebaseConnected) {
      try {
        await setDoc(doc(db, 'accounts', id), newAcc);
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    setAccounts(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...updates } : a);
      try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await updateDoc(doc(db, 'accounts', id), updates);
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const deleteAccount = async (id: string) => {
    const target = accounts.find(a => a.id === id);
    setAccounts(prev => {
      const updated = prev.filter(a => a.id !== id);
      try {
        localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
      return updated;
    });

    if (target) {
      addNotification({
        title: language === 'bn' ? 'হিসাব মুছে ফেলা হয়েছে' : 'Account Removed',
        message: language === 'bn' 
          ? `হিসাব "${target.accountName}" সফলভাবে অপসারণ করা হয়েছে।` 
          : `Account "${target.accountName}" was permanently removed.`,
        type: 'payment',
        read: false,
        linkTab: 'accounts'
      });
    }

    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'accounts', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync skipped/queued:', e);
      }
    }
  };

  const transferFunds = (fromAccountId: string, toAccountId: string, amount: number, notes?: string): boolean => {
    const sourceAcc = accounts.find(a => a.id === fromAccountId);
    if (!sourceAcc || sourceAcc.currentBalance < amount) return false;

    setAccounts(prev => {
      const updated = prev.map(a => {
        if (a.id === fromAccountId) {
          const accUpdated = { ...a, currentBalance: a.currentBalance - amount };
          if (firebaseConnected) updateDoc(doc(db, 'accounts', a.id), accUpdated).catch(() => {});
          return accUpdated;
        }
        if (a.id === toAccountId) {
          const accUpdated = { ...a, currentBalance: a.currentBalance + amount };
          if (firebaseConnected) updateDoc(doc(db, 'accounts', a.id), accUpdated).catch(() => {});
          return accUpdated;
        }
        return a;
      });
      try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
      return updated;
    });

    const txId = `tx-${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      type: 'transfer',
      accountId: fromAccountId,
      toAccountId: toAccountId,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      category: 'Internal Transfer',
      description: notes || `Transfer from ${sourceAcc.accountName}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => {
      const updated = [tx, ...prev];
      try { localStorage.setItem('mayer_doya_transactions', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      setDoc(doc(db, 'transactions', txId), tx).catch(() => {});
    }
    return true;
  };

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
    const id = `tx-${Date.now()}`;
    const newTx: Transaction = {
      ...txData,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      try { localStorage.setItem('mayer_doya_transactions', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await setDoc(doc(db, 'transactions', id), newTx);
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
    return id;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    const oldAmt = Number(oldTx.amount) || 0;
    const newAmt = updates.amount !== undefined ? Number(updates.amount) || 0 : oldAmt;
    const oldAccId = oldTx.accountId;
    const newAccId = updates.accountId || oldAccId;

    // Adjust accounts if amount or account changed
    if (oldTx.type === 'credit') {
      if (oldAccId === newAccId) {
        const diff = newAmt - oldAmt; // positive means more money received
        if (diff !== 0) {
          setAccounts(prev => {
            const updated = prev.map(a => a.id === oldAccId ? { ...a, currentBalance: (Number(a.currentBalance) || 0) + diff } : a);
            try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
            return updated;
          });
          if (firebaseConnected) {
            const acc = accounts.find(a => a.id === oldAccId);
            if (acc) updateDoc(doc(db, 'accounts', acc.id), { currentBalance: (Number(acc.currentBalance) || 0) + diff }).catch(() => {});
          }
        }
      } else {
        setAccounts(prev => {
          const updated = prev.map(a => {
            if (a.id === oldAccId) return { ...a, currentBalance: (Number(a.currentBalance) || 0) - oldAmt };
            if (a.id === newAccId) return { ...a, currentBalance: (Number(a.currentBalance) || 0) + newAmt };
            return a;
          });
          try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
          return updated;
        });
        if (firebaseConnected) {
          const oldAcc = accounts.find(a => a.id === oldAccId);
          const newAcc = accounts.find(a => a.id === newAccId);
          if (oldAcc) updateDoc(doc(db, 'accounts', oldAcc.id), { currentBalance: (Number(oldAcc.currentBalance) || 0) - oldAmt }).catch(() => {});
          if (newAcc) updateDoc(doc(db, 'accounts', newAcc.id), { currentBalance: (Number(newAcc.currentBalance) || 0) + newAmt }).catch(() => {});
        }
      }
    } else if (oldTx.type === 'debit') {
      if (oldAccId === newAccId) {
        const diff = newAmt - oldAmt; // positive means more money spent, so deduct diff
        if (diff !== 0) {
          setAccounts(prev => {
            const updated = prev.map(a => a.id === oldAccId ? { ...a, currentBalance: (Number(a.currentBalance) || 0) - diff } : a);
            try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
            return updated;
          });
          if (firebaseConnected) {
            const acc = accounts.find(a => a.id === oldAccId);
            if (acc) updateDoc(doc(db, 'accounts', acc.id), { currentBalance: (Number(acc.currentBalance) || 0) - diff }).catch(() => {});
          }
        }
      } else {
        setAccounts(prev => {
          const updated = prev.map(a => {
            if (a.id === oldAccId) return { ...a, currentBalance: (Number(a.currentBalance) || 0) + oldAmt };
            if (a.id === newAccId) return { ...a, currentBalance: (Number(a.currentBalance) || 0) - newAmt };
            return a;
          });
          try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
          return updated;
        });
        if (firebaseConnected) {
          const oldAcc = accounts.find(a => a.id === oldAccId);
          const newAcc = accounts.find(a => a.id === newAccId);
          if (oldAcc) updateDoc(doc(db, 'accounts', oldAcc.id), { currentBalance: (Number(oldAcc.currentBalance) || 0) + oldAmt }).catch(() => {});
          if (newAcc) updateDoc(doc(db, 'accounts', newAcc.id), { currentBalance: (Number(newAcc.currentBalance) || 0) - newAmt }).catch(() => {});
        }
      }
    }

    const updatedTx: Transaction = { ...oldTx, ...updates };
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? updatedTx : t);
      try { localStorage.setItem('mayer_doya_transactions', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await updateDoc(doc(db, 'transactions', id), updates);
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      const numAmt = Number(tx.amount) || 0;
      // Reverse Account Balance atomically
      if (tx.type === 'credit' && tx.accountId) {
        // Was received into account; delete means subtract from account balance
        setAccounts(prev => {
          const updated = prev.map(a => a.id === tx.accountId ? { ...a, currentBalance: (Number(a.currentBalance) || 0) - numAmt } : a);
          try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
          return updated;
        });
        if (firebaseConnected) {
          const targetAcc = accounts.find(a => a.id === tx.accountId);
          if (targetAcc) {
            updateDoc(doc(db, 'accounts', targetAcc.id), { currentBalance: (Number(targetAcc.currentBalance) || 0) - numAmt }).catch(() => {});
          }
        }
      } else if (tx.type === 'debit' && tx.accountId) {
        // Was deducted from account; delete means restore to account balance
        setAccounts(prev => {
          const updated = prev.map(a => a.id === tx.accountId ? { ...a, currentBalance: (Number(a.currentBalance) || 0) + numAmt } : a);
          try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
          return updated;
        });
        if (firebaseConnected) {
          const targetAcc = accounts.find(a => a.id === tx.accountId);
          if (targetAcc) {
            updateDoc(doc(db, 'accounts', targetAcc.id), { currentBalance: (Number(targetAcc.currentBalance) || 0) + numAmt }).catch(() => {});
          }
        }
      } else if (tx.type === 'transfer' && tx.accountId && tx.toAccountId) {
        // Reverse transfer: restore source account, deduct from target account
        setAccounts(prev => {
          const updated = prev.map(a => {
            if (a.id === tx.accountId) return { ...a, currentBalance: (Number(a.currentBalance) || 0) + numAmt };
            if (a.id === tx.toAccountId) return { ...a, currentBalance: (Number(a.currentBalance) || 0) - numAmt };
            return a;
          });
          try { localStorage.setItem('mayer_doya_accounts', JSON.stringify(updated)); } catch {}
          return updated;
        });
        if (firebaseConnected) {
          const srcAcc = accounts.find(a => a.id === tx.accountId);
          const dstAcc = accounts.find(a => a.id === tx.toAccountId);
          if (srcAcc) updateDoc(doc(db, 'accounts', srcAcc.id), { currentBalance: (Number(srcAcc.currentBalance) || 0) + numAmt }).catch(() => {});
          if (dstAcc) updateDoc(doc(db, 'accounts', dstAcc.id), { currentBalance: (Number(dstAcc.currentBalance) || 0) - numAmt }).catch(() => {});
        }
      }
    }

    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      try { localStorage.setItem('mayer_doya_transactions', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const addCheque = async (chequeData: Omit<Cheque, 'id' | 'createdAt'>): Promise<string> => {
    const id = `chq-${Date.now()}`;
    const normalizedStatus: ChequeStatus = (chequeData.status === 'Cleared' || chequeData.status === 'Clear')
      ? 'Clear'
      : (chequeData.status === 'Cancelled' || chequeData.status === 'Cancel' || chequeData.status === 'Bounced')
      ? 'Cancel'
      : 'Pending';
    const direction: ChequeDirection = chequeData.direction || (chequeData.partyType === 'Client' ? 'received' : 'issued');

    const newChq: Cheque = { 
      ...chequeData, 
      id, 
      direction,
      status: normalizedStatus,
      createdAt: new Date().toISOString().split('T')[0] 
    };
    setCheques(prev => [newChq, ...prev]);
    try {
      await setDoc(doc(db, 'cheques', id), newChq);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
    return id;
  };

  const endorseChequeToSupplier = async (sourceChequeId: string, supplierId: string, supplierName: string, notes?: string) => {
    const sourceChq = cheques.find(c => c.id === sourceChequeId);
    if (!sourceChq) return;

    const issuedChequeId = `chq-end-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. New issued cheque record for the supplier
    const issuedCheque: Cheque = {
      id: issuedChequeId,
      chequeNumber: sourceChq.chequeNumber,
      bankName: sourceChq.bankName,
      partyName: supplierName,
      partyType: 'Supplier',
      direction: 'issued',
      supplierId,
      supplierName,
      clientId: sourceChq.clientId,
      clientName: sourceChq.clientName || sourceChq.partyName,
      sourceChequeId: sourceChq.id,
      isEndorsed: true,
      amount: sourceChq.amount,
      issueDate: sourceChq.issueDate,
      clearingDate: sourceChq.clearingDate || todayStr,
      status: 'Pending',
      notes: notes || `Endorsed from client ${sourceChq.partyName}`,
      createdAt: todayStr
    };

    // 2. Update source client cheque record
    const sourceUpdates: Partial<Cheque> = {
      isEndorsed: true,
      endorsedToChequeId: issuedChequeId,
      endorsedToSupplierId: supplierId,
      endorsedToSupplierName: supplierName
    };

    setCheques(prev => [
      issuedCheque,
      ...prev.map(c => c.id === sourceChequeId ? { ...c, ...sourceUpdates } : c)
    ]);

    try {
      await setDoc(doc(db, 'cheques', issuedChequeId), issuedCheque);
      await updateDoc(doc(db, 'cheques', sourceChequeId), sourceUpdates);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }

    addNotification({
      title: 'চেক প্রদান সম্পন্ন (Endorsed)',
      message: `ক্লায়েন্ট ${sourceChq.partyName} এর চেক #${sourceChq.chequeNumber} (৳${sourceChq.amount}) মহাজন ${supplierName} কে প্রদান করা হয়েছে।`,
      type: 'cheque',
      read: false,
      linkTab: 'accounts'
    });
  };

  const updateCheque = async (id: string, updates: Partial<Cheque>) => {
    setCheques(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      await updateDoc(doc(db, 'cheques', id), updates);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const deleteCheque = async (id: string) => {
    setCheques(prev => {
      const updated = prev.filter(c => c.id !== id);
      try { localStorage.setItem('mayer_doya_cheques', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'cheques', id));
      } catch (e) {
        console.warn('Persisted locally, Firebase sync queued:', e);
      }
    }
  };

  const updateChequeStatus = async (id: string, newStatus: ChequeStatus, reason?: string) => {
    const target = cheques.find(c => c.id === id);
    if (!target) return;

    const normalizedTargetStatus: ChequeStatus = (newStatus === 'Clear' || newStatus === 'Cleared') 
      ? 'Clear' 
      : (newStatus === 'Cancel' || newStatus === 'Cancelled' || newStatus === 'Bounced') 
      ? 'Cancel' 
      : 'Pending';

    const todayStr = new Date().toISOString().split('T')[0];
    const updates: Partial<Cheque> = {
      status: normalizedTargetStatus,
      ...(normalizedTargetStatus === 'Clear' ? { clearedAt: todayStr } : {}),
      ...(normalizedTargetStatus === 'Cancel' ? { cancelledAt: todayStr, cancelReason: reason || 'Cancelled by user' } : {})
    };

    // Find linked cheque (endorsed to supplier or received from client)
    const linkedChequeId = target.sourceChequeId || target.endorsedToChequeId;
    const linkedCheque = linkedChequeId ? cheques.find(c => c.id === linkedChequeId) : null;

    // Apply state updates to in-memory cheques
    setCheques(prev => prev.map(chq => {
      if (chq.id === id) {
        return { ...chq, ...updates };
      }
      if (linkedChequeId && chq.id === linkedChequeId) {
        return { ...chq, ...updates };
      }
      return chq;
    }));

    try {
      await updateDoc(doc(db, 'cheques', id), updates);
      if (linkedChequeId) {
        await updateDoc(doc(db, 'cheques', linkedChequeId), updates);
      }
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }

    // IF CLEARING:
    if (normalizedTargetStatus === 'Clear') {
      const isEndorsedTransfer = !!(target.sourceChequeId || target.isEndorsed || target.endorsedToChequeId);

      if (isEndorsedTransfer) {
        // Linked Client & Supplier transfer settlement
        const clientTargetId = target.clientId || linkedCheque?.clientId || (target.partyType === 'Client' ? (clients.find(c => c.name === target.partyName)?.id) : linkedCheque?.partyName ? clients.find(c => c.name === linkedCheque.partyName)?.id : undefined);
        const supplierTargetId = target.supplierId || linkedCheque?.supplierId || (target.partyType === 'Supplier' ? (suppliers.find(s => s.name === target.partyName)?.id) : linkedCheque?.partyName ? suppliers.find(s => s.name === linkedCheque.partyName)?.id : undefined);

        const clientName = target.clientName || (target.partyType === 'Client' ? target.partyName : linkedCheque?.partyName) || 'Client';
        const supplierName = target.supplierName || (target.partyType === 'Supplier' ? target.partyName : linkedCheque?.partyName) || 'Supplier';

        // 1. Adjust Client's paid and balance
        if (clientTargetId) {
          setClients(prev => prev.map(c => {
            if (c.id === clientTargetId) {
              const updatedPaid = c.totalPaid + target.amount;
              const updatedClient = {
                ...c,
                totalPaid: updatedPaid,
                balance: c.totalBilled - updatedPaid
              };
              updateDoc(doc(db, 'clients', c.id), updatedClient).catch(() => {});
              return updatedClient;
            }
            return c;
          }));
        }

        // 2. Adjust Supplier's paid and balance
        if (supplierTargetId) {
          setSuppliers(prev => prev.map(s => {
            if (s.id === supplierTargetId) {
              const updatedPaid = s.totalPaid + target.amount;
              const updatedSupplier = {
                ...s,
                totalPaid: updatedPaid,
                balance: s.totalPurchases - updatedPaid
              };
              updateDoc(doc(db, 'suppliers', s.id), updatedSupplier).catch(() => {});
              return updatedSupplier;
            }
            return s;
          }));
        }

        // 3. Record Transactions in Ledger
        const txIdClient = `tx-${Date.now()}-c`;
        const txClient: Transaction = {
          id: txIdClient,
          type: 'credit',
          accountId: target.accountId || 'acc-cheque',
          amount: target.amount,
          date: todayStr,
          category: 'Client Cheque Clearance',
          referenceId: id,
          description: `Cheque #${target.chequeNumber} cleared: Received from ${clientName} (Endorsed to ${supplierName})`,
          createdAt: todayStr
        };
        const txIdSupplier = `tx-${Date.now() + 1}-s`;
        const txSupplier: Transaction = {
          id: txIdSupplier,
          type: 'debit',
          accountId: target.accountId || 'acc-cheque',
          amount: target.amount,
          date: todayStr,
          category: 'Supplier Cheque Settlement',
          referenceId: id,
          description: `Cheque #${target.chequeNumber} encashed by supplier ${supplierName} (Funded via client ${clientName})`,
          createdAt: todayStr
        };

        setTransactions(prev => [txClient, txSupplier, ...prev]);
        setDoc(doc(db, 'transactions', txIdClient), txClient).catch(() => {});
        setDoc(doc(db, 'transactions', txIdSupplier), txSupplier).catch(() => {});

        addNotification({
          title: 'চেক ক্লিয়ারেন্স সম্পন্ন',
          message: `মহাজন ${supplierName} চেক #${target.chequeNumber} (৳${target.amount}) উত্তোলন করেছেন। ক্লায়েন্ট ${clientName} এর চেক ক্লিয়ার হয়ে উভয় পক্ষের হিসাব সমন্বয় হয়েছে।`,
          type: 'cheque',
          read: false,
          linkTab: 'accounts'
        });
      } else {
        // Direct Cheque (Not endorsed)
        if (target.partyType === 'Client') {
          // Client paid factory directly into bank account
          const clientId = target.clientId || clients.find(c => c.name === target.partyName)?.id;
          if (clientId) {
            setClients(prev => prev.map(c => {
              if (c.id === clientId) {
                const updatedPaid = c.totalPaid + target.amount;
                const updatedClient = {
                  ...c,
                  totalPaid: updatedPaid,
                  balance: c.totalBilled - updatedPaid
                };
                updateDoc(doc(db, 'clients', c.id), updatedClient).catch(() => {});
                return updatedClient;
              }
              return c;
            }));
          }

          if (target.accountId) {
            setAccounts(accs => accs.map(a => {
              if (a.id === target.accountId) {
                const updated = { ...a, currentBalance: a.currentBalance + target.amount };
                updateDoc(doc(db, 'accounts', a.id), updated).catch(() => {});
                return updated;
              }
              return a;
            }));
          }

          const txId = `tx-${Date.now()}`;
          const tx: Transaction = {
            id: txId,
            type: 'credit',
            accountId: target.accountId || accounts[0]?.id || 'acc-1',
            amount: target.amount,
            date: todayStr,
            category: 'Client Cheque Deposit',
            referenceId: id,
            description: `Cheque #${target.chequeNumber} deposited to bank from ${target.partyName}`,
            createdAt: todayStr
          };
          setTransactions(prev => [tx, ...prev]);
          setDoc(doc(db, 'transactions', txId), tx).catch(() => {});
        } else if (target.partyType === 'Supplier') {
          // Factory paid supplier directly from bank account
          const supplierId = target.supplierId || suppliers.find(s => s.name === target.partyName)?.id;
          if (supplierId) {
            setSuppliers(prev => prev.map(s => {
              if (s.id === supplierId) {
                const updatedPaid = s.totalPaid + target.amount;
                const updatedSupplier = {
                  ...s,
                  totalPaid: updatedPaid,
                  balance: s.totalPurchases - updatedPaid
                };
                updateDoc(doc(db, 'suppliers', s.id), updatedSupplier).catch(() => {});
                return updatedSupplier;
              }
              return s;
            }));
          }

          if (target.accountId) {
            setAccounts(accs => accs.map(a => {
              if (a.id === target.accountId) {
                const updated = { ...a, currentBalance: a.currentBalance - target.amount };
                updateDoc(doc(db, 'accounts', a.id), updated).catch(() => {});
                return updated;
              }
              return a;
            }));
          }

          const txId = `tx-${Date.now()}`;
          const tx: Transaction = {
            id: txId,
            type: 'debit',
            accountId: target.accountId || accounts[0]?.id || 'acc-1',
            amount: target.amount,
            date: todayStr,
            category: 'Supplier Cheque Payment',
            referenceId: id,
            description: `Factory cheque #${target.chequeNumber} encashed by ${target.partyName}`,
            createdAt: todayStr
          };
          setTransactions(prev => [tx, ...prev]);
          setDoc(doc(db, 'transactions', txId), tx).catch(() => {});
        }
      }
    } else if (normalizedTargetStatus === 'Cancel') {
      addNotification({
        title: 'চেক বাতিল করা হয়েছে',
        message: `চেক #${target.chequeNumber} (${target.partyName} - ৳${target.amount}) বাতিল করা হয়েছে। ${reason ? `কারণ: ${reason}` : ''}`,
        type: 'cheque',
        read: false,
        linkTab: 'accounts'
      });
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = async (notifData: Omit<Notification, 'id' | 'time'>) => {
    const id = `notif-${Date.now()}`;
    const newNotif: Notification = { ...notifData, id, time: 'Just now' };
    setNotifications(prev => [newNotif, ...prev]);
    setDoc(doc(db, 'notifications', id), newNotif).catch(() => {});
  };

  // ----------------------------------------------------
  // Investors & Capital Accounting Engine
  // ----------------------------------------------------
  const addInvestor = async (investorData: Omit<Investor, 'id' | 'createdAt' | 'totalInvested' | 'totalWithdrawn' | 'totalProfitReceived' | 'pendingProfit' | 'currentPosition'>): Promise<string> => {
    const id = `inv-reg-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newInvestor: Investor = {
      ...investorData,
      id,
      totalInvested: 0,
      totalWithdrawn: 0,
      totalProfitReceived: 0,
      pendingProfit: 0,
      currentPosition: 0,
      createdAt: todayStr
    };

    setInvestors(prev => [newInvestor, ...prev]);
    try {
      await setDoc(doc(db, 'investors', id), newInvestor);
    } catch (e) {
      console.warn('Investor cached locally, Firestore sync queued:', e);
    }

    addNotification({
      title: 'নতুন বিনিয়োগকারী যুক্ত হয়েছে',
      message: `বিনিয়োগকারী "${newInvestor.name}" সফলভাবে নিবন্ধিত হয়েছে।`,
      type: 'payment',
      read: false,
      linkTab: 'investors'
    });

    return id;
  };

  const updateInvestor = async (id: string, updates: Partial<Investor>): Promise<void> => {
    setInvestors(prev => prev.map(inv => {
      if (inv.id === id) {
        const updated = { ...inv, ...updates };
        const position = (updated.totalInvested || 0) - (updated.totalWithdrawn || 0) + (updated.pendingProfit || 0);
        const finalObj = { ...updated, currentPosition: position };
        updateDoc(doc(db, 'investors', id), finalObj).catch(() => {});
        return finalObj;
      }
      return inv;
    }));
  };

  const deleteInvestor = async (id: string): Promise<void> => {
    setInvestors(prev => {
      const updated = prev.filter(inv => inv.id !== id);
      try { localStorage.setItem('mayer_doya_investors', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'investors', id));
      } catch (e) {
        console.warn('Delete investor sync queued:', e);
      }
    }
  };

  const addInvestment = async (investmentData: Omit<Investment, 'id' | 'createdAt'>): Promise<string> => {
    const id = `invest-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newInvestment: Investment = {
      ...investmentData,
      reference: investmentData.reference || '',
      notes: investmentData.notes || '',
      id,
      createdAt: todayStr
    };

    // 1. Add investment record
    setInvestments(prev => [newInvestment, ...prev]);
    setDoc(doc(db, 'investments', id), newInvestment).catch(() => {});

    // 2. Update investor capital metrics
    setInvestors(prev => prev.map(inv => {
      if (inv.id === investmentData.investorId) {
        const newInvested = (inv.totalInvested || 0) + investmentData.amount;
        const newPosition = newInvested - (inv.totalWithdrawn || 0) + (inv.pendingProfit || 0);
        const updated = {
          ...inv,
          totalInvested: newInvested,
          currentPosition: newPosition
        };
        updateDoc(doc(db, 'investors', inv.id), updated).catch(() => {});
        return updated;
      }
      return inv;
    }));

    // 3. Deposit money into factory Account (Increase Account Balance)
    if (investmentData.accountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === investmentData.accountId) {
          const updated = { ...acc, currentBalance: (acc.currentBalance || 0) + investmentData.amount };
          updateDoc(doc(db, 'accounts', acc.id), { currentBalance: updated.currentBalance }).catch(() => {});
          return updated;
        }
        return acc;
      }));
    }

    // 4. Create Credit Transaction (Category: Investor Capital Investment)
    const txId = `tx-${Date.now()}`;
    const typeLabel = investmentData.investmentType.replace('_', ' ');
    const tx: Transaction = {
      id: txId,
      type: 'credit',
      accountId: investmentData.accountId,
      amount: investmentData.amount,
      date: investmentData.date || todayStr,
      category: 'Investor Capital Investment',
      referenceId: id,
      description: `Investor Capital: ${investmentData.investorName} (${typeLabel})${investmentData.reference ? ` - Ref: ${investmentData.reference}` : ''}`,
      createdAt: todayStr
    };
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

    // 5. Add notification
    addNotification({
      title: 'মূলধন জমা রেকর্ড',
      message: `বিনিয়োগকারী ${investmentData.investorName} এর থেকে ৳${investmentData.amount} মূলধন জমা হয়েছে (${investmentData.accountName})।`,
      type: 'payment',
      read: false,
      linkTab: 'investors'
    });

    return id;
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>): Promise<void> => {
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    try {
      await updateDoc(doc(db, 'investments', id), updates);
    } catch (e) {
      console.warn('Update investment sync queued:', e);
    }
  };

  const deleteInvestment = async (id: string): Promise<void> => {
    setInvestments(prev => {
      const updated = prev.filter(inv => inv.id !== id);
      try { localStorage.setItem('mayer_doya_investments', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'investments', id));
      } catch (e) {
        console.warn('Delete investment sync queued:', e);
      }
    }
  };

  const addWithdrawal = async (withdrawalData: Omit<InvestorWithdrawal, 'id' | 'createdAt'>): Promise<string> => {
    const id = `wd-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newWithdrawal: InvestorWithdrawal = {
      ...withdrawalData,
      reference: withdrawalData.reference || '',
      notes: withdrawalData.notes || '',
      id,
      createdAt: todayStr
    };

    // 1. Add withdrawal record
    setWithdrawals(prev => [newWithdrawal, ...prev]);
    setDoc(doc(db, 'investor_withdrawals', id), newWithdrawal).catch(() => {});

    // 2. Update investor capital metrics
    setInvestors(prev => prev.map(inv => {
      if (inv.id === withdrawalData.investorId) {
        const newWithdrawn = (inv.totalWithdrawn || 0) + withdrawalData.amount;
        const newPosition = (inv.totalInvested || 0) - newWithdrawn + (inv.pendingProfit || 0);
        const updated = {
          ...inv,
          totalWithdrawn: newWithdrawn,
          currentPosition: newPosition
        };
        updateDoc(doc(db, 'investors', inv.id), updated).catch(() => {});
        return updated;
      }
      return inv;
    }));

    // 3. Deduct money from factory Account (Decrease Account Balance)
    if (withdrawalData.accountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === withdrawalData.accountId) {
          const updated = { ...acc, currentBalance: (acc.currentBalance || 0) - withdrawalData.amount };
          updateDoc(doc(db, 'accounts', acc.id), { currentBalance: updated.currentBalance }).catch(() => {});
          return updated;
        }
        return acc;
      }));
    }

    // 4. Create Debit Transaction (Category: Investor Capital Withdrawal)
    const txId = `tx-${Date.now()}`;
    const reasonLabel = withdrawalData.reason.replace('_', ' ');
    const tx: Transaction = {
      id: txId,
      type: 'debit',
      accountId: withdrawalData.accountId,
      amount: withdrawalData.amount,
      date: withdrawalData.date || todayStr,
      category: 'Investor Capital Withdrawal',
      referenceId: id,
      description: `Capital Withdrawal: ${withdrawalData.investorName} (${reasonLabel})${withdrawalData.reference ? ` - Ref: ${withdrawalData.reference}` : ''}`,
      createdAt: todayStr
    };
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

    // 5. Add notification
    addNotification({
      title: 'মূলধন উত্তোলন রেকর্ড',
      message: `বিনিয়োগকারী ${withdrawalData.investorName} ৳${withdrawalData.amount} মূলধন উত্তোলন করেছেন (${withdrawalData.accountName})।`,
      type: 'payment',
      read: false,
      linkTab: 'investors'
    });

    return id;
  };

  const updateWithdrawal = async (id: string, updates: Partial<InvestorWithdrawal>): Promise<void> => {
    setWithdrawals(prev => prev.map(wd => wd.id === id ? { ...wd, ...updates } : wd));
    try {
      await updateDoc(doc(db, 'investor_withdrawals', id), updates);
    } catch (e) {
      console.warn('Update withdrawal sync queued:', e);
    }
  };

  const deleteWithdrawal = async (id: string): Promise<void> => {
    setWithdrawals(prev => {
      const updated = prev.filter(wd => wd.id !== id);
      try { localStorage.setItem('mayer_doya_investor_withdrawals', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (firebaseConnected) {
      try {
        await deleteDoc(doc(db, 'investor_withdrawals', id));
      } catch (e) {
        console.warn('Delete withdrawal sync queued:', e);
      }
    }
  };

  const distributeProfit = async (distData: Omit<ProfitDistribution, 'id' | 'createdAt'>): Promise<string> => {
    const id = `dist-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newDist: ProfitDistribution = {
      ...distData,
      id,
      createdAt: todayStr
    };

    // 1. Save distribution
    setProfitDistributions(prev => [newDist, ...prev]);
    setDoc(doc(db, 'profit_distributions', id), newDist).catch(() => {});

    // 2. Process each allocation
    for (const alloc of newDist.allocations) {
      if (alloc.status === 'paid' && alloc.accountId) {
        // If already paid at distribution time:
        // A. Create Debit Transaction
        const txId = `tx-${Date.now()}-${alloc.investorId}`;
        const tx: Transaction = {
          id: txId,
          type: 'debit',
          accountId: alloc.accountId,
          amount: alloc.allocatedProfit,
          date: todayStr,
          category: 'Investor Profit Payout',
          referenceId: `${id}-${alloc.investorId}`,
          description: `Profit Payout: ${alloc.investorName} (${newDist.period})`,
          createdAt: todayStr
        };
        setTransactions(prev => [tx, ...prev]);
        setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

        // B. Decrement Account balance
        setAccounts(prev => prev.map(a => {
          if (a.id === alloc.accountId) {
            const updated = { ...a, currentBalance: (a.currentBalance || 0) - alloc.allocatedProfit };
            updateDoc(doc(db, 'accounts', a.id), updated).catch(() => {});
            return updated;
          }
          return a;
        }));

        // C. Update investor: profit received increases
        setInvestors(prev => prev.map(inv => {
          if (inv.id === alloc.investorId) {
            const newProfitRec = (inv.totalProfitReceived || 0) + alloc.allocatedProfit;
            const newPosition = (inv.totalInvested || 0) - (inv.totalWithdrawn || 0) + (inv.pendingProfit || 0);
            const updated = {
              ...inv,
              totalProfitReceived: newProfitRec,
              currentPosition: newPosition
            };
            updateDoc(doc(db, 'investors', inv.id), updated).catch(() => {});
            return updated;
          }
          return inv;
        }));
      } else {
        // Pending payout: investor pendingProfit increases
        setInvestors(prev => prev.map(inv => {
          if (inv.id === alloc.investorId) {
            const newPending = (inv.pendingProfit || 0) + alloc.allocatedProfit;
            const newPosition = (inv.totalInvested || 0) - (inv.totalWithdrawn || 0) + newPending;
            const updated = {
              ...inv,
              pendingProfit: newPending,
              currentPosition: newPosition
            };
            updateDoc(doc(db, 'investors', inv.id), updated).catch(() => {});
            return updated;
          }
          return inv;
        }));
      }
    }

    addNotification({
      title: 'লভ্যাংশ বণ্টন সম্পন্ন',
      message: `${newDist.period} মেয়াদের জন্য ৳${newDist.totalAllocated} লভ্যাংশ বণ্টন সম্পন্ন হয়েছে।`,
      type: 'payment',
      read: false,
      linkTab: 'investors'
    });

    return id;
  };

  const payoutInvestorProfit = async (distributionId: string, investorId: string, accountId: string, reference?: string, notes?: string): Promise<void> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDist = profitDistributions.find(d => d.id === distributionId);
    if (!targetDist) return;

    const alloc = targetDist.allocations.find(a => a.investorId === investorId);
    if (!alloc || alloc.status === 'paid') return;

    const payoutAmount = alloc.allocatedProfit;
    const payingAccount = accounts.find(a => a.id === accountId);
    const accName = payingAccount ? payingAccount.accountName : 'Cash Account';

    // 1. Update distribution allocation status
    const updatedAllocations = targetDist.allocations.map(a => {
      if (a.investorId === investorId) {
        return {
          ...a,
          status: 'paid' as const,
          accountId,
          accountName: accName,
          paidAt: todayStr,
          paymentReference: reference || ''
        };
      }
      return a;
    });

    const newTotalPaid = updatedAllocations.filter(a => a.status === 'paid').reduce((s, a) => s + a.allocatedProfit, 0);
    const newTotalPending = updatedAllocations.filter(a => a.status === 'pending').reduce((s, a) => s + a.allocatedProfit, 0);
    const newStatus = newTotalPending === 0 ? 'fully_paid' : 'partially_paid';

    const updatedDist: ProfitDistribution = {
      ...targetDist,
      allocations: updatedAllocations,
      totalPaid: newTotalPaid,
      totalPending: newTotalPending,
      status: newStatus
    };

    setProfitDistributions(prev => prev.map(d => d.id === distributionId ? updatedDist : d));
    updateDoc(doc(db, 'profit_distributions', distributionId), updatedDist as any).catch(() => {});

    // 2. Decrement factory Account
    setAccounts(prev => prev.map(a => {
      if (a.id === accountId) {
        const updated = { ...a, currentBalance: (a.currentBalance || 0) - payoutAmount };
        updateDoc(doc(db, 'accounts', a.id), { currentBalance: updated.currentBalance }).catch(() => {});
        return updated;
      }
      return a;
    }));

    // 3. Create Debit Transaction
    const txId = `tx-${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      type: 'debit',
      accountId: accountId,
      amount: payoutAmount,
      date: todayStr,
      category: 'Investor Profit Payout',
      referenceId: `${distributionId}-${investorId}`,
      description: `Profit Payout: ${alloc.investorName} (Period: ${targetDist.period})${reference ? ` - Ref: ${reference}` : ''}`,
      createdAt: todayStr
    };
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});

    // 4. Update investor state
    setInvestors(prev => prev.map(inv => {
      if (inv.id === investorId) {
        const newProfitRec = (inv.totalProfitReceived || 0) + payoutAmount;
        const newPending = Math.max(0, (inv.pendingProfit || 0) - payoutAmount);
        const newPosition = (inv.totalInvested || 0) - (inv.totalWithdrawn || 0) + newPending;
        const updated = {
          ...inv,
          totalProfitReceived: newProfitRec,
          pendingProfit: newPending,
          currentPosition: newPosition
        };
        updateDoc(doc(db, 'investors', inv.id), updated).catch(() => {});
        return updated;
      }
      return inv;
    }));

    addNotification({
      title: 'লভ্যাংশ পরিশোধ সম্পন্ন',
      message: `বিনিয়োগকারী ${alloc.investorName} কে ৳${payoutAmount} লভ্যাংশ পরিশোধ করা হয়েছে (${accName})।`,
      type: 'payment',
      read: false,
      linkTab: 'investors'
    });
  };

  // --- Bank Loan Management ---
  const addBankLoan = async (loanData: Omit<BankLoan, 'id' | 'createdAt' | 'updatedAt' | 'totalPrincipalPaid' | 'totalInterestPaid' | 'currentOutstanding'>): Promise<boolean> => {
    const id = `loan-${Date.now()}`;
    const now = new Date().toISOString();
    const sanction = Number(loanData.sanctionAmount) || 0;
    const newLoan: BankLoan = {
      ...loanData,
      id,
      sanctionAmount: sanction,
      interestRateAnnual: Number(loanData.interestRateAnnual) || 0,
      tenureMonths: Number(loanData.tenureMonths) || 12,
      monthlyInstallment: Number(loanData.monthlyInstallment) || 0,
      totalPrincipalPaid: 0,
      totalInterestPaid: 0,
      currentOutstanding: sanction,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    setBankLoans(prev => [newLoan, ...prev]);

    // Disburse funds to factory account if specified
    if (loanData.disbursedToAccountId && sanction > 0) {
      setAccounts(prev => prev.map(a => {
        if (a.id === loanData.disbursedToAccountId) {
          const updatedBal = (Number(a.currentBalance) || 0) + sanction;
          try {
            updateDoc(doc(db, 'accounts', a.id), { currentBalance: updatedBal });
          } catch {}
          return { ...a, currentBalance: updatedBal };
        }
        return a;
      }));

      const txId = `tx-disb-${Date.now()}`;
      const tx: Transaction = {
        id: txId,
        type: 'credit',
        accountId: loanData.disbursedToAccountId,
        amount: sanction,
        date: loanData.disbursementDate || now.split('T')[0],
        category: 'Bank Loan Disbursement',
        referenceId: id,
        description: `Loan Sanction & Disbursement: ${loanData.loanTitle} (${loanData.bankName})`,
        createdAt: now
      };
      setTransactions(prev => [tx, ...prev]);
      try {
        setDoc(doc(db, 'transactions', txId), cleanFirestoreData(tx));
      } catch {}
    }

    try {
      await setDoc(doc(db, 'bankLoans', id), cleanFirestoreData(newLoan));
    } catch (e) {
      console.warn('Bank loan saved to offline storage:', e);
    }

    addNotification({
      title: 'নতুন ব্যাংক ঋণ অনুমোদিত',
      message: `${loanData.loanTitle} (৳${sanction.toLocaleString()}) সফলভাবে সংরক্ষণ করা হয়েছে।`,
      type: 'payment',
      read: false,
      linkTab: 'loans'
    });

    return true;
  };

  const updateBankLoan = async (id: string, updates: Partial<BankLoan>): Promise<boolean> => {
    const now = new Date().toISOString();
    const updatedFields = { ...updates, updatedAt: now };
    setBankLoans(prev => prev.map(l => l.id === id ? { ...l, ...updatedFields } : l));
    try {
      await updateDoc(doc(db, 'bankLoans', id), cleanFirestoreData(updatedFields));
    } catch (e) {
      console.warn('Update loan saved to offline storage:', e);
    }
    return true;
  };

  const deleteBankLoan = async (id: string): Promise<boolean> => {
    setBankLoans(prev => prev.filter(l => l.id !== id));
    try {
      await deleteDoc(doc(db, 'bankLoans', id));
    } catch (e) {
      console.warn('Delete loan saved to offline storage:', e);
    }
    return true;
  };

  const addLoanInstallment = async (installmentData: Omit<LoanInstallmentPayment, 'id' | 'createdAt'>): Promise<boolean> => {
    const id = `inst-${Date.now()}`;
    const now = new Date().toISOString();
    const total = Number(installmentData.totalAmount) || 0;
    const principal = Number(installmentData.principalAmount) || 0;
    const interest = Number(installmentData.interestAmount) || 0;

    const newInst: LoanInstallmentPayment = {
      ...installmentData,
      id,
      totalAmount: total,
      principalAmount: principal,
      interestAmount: interest,
      createdAt: now
    };

    setLoanInstallments(prev => [newInst, ...prev]);

    // Update parent loan balances
    setBankLoans(prev => prev.map(l => {
      if (l.id === installmentData.loanId) {
        const newPrin = (Number(l.totalPrincipalPaid) || 0) + principal;
        const newInt = (Number(l.totalInterestPaid) || 0) + interest;
        const newOut = Math.max(0, (Number(l.sanctionAmount) || 0) - newPrin);
        const newStat = newOut <= 0 ? 'closed' : l.status;

        let nextDue = l.nextDueDate;
        try {
          const d = new Date(installmentData.paymentDate || l.nextDueDate || now);
          d.setMonth(d.getMonth() + 1);
          nextDue = d.toISOString().split('T')[0];
        } catch {}

        const updatedLoan: BankLoan = {
          ...l,
          totalPrincipalPaid: newPrin,
          totalInterestPaid: newInt,
          currentOutstanding: newOut,
          status: newStat,
          nextDueDate: nextDue,
          updatedAt: now
        };

        try {
          updateDoc(doc(db, 'bankLoans', l.id), cleanFirestoreData(updatedLoan));
        } catch {}

        return updatedLoan;
      }
      return l;
    }));

    // Deduct from paying factory account
    if (installmentData.fromAccountId && total > 0) {
      setAccounts(prev => prev.map(a => {
        if (a.id === installmentData.fromAccountId) {
          const updatedBal = Math.max(0, (Number(a.currentBalance) || 0) - total);
          try {
            updateDoc(doc(db, 'accounts', a.id), { currentBalance: updatedBal });
          } catch {}
          return { ...a, currentBalance: updatedBal };
        }
        return a;
      }));

      const txId = `tx-emi-${Date.now()}`;
      const tx: Transaction = {
        id: txId,
        type: 'debit',
        accountId: installmentData.fromAccountId,
        amount: total,
        date: installmentData.paymentDate || now.split('T')[0],
        category: 'Bank Loan Repayment',
        referenceId: id,
        description: `Loan Installment #${installmentData.installmentNumber || ''}: ${installmentData.loanTitle} (আসল: ৳${principal}, সুদ: ৳${interest})`,
        createdAt: now
      };
      setTransactions(prev => [tx, ...prev]);
      try {
        setDoc(doc(db, 'transactions', txId), cleanFirestoreData(tx));
      } catch {}
    }

    try {
      await setDoc(doc(db, 'loanInstallments', id), cleanFirestoreData(newInst));
    } catch (e) {
      console.warn('Installment saved offline:', e);
    }

    addNotification({
      title: 'ঋণের কিস্তি পরিশোধ সম্পন্ন',
      message: `${installmentData.loanTitle} এর কিস্তি ৳${total.toLocaleString()} পরিশোধ সম্পন্ন হয়েছে।`,
      type: 'payment',
      read: false,
      linkTab: 'loans'
    });

    return true;
  };

  const deleteLoanInstallment = async (id: string): Promise<boolean> => {
    const inst = loanInstallments.find(i => i.id === id);
    setLoanInstallments(prev => prev.filter(i => i.id !== id));

    if (inst) {
      setBankLoans(prev => prev.map(l => {
        if (l.id === inst.loanId) {
          const newPrin = Math.max(0, (Number(l.totalPrincipalPaid) || 0) - (Number(inst.principalAmount) || 0));
          const newInt = Math.max(0, (Number(l.totalInterestPaid) || 0) - (Number(inst.interestAmount) || 0));
          const newOut = Math.max(0, (Number(l.sanctionAmount) || 0) - newPrin);
          const updatedLoan = {
            ...l,
            totalPrincipalPaid: newPrin,
            totalInterestPaid: newInt,
            currentOutstanding: newOut,
            status: (newOut > 0 ? 'active' : 'closed') as LoanStatus,
            updatedAt: new Date().toISOString()
          };
          try {
            updateDoc(doc(db, 'bankLoans', l.id), cleanFirestoreData(updatedLoan));
          } catch {}
          return updatedLoan;
        }
        return l;
      }));
    }

    try {
      await deleteDoc(doc(db, 'loanInstallments', id));
    } catch (e) {
      console.warn('Delete installment offline:', e);
    }
    return true;
  };

  // Metrics derivation
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const activeBatchesCount = orders.filter(o => ['washing', 'dyeing', 'hydro', 'drying', 'batch_assigned'].includes(o.status)).length;
    const pendingDeliveriesCount = orders.filter(o => ['ready_for_delivery', 'qc_passed'].includes(o.status)).length;
    const chemicalStockValue = inventory.reduce((sum, item) => sum + ((Number(item.currentStockKg) || 0) * (Number(item.unitPrice) || 0)), 0);
    const netCashBalance = accounts.reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
    const totalReceivables = clients.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
    const todayWashOutput = orders
      .filter(o => ['ready_for_delivery', 'delivered', 'qc_passed'].includes(o.status))
      .reduce((sum, o) => sum + (Number(o.quantityPcs) || 0), 0);

    const totalClients = clients.length;
    const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    const completedDeliveriesCount = orders.filter(o => o.status === 'delivered').length;
    const runningBillsCount = clientBills.filter(b => b.status !== 'Paid').length;
    const runningBillsTotalDue = clientBills.reduce((sum, b) => sum + (Number(b.dueAmount) || 0), 0);
    const cashBalance = accounts.filter(a => (a.accountType || '').toLowerCase() === 'cash' || (a.accountType || '').toLowerCase() === 'petty cash').reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
    const bankBalance = accounts.filter(a => (a.accountType || '').toLowerCase() === 'bank').reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
    const mfsBalance = accounts.filter(a => (a.accountType || '').toLowerCase() === 'mfs').reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const lowStockCount = inventory.filter(i => (Number(i.currentStockKg) || 0) <= (Number(i.minAlertLevel) || 0)).length;
    const supplierDue = suppliers.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
    const monthlyPayroll = employees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const investorCapital = investors.reduce((sum, inv) => sum + ((Number(inv.totalInvested) || 0) - (Number(inv.totalWithdrawn) || 0)), 0);

    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const monthlyRevenue = transactions
      .filter(t => t.type === 'credit' && t.date && t.date.startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'debit' && t.date && t.date.startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const netCashFlow = monthlyRevenue - monthlyExpenses;

    return {
      totalRevenue,
      activeBatchesCount,
      pendingDeliveriesCount,
      chemicalStockValue,
      netCashBalance,
      totalReceivables,
      totalPayables,
      todayWashOutput,
      totalClients,
      activeOrdersCount,
      completedDeliveriesCount,
      runningBillsCount,
      runningBillsTotalDue,
      cashBalance,
      bankBalance,
      mfsBalance,
      totalExpenses,
      lowStockCount,
      supplierDue,
      monthlyPayroll,
      investorCapital,
      monthlyRevenue,
      monthlyExpenses,
      netCashFlow
    };
  }, [orders, inventory, accounts, clients, suppliers, clientBills, expenses, employees, investors, transactions]);

  return (
    <ERPContext.Provider value={{
      language,
      setLanguage,
      t,
      currentUser,
      setCurrentUser,
      users,
      pendingUsersCount,
      login,
      logout,
      registerUser,
      approveUser,
      rejectUser,
      deleteUser,
      updateUserRole,
      orders,
      addOrder,
      updateOrder,
      deleteOrder,
      updateOrderStatus,
      deliverOrder,
      clients,
      addClient,
      updateClient,
      deleteClient,
      clientBills,
      addClientBill,
      updateClientBill,
      deleteClientBill,
      recordBillPayment,
      recordClientPayment,
      suppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      paySupplier,
      recordChemicalPurchase,
      supplierPurchases,
      supplierPayments,
      inventory,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      updateInventoryStock,
      employees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      payEmployeeSalary,
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      accounts,
      transactions,
      cheques,
      investors,
      investments,
      withdrawals,
      profitDistributions,
      bankLoans,
      loanInstallments,
      addBankLoan,
      updateBankLoan,
      deleteBankLoan,
      addLoanInstallment,
      deleteLoanInstallment,
      addInvestor,
      updateInvestor,
      deleteInvestor,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      addWithdrawal,
      updateWithdrawal,
      deleteWithdrawal,
      distributeProfit,
      payoutInvestorProfit,
      endorseChequeToSupplier,
      addAccount,
      updateAccount,
      deleteAccount,
      transferFunds,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCheque,
      updateCheque,
      deleteCheque,
      updateChequeStatus,
      notifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification,
      metrics,
      quickActionModal,
      openQuickAction,
      isOnline,
      isSyncing,
      firebaseConnected,
      firebaseProjectId: firebaseConfig.projectId,
      syncAllToFirebase
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextType => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};

