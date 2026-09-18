import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { ReportCategory, DateRange, PrintDocumentType } from './reports/types';
import { getDefaultDateRange } from './reports/dateUtils';
import { exportReportToCSV } from './reports/csvExport';
import { exportReportToExcel } from './reports/excelExport';
import { ReportHeader } from './reports/ReportHeader';
import { ReportCategoryTabs } from './reports/ReportCategoryTabs';
import { OverviewReport } from './reports/OverviewReport';
import { ProductionReport } from './reports/ProductionReport';
import { OrderReport } from './reports/OrderReport';
import { ClientReport } from './reports/ClientReport';
import { SupplierReport } from './reports/SupplierReport';
import { InventoryReport } from './reports/InventoryReport';
import { FinancialReport } from './reports/FinancialReport';
import { ExpenseReport } from './reports/ExpenseReport';
import { EmployeeReport } from './reports/EmployeeReport';
import { PrintCenter } from './reports/PrintCenter';

export const Reports: React.FC = () => {
  const { 
    orders, 
    clients, 
    suppliers, 
    inventory, 
    expenses, 
    accounts, 
    transactions, 
    employees, 
    currentUser, 
    language, 
    t 
  } = useERP();

  const [activeCategory, setActiveCategory] = useState<ReportCategory>('overview');
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange('this_year'));
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Map current active report category to corresponding print document template
  const getPrintDocTypeForCategory = (cat: ReportCategory): PrintDocumentType => {
    switch (cat) {
      case 'overview':
      case 'finance':
        return 'executive_pnl';
      case 'production':
        return 'production_sheet';
      case 'orders':
      case 'clients':
        return 'client_receivables';
      case 'suppliers':
        return 'supplier_payables';
      case 'inventory':
        return 'inventory_valuation';
      case 'expenses':
        return 'expense_audit';
      case 'employees':
        return 'salary_sheet';
      default:
        return 'executive_pnl';
    }
  };

  const handleExportCSV = () => {
    exportReportToCSV(activeCategory, {
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
    });
  };

  const handleExportExcel = () => {
    exportReportToExcel(activeCategory, {
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
    });
  };

  const handleOpenPrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Global Report Header */}
      <ReportHeader
        activeCategory={activeCategory}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onOpenPrintCenter={handleOpenPrint}
      />

      {/* Category Navigation Tabs with RBAC */}
      <ReportCategoryTabs
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        userRole={currentUser?.role}
      />

      {/* Report Content View */}
      <div className="transition-all duration-200">
        {activeCategory === 'overview' && <OverviewReport dateRange={dateRange} />}
        {activeCategory === 'production' && <ProductionReport dateRange={dateRange} />}
        {activeCategory === 'orders' && <OrderReport dateRange={dateRange} />}
        {activeCategory === 'clients' && <ClientReport dateRange={dateRange} />}
        {activeCategory === 'suppliers' && <SupplierReport dateRange={dateRange} />}
        {activeCategory === 'inventory' && <InventoryReport dateRange={dateRange} />}
        {activeCategory === 'finance' && <FinancialReport dateRange={dateRange} />}
        {activeCategory === 'expenses' && <ExpenseReport dateRange={dateRange} />}
        {activeCategory === 'employees' && <EmployeeReport dateRange={dateRange} />}
      </div>

      {/* Print Center Modal (A4 Print-Ready Reports) */}
      <PrintCenter
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        dateRange={dateRange}
        initialDocType={getPrintDocTypeForCategory(activeCategory)}
      />
    </div>
  );
};
export default Reports;
