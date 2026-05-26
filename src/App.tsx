import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Settings, 
  LogOut, 
  Shield, 
  LogIn, 
  Store, 
  User, 
  CheckCircle,
  BellRing,
  RefreshCw
} from 'lucide-react';
import { 
  Role, 
  Branch, 
  Product, 
  Customer, 
  Supplier, 
  Voucher, 
  Purchase, 
  StockLog, 
  Transaction, 
  TransactionItem, 
  CashFlow, 
  ActivityLog 
} from './types';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import CashierView from './components/CashierView';
import ProductView from './components/ProductView';
import InventoryView from './components/InventoryView';
import CustomerSupplierView from './components/CustomerSupplierView';
import PurchaseView from './components/PurchaseView';
import FinanceView from './components/FinanceView';
import AuditView from './components/AuditView';
import AiAssistantView from './components/AiAssistantView';
import { api } from './services/api';

const DEMO_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Cabang Lahat', address: 'Jl. Mayor Ruslan No. 45, Lahat', phone: '0731-555123' },
  { id: 'b2', name: 'Cabang Pagar Alam', address: 'Jl. Kombes H. Umar No. 102, Pagar Alam', phone: '0730-444567' }
];

export default function App() {
  const [currentBranchId, setCurrentBranchId] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pos_active_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.branchId && u.branchId !== 'all') return u.branchId;
      }
    } catch {}
    return 'b1';
  });
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('pos_is_logged_in') === 'true';
  });
  const [activeUser, setActiveUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_active_user');
      return saved ? JSON.parse(saved) : { id: 'u1', username: 'admin', name: 'Super Admin', role: Role.ADMIN, branchId: 'b1', active: true };
    } catch {
      return { id: 'u1', username: 'admin', name: 'Super Admin', role: Role.ADMIN, branchId: 'b1', active: true };
    }
  });

  const handleLoginSuccess = (user: any) => {
    localStorage.setItem('pos_is_logged_in', 'true');
    localStorage.setItem('pos_active_user', JSON.stringify(user));
    setActiveUser(user);
    setIsLoggedIn(true);
    if (user.branchId && user.branchId !== 'all') {
      setCurrentBranchId(user.branchId);
    }
    
    // Add audit log
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: user.name,
      role: user.role,
      action: `Berhasil Masuk Sistem (Login)`,
      branchId: user.branchId === 'all' ? 'b1' : user.branchId,
      ip: '192.168.10.15'
    };
    api.saveActivityLog(auditLog).then(loadAllData);
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_is_logged_in');
    localStorage.removeItem('pos_active_user');
    setIsLoggedIn(false);
    setCurrentView('dashboard');
    
    // Add audit log
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Keluar Sesi Sistem (Logout)`,
      branchId: currentBranchId,
      ip: '192.168.10.15'
    };
    api.saveActivityLog(auditLog).then(loadAllData);
  };
  
  // App states
  const [isLoading, setIsLoading] = useState(true);
  const [gasDeploymentUrl, setGasDeploymentUrl] = useState('');
  
  // Data pools
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stocks, setStocks] = useState<StockLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [cashflows, setCashflows] = useState<CashFlow[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Critical Low Stock Alerts computing for prompt badges
  const lowStockAlerts = useMemo(() => {
    return products.filter(p => p.branchId === currentBranchId && p.stock <= p.minStock && p.active);
  }, [products, currentBranchId]);

  // Load state and seed data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const data = await api.fetchAllData();
      setProducts(data.products);
      setCustomers(data.customers);
      setSuppliers(data.suppliers);
      setVouchers(data.vouchers);
      setPurchases(data.purchases);
      setStocks(data.stocks);
      setTransactions(data.transactions);
      setTransactionItems(data.transactionItems);
      setCashflows(data.cashflows);
      setActivityLogs(data.activityLogs);
    } catch (err) {
      console.error('Error fetching data pools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let savedUrl = localStorage.getItem('GAS_DEPLOYMENT_URL');
    if (!savedUrl) {
      savedUrl = ((import.meta as any).env.VITE_GAS_DEPLOYMENT_URL as string) || '';
      if (savedUrl) {
        localStorage.setItem('GAS_DEPLOYMENT_URL', savedUrl);
        localStorage.setItem('pos_apps_script_url', savedUrl);
      }
    }
    setGasDeploymentUrl(savedUrl);
    api.setGasUrl(savedUrl);
    loadAllData();
  }, []);

  const handleUpdateGasUrl = (url: string) => {
    setGasDeploymentUrl(url);
    localStorage.setItem('GAS_DEPLOYMENT_URL', url);
    api.setGasUrl(url);
    loadAllData();
  };

  // Switch role simulator helper
  const handleSwitchUserSim = (roleVal: Role) => {
    let name = 'Pak Adi Owner';
    if (roleVal === Role.ADMIN) name = 'Admin Siswo';
    if (roleVal === Role.MANAGER) name = 'Manajer Rani';
    if (roleVal === Role.CASHIER) name = 'Kasir Aisyah';

    const nextUsr = { id: 'usr_' + roleVal, username: roleVal.toLowerCase(), name, role: roleVal, branchId: roleVal === Role.CASHIER ? 'b1' : 'all' };
    setActiveUser(nextUsr);
    localStorage.setItem('pos_active_user', JSON.stringify(nextUsr));

    // Record activity audit logger
    const logItem: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: nextUsr.name,
      role: nextUsr.role,
      action: `Ganti session akun simulator menjadi ${roleVal}`,
      branchId: currentBranchId,
      ip: '192.168.10.15'
    };
    api.saveActivityLog(logItem).then(loadAllData);
  };

  // Transaction checkout
  const handleAddTransaction = async ({ transaction, items }: { transaction: Transaction; items: TransactionItem[] }) => {
    await api.submitCheckoutTrx({ transaction, items });
    
    // Log activity
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Memproses Transaksi Baru ID: ${transaction.id}, Total Final: Rp ${transaction.finalAmount.toLocaleString()}`,
      branchId: currentBranchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Add Product
  const handleAddProduct = async (prod: Product) => {
    await api.addProduct(prod);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Mendaftarkan produk SKU baru "${prod.name}" (SKU: ${prod.sku})`,
      branchId: currentBranchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Update Product
  const handleUpdateProduct = async (prod: Product) => {
    await api.updateProduct(prod);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Mengubah rincian produk SKU "${prod.name}" (SKU: ${prod.sku})`,
      branchId: currentBranchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Delete Product
  const handleDeleteProduct = async (sku: string, branchId: string) => {
    await api.deleteProduct(sku, branchId);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Menonaktifkan produk SKU catalog: ${sku}`,
      branchId: branchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Stock mutation IN/OUT/ADJUST/TRANSFER
  const handleAddStockLog = async (payload: { sku: string; branchId: string; type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'; qty: number; notes: string; user: string }) => {
    await api.submitStockMutation(payload);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Melakukan mutasi stok SKU ${payload.sku} (${payload.type}), Qty: ${payload.qty} pcs. Detail: ${payload.notes}`,
      branchId: payload.branchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Add customer member
  const handleAddCustomer = async (custObj: any) => {
    const nextId = 'CUST-' + Math.floor(1000 + Math.random() * 9000);
    const newCust: Customer = {
      id: nextId,
      name: custObj.name,
      phone: custObj.phone,
      email: custObj.email,
      memberRank: 'REGULAR',
      point: 50,
      notes: custObj.notes || ''
    };
    await api.addCustomer(newCust);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Registrasi Member Pelanggan Baru "${custObj.name}" (ID: ${nextId})`,
      branchId: currentBranchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Add Supplier
  const handleAddSupplier = async (supObj: any) => {
    const nextId = 'SUP-' + Math.floor(100 + Math.random() * 900);
    const newSup: Supplier = {
      id: nextId,
      name: supObj.name,
      contact: supObj.contact,
      phone: supObj.phone,
      address: supObj.address
    };
    await api.addSupplier(newSup);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Mendaftarkan Agen Supplier Baru "${supObj.name}" (ID: ${nextId})`,
      branchId: currentBranchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Purchase Order creation
  const handleAddPurchase = async (po: Purchase) => {
    await api.addPurchase(po);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Merilis dokumen Purchase Order ${po.code} ke Supplier: ${po.supplierName}`,
      branchId: currentBranchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Receive goods from PO
  const handleReceivePurchase = async (id: string, branchId: string) => {
    await api.receivePurchase(id, branchId);
    
    // Find the purchase details for logs
    const po = purchases.find(p => p.id === id);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Memverifikasi penerimaan barang dlm PO ${po ? po.code : id}, memutasi stok naik & saldo kas minus.`,
      branchId: branchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  // Submit cashflow INCOME / EXPENSE
  const handleAddCashflow = async (cfObj: { type: 'INCOME' | 'EXPENSE'; amount: number; notes: string; branchId: string }) => {
    const nextId = 'cf_' + Date.now();
    const newCf: CashFlow = {
      id: nextId,
      type: cfObj.type,
      amount: cfObj.amount,
      description: cfObj.notes,
      category: cfObj.type === 'INCOME' ? 'Pemasukan Manual' : 'Beban Operasional',
      user: activeUser.name,
      date: new Date().toISOString(),
      branchId: cfObj.branchId
    };
    await api.addCashFlow(newCf);
    const auditLog: ActivityLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser.name,
      role: activeUser.role,
      action: `Mencatatkan Mutasi Kas Manual (${cfObj.type}): ${cfObj.notes}, Senilai Rp ${cfObj.amount.toLocaleString()}`,
      branchId: cfObj.branchId,
      ip: '192.168.10.10'
    };
    await api.saveActivityLog(auditLog);
    await loadAllData();
  };

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden" id="pos_app_wrapper">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={currentView}
        setActiveTab={setCurrentView}
        currentUser={{
          id: activeUser.id,
          username: activeUser.username || 'admin',
          name: activeUser.name,
          role: activeUser.role,
          branchId: currentBranchId,
          active: true
        }}
        onLogout={handleLogout}
        notificationsCount={lowStockAlerts.length}
        onOpenNotifications={() => setCurrentView('inventory')}
        activeBranchName={DEMO_BRANCHES.find(b => b.id === currentBranchId)?.name || 'Lahat'}
      />

      {/* Main workspace container panel router */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        
        {/* Superior Status System Header Bar */}
        <header className="h-[60px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
          
          {/* Active branch display */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/60 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cabang Toko Aktif</span>
              <span className="text-xs font-black text-slate-900 block" id="branch_header_name">
                {DEMO_BRANCHES.find(b => b.id === currentBranchId)?.name || currentBranchId}
              </span>
            </div>
          </div>

          {/* Controller Switch simulation panel */}
          <div className="flex items-center gap-4">
            
            {/* Quick alert notifications indicator */}
            {lowStockAlerts.length > 0 && (
              <div 
                onClick={() => setCurrentView('inventory')}
                className="bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] text-amber-700 font-black cursor-pointer animate-pulse hover:bg-amber-100 transition-colors"
                id="header_stock_alert_badge"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Ada {lowStockAlerts.length} Produk Kritis</span>
              </div>
            )}

            {/* Quick simulation mode switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border">
              <span className="text-[9px] text-slate-400 font-bold px-1.5 uppercase">Akses SIM:</span>
              {(['OWNER', 'MANAGER', 'CASHIER'] as const).map(roleOption => (
                <button
                  key={roleOption}
                  onClick={() => handleSwitchUserSim(Role[roleOption as keyof typeof Role])}
                  className={`px-2 py-1 rounded text-[9px] font-black cursor-pointer capitalize transition-all ${activeUser.role === Role[roleOption as keyof typeof Role] ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {roleOption === 'OWNER' ? 'Owner' : roleOption === 'MANAGER' ? 'Manajer' : 'Kasir'}
                </button>
              ))}
            </div>

            {/* User credentials identifier */}
            <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-inner font-black text-xs font-mono">
                {activeUser.name.charAt(0)}
              </div>
              <div className="hidden md:block">
                <span className="text-[11px] font-bold text-slate-800 block truncate max-w-[120px]">{activeUser.name}</span>
                <span className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-500 font-bold uppercase tracking-widest">{activeUser.role}</span>
              </div>
            </div>

          </div>

        </header>

        {/* Routed dynamic body */}
        <div className="flex-grow overflow-hidden flex flex-col position-relative h-full">
          {isLoading ? (
            <div className="flex-1 flex flex-col justify-center items-center text-xs text-slate-400 bg-slate-50 font-bold gap-3">
              <RefreshCw className="w-10 h-10 text-teal-500 animate-spin" />
              <p>Mempersiapkan basis data Sajian Indy dari Google Sheets Cloud...</p>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  transactions={transactions}
                  products={products}
                  cashflows={cashflows}
                  branches={DEMO_BRANCHES}
                  activeBranchId={currentBranchId}
                  setActiveBranchId={setCurrentBranchId}
                  onNavigateToTab={setCurrentView}
                />
              )}

              {currentView === 'cashier' && (
                <CashierView
                  products={products}
                  customers={customers}
                  vouchers={vouchers}
                  onAddTransaction={handleAddTransaction}
                  currentBranchId={currentBranchId}
                  activeCashier={{ id: activeUser.id, name: activeUser.name }}
                />
              )}

              {currentView === 'products' && (
                <ProductView
                  products={products}
                  currentBranchId={currentBranchId}
                  currentUserRole={activeUser.role}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}

              {currentView === 'inventory' && (
                <InventoryView
                  stocks={stocks}
                  products={products}
                  branches={DEMO_BRANCHES}
                  activeBranchId={currentBranchId}
                  onAddStockLog={handleAddStockLog}
                  activeUser={{ id: activeUser.id, name: activeUser.name }}
                />
              )}

              {currentView === 'customers' && (
                <CustomerSupplierView
                  customers={customers}
                  suppliers={suppliers}
                  onAddCustomer={handleAddCustomer}
                  onAddSupplier={handleAddSupplier}
                />
              )}

              {currentView === 'purchases' && (
                <PurchaseView
                  purchases={purchases}
                  suppliers={suppliers}
                  products={products}
                  currentBranchId={currentBranchId}
                  onAddPurchase={handleAddPurchase}
                  onReceivePurchase={handleReceivePurchase}
                />
              )}

              {currentView === 'finance' && (
                <FinanceView
                  cashflows={cashflows}
                  transactions={transactions}
                  transactionItems={transactionItems}
                  products={products}
                  currentBranchId={currentBranchId}
                  onAddCashflow={handleAddCashflow}
                />
              )}

              {currentView === 'audit' && (
                <AuditView
                  logs={activityLogs}
                  gasDeploymentUrl={gasDeploymentUrl}
                  onUpdateGasUrl={handleUpdateGasUrl}
                  onRefreshData={loadAllData}
                />
              )}

              {currentView === 'ai-assistant' && (
                <AiAssistantView
                  products={products}
                  transactions={transactions}
                  cashflows={cashflows}
                  currentBranchId={currentBranchId}
                />
              )}
            </>
          )}
        </div>

      </div>

    </div>
  );
}
