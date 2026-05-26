import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Plus, 
  X, 
  Calendar, 
  PlusCircle, 
  FileSpreadsheet,
  Layers,
  HelpCircle
} from 'lucide-react';
import { CashFlow, Product, Transaction, TransactionItem } from '../types';

interface FinanceViewProps {
  cashflows: CashFlow[];
  transactions: Transaction[];
  transactionItems: TransactionItem[];
  products: Product[];
  currentBranchId: string;
  onAddCashflow: (cfObject: { type: 'INCOME' | 'EXPENSE'; amount: number; notes: string; branchId: string }) => Promise<void>;
}

export default function FinanceView({
  cashflows,
  transactions,
  transactionItems,
  products,
  currentBranchId,
  onAddCashflow
}: FinanceViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Settle cashflows for active branch
  const filteredCashflows = useMemo(() => {
    return cashflows
      .filter(cf => cf.branchId === currentBranchId)
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [cashflows, currentBranchId]);

  // Compute balance
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    filteredCashflows.forEach(cf => {
      if (cf.type === 'INCOME') income += cf.amount;
      else expense += cf.amount;
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      netCash: income - expense
    };
  }, [filteredCashflows]);

  // Calculate Profit and Loss (Laba Rugi)
  const profitAndLoss = useMemo(() => {
    // 1. Total Revenue (Omset Jual Bersih) dari Transaksi Sukses untuk cabang aktif
    const branchTrx = transactions.filter(t => t.branchId === currentBranchId);
    const revenue = branchTrx.reduce((sum, t) => sum + t.finalAmount, 0);

    // 2. COGS (HPP - Harga Pokok Penjualan)
    // Hitung total buyPrice * qty dari seluruh item transaksi cabang aktif
    let cogs = 0;
    branchTrx.forEach(t => {
      const items = transactionItems.filter(it => it.transactionId === t.id);
      items.forEach(it => {
        const matchingProd = products.find(p => p.sku === it.sku && p.branchId === currentBranchId);
        const singleBuyPrice = matchingProd ? matchingProd.buyPrice : (it.price * 0.6); // default fallback
        cogs += singleBuyPrice * it.qty;
      });
    });

    // Gross profit margin
    const grossProfit = Math.max(0, revenue - cogs);

    // 3. Operational Expenses (Pengeluaran manual kasir, gaji, dll)
    const operationalExpenses = filteredCashflows
      .filter(cf => cf.type === 'EXPENSE' && !(cf.notes || cf.description || '').includes('Belanja PO'))
      .reduce((sum, cf) => sum + cf.amount, 0);

    // Net profit
    const netProfit = grossProfit - operationalExpenses;

    return {
      revenue,
      cogs,
      grossProfit,
      operationalExpenses,
      netProfit
    };
  }, [transactions, transactionItems, products, filteredCashflows, currentBranchId]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !notes) return;

    try {
      await onAddCashflow({
        type,
        amount,
        notes,
        branchId: currentBranchId
      });
      setIsModalOpen(false);
      setAmount(0);
      setNotes('');
    } catch(err: any) {
      alert('Gagal menambahkan arus kas: ' + err.message);
    }
  };

  return (
    <div className="flex-grow overflow-y-auto p-6 bg-slate-50 text-slate-800 space-y-6" id="finance_view_container">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <span>Manajemen Keuangan & Arus Kas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Audit mutasi kas harian, input beban operasional, serta laporan real-time Laba Rugi (P&L).</p>
        </div>

        <button
          onClick={() => {
            setType('EXPENSE');
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 border border-teal-500 text-white shadow-md cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Rekam Arus Kas Manual</span>
        </button>
      </div>

      {/* Mini ledger summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Arus Masuk (Tunai/QRIS)</span>
            <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
              Rp{metrics.totalIncome.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Arus Keluar (Operasional/PO)</span>
            <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
              Rp{metrics.totalExpense.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Kas Cabang Terkini</span>
            <span className={`text-lg font-black font-mono block mt-0.5 ${metrics.netCash >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>
              Rp{metrics.netCash.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* Grid: Split Laba Rugi real-time report & manual logs table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Real-time Profit & Loss Statement (P&L Card) */}
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 space-y-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-teal-400">Statement Laba Rugi (P&L)</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Ringkasan laba bersih real-time dari sirkulasi barang.</p>
          </div>

          <div className="border-b border-slate-800/80 my-3"></div>

          <div className="space-y-3.5 text-xs">
            
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400">Total Pendapatan Jual Jual Jual (Revenue/Omset)</span>
              <span className="font-mono font-bold text-slate-100 text-sm">Rp{profitAndLoss.revenue.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400">Harga Pokok Pembelian (HPP/COGS)</span>
              <span className="font-mono font-bold text-rose-400">Rp{profitAndLoss.cogs.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-800 pt-3">
              <span className="text-slate-300 font-bold">LABA KOTOR (Gross Profit)</span>
              <span className="font-mono font-extrabold text-teal-400 text-sm">Rp{profitAndLoss.grossProfit.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400">Beban Beban Operasional Manual</span>
              <span className="font-mono font-bold text-rose-400">Rp{profitAndLoss.operationalExpenses.toLocaleString()}</span>
            </div>

            <div className="border-t border-slate-800/80 my-3"></div>

            <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest block">Laba Bersih Terkirim</span>
                <span className="text-lg font-black font-mono block mt-1 text-teal-300">
                  Rp{profitAndLoss.netProfit.toLocaleString()}
                </span>
              </div>
              <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded font-black">
                {profitAndLoss.revenue > 0 ? `${((profitAndLoss.netProfit / profitAndLoss.revenue) * 100).toFixed(1)}% Margin` : '0%'}
              </span>
            </div>

          </div>
        </div>

        {/* Cashflow Log Table list */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-slate-900">Histori Arus Kas Keuangan</h2>
            <span className="text-slate-400 text-[10px] font-mono tracking-widest uppercase">Sheets Ledger</span>
          </div>

          <div className="overflow-y-auto max-h-[360px] flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Tanggal / Mutasi</th>
                  <th className="p-4">Alur</th>
                  <th className="p-4">Jumlah Dana</th>
                  <th className="p-4">Deskripsi Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filteredCashflows.length > 0 ? (
                  filteredCashflows.map((cf) => (
                    <tr key={cf.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(cf.date).toLocaleString('id-ID')}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                          cf.type === 'INCOME' ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-rose-50 border-rose-200 text-rose-500'
                        }`}>
                          {cf.type === 'INCOME' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-900">
                        {cf.type === 'INCOME' ? '+' : '-'}Rp{cf.amount.toLocaleString()}
                      </td>

                      <td className="p-4 text-slate-500 max-w-xs truncate" title={cf.notes || cf.description || ''}>
                        {cf.notes || cf.description || ''}
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                      Belum ada mutasi kas terekam.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* POPUP MODAL: Add cashflow manual */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleFormSubmit}
            className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 animate-in fade-in-50 zoom-in-95 shadow-2xl border border-slate-100"
          >
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase font-sans">Input Data Arus Kas Manual</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select type INCOME / EXPENSE */}
            <div className="grid grid-cols-2 gap-2 border rounded-xl p-1 bg-slate-50 border-slate-200">
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer uppercase ${type === 'INCOME' ? 'bg-teal-500 text-white shadow-xs' : 'text-slate-500'}`}
              >
                Pemasukan Keuangan
              </button>
              
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer uppercase ${type === 'EXPENSE' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'}`}
              >
                Pengeluaran Keuangan
              </button>
            </div>

            {/* Amount input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Jumlah Nominal Mutasi (Rp)</label>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                required
              />
            </div>

            {/* Notes description */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Peruntukan / Keterangan Arus Kas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Pemasukan modal awal, bayar servis mesin espresso, ganti bohlam listrik, dll..."
                className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 h-20 resize-none"
                required
              />
            </div>

            {/* Actions panel */}
            <div className="border-t pt-3 border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                Batalkan
              </button>
              
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md cursor-pointer"
              >
                Simpan Transaksi
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
