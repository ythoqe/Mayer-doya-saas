import { ReportCategory, DateRange } from './types';
import { isDateInRange } from './dateUtils';
import { Order, Client, Supplier, InventoryItem, Expense, Account, Transaction, Employee } from '../../types';

/**
 * Helper to download CSV in browser
 */
export const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      let str = val === undefined || val === null ? '' : String(val);
      // Escape double quotes
      str = str.replace(/"/g, '""');
      if (str.search(/("|,|\n)/g) >= 0) {
        str = `"${str}"`;
      }
      return str;
    }).join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(processRow).join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export interface ExportDataPayload {
  orders: Order[];
  clients: Client[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  expenses: Expense[];
  accounts: Account[];
  transactions: Transaction[];
  employees: Employee[];
  dateRange: DateRange;
  language: 'en' | 'bn';
}

export const exportReportToCSV = (
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
    dateRange 
  } = payload;

  const dateSuffix = `${dateRange.startDate}_to_${dateRange.endDate}`;

  switch (category) {
    case 'overview':
    case 'orders': {
      const filtered = orders.filter(o => isDateInRange(o.receivedDate || o.createdAt, dateRange));
      const headers = ['Order No', 'Client Name', 'Style No', 'Garment Type', 'Wash Type', 'Quantity Pcs', 'Unit Rate', 'Total Amount', 'Advance Amount', 'Due Amount', 'Status', 'Received Date', 'Delivery Date'];
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
      downloadCSV(`mayer_doya_orders_${dateSuffix}`, [headers, ...rows]);
      break;
    }

    case 'production': {
      const filtered = orders.filter(o => isDateInRange(o.receivedDate || o.createdAt, dateRange));
      const headers = ['Job Card / Order No', 'Client', 'Style', 'Garment Type', 'Process / Wash Type', 'Quantity (Pcs)', 'Machine Assigned', 'Production Status', 'Start Date', 'Target Delivery'];
      const rows = filtered.map(o => [
        o.orderNumber,
        o.clientName,
        o.styleNo,
        o.garmentType,
        o.washType,
        o.quantityPcs,
        o.machineNo || 'N/A',
        o.status,
        o.receivedDate,
        o.deliveryDate
      ]);
      downloadCSV(`mayer_doya_production_${dateSuffix}`, [headers, ...rows]);
      break;
    }

    case 'clients': {
      const headers = ['Client Name', 'Company Name', 'Phone', 'Email', 'Address', 'Total Billed (BDT)', 'Total Paid (BDT)', 'Balance Due (BDT)', 'Status'];
      const rows = clients.map(c => [
        c.name,
        c.companyName,
        c.phone,
        c.email,
        c.address,
        c.totalBilled,
        c.totalPaid,
        c.balance,
        c.status
      ]);
      downloadCSV(`mayer_doya_clients_${dateSuffix}`, [headers, ...rows]);
      break;
    }

    case 'suppliers': {
      const headers = ['Supplier Name', 'Company', 'Category', 'Phone', 'Address', 'Total Purchases (BDT)', 'Total Paid (BDT)', 'Balance Payable (BDT)', 'Status'];
      const rows = suppliers.map(s => [
        s.name,
        s.company || s.companyName || s.name,
        s.category,
        s.phone,
        s.address,
        s.totalPurchases,
        s.totalPaid,
        s.balance,
        s.status
      ]);
      downloadCSV(`mayer_doya_suppliers_${dateSuffix}`, [headers, ...rows]);
      break;
    }

    case 'inventory': {
      const headers = ['Chemical Name', 'Category', 'Current Stock', 'Unit', 'Unit Price (BDT)', 'Total Valuation (BDT)', 'Min Alert Level', 'Location', 'Supplier'];
      const rows = inventory.map(i => [
        i.name,
        i.category,
        i.currentStockKg,
        i.unit,
        i.unitPrice,
        i.currentStockKg * i.unitPrice,
        i.minAlertLevel,
        i.location || 'Store Room',
        i.supplierName || 'General'
      ]);
      downloadCSV(`mayer_doya_inventory_${dateSuffix}`, [headers, ...rows]);
      break;
    }

    case 'finance': {
      const filtered = transactions.filter(tr => isDateInRange(tr.date || tr.createdAt, dateRange));
      const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Description', 'Amount (BDT)', 'Account ID', 'Reference'];
      const rows = filtered.map(tr => [
        tr.id,
        tr.date,
        tr.type,
        tr.category,
        tr.description,
        tr.amount,
        tr.accountId,
        tr.referenceId || ''
      ]);
      downloadCSV(`mayer_doya_financial_ledger_${dateSuffix}`, [headers, ...rows]);
      break;
    }

    case 'expenses': {
      const filtered = expenses.filter(e => isDateInRange(e.date || e.createdAt, dateRange));
      const headers = ['Voucher No', 'Date', 'Category', 'Amount (BDT)', 'Paid By', 'Account', 'Notes'];
      const rows = filtered.map(e => [
        e.voucherNo,
        e.date,
        e.category,
        e.amount,
        e.paidBy,
        e.accountName,
        e.notes || ''
      ]);
      downloadCSV(`mayer_doya_expenses_${dateSuffix}`, [headers, ...rows]);
      break;
    }

    case 'employees': {
      const headers = ['Employee Name', 'Designation', 'Department', 'Phone', 'Shift', 'Join Date', 'Monthly Salary (BDT)', 'Status'];
      const rows = employees.map(emp => [
        emp.name,
        emp.designation,
        emp.department,
        emp.phone,
        emp.shift,
        emp.joinDate,
        emp.salary,
        emp.status
      ]);
      downloadCSV(`mayer_doya_employees_${dateSuffix}`, [headers, ...rows]);
      break;
    }

    default:
      break;
  }
};
