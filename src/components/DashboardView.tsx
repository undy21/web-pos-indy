import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Store,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { Transaction, Product, CashFlow, StockLog, Branch } from '../types';

interface DashboardViewProps {
  transactions: Transaction[];
  products: Product[];
  cashflows: CashFlow[];
  branches: Branch[];
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({
  transactions,
  products,
  cashflows,
  branches,
  activeBranchId,
  setActiveBranchId,
  onNavigateToTab
}: DashboardViewProps) {
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'month' | 'all'>('all');

  // Filtered dataset based on branch context
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => activeBranchId === 'all' || t.branchId === activeBranchId);
  }, [transactions, activeBranchId]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => activeBranchId === 'all' || p.branchId === activeBranchId);
  }, [products, activeBranchId]);

  const filteredCashflows = useMemo(() => {
    return cashflows.filter(cf => activeBranchId === 'all' || cf.branchId === activeBranchId);
  }, [cashflows, activeBranchId]);

  // Compute Core Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    
    // Total Revenue
    let totalRevenue = 0;
    let todayRevenue = 0;
    filteredTransactions.forEach(t => {
      totalRevenue += t.finalAmount;
      if (t.date.startsWith(todayStr)) {
        todayRevenue += t.finalAmount;
      }
    });

    // Low Stock Alert
    const lowStockItems = filteredProducts.filter(p => p.stock <= p.minStock);
    
    // Cash balance estimation from cashflows
    let netCash = 0;
    filteredCashflows.forEach(cf => {
      if (cf.type === 'INCOME') netCash += cf.amount;
      else netCash -= cf.amount;
    });

    // Transactions counts
    const todayTransactionsCount = filteredTransactions.filter(t => t.date.startsWith(todayStr)).length;

    return {
      totalRevenue,
      todayRevenue,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      netCash,
      todayTransactionsCount,
      totalTransactionsCount: filteredTransactions.length
    };
  }, [filteredTransactions, filteredProducts, filteredCashflows]);

  // Compute category sales distribution for visualization
  const categoryChartData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredProducts.forEach(p => {
      cats[p.category] = (cats[p.category] || 0) + p.stock;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).slice(0, 5);
  }, [filteredProducts]);

  // Daily revenue data for custom SVG Line/Area chart
  const revenueChartData = useMemo(() => {
    const map: Record<string, number> = {};
    // Last 7 days template entries
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().substring(0, 10);
      map[key] = 0;
    }

    filteredTransactions.forEach(t => {
      const dateKey = t.date.substring(0, 10);
      if (map[dateKey] !== undefined) {
        map[dateKey] += t.finalAmount;
      }
    });

    return Object.entries(map).map(([date, revenue]) => {
      const dayName = new Date(date).toLocaleDateString('id-ID', { weekday: 'short' });
      return { label: dayName, date, amount: revenue };
    });
  }, [filteredTransactions]);

  const maxRevenueInChart = useMemo(() => {
    const maxVal = Math.max(...revenueChartData.map(d => d.amount), 50000);
    return Math.ceil(maxVal / 10000) * 10000;
  }, [revenueChartData]);

  // Top selling products simulation
  const topProducts = useMemo(() => {
    return filteredProducts
      .filter(p => p.stock < 100) // simulated high velocity items
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4);
  }, [filteredProducts]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-slate-800 space-y-6" id="dashboard_view_container">
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ringkasan Eksekutif</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis data POS real-time tersinkronisasi langsung ke Google Sheets.
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex items-center gap-3">
          {/* Branch filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-1.5 gap-2">
            <Store className="w-4 h-4 text-slate-400" />
            <select
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none text-slate-700 focus:outline-none focus:ring-0 cursor-pointer"
              id="branch_select"
            >
              <option value="all">Semua Cabang (Konsolidasi)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => onNavigateToTab('ai-assistant')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md shadow-teal-500/10 hover:shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Minta Saran AI</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Today omzet */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full -mr-8 -mt-8 -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Omzet Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              Rp {metrics.todayRevenue.toLocaleString('id-ID')}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-teal-600 mt-1.5 font-semibold">
              <ArrowUpRight className="w-3 h-3" />
              <span>+14.5% vs kemarin</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Today Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 rounded-full -mr-8 -mt-8 -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Transaksi Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {metrics.todayTransactionsCount} <span className="text-sm font-normal text-slate-400">Trx</span>
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-cyan-600 mt-1.5 font-semibold">
              <CheckCircle className="w-3 h-3" />
              <span>Selesai diproses kasir</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Low stock warning */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Stok Kritis</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${metrics.lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold tracking-tight font-mono ${metrics.lowStockCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
              {metrics.lowStockCount} <span className="text-sm font-normal text-slate-400">SKU</span>
            </h3>
            <div className="flex items-center gap-1 text-[11px] mt-1.5 font-semibold text-slate-500">
              {metrics.lowStockCount > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-500 animate-bounce" />
                  <span className="text-rose-500">Butuh restock order cepat</span>
                </>
              ) : (
                <span>Level inventaris aman</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 4: Cash drawer balance estimation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Pembukuan Kas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              Rp {metrics.netCash.toLocaleString('id-ID')}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-1.5 font-semibold">
              <ArrowUpRight className="w-3 h-3" />
              <span>Arus kas bersih aktif</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Charts & Visualizations Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Revenue Line/Area Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tren Pendapatan Mingguan</h2>
              <p className="text-xs text-slate-500">Ringkasan transaksi bersih dalam 7 hari terakhir</p>
            </div>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              <span>Penjualan</span>
            </div>
          </div>

          {/* Bespoke Responsive SVG Chart Line */}
          <div className="w-full h-64 pt-4 relative">
            <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 20 + 180 * ratio;
                const valueLabel = maxRevenueInChart * (1 - ratio);
                return (
                  <g key={idx} className="opacity-40">
                    <line x1="45" y1={y} x2="580" y2={y} stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1" />
                    <text x="5" y={y + 4} fill="#64748b" className="text-[10px] font-mono font-medium">
                      Rp{Math.round(valueLabel / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* Chart Line Path Compute */}
              {(() => {
                const stepX = 535 / 6;
                const points = revenueChartData.map((d, idx) => {
                  const x = 50 + idx * stepX;
                  const ratio = maxRevenueInChart > 0 ? d.amount / maxRevenueInChart : 0;
                  const y = 200 - 180 * ratio;
                  return { x, y, amount: d.amount, label: d.label };
                });

                const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPath = points.length > 0 
                  ? `${linePath} L ${points[points.length-1].x} 200 L ${points[0].x} 200 Z` 
                  : '';

                return (
                  <>
                    {/* Area fill */}
                    {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}
                    {/* Main path stroke line */}
                    {linePath && <path d={linePath} fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                    
                    {/* Connecting node circles & Tooltips */}
                    {points.map((p, idx) => (
                      <g key={idx} className="group/node hover:scale-105 transition-transform duration-200">
                        {/* Ring outside */}
                        <circle cx={p.x} cy={p.y} r="6" fill="#ffffff" stroke="#14b8a6" strokeWidth="2" className="cursor-pointer shadow-sm" />
                        {/* Dot inside */}
                        <circle cx={p.x} cy={p.y} r="3" fill="#0d9488" />
                        
                        {/* Label name on bottom */}
                        <text x={p.x} y="222" fill="#475569" className="text-[10px] font-medium" textAnchor="middle">
                          {p.label}
                        </text>

                        {/* Miniature responsive tooltip */}
                        <g className="opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none duration-150">
                          <rect x={p.x - 45} y={p.y - 36} width="90" height="24" rx="6" fill="#0f172a" />
                          <text x={p.x} y={p.y - 20} fill="#ffffff" className="text-[10px] font-bold font-mono" textAnchor="middle">
                            Rp{p.amount.toLocaleString('id-ID')}
                          </text>
                        </g>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Category Share Distribution doughnut summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Distribusi Kategori</h2>
            <p className="text-xs text-slate-500 mb-4">Proporsi item terbanyak berdasarkan sisa stok</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4 space-y-4">
            {categoryChartData.length > 0 ? (
              <>
                {/* SVG Mini Donut Chart */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {(() => {
                      const totalQty = categoryChartData.reduce((sum, c) => sum + c.value, 0);
                      let cumulativePercent = 0;
                      const colors = ['#0d9488', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899'];
                      
                      return categoryChartData.map((c, idx) => {
                        const percent = (c.value / totalQty) * 100;
                        const arcLength = (percent / 100) * 100; // representing stroke dasharray relative to stroke length
                        const offset = (cumulativePercent / 100) * 100;
                        cumulativePercent += percent;
                        
                        return (
                          <circle
                            key={idx}
                            cx="20"
                            cy="20"
                            r="15.915"
                            viewBox="0 0 40 40"
                            fill="transparent"
                            stroke={colors[idx % colors.length]}
                            strokeWidth="4"
                            strokeDasharray={`${arcLength} ${100 - arcLength}`}
                            strokeDashoffset={-offset}
                            className="transition-all hover:stroke-[5] cursor-pointer"
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Inside hole summary */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Total Stok</span>
                    <span className="text-lg font-bold text-slate-800 font-mono">
                      {categoryChartData.reduce((sum, c) => sum + c.value, 0)}
                    </span>
                  </div>
                </div>

                {/* Legend list indicators */}
                <div className="w-full space-y-1.5 pt-2">
                  {categoryChartData.map((c, idx) => {
                    const colors = ['bg-teal-600', 'bg-cyan-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500'];
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`}></span>
                          <span className="text-slate-600 truncate max-w-[120px]">{c.name}</span>
                        </div>
                        <span className="text-slate-900 font-bold font-mono">{c.value} Porsi</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-2">
                <Store className="w-8 h-8 text-slate-300" />
                <span>Belum ada data inventaris untuk dianalisis.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Under Section: Low stocks alarm & Cashiers tracker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left column: Stocks Menipis List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="text-rose-500 w-4 h-4 animate-pulse" />
                <span>Status Stok Menipis ({metrics.lowStockCount})</span>
              </h2>
              <p className="text-xs text-slate-500">Mencapai batas minimum level inventaris toko</p>
            </div>
            
            <button 
              onClick={() => onNavigateToTab('inventory')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
            >
              Kelola Stok →
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {metrics.lowStockItems.length > 0 ? (
              metrics.lowStockItems.slice(0, 4).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100 hover:bg-rose-50 transition-colors">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase bg-white px-1.5 py-0.5 rounded border border-slate-100 mt-1 inline-block">
                      {p.sku}
                    </span>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-rose-500 font-bold block">Sisa {p.stock} porsi</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Min level: {p.minStock}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-center gap-2 text-slate-400">
                <CheckCircle className="w-8 h-8 text-teal-400" />
                <p className="text-xs font-medium">Hebat! Semua stok terkelola dengan aman.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Recent logs & activity log preview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-slate-500 w-4 h-4" />
                <span>Transaksi Penjualan Terbaru</span>
              </h2>
              <p className="text-xs text-slate-500">Dua pesanan terakhir yang diproses kasir</p>
            </div>
            
            <button 
              onClick={() => onNavigateToTab('cashier')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
            >
              Lihat Kasir →
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.slice(0, 2).map((t, idx) => (
                <div key={idx} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 font-extrabold text-[10px] font-mono">
                      TX
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 font-mono truncate">{t.id}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1 rounded uppercase">
                          {t.paymentMethod}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Diproses oleh <span className="font-semibold text-slate-600">{t.cashierName}</span> • {new Date(t.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block font-mono">
                      Rp {t.finalAmount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-teal-500 font-semibold block mt-0.5">Berhasil</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-center gap-2 text-slate-400">
                <Store className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-medium">Belum ada transaksi apa pun hari ini.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
