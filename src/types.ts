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

export interface YearlyDue {
  year: number | string;
  amount: number;
  note?: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  address: string;
  openingBalance?: number;
  previousYearsDues?: YearlyDue[];
  totalBilled: number;
  totalPaid: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type BillStatus = 'Unpaid' | 'Partially Paid' | 'Paid';

export interface ClientBill {
  id: string;
  billNumber: string;
  orderId: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  deliveryDate: string;
  orderDescription: string;
  quantity: number;
  rate: number;
  totalBill: number;
  paidAmount: number;
  dueAmount: number;
  status: BillStatus;
  notes?: string;
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

export interface SupplierPurchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Due';
  purchaseDate: string;
  invoiceRef?: string;
  accountId?: string;
  accountName?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  accountId: string;
  accountName: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export type ChemicalCategory = 'জুট' | 'ব্লিচিং' | 'সোডা' | 'কাস্টিং' | 'এসিড' | 'ব্লু' | 'বিএমবি' | string;

export interface InventoryItem {
  id: string;
  name: string;
  category: ChemicalCategory;
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

export type ChequeStatus = 'Pending' | 'Clear' | 'Cancel' | 'Cleared' | 'Cancelled' | 'Bounced';
export type ChequeDirection = 'received' | 'issued'; // চেক গ্রহণ (received) vs চেক প্রদান (issued)

export interface Cheque {
  id: string;
  chequeNumber: string;
  bankName: string;
  partyName: string;
  partyType: 'Client' | 'Supplier' | 'Other';
  direction?: ChequeDirection; // 'received' = চেক গ্রহণ (Client) | 'issued' = চেক প্রদান (Supplier)
  clientId?: string;
  clientName?: string;
  supplierId?: string;
  supplierName?: string;
  sourceChequeId?: string; // If this cheque was issued by forwarding/endorsing a client's received cheque
  endorsedToChequeId?: string; // ID of the issued cheque record created for the supplier
  endorsedToSupplierId?: string;
  endorsedToSupplierName?: string;
  isEndorsed?: boolean;
  amount: number;
  issueDate: string;
  clearingDate: string;
  status: ChequeStatus; // 'Pending' | 'Clear' | 'Cancel'
  accountId?: string;
  accountName?: string;
  notes?: string;
  clearedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
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

// ----------------------------------------------------
// Investors & Equity Management Types
// ----------------------------------------------------

export type InvestmentType = 
  | 'initial' 
  | 'additional' 
  | 'share_capital' 
  | 'machinery' 
  | 'working_capital';

export type WithdrawalReason = 
  | 'capital_return' 
  | 'partial_withdrawal' 
  | 'emergency' 
  | 'partnership_settlement' 
  | 'other';

export interface Investor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nidOrPassport?: string;
  address?: string;
  sharePercentage?: number; // Ownership share % or agreed percentage
  mudarabaProfitSharePercentage?: number; // Agreed Mudaraba Profit Sharing % (e.g. 30% of proportional profit)
  investmentStartDate?: string;
  startDate?: string;
  bankDetails?: string;
  totalInvested: number; // Sum of all active investments
  totalWithdrawn: number; // Sum of principal withdrawals
  totalProfitReceived: number; // Sum of profit paid out
  pendingProfit: number; // Profit allocated but pending payout
  currentPosition: number; // (totalInvested - totalWithdrawn + pendingProfit)
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  investorId: string;
  investorName: string;
  amount: number;
  date: string;
  investmentType: InvestmentType;
  accountId: string;
  accountName: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface InvestorWithdrawal {
  id: string;
  investorId: string;
  investorName: string;
  amount: number;
  date: string;
  accountId: string;
  accountName: string;
  reason: WithdrawalReason;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface InvestorProfitAllocation {
  investorId: string;
  investorName: string;
  investedAmount: number; // Active principal invested by this partner
  existingFactoryCapital?: number; // Existing base factory capital
  totalCapitalAfterInvestment?: number; // Existing Capital + Investor Capital
  ownershipPercentage: number; // (investedAmount / totalCapital) * 100
  proportionalProfit: number; // Total Net Profit * (ownershipPercentage / 100)
  mudarabaProfitSharePercentage: number; // Agreed contract % (e.g. 30%)
  allocatedProfit: number; // Final investor profit: Proportional Profit * (mudarabaProfitSharePercentage / 100)
  factoryRetainedProfit?: number; // Proportional Profit - allocatedProfit (70% kept by factory)
  sharePercentage?: number; // Legacy alias for compatibility
  status: 'paid' | 'pending';
  accountId?: string;
  accountName?: string;
  paidAt?: string;
  paymentReference?: string;
}

export interface ProfitDistribution {
  id: string;
  period: string; // e.g., "January 2026", "Q1 2026", "2025-2026 Fiscal"
  startDate?: string;
  endDate?: string;
  existingFactoryCapital?: number; // Factory base capital (e.g. 1,000,000)
  totalCompanyNetProfit?: number; // Actual company net profit (e.g. 500,000)
  totalDistributableProfit: number; // Sum of final profit allocated to investors
  totalFactoryRetainedProfit?: number; // Sum retained by factory
  distributionRule: 'mudaraba_proportional' | 'proportional' | 'equal' | 'agreed_share' | 'manual';
  notes?: string;
  allocations: InvestorProfitAllocation[];
  totalAllocated: number;
  totalPaid: number;
  totalPending: number;
  status: 'draft' | 'approved' | 'partially_paid' | 'fully_paid';
  createdAt: string;
}

export interface InvestorLedgerRow {
  id: string;
  date: string;
  type: 'investment' | 'withdrawal' | 'profit_allocation' | 'profit_payout';
  reference: string;
  description: string;
  debit: number; // Cash out / withdrawal / profit payout
  credit: number; // Capital in / profit allocation
  balance: number; // Running net equity balance
}

export type LoanType = 
  | 'term_loan' 
  | 'cc_loan' 
  | 'sme_loan' 
  | 'mortgage' 
  | 'short_term' 
  | 'machinery_loan'
  | 'other';

export type LoanStatus = 'active' | 'closed' | 'overdue' | 'defaulted';

export interface BankLoan {
  id: string;
  loanTitle: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  loanType: LoanType;
  disbursementDate: string;
  sanctionAmount: number;
  interestRateAnnual: number;
  tenureMonths: number;
  monthlyInstallment: number;
  disbursedToAccountId: string;
  disbursedToAccountName: string;
  status: LoanStatus;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  currentOutstanding: number;
  nextDueDate: string;
  collateralDetails?: string;
  guarantorName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanInstallmentPayment {
  id: string;
  loanId: string;
  loanTitle: string;
  bankName: string;
  paymentDate: string;
  installmentNumber: number;
  totalAmount: number;
  principalAmount: number;
  interestAmount: number;
  lateFeeOrCharges?: number;
  fromAccountId: string;
  fromAccountName: string;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Auto-Debit' | 'Cash';
  chequeNumber?: string;
  reference: string;
  notes?: string;
  createdAt: string;
}

