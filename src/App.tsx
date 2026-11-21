import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ERPProvider, useERP } from './context/ERPContext';
import { Sidebar } from './components/ui/Sidebar';
import { Topbar } from './components/ui/Topbar';
import { QuickActionModal } from './components/ui/QuickActionModal';
import { Login } from './pages/Login';
import { Dashboard } from './components/Dashboard';
import { Orders } from './pages/Orders';
import { Clients } from './pages/Clients';
import { ClientLedger } from './pages/ClientLedger';
import { Suppliers } from './pages/Suppliers';
import { Inventory } from './components/Inventory';
import { Accounts } from './components/Accounts';
import { Expenses } from './components/Expenses';
import { Cheques } from './components/Cheques';
import { Employees } from './components/Employees';
import { Investors } from './components/Investors';
import { BankLoans } from './components/loans/BankLoans';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { ClientPaymentModal } from './components/clients/ClientPaymentModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';

const ERPAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { language, t, quickActionModal, openQuickAction } = useERP();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isTabletCollapsed, setIsTabletCollapsed] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F1FAFA] text-[#17383B]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-3 border-[#0B9FA5] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#688285]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not logged in via Firebase Auth, show Login screen
  if (!user) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigateTab={setActiveTab} />;
      case 'orders':
        return <Orders />;
      case 'clients':
        return <Clients />;
      case 'clientLedger':
        return <ClientLedger />;
      case 'suppliers':
        return <Suppliers />;
      case 'inventory':
        return <Inventory />;
      case 'accounts':
        return <Accounts />;
      case 'expenses':
        return <Expenses />;
      case 'cheques':
        return <Cheques />;
      case 'bankLoans':
      case 'loans':
        return <BankLoans />;
      case 'employees':
        return <Employees />;
      case 'investors':
        return <Investors language={language} t={t} />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full flex bg-[#F1FAFA] text-[#17383B] overflow-x-hidden font-sans">
      {/* Subtle Atmospheric Background Glows */}
      <div className="app-atmosphere" />
      <div className="app-bottom-glow" />

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isCollapsedTablet={isTabletCollapsed}
        onToggleCollapse={() => setIsTabletCollapsed(!isTabletCollapsed)}
      />

      {/* Main Viewport Shell */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        {/* Top Header */}
        <Topbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          onNavigateTab={setActiveTab}
          onOpenSettings={() => setActiveTab('settings')}
        />

        {/* Scrollable Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full"
            >
              <ErrorBoundary resetKeys={[activeTab]}>
                {renderActiveView()}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal />

      {/* Global Quick Client Payment Modal */}
      <ClientPaymentModal
        client={null}
        isOpen={quickActionModal === 'payment'}
        onClose={() => openQuickAction(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ERPProvider>
          <ERPAppContent />
        </ERPProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
