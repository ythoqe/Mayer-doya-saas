import * as XLSX from 'xlsx';
import { ReportCategory, DateRange } from './types';
import { isDateInRange } from './dateUtils';
import { Order, Client, Supplier, InventoryItem, Expense, Account, Transaction, Employee } from '../../types';
import { ExportDataPayload } from './csvExport';

/**
 * High-performance Excel (.xlsx) export utility using sheetjs / xlsx
 */
export const exportReportToExcel = (
  category: ReportCategory,
  payload: ExportDataPayload
) => {
  const { 
    orders, 
    clients, 
    suppliers, 
    inventory, 
    expenses, 
    accounts, 
    transactions, 
    employees, 
    dateRange,
    language 
  } = payload;

  const dateSuffix = `${dateRange.startDate}_to_${dateRange.endDate}`;
  const wb = XLSX.utils.book_new();

  const isBn = language === 'bn';

  switch (category) {
    case 'overview':
    case 'finance': {
      // 1. Annual / Periodic Financial Summary Sheet
      const filteredOrders = orders.filter(o => isDateInRange(o.receivedDate || o.createdAt, dateRange));
      const filteredExpenses = expenses.filter(e => isDateInRange(e.date || e.createdAt, dateRange));
      const filteredTx = transactions.filter(tx => isDateInRange(tx.date || tx.createdAt, dateRange));

      const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalAdvance = filteredOrders.reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
      const totalOrderDue = filteredOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      const totalReceivables = clients.reduce((sum, c) => sum + (c.balance || 0), 0);
      const totalPayables = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
      const totalCashInAccounts = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

      const summaryData = [
        [isBn ? 'মেসার্স মায়ের দোয়া ওয়াশিং ও ডায়িং কারখানা' : 'Mayer Doya Washing Plant - Annual Financial Statement'],
        [isBn ? `হিসাবের মেয়াদ: ${dateRange.startDate} হতে ${dateRange.endDate}` : `Accounting Period: ${dateRange.startDate} to ${dateRange.endDate}`],
        [''],
        [isBn ? 'হিসাব খাত (Financial Head)' : 'Financial Head', isBn ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'],
        [isBn ? 'মোট ওয়াশিং বিল ও আয় (Total Invoiced Revenue)' : 'Total Invoiced Revenue', totalRevenue],
        [isBn ? 'মোট আদায়কৃত নগদ/ব্যাংক টাকা (Total Collections Received)' : 'Total Collections Received', totalAdvance],
        [isBn ? 'চলতি অর্ডারের বকেয়া (Current Orders Due)' : 'Current Orders Due', totalOrderDue],
        [isBn ? 'সর্বমোট ক্লায়েন্ট বকেয়া (বিগত বছরসহ) (Total Client Receivables)' : 'Total Client Receivables (incl. Past Dues)', totalReceivables],
        [isBn ? 'মোট কারখানা পরিচালন ব্যয় (Total Factory Operating Expenses)' : 'Total Factory Operating Expenses', totalExpenses],
        [isBn ? 'সর্বমোট সাপ্লায়ার দেনা (Total Supplier Payables)' : 'Total Supplier Payables', totalPayables],
        [isBn ? 'ব্যাংক ও ক্যাশ রিজার্ভ (Net Cash/Bank Balance)' : 'Net Cash & Bank Reserve Balance', totalCashInAccounts],
        [''],
        [isBn ? 'নিট পরিচালন লাভ/ক্ষতি (Net Operating Profit/Loss)' : 'Net Operating Profit / (Loss)', netProfit]
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, isBn ? 'আর্থিক সারসংক্ষেপ' : 'Financial Statement');

      // 2. Client Debt & Historical Dues Sheet
      const clientHeaders = [
        isBn ? 'কোম্পানি / ফ্যাক্টরির নাম' : 'Company Name',
        isBn ? 'মার্চেন্ডাইজার / প্রতিনিধি' : 'Contact Person',
        isBn ? 'ফোন নম্বর' : 'Phone',
        isBn ? 'পূর্বের বকেয়া (বিগত বছর)' : 'Opening / Past Years Due',
        isBn ? 'চলতি বিল' : 'Current Orders Billed',
        isBn ? 'মোট পরিশোধ' : 'Total Paid',
        isBn ? 'মোট বর্তমান বকেয়া' : 'Total Balance Due'
      ];
      const clientRows = clients.map(c => [
        c.companyName,
        c.name,
        c.phone,
        c.openingBalance || 0,
        c.totalBilled,
        c.totalPaid,
        c.balance
      ]);
      const wsClients = XLSX.utils.aoa_to_sheet([clientHeaders, ...clientRows]);
      XLSX.utils.book_append_sheet(wb, wsClients, isBn ? 'ক্লায়েন্ট বকেয়া খতিয়ান' : 'Client Receivables');

      // 3. Expense Breakdown Sheet
      const expenseHeaders = [
        isBn ? 'তারিখ' : 'Date',
        isBn ? 'ভাউচার নং' : 'Voucher No',
        isBn ? 'ক্যাটাগরি' : 'Category',
        isBn ? 'খরচের খাত ও নোট' : 'Notes / Head',
        isBn ? 'টাকা (BDT)' : 'Amount (BDT)'
      ];
      const expenseRows = filteredExpenses.map(e => [
        e.date,
        e.voucherNo || 'N/A',
        e.category,
        e.notes || '',
        e.amount
      ]);
      const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
      XLSX.utils.book_append_sheet(wb, wsExpenses, isBn ? 'ব্যয় বিবরণী' : 'Expense Audit');

      XLSX.writeFile(wb, `mayer_doya_annual_finance_${dateSuffix}.xlsx`);
      return;
    }

    case 'orders': {
      const filtered = orders.filter(o => isDateInRange(o.receivedDate || o.createdAt, dateRange));
      const headers = [
        'Job Card / Order No',
        'Client / Factory',
        'Style No',
        'Garment Type',
        'Wash Type',
        'Quantity (Pcs)',
        'Unit Rate (BDT)',
        'Total Bill (BDT)',
        'Advance Paid',
        'Due Balance',
        'Production Status',
        'Received Date',
        'Delivery Date'
      ];
      const rows = filtered.map(o => [
        o.orderNumber,
        o.clientName,
        o.styleNo,
        o.garmentType,
        o.washType,
        o.quantityPcs,
        o.unitRate,
        o.totalAmount,
        o.advanceAmount,
        o.dueAmount,
        o.status,
        o.receivedDate,
        o.deliveryDate
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Orders List');
      XLSX.writeFile(wb, `mayer_doya_orders_${dateSuffix}.xlsx`);
      return;
    }

    case 'clients': {
      const headers = [
        'Company / Factory Name',
        'Contact Person',
        'Phone',
        'Email',
        'Address',
        'Opening Balance (Past Years)',
        'Total Billed',
        'Total Paid',
        'Net Balance Due',
        'Status'
      ];
      const rows = clients.map(c => [
        c.companyName,
        c.name,
        c.phone,
        c.email || '',
        c.address || '',
        c.openingBalance || 0,
        c.totalBilled,
        c.totalPaid,
        c.balance,
        c.status
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Clients Ledger');
      XLSX.writeFile(wb, `mayer_doya_clients_${dateSuffix}.xlsx`);
      return;
    }

    case 'suppliers': {
      const headers = [
        'Supplier / Company Name',
        'Representative',
        'Phone',
        'Category / Supplied Item',
        'Total Purchases',
        'Total Paid',
        'Payable Balance',
        'Status'
      ];
      const rows = suppliers.map(s => [
        s.company || s.name,
        s.name,
        s.phone,
        s.category,
        s.totalPurchases,
        s.totalPaid,
        s.balance,
        s.status
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Suppliers Ledger');
      XLSX.writeFile(wb, `mayer_doya_suppliers_${dateSuffix}.xlsx`);
      return;
    }

    case 'inventory': {
      const headers = [
        'Chemical / Material Name',
        'Category',
        'Current Stock (Kg/Ltr)',
        'Unit Price (BDT)',
        'Total Valuation (BDT)',
        'Min Alert Level',
        'Stock Alert Status',
        'Supplier'
      ];
      const rows = inventory.map(i => [
        i.name,
        i.category,
        i.currentStockKg,
        i.unitPrice,
        i.currentStockKg * i.unitPrice,
        i.minAlertLevel,
        i.currentStockKg <= i.minAlertLevel ? 'Low Stock Alert' : 'Normal',
        i.supplierName || 'General'
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Chemical Inventory');
      XLSX.writeFile(wb, `mayer_doya_chemicals_${dateSuffix}.xlsx`);
      return;
    }

    case 'expenses': {
      const filtered = expenses.filter(e => isDateInRange(e.date || e.createdAt, dateRange));
      const headers = [
        'Voucher No',
        'Date',
        'Expense Category',
        'Account Paid From',
        'Notes / Item Details',
        'Amount (BDT)'
      ];
      const rows = filtered.map(e => {
        const acc = accounts.find(a => a.id === e.accountId);
        return [
          e.voucherNo,
          e.date,
          e.category,
          acc ? `${acc.accountName} (${acc.accountNumber})` : 'Cash',
          e.notes || '',
          e.amount
        ];
      });
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Factory Expenses');
      XLSX.writeFile(wb, `mayer_doya_expenses_${dateSuffix}.xlsx`);
      return;
    }

    case 'employees': {
      const headers = [
        'Employee ID',
        'Full Name',
        'Designation',
        'Department',
        'Phone',
        'Monthly Base Salary',
        'Status',
        'Joining Date'
      ];
      const rows = employees.map(emp => [
        emp.id,
        emp.name,
        emp.designation,
        emp.department,
        emp.phone,
        emp.salary,
        emp.status,
        emp.joinDate
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Employees Payroll');
      XLSX.writeFile(wb, `mayer_doya_employees_${dateSuffix}.xlsx`);
      return;
    }

    default: {
      const ws = XLSX.utils.aoa_to_sheet([['Report data exported successfully']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `mayer_doya_report_${dateSuffix}.xlsx`);
      return;
    }
  }
};
