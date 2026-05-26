import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Users, 
  Truck, 
  Receipt, 
  Wallet, 
  Sparkles, 
  FileLock, 
  Settings, 
  LogOut,
  ChevronRight,
  User as UserIcon,
  Bell
} from 'lucide-react';
import { Role, User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
  activeBranchName: string;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  notificationsCount,
  onOpenNotifications,
  activeBranchName
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.OWNER, Role.MANAGER, Role.ADMIN, Role.CASHIER] },
    { id: 'cashier', label: 'Kasir Penjualan', icon: ShoppingCart, roles: [Role.OWNER, Role.MANAGER, Role.ADMIN, Role.CASHIER] },
    { id: 'products', label: 'Kelola Produk', icon: Package, roles: [Role.OWNER, Role.MANAGER, Role.ADMIN] },
    { id: 'inventory', label: 'Stok & Log Mutasi', icon: History, roles: [Role.OWNER, Role.MANAGER, Role.ADMIN] },
    { id: 'customers', label: 'Mitra & Member', icon: Users, roles: [Role.OWNER, Role.MANAGER, Role.ADMIN, Role.CASHIER] },
    { id: 'purchases', label: 'Pembelian (PO)', icon: Truck, roles: [Role.OWNER, Role.MANAGER, Role.ADMIN] },
    { id: 'finance', label: 'Keuangan & Kas', icon: Wallet, roles: [Role.OWNER, Role.MANAGER] },
    { id: 'ai-assistant', label: 'Analitik AI Gemini', icon: Sparkles, roles: [Role.OWNER, Role.MANAGER, Role.ADMIN, Role.CASHIER] },
    { id: 'audit', label: 'Database Sheet & Audit', icon: FileLock, roles: [Role.OWNER, Role.ADMIN] },
  ];

  const allowedItems = menuItems.filter(item => 
    currentUser && currentUser.role && item.roles.includes(currentUser.role)
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full shrink-0 border-r border-slate-800 shadow-xl" id="pos_sidebar">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            SAJIAN INDY
          </h1>
          <p className="text-[10px] text-teal-400 font-mono mt-0.5 uppercase tracking-wide">
            {localStorage.getItem('pos_apps_script_url') ? 'Google Sheets Cloud' : 'Server JSON Database'}
          </p>
        </div>
        
        {/* Branch Info Badge */}
        <div className="flex items-center relative">
          <button 
            onClick={onOpenNotifications}
            className="p-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 relative transition-colors cursor-pointer"
            title="Notifikasi"
            id="notif_bell_btn"
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-[10px] text-white font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {notificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cabang Badge Area */}
      <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/40 flex items-center justify-between text-xs">
        <span className="text-slate-500">Cabang Aktif:</span>
        <span className="text-teal-400 font-medium truncate max-w-[130px]">{activeBranchName}</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group cursor-pointer ${
                isActive 
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              id={`sidebar_link_${item.id}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-white" />}
            </button>
          );
        })}
      </nav>

      {/* Active User Panel */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-teal-400 font-bold shrink-0">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold truncate text-slate-200">{currentUser.name}</h2>
            <p className="text-xs text-slate-500 capitalize">{currentUser.role.toLowerCase()}</p>
          </div>
        </div>
        
        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-lg transition-all cursor-pointer"
          id="btn_logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
