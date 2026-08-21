import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Language, 
  User, 
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

interface ERPContextType {
  // Localization & Auth
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, role?: string) => Promise<boolean>;
  logout: () => void;
  isOnline: boolean;
  isSyncing: boolean;

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

// Initial Seed Data
const initialClients: Client[] = [
  { id: 'c1', name: 'Al-Amin Hossain', companyName: 'Apex Apparels Ltd.', phone: '+880 1711-234567', email: 'merchandising@apexapparels.com', address: 'Plot 42, Gazipur Industrial Area, Dhaka', totalBilled: 485000, totalPaid: 360000, balance: 125000, status: 'active', createdAt: '2026-01-15' },
  { id: 'c2', name: 'Mahmudur Rahman', companyName: 'Ha-Meem Denim Processing', phone: '+880 1819-876543', email: 'mahmud@hameemgroup.com', address: 'Narayanganj BSCIC, Dhaka', totalBilled: 720000, totalPaid: 610000, balance: 110000, status: 'active', createdAt: '2026-01-20' },
  { id: 'c3', name: 'Tariqul Islam', companyName: 'Beximco Textiles Unit 3', phone: '+880 1912-345678', email: 'tariq@beximco.net', address: 'Sarabo, Kashimpur, Gazipur', totalBilled: 950000, totalPaid: 950000, balance: 0, status: 'active', createdAt: '2026-02-01' },
  { id: 'c4', name: 'Kamrul Hasan', companyName: 'Pacific Jeans Finishing Hub', phone: '+880 1611-987654', email: 'k.hasan@pacificjeans.com', address: 'CEPZ, Chattogram', totalBilled: 310000, totalPaid: 215000, balance: 95000, status: 'active', createdAt: '2026-02-10' }
];

const initialOrders: Order[] = [
  { id: 'ord-101', orderNumber: 'MD-2026-0841', clientId: 'c1', clientName: 'Apex Apparels Ltd.', styleNo: 'APX-DENIM-99', garmentType: 'Denim Pants', colorShade: 'Medium Blue Vintage', washType: 'Enzyme Stone Wash + Tint', quantityPcs: 2500, unitRate: 48, totalAmount: 120000, advanceAmount: 50000, dueAmount: 70000, status: 'washing', receivedDate: '2026-08-18', deliveryDate: '2026-08-23', priority: 'high', batchNumber: 'BATCH-W-04', machineNo: 'WASH-M02', createdAt: '2026-08-18' },
  { id: 'ord-102', orderNumber: 'MD-2026-0842', clientId: 'c2', clientName: 'Ha-Meem Denim Processing', styleNo: 'HM-CARGO-21', garmentType: 'Twill Cargo Pants', colorShade: 'Olive Drab Dye', washType: 'Reactive Pigment Dyeing', quantityPcs: 1800, unitRate: 65, totalAmount: 117000, advanceAmount: 40000, dueAmount: 77000, status: 'dyeing', receivedDate: '2026-08-19', deliveryDate: '2026-08-25', priority: 'urgent', batchNumber: 'BATCH-D-09', machineNo: 'DYE-M01', createdAt: '2026-08-19' },
  { id: 'ord-103', orderNumber: 'MD-2026-0843', clientId: 'c3', clientName: 'Beximco Textiles Unit 3', styleNo: 'BEX-SHIRT-77', garmentType: 'Cotton Casual Shirt', colorShade: 'Optic White', washType: 'Bleach Wash + Silicon Softener', quantityPcs: 4200, unitRate: 32, totalAmount: 134400, advanceAmount: 134400, dueAmount: 0, status: 'qc_passed', receivedDate: '2026-08-15', deliveryDate: '2026-08-21', priority: 'normal', batchNumber: 'BATCH-W-01', machineNo: 'WASH-M04', createdAt: '2026-08-15' },
  { id: 'ord-104', orderNumber: 'MD-2026-0844', clientId: 'c4', clientName: 'Pacific Jeans Finishing Hub', styleNo: 'PJ-JACKET-12', garmentType: 'Denim Jacket', colorShade: 'Acid Snow Bleach', washType: 'Acid Wash + Heavy Potassium Spray', quantityPcs: 1200, unitRate: 95, totalAmount: 114000, advanceAmount: 30000, dueAmount: 84000, status: 'hydro', receivedDate: '2026-08-17', deliveryDate: '2026-08-24', priority: 'high', batchNumber: 'BATCH-W-03', machineNo: 'HYDRO-01', createdAt: '2026-08-17' },
  { id: 'ord-105', orderNumber: 'MD-2026-0845', clientId: 'c1', clientName: 'Apex Apparels Ltd.', styleNo: 'APX-SHORTS-03', garmentType: 'Knit Shorts', colorShade: 'Deep Charcoal', washType: 'Direct Dyeing + Bio Polish', quantityPcs: 3000, unitRate: 38, totalAmount: 114000, advanceAmount: 30000, dueAmount: 84000, status: 'ready_for_delivery', receivedDate: '2026-08-16', deliveryDate: '2026-08-22', priority: 'normal', batchNumber: 'BATCH-D-06', machineNo: 'FINISH-02', createdAt: '2026-08-16' }
];

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'Haji Rafiqul Islam', company: 'Colour Chem Bangladesh Ltd.', phone: '+880 1712-445566', address: 'Mitford Road, Old Dhaka', category: 'Chemicals', totalPurchases: 620000, totalPaid: 480000, balance: 140000, status: 'active', createdAt: '2026-01-10' },
  { id: 's2', name: 'Enamul Haque', company: 'Dystar Textile Auxiliaries', phone: '+880 1817-667788', address: 'Tejgaon I/A, Dhaka', category: 'Dyes', totalPurchases: 890000, totalPaid: 750000, balance: 140000, status: 'active', createdAt: '2026-01-12' },
  { id: 's3', name: 'Zahirul Alam', company: 'Meghna Boiler & Machine Spares', phone: '+880 1913-998877', address: 'Siddirganj, Narayanganj', category: 'Machinery', totalPurchases: 250000, totalPaid: 250000, balance: 0, status: 'active', createdAt: '2026-02-05' }
];

const initialInventory: InventoryItem[] = [
  { id: 'inv-1', name: 'Cellulase Bio-Enzyme (Neutral 500)', category: 'Enzyme', supplierId: 's1', supplierName: 'Colour Chem Bangladesh Ltd.', currentStockKg: 380, unit: 'kg', unitPrice: 280, minAlertLevel: 100, location: 'Rack A-02 Chemical Store' },
  { id: 'inv-2', name: 'Reactive Black DN (Concentrate)', category: 'Dye', supplierId: 's2', supplierName: 'Dystar Textile Auxiliaries', currentStockKg: 45, unit: 'kg', unitPrice: 850, minAlertLevel: 50, location: 'Rack B-01 Dyes Room' },
  { id: 'inv-3', name: 'Glacial Acetic Acid (99.8%)', category: 'Acid', supplierId: 's1', supplierName: 'Colour Chem Bangladesh Ltd.', currentStockKg: 820, unit: 'kg', unitPrice: 95, minAlertLevel: 250, location: 'Drum Zone C' },
  { id: 'inv-4', name: 'Micro Silicon Softener (Macro 80)', category: 'Softener', supplierId: 's1', supplierName: 'Colour Chem Bangladesh Ltd.', currentStockKg: 210, unit: 'kg', unitPrice: 190, minAlertLevel: 150, location: 'Rack A-04' },
  { id: 'inv-5', name: 'Hydrogen Peroxide (50% Grade)', category: 'Bleach', supplierId: 's1', supplierName: 'Colour Chem Bangladesh Ltd.', currentStockKg: 640, unit: 'kg', unitPrice: 65, minAlertLevel: 200, location: 'Drum Zone C' },
  { id: 'inv-6', name: 'Soda Ash Light (Alkali)', category: 'Alkali', supplierId: 's1', supplierName: 'Colour Chem Bangladesh Ltd.', currentStockKg: 1200, unit: 'kg', unitPrice: 48, minAlertLevel: 400, location: 'Pallet Zone D' }
];

const initialAccounts: Account[] = [
  { id: 'acc-1', accountName: 'Prime Bank Factory Current A/C', accountType: 'Bank', accountNumber: '2104108003491', bankName: 'Prime Bank Ltd.', branch: 'Gazipur Branch', currentBalance: 845000, status: 'active' },
  { id: 'acc-2', accountName: 'Dutch-Bangla CD Operations', accountType: 'Bank', accountNumber: '1181200054321', bankName: 'Dutch-Bangla Bank', branch: 'Uttara Branch', currentBalance: 412000, status: 'active' },
  { id: 'acc-3', accountName: 'Factory Floor Petty Cash', accountType: 'Petty Cash', currentBalance: 68500, status: 'active' },
  { id: 'acc-4', accountName: 'bKash Merchant Gateway', accountType: 'MFS', accountNumber: '+880 1711-009988', currentBalance: 34200, status: 'active' }
];

const initialExpenses: Expense[] = [
  { id: 'exp-1', voucherNo: 'VOUCH-26-0182', category: 'Gas', amount: 85000, date: '2026-08-15', accountId: 'acc-1', accountName: 'Prime Bank Factory Current A/C', paidBy: 'Titas Gas Transmission', notes: 'Monthly factory boiler line consumption bill', createdAt: '2026-08-15' },
  { id: 'exp-2', voucherNo: 'VOUCH-26-0183', category: 'Electricity', amount: 112000, date: '2026-08-16', accountId: 'acc-1', accountName: 'Prime Bank Factory Current A/C', paidBy: 'DESCO Gazipur Circle', notes: 'HT Industrial Power Bill', createdAt: '2026-08-16' },
  { id: 'exp-3', voucherNo: 'VOUCH-26-0184', category: 'Maintenance', amount: 14500, date: '2026-08-18', accountId: 'acc-3', accountName: 'Factory Floor Petty Cash', paidBy: 'Kamrul Spares', notes: 'Washing machine M-02 bearing seal repair', createdAt: '2026-08-18' },
  { id: 'exp-4', voucherNo: 'VOUCH-26-0185', category: 'Fuel/Boiler', amount: 32000, date: '2026-08-19', accountId: 'acc-3', accountName: 'Factory Floor Petty Cash', paidBy: 'Wood & Husk Vendor', notes: 'Boiler auxiliary fuel load 6 tons', createdAt: '2026-08-19' }
];

const initialTransactions: Transaction[] = [
  { id: 'tx-1', type: 'credit', accountId: 'acc-1', amount: 150000, date: '2026-08-18', category: 'Client Payment', referenceId: 'c1', description: 'Advance received from Apex Apparels for Batch W-04', createdAt: '2026-08-18' },
  { id: 'tx-2', type: 'debit', accountId: 'acc-1', amount: 85000, date: '2026-08-15', category: 'Factory Expense', referenceId: 'exp-1', description: 'Titas Gas boiler bill clearance', createdAt: '2026-08-15' },
  { id: 'tx-3', type: 'transfer', accountId: 'acc-1', toAccountId: 'acc-3', amount: 50000, date: '2026-08-17', category: 'Internal Transfer', description: 'Replenish floor petty cash float', createdAt: '2026-08-17' }
];

const initialCheques: Cheque[] = [
  { id: 'chq-1', chequeNumber: 'CQ-984421', bankName: 'Islami Bank Bangladesh', partyName: 'Apex Apparels Ltd.', partyType: 'Client', amount: 70000, issueDate: '2026-08-18', clearingDate: '2026-08-24', status: 'Pending', accountId: 'acc-1', notes: 'Order MD-2026-0841 balance cheque', createdAt: '2026-08-18' },
  { id: 'chq-2', chequeNumber: 'CQ-332190', bankName: 'City Bank Ltd.', partyName: 'Colour Chem Bangladesh', partyType: 'Supplier', amount: 95000, issueDate: '2026-08-16', clearingDate: '2026-08-22', status: 'Pending', accountId: 'acc-1', notes: 'Acetic acid bulk invoice payment', createdAt: '2026-08-16' },
  { id: 'chq-3', chequeNumber: 'CQ-110294', bankName: 'Eastern Bank Ltd.', partyName: 'Beximco Textiles Unit 3', partyType: 'Client', amount: 134400, issueDate: '2026-08-15', clearingDate: '2026-08-17', status: 'Cleared', accountId: 'acc-2', notes: 'Full bill clearance for BEX-SHIRT', createdAt: '2026-08-15' }
];

const initialEmployees: Employee[] = [
  { id: 'emp-1', name: 'Md. Delwar Hossain', designation: 'Head Dyeing Master', department: 'Dyeing', phone: '+880 1722-112233', salary: 45000, joinDate: '2023-03-01', status: 'active', shift: 'day' },
  { id: 'emp-2', name: 'Shah Alam', designation: 'Senior Washing Supervisor', department: 'Washing', phone: '+880 1833-223344', salary: 32000, joinDate: '2023-06-15', status: 'active', shift: 'day' },
  { id: 'emp-3', name: 'Biplob Mia', designation: 'Hydro & Dryer Operator', department: 'Hydro & Drying', phone: '+880 1944-334455', salary: 18500, joinDate: '2024-01-10', status: 'active', shift: 'night' },
  { id: 'emp-4', name: 'Nazrul Islam', designation: 'QC & Shade Inspector', department: 'Quality Control', phone: '+880 1655-445566', salary: 26000, joinDate: '2023-11-20', status: 'active', shift: 'day' },
  { id: 'emp-5', name: 'Kabir Hossain', designation: 'Senior Boiler & Machine Technician', department: 'Maintenance', phone: '+880 1718-998811', salary: 28000, joinDate: '2023-08-05', status: 'active', shift: 'day' },
  { id: 'emp-6', name: 'Farhana Akter', designation: 'Factory Accountant & Billing Executive', department: 'Accounts', phone: '+880 1819-334411', salary: 30000, joinDate: '2023-05-12', status: 'active', shift: 'general' },
  { id: 'emp-7', name: 'Rafiqul Islam', designation: 'Finishing & Packing Supervisor', department: 'Finishing', phone: '+880 1922-778899', salary: 22000, joinDate: '2024-02-01', status: 'on_leave', shift: 'day' },
  { id: 'emp-8', name: 'Abdul Alim', designation: 'Store Keeper & Chemical In-charge', department: 'Administration', phone: '+880 1733-445566', salary: 24000, joinDate: '2023-04-18', status: 'active', shift: 'day' }
];

const initialNotifications: Notification[] = [
  { id: 'n1', title: 'Low Chemical Stock Warning', message: 'Reactive Black DN is currently at 45kg (below safe minimum 50kg).', type: 'inventory', read: false, time: '10m ago', linkTab: 'inventory' },
  { id: 'n2', title: 'New Lot Received for Dyeing', message: 'Order MD-2026-0842 (1,800 pcs) loaded into Dyeing Machine 01.', type: 'order', read: false, time: '35m ago', linkTab: 'orders' },
  { id: 'n3', title: 'Upcoming Cheque Deposit', message: 'Apex Apparels cheque ৳70,000 clearing scheduled for Aug 24.', type: 'cheque', read: true, time: '2h ago', linkTab: 'accounts' }
];

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
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem('mayer_doya_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialUser; }
    }
    return initialUser;
  });

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('mayer_doya_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mayer_doya_user');
    }
  };

  const login = async (email: string, role?: string): Promise<boolean> => {
    const matchedRole = (role as User['role']) || 'super_admin';
    const userObj: User = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0] || 'Factory Manager',
      email: email || 'manager@mayerdoya.com',
      role: matchedRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
    setCurrentUser(userObj);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Collections with localStorage persistence fallback
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('mayer_doya_clients');
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('mayer_doya_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('mayer_doya_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('mayer_doya_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('mayer_doya_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('mayer_doya_accounts');
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('mayer_doya_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [cheques, setCheques] = useState<Cheque[]>(() => {
    const saved = localStorage.getItem('mayer_doya_cheques');
    return saved ? JSON.parse(saved) : initialCheques;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('mayer_doya_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('mayer_doya_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [isOnline] = useState<boolean>(true);
  const [isSyncing] = useState<boolean>(false);
  const [quickActionModal, openQuickAction] = useState<'order' | 'expense' | 'payment' | 'chemical' | null>(null);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('mayer_doya_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('mayer_doya_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('mayer_doya_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('mayer_doya_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('mayer_doya_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('mayer_doya_accounts', JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem('mayer_doya_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('mayer_doya_cheques', JSON.stringify(cheques)); }, [cheques]);
  useEffect(() => { localStorage.setItem('mayer_doya_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('mayer_doya_notifications', JSON.stringify(notifications)); }, [notifications]);

  // Operations
  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...employeeData,
      id
    };
    setEmployees(prev => [newEmp, ...prev]);

    addNotification({
      title: 'New Employee Registered',
      message: `${newEmp.name} joined as ${newEmp.designation} (${newEmp.department}).`,
      type: 'alert',
      read: false,
      linkTab: 'employees'
    });
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };
  const addOrder = (newOrderData: Omit<Order, 'id' | 'createdAt'>) => {
    const id = `ord-${Date.now()}`;
    const newOrder: Order = {
      ...newOrderData,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setOrders(prev => [newOrder, ...prev]);

    // Update Client Billed & Balance
    setClients(prev => prev.map(c => {
      if (c.id === newOrder.clientId) {
        const billed = c.totalBilled + newOrder.totalAmount;
        const paid = c.totalPaid + newOrder.advanceAmount;
        return { ...c, totalBilled: billed, totalPaid: paid, balance: billed - paid };
      }
      return c;
    }));

    // If advance paid, record transaction
    if (newOrder.advanceAmount > 0) {
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
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
    }

    addNotification({
      title: 'New Order Booked',
      message: `Order ${newOrder.orderNumber} for ${newOrder.quantityPcs} pcs booked for ${newOrder.clientName}.`,
      type: 'order',
      read: false,
      linkTab: 'orders'
    });
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === id) {
        return { ...ord, status };
      }
      return ord;
    }));
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(ord => ord.id === id ? { ...ord, ...updates } : ord));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(ord => ord.id !== id));
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const id = `c-${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id,
      balance: clientData.totalBilled - clientData.totalPaid,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [newClient, ...prev]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        updated.balance = updated.totalBilled - updated.totalPaid;
        return updated;
      }
      return c;
    }));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const id = `s-${Date.now()}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id,
      balance: supplierData.totalPurchases - supplierData.totalPaid,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setSuppliers(prev => [newSupplier, ...prev]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        updated.balance = updated.totalPurchases - updated.totalPaid;
        return updated;
      }
      return s;
    }));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const id = `inv-${Date.now()}`;
    setInventory(prev => [{ ...itemData, id }, ...prev]);
  };

  const updateInventoryStock = (id: string, newStock: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, currentStockKg: newStock, lastRestocked: new Date().toISOString().split('T')[0] };
      }
      return item;
    }));
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const id = `exp-${Date.now()}`;
    const newExp: Expense = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [newExp, ...prev]);

    // Deduct from account
    setAccounts(prev => prev.map(acc => {
      if (acc.id === newExp.accountId) {
        return { ...acc, currentBalance: acc.currentBalance - newExp.amount };
      }
      return acc;
    }));

    // Record Transaction
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
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
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addAccount = (accData: Omit<Account, 'id'>) => {
    const id = `acc-${Date.now()}`;
    setAccounts(prev => [...prev, { ...accData, id }]);
  };

  const transferFunds = (fromAccountId: string, toAccountId: string, amount: number, notes?: string): boolean => {
    const sourceAcc = accounts.find(a => a.id === fromAccountId);
    if (!sourceAcc || sourceAcc.currentBalance < amount) return false;

    setAccounts(prev => prev.map(a => {
      if (a.id === fromAccountId) return { ...a, currentBalance: a.currentBalance - amount };
      if (a.id === toAccountId) return { ...a, currentBalance: a.currentBalance + amount };
      return a;
    }));

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
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
    return true;
  };

  const addCheque = (chequeData: Omit<Cheque, 'id' | 'createdAt'>) => {
    const id = `chq-${Date.now()}`;
    setCheques(prev => [{ ...chequeData, id, createdAt: new Date().toISOString().split('T')[0] }, ...prev]);
  };

  const updateChequeStatus = (id: string, status: Cheque['status']) => {
    setCheques(prev => prev.map(chq => {
      if (chq.id === id) {
        // If transitioning to cleared and accountId exists, update bank balance
        if (status === 'Cleared' && chq.status !== 'Cleared' && chq.accountId) {
          setAccounts(accs => accs.map(a => {
            if (a.id === chq.accountId) {
              const delta = chq.partyType === 'Client' ? chq.amount : -chq.amount;
              return { ...a, currentBalance: a.currentBalance + delta };
            }
            return a;
          }));
        }
        return { ...chq, status };
      }
      return chq;
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (notifData: Omit<Notification, 'id' | 'time'>) => {
    const id = `notif-${Date.now()}`;
    setNotifications(prev => [{ ...notifData, id, time: 'Just now' }, ...prev]);
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
      login,
      logout,
      isOnline,
      isSyncing,
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
