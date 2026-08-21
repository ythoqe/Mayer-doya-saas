export type Language = 'en' | 'bn';

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'production_manager' 
  | 'dyeing_master' 
  | 'washing_manager' 
  | 'accounts_manager' 
  | 'store_keeper' 
  | 'employee' 
  | 'auditor';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'washing' 
  | 'delivered'
  | 'lot_received'
  | 'batch_assigned'
  | 'dyeing'
  | 'hydro'
  | 'drying'
  | 'finishing'
  | 'qc_passed'
  | 'ready_for_delivery'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  fabricQuality: string; // মার্কিন, লংক্লথ, ভয়েল, পপলিন, ইউনিটিকা, আস্তর
  greyYards: number; // গেরে গজ (Received Grey Yards)
  finishingYards: number; // ফিনিশিং গজ (Finishing Yards after washing for billing)
  quantityPcs?: number; // legacy alias for yards
  quantityYards?: number; // Yards
  unitRate: number; // Rate per Yard (দর ৳/গজ)
  totalAmount: number; // (finishingYards || greyYards) * unitRate
  advanceAmount: number;
  dueAmount: number;
  status: OrderStatus;
  receivedDate: string;
  deliveryDate: string;
  priority: 'normal' | 'urgent' | 'high';
  remarks?: string;
  styleNo?: string;
  garmentType?: string;
  colorShade?: string;
  washType?: string;
  batchNumber?: string;
  machineNo?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  address: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  companyName?: string;
  phone: string;
  address: string;
  category: 'Chemicals' | 'Dyes' | 'Machinery' | 'Packaging' | 'General';
  totalPurchases: number;
  totalPaid: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Acid' | 'Enzyme' | 'Dye' | 'Softener' | 'Bleach' | 'Alkali' | 'Fixing Agent' | 'Detergent' | 'Other';
  supplierId?: string;
  supplierName?: string;
  currentStockKg: number;
  unit: 'kg' | 'liter' | 'bag' | 'drum';
  unitPrice: number;
  minAlertLevel: number;
  location?: string;
  lastRestocked?: string;
}

export interface Expense {
  id: string;
  voucherNo: string;
  category: 'Electricity' | 'Gas' | 'Factory Rent' | 'Chemicals' | 'Maintenance' | 'Fuel/Boiler' | 'Labor' | 'Food' | 'Transport' | 'Office' | 'Misc';
  amount: number;
  date: string;
  accountId: string;
  accountName: string;
  paidBy: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  accountName: string;
  accountType: 'Cash' | 'Bank' | 'MFS' | 'Petty Cash';
  accountNumber?: string;
  bankName?: string;
  branch?: string;
  currentBalance: number;
  status: 'active' | 'inactive';
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'transfer';
  accountId: string;
  toAccountId?: string;
  amount: number;
  date: string;
  category: string;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface Cheque {
  id: string;
  chequeNumber: string;
  bankName: string;
  partyName: string;
  partyType: 'Client' | 'Supplier' | 'Other';
  amount: number;
  issueDate: string;
  clearingDate: string;
  status: 'Pending' | 'Cleared' | 'Bounced' | 'Cancelled';
  accountId?: string;
  notes?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  department: 'Washing' | 'Dyeing' | 'Hydro & Drying' | 'Finishing' | 'Quality Control' | 'Maintenance' | 'Accounts' | 'Administration';
  phone: string;
  salary: number;
  joinDate: string;
  status: 'active' | 'on_leave' | 'inactive';
  shift: 'day' | 'night' | 'general';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'cheque' | 'payment' | 'alert';
  read: boolean;
  time: string;
  linkTab?: string;
}
