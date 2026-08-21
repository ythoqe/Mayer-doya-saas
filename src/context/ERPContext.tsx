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
  Employee, 
  Notification,
  OrderStatus 
} from '../types';
import { translations } from '../utils/translation';
import { db, firebaseConfig } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

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

  // CRUD & Mutations
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;

  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryStock: (id: string, newStock: number) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  addAccount: (account: Omit<Account, 'id'>) => void;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => boolean;

  addCheque: (cheque: Omit<Cheque, 'id' | 'createdAt'>) => void;
  updateChequeStatus: (id: string, status: Cheque['status']) => void;

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
  };

  // Quick Action Modal Controller
  quickActionModal: 'order' | 'expense' | 'payment' | 'chemical' | null;
  openQuickAction: (action: 'order' | 'expense' | 'payment' | 'chemical' | null) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

// Initial Collections State (Empty - loaded strictly from Firebase Cloud)
const initialClients: Client[] = [];
const initialOrders: Order[] = [];
const initialSuppliers: Supplier[] = [];
const initialInventory: InventoryItem[] = [];
const initialAccounts: Account[] = [];
const initialExpenses: Expense[] = [];
const initialTransactions: Transaction[] = [];
const initialCheques: Cheque[] = [];
const initialEmployees: Employee[] = [];
const initialNotifications: Notification[] = [];

const initialUser: User = {
  id: 'usr-admin-1',
  name: 'Mojammal Hoq',
  email: 'hmmojjammalhoq@gmail.com',
  role: 'super_admin',
  phone: '+880 1700-000000',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

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
      type: 'alert'
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
      type: 'order'
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

  // Collections state - initialized strictly from empty array or synced Firestore cache
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [quickActionModal, openQuickAction] = useState<'order' | 'expense' | 'payment' | 'chemical' | null>(null);

  // Clear any legacy demo data from localStorage on first run
  useEffect(() => {
    try {
      const keys = [
        'mayer_doya_clients',
        'mayer_doya_orders',
        'mayer_doya_suppliers',
        'mayer_doya_inventory',
        'mayer_doya_expenses',
        'mayer_doya_accounts',
        'mayer_doya_transactions',
        'mayer_doya_cheques',
        'mayer_doya_employees',
        'mayer_doya_notifications'
      ];
      // If cached data contains demo IDs like 'ord-101' or 'c1', purge it
      const cachedOrders = localStorage.getItem('mayer_doya_orders');
      if (cachedOrders && cachedOrders.includes('ord-101')) {
        keys.forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

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

  // Real-time Firestore Subscriptions
  useEffect(() => {
    setIsSyncing(true);
    const unsubs: (() => void)[] = [];

    try {
      // 1. Orders
      const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
        const list: Order[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Order));
        setOrders(list);
        setFirebaseConnected(true);
      }, (err) => {
        console.warn('Firestore orders sync notice:', err.message);
      });
      unsubs.push(unsubOrders);

      // 2. Clients
      const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
        const list: Client[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Client));
        setClients(list);
      }, (err) => console.warn('Firestore clients sync notice:', err.message));
      unsubs.push(unsubClients);

      // 3. Suppliers
      const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => {
        const list: Supplier[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Supplier));
        setSuppliers(list);
      }, (err) => console.warn('Firestore suppliers sync notice:', err.message));
      unsubs.push(unsubSuppliers);

      // 4. Inventory / Chemicals (supports both 'chemicals' and 'inventory' collection names)
      const unsubInventory = onSnapshot(collection(db, 'inventory'), (snap) => {
        if (!snap.empty) {
          const list: InventoryItem[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as InventoryItem));
          setInventory(list);
        }
      }, (err) => console.warn('Firestore inventory sync notice:', err.message));
      unsubs.push(unsubInventory);

      const unsubChemicals = onSnapshot(collection(db, 'chemicals'), (snap) => {
        if (!snap.empty) {
          const list: InventoryItem[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as InventoryItem));
          setInventory(list);
        }
      }, (err) => console.warn('Firestore chemicals sync notice:', err.message));
      unsubs.push(unsubChemicals);

      // 5. Expenses
      const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
        const list: Expense[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Expense));
        setExpenses(list);
      }, (err) => console.warn('Firestore expenses sync notice:', err.message));
      unsubs.push(unsubExpenses);

      // 6. Accounts
      const unsubAccounts = onSnapshot(collection(db, 'accounts'), (snap) => {
        const list: Account[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Account));
        setAccounts(list);
      }, (err) => console.warn('Firestore accounts sync notice:', err.message));
      unsubs.push(unsubAccounts);

      // 7. Transactions
      const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
        const list: Transaction[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Transaction));
        setTransactions(list);
      }, (err) => console.warn('Firestore transactions sync notice:', err.message));
      unsubs.push(unsubTransactions);

      // 8. Cheques
      const unsubCheques = onSnapshot(collection(db, 'cheques'), (snap) => {
        const list: Cheque[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Cheque));
        setCheques(list);
      }, (err) => console.warn('Firestore cheques sync notice:', err.message));
      unsubs.push(unsubCheques);

      // 9. Employees
      const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
        const list: Employee[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Employee));
        setEmployees(list);
      }, (err) => console.warn('Firestore employees sync notice:', err.message));
      unsubs.push(unsubEmployees);

      // 10. Notifications
      const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
        const list: Notification[] = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id
        } as Notification));
        setNotifications(list);
      }, (err) => console.warn('Firestore notifications sync notice:', err.message));
      unsubs.push(unsubNotifs);

      // 11. Users
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        if (!snap.empty) {
          const list: User[] = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id
          } as User));
          const hasAdmin = list.some(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
          const combined = hasAdmin ? list : [DEFAULT_ADMIN, ...list];
          setUsers(combined);
          localStorage.setItem('mayer_doya_users', JSON.stringify(combined));
        } else {
          setDoc(doc(db, 'users', DEFAULT_ADMIN.id), DEFAULT_ADMIN).catch(() => {});
        }
      }, (err) => console.warn('Firestore users sync notice:', err.message));
      unsubs.push(unsubUsers);

    } catch (error) {
      console.warn('Firebase real-time synchronization initialized with offline fallback:', error);
      setFirebaseConnected(false);
    } finally {
      setIsSyncing(false);
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Helper function to sync local records to Firebase batch
  const syncAllToFirebase = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);

      orders.forEach(item => {
        const ref = doc(db, 'orders', item.id);
        batch.set(ref, item, { merge: true });
      });

      clients.forEach(item => {
        const ref = doc(db, 'clients', item.id);
        batch.set(ref, item, { merge: true });
      });

      suppliers.forEach(item => {
        const ref = doc(db, 'suppliers', item.id);
        batch.set(ref, item, { merge: true });
      });

      inventory.forEach(item => {
        const ref = doc(db, 'inventory', item.id);
        batch.set(ref, item, { merge: true });
      });

      expenses.forEach(item => {
        const ref = doc(db, 'expenses', item.id);
        batch.set(ref, item, { merge: true });
      });

      accounts.forEach(item => {
        const ref = doc(db, 'accounts', item.id);
        batch.set(ref, item, { merge: true });
      });

      transactions.forEach(item => {
        const ref = doc(db, 'transactions', item.id);
        batch.set(ref, item, { merge: true });
      });

      cheques.forEach(item => {
        const ref = doc(db, 'cheques', item.id);
        batch.set(ref, item, { merge: true });
      });

      employees.forEach(item => {
        const ref = doc(db, 'employees', item.id);
        batch.set(ref, item, { merge: true });
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
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
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

    // Update Client Billed & Balance
    setClients(prev => prev.map(c => {
      if (c.id === newOrder.clientId) {
        const billed = c.totalBilled + newOrder.totalAmount;
        const paid = c.totalPaid + newOrder.advanceAmount;
        const updatedClient = { ...c, totalBilled: billed, totalPaid: paid, balance: billed - paid };
        updateDoc(doc(db, 'clients', c.id), updatedClient).catch(() => {});
        return updatedClient;
      }
      return c;
    }));

    // If advance paid, record transaction
    if (newOrder.advanceAmount > 0) {
      const txId = `tx-${Date.now()}`;
      const tx: Transaction = {
        id: txId,
        type: 'credit',
        accountId: accounts[0]?.id || 'acc-1',
        amount: newOrder.advanceAmount,
        date: new Date().toISOString().split('T')[0],
        category: 'Order Advance',
        referenceId: id,
        description: `Advance for Order ${newOrder.orderNumber} (${newOrder.clientName})`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setTransactions(prev => [tx, ...prev]);
      setDoc(doc(db, 'transactions', txId), tx).catch(() => {});
    }

    addNotification({
      title: 'New Order Booked',
      message: `Order ${newOrder.orderNumber} for ${newOrder.quantityPcs} pcs booked for ${newOrder.clientName}.`,
      type: 'order',
      read: false,
      linkTab: 'orders'
    });
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
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
    setOrders(prev => prev.filter(ord => ord.id !== id));
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const id = `c-${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id,
      balance: clientData.totalBilled - clientData.totalPaid,
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
        updated.balance = updated.totalBilled - updated.totalPaid;
        updateDoc(doc(db, 'clients', id), updated).catch(() => {});
        return updated;
      }
      return c;
    }));
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
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
    setSuppliers(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
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
        updateDoc(doc(db, 'accounts', acc.id), updatedAcc).catch(() => {});
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

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const addAccount = async (accData: Omit<Account, 'id'>) => {
    const id = `acc-${Date.now()}`;
    const newAcc: Account = { ...accData, id };
    setAccounts(prev => [...prev, newAcc]);
    try {
      await setDoc(doc(db, 'accounts', id), newAcc);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const transferFunds = (fromAccountId: string, toAccountId: string, amount: number, notes?: string): boolean => {
    const sourceAcc = accounts.find(a => a.id === fromAccountId);
    if (!sourceAcc || sourceAcc.currentBalance < amount) return false;

    setAccounts(prev => prev.map(a => {
      if (a.id === fromAccountId) {
        const updated = { ...a, currentBalance: a.currentBalance - amount };
        updateDoc(doc(db, 'accounts', a.id), updated).catch(() => {});
        return updated;
      }
      if (a.id === toAccountId) {
        const updated = { ...a, currentBalance: a.currentBalance + amount };
        updateDoc(doc(db, 'accounts', a.id), updated).catch(() => {});
        return updated;
      }
      return a;
    }));

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
    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', txId), tx).catch(() => {});
    return true;
  };

  const addCheque = async (chequeData: Omit<Cheque, 'id' | 'createdAt'>) => {
    const id = `chq-${Date.now()}`;
    const newChq: Cheque = { ...chequeData, id, createdAt: new Date().toISOString().split('T')[0] };
    setCheques(prev => [newChq, ...prev]);
    try {
      await setDoc(doc(db, 'cheques', id), newChq);
    } catch (e) {
      console.warn('Persisted locally, Firebase sync queued:', e);
    }
  };

  const updateChequeStatus = async (id: string, status: Cheque['status']) => {
    setCheques(prev => prev.map(chq => {
      if (chq.id === id) {
        // If transitioning to cleared and accountId exists, update bank balance
        if (status === 'Cleared' && chq.status !== 'Cleared' && chq.accountId) {
          setAccounts(accs => accs.map(a => {
            if (a.id === chq.accountId) {
              const delta = chq.partyType === 'Client' ? chq.amount : -chq.amount;
              const updated = { ...a, currentBalance: a.currentBalance + delta };
              updateDoc(doc(db, 'accounts', a.id), updated).catch(() => {});
              return updated;
            }
            return a;
          }));
        }
        const updated = { ...chq, status };
        updateDoc(doc(db, 'cheques', id), { status }).catch(() => {});
        return updated;
      }
      return chq;
    }));
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

  // Metrics derivation
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const activeBatchesCount = orders.filter(o => ['washing', 'dyeing', 'hydro', 'drying', 'batch_assigned'].includes(o.status)).length;
    const pendingDeliveriesCount = orders.filter(o => ['ready_for_delivery', 'qc_passed'].includes(o.status)).length;
    const chemicalStockValue = inventory.reduce((sum, item) => sum + (item.currentStockKg * item.unitPrice), 0);
    const netCashBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const totalReceivables = clients.reduce((sum, c) => sum + (c.balance || 0), 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
    const todayWashOutput = orders
      .filter(o => ['ready_for_delivery', 'delivered', 'qc_passed'].includes(o.status))
      .reduce((sum, o) => sum + (o.quantityPcs || 0), 0);

    return {
      totalRevenue,
      activeBatchesCount,
      pendingDeliveriesCount,
      chemicalStockValue,
      netCashBalance,
      totalReceivables,
      totalPayables,
      todayWashOutput
    };
  }, [orders, inventory, accounts, clients, suppliers]);

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
      isOnline,
      isSyncing,
      firebaseConnected,
      firebaseProjectId: firebaseConfig.projectId,
      syncAllToFirebase,
      orders,
      clients,
      suppliers,
      inventory,
      expenses,
      accounts,
      transactions,
      cheques,
      employees,
      notifications,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addOrder,
      updateOrderStatus,
      updateOrder,
      deleteOrder,
      addClient,
      updateClient,
      deleteClient,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addInventoryItem,
      updateInventoryStock,
      addExpense,
      deleteExpense,
      addAccount,
      transferFunds,
      addCheque,
      updateChequeStatus,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification,
      metrics,
      quickActionModal,
      openQuickAction
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

