import React, { useState, useMemo } from 'react';
import { 
  History, 
  Plus, 
  ArrowRightLeft, 
  ArrowUp, 
  ArrowDown, 
  Sliders, 
  CheckCircle,
  Truck,
  User,
  Package,
  Calendar,
  X
} from 'lucide-react';
import { StockLog, Product, Branch } from '../types';

interface InventoryViewProps {
  stocks: StockLog[];
  products: Product[];
  branches: Branch[];
  activeBranchId: string;
  onAddStockLog: (payload: { sku: string; branchId: string; type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'; qty: number; notes: string; user: string }) => Promise<void>;
  activeUser: { id: string; name: string };
}

export default function InventoryView({
  stocks,
  products,
  branches,
  activeBranchId,
  onAddStockLog,
  activeUser
}: InventoryViewProps) {
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mutationType, setMutationType] = useState<'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'>('IN');
  
  // Form fields
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [destinationBranchId, setDestinationBranchId] = useState('');

  // Settle active branch products
  const branchProducts = useMemo(() => {
    return products.filter(p => p.branchId === activeBranchId && p.active);
  }, [products, activeBranchId]);

  // Settle stocks log list for the active branch
  const filteredStocks = useMemo(() => {
    return stocks
      .filter(s => s.branchId === activeBranchId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stocks, activeBranchId]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || qty <= 0) return;

    try {
      const selectedProduct = branchProducts.find(p => p.sku === sku);
      if (!selectedProduct) return;

      if (mutationType === 'OUT' && selectedProduct.stock < qty) {
        alert(`Stok hanya sisa ${selectedProduct.stock} unit. Jumlah mutasi pengurangan melebihi sisa.`);
        return;
      }

      if (mutationType === 'TRANSFER') {
        if (!destinationBranchId) {
          alert('Harap pilih cabang tujuan transfer.');
          return;
        }
        if (destinationBranchId === activeBranchId) {
          alert('Cabang tujuan tidak boleh sama dengan cabang aktif.');
          return;
        }
        if (selectedProduct.stock < qty) {
          alert(`Stok tidak mencukupi untuk transfer. Sisa stok: ${selectedProduct.stock}`);
          return;
        }

        // Processing Transfer
        // 1. Deduct from active branch (OUT)
        await onAddStockLog({
          sku,
          branchId: activeBranchId,
          type: 'OUT',
          qty,
          notes: `Transfer Keluar ke Cabang: ${branches.find(b => b.id === destinationBranchId)?.name || destinationBranchId}. Detail: ${notes}`,
          user: activeUser.name
        });

        // 2. Add as IN to destination branch
        // Note: GAS Backend supports multi branch. We register it on destination branch.
        await onAddStockLog({
          sku,
          branchId: destinationBranchId,
          type: 'IN',
          qty,
          notes: `Transfer Masuk dari Cabang: ${branches.find(b => b.id === activeBranchId)?.name || activeBranchId}. Detail: ${notes}`,
          user: activeUser.name
        });

        alert('Transfer stok antar cabang berhasil dijalankan.');
      } else {
        // Standard in/out/adjust mutation
        await onAddStockLog({
          sku,
          branchId: activeBranchId,
          type: mutationType,
          qty,
          notes: notes || `Mutasi manual ${mutationType}`,
          user: activeUser.name
        });
      }

      setIsModalOpen(false);
      setSku('');
      setQty(10);
      setNotes('');
    } catch(err: any) {
      alert('Gagal menyinkronkan stok mutasi: ' + err.message);
    }
  };

  return (
    <div className="flex-grow overflow-y-auto p-6 bg-slate-50 text-slate-800 space-y-6" id="inventory_view_container">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <span>Riwayat Mutasi & Opname Stok</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Audit log mutasi produk masuk, keluar, transfer antar toko, dan penyesuaian opname manual.</p>
        </div>

        <button
          onClick={() => {
            setMutationType('IN');
            if (branchProducts.length > 0) setSku(branchProducts[0].sku);
            setIsModalOpen(true);
          }}
          disabled={branchProducts.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 border border-teal-500 text-white shadow-md disabled:opacity-55 cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
          <span>Sesuaikan Stok Gg</span>
        </button>
      </div>

      {/* Grid summarizing stock metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ArrowUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Mutasi Masuk</span>
            <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
              {stocks.filter(s => s.branchId === activeBranchId && s.type === 'IN').reduce((sum, s) => sum + s.qty, 0)} Pcs
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Mutasi Keluar</span>
            <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
              {stocks.filter(s => s.branchId === activeBranchId && s.type === 'OUT').reduce((sum, s) => sum + s.qty, 0)} Pcs
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Model SKU Aktif</span>
            <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
              {products.filter(p => p.branchId === activeBranchId).length} SKU
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Stok Level Sehat</span>
            <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">
              {products.filter(p => p.branchId === activeBranchId && p.stock > p.minStock).length} SKU
            </span>
          </div>
        </div>

      </div>

      {/* Audit Log Table list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="stock_logs_table_card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Kronologi Mutasi Inventaris</h2>
          <span className="text-slate-400 text-xs font-mono">Tabel Log Sheets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <th className="p-4">Tanggal / Waktu</th>
                <th className="p-4">SKU Produk</th>
                <th className="p-4">Jenis Mutasi</th>
                <th className="p-4 text-center">Jumlah Kuantitas</th>
                <th className="p-4">Keterangan / Deskripsi Sesi</th>
                <th className="p-4">Penanggung Jawab</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {filteredStocks.length > 0 ? (
                filteredStocks.map((s, idx) => {
                  const matchingProd = products.find(p => p.sku === s.sku && p.branchId === activeBranchId);
                  return (
                    <tr key={s.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      {/* Date details */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(s.date).toLocaleString('id-ID')}</span>
                        </div>
                      </td>

                      {/* sku item */}
                      <td className="p-4">
                        <span className="font-bold text-slate-950 font-mono block">{s.sku}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium truncate max-w-[150px]">
                          {matchingProd ? matchingProd.name : 'Produk Tidak Terdaftar'}
                        </span>
                      </td>

                      {/* mutation badge indicator */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide border uppercase ${
                          s.type === 'IN' ? 'bg-teal-50 border-teal-200 text-teal-600' :
                          s.type === 'OUT' ? 'bg-rose-50 border-rose-200 text-rose-500' :
                          s.type === 'ADJUST' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                          'bg-indigo-50 border-indigo-200 text-indigo-600'
                        }`}>
                          {s.type === 'IN' ? 'Masuk' : s.type === 'OUT' ? 'Keluar' : s.type === 'ADJUST' ? 'Opname' : 'Transfer'}
                        </span>
                      </td>

                      {/* quantity mutated details */}
                      <td className="p-4 text-center font-mono font-bold text-slate-900 text-xs">
                        {s.type === 'OUT' ? '-' : '+'}{s.qty} pcs
                      </td>

                      {/* explanation notes */}
                      <td className="p-4 text-slate-500 max-w-xs truncate" title={s.notes}>
                        {s.notes}
                      </td>

                      {/* PIC initials user */}
                      <td className="p-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-700 font-semibold">{s.user}</span>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat pergerakan stok terekam di sistem.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: Stock Mutation Form */}
      {isModalOpen && branchProducts.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleFormSubmit}
            className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 animate-in fade-in-50 zoom-in-95 shadow-2xl border border-slate-100"
          >
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase">Input Penyesuaian Stok</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector process type */}
            <div className="grid grid-cols-4 gap-1 border rounded-lg p-1 bg-slate-50 border-slate-200">
              {(['IN', 'OUT', 'ADJUST', 'TRANSFER'] as const).map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setMutationType(type);
                    if (type === 'TRANSFER' && branches.length > 1) {
                      const dest = branches.find(b => b.id !== activeBranchId);
                      setDestinationBranchId(dest?.id || '');
                    }
                  }}
                  className={`py-1 rounded text-[10px] font-bold cursor-pointer uppercase ${mutationType === type ? 'bg-indigo-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {type === 'IN' ? 'Masuk' : type === 'OUT' ? 'Keluar' : type === 'ADJUST' ? 'Opname' : 'Utus'}
                </button>
              ))}
            </div>

            {/* Select product */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Pilih Produk SKU</label>
              <select
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 cursor-pointer"
                required
              >
                <option value="">-- Pilih SKU Produk --</option>
                {branchProducts.map(p => (
                  <option key={p.sku} value={p.sku}>{p.name} (Stok: {p.stock} pcs)</option>
                ))}
              </select>
            </div>

            {/* Destination branch required only if transfer model */}
            {mutationType === 'TRANSFER' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Cabang Toko Tujuan</label>
                <select
                  value={destinationBranchId}
                  onChange={(e) => setDestinationBranchId(e.target.value)}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Cabang Penerima --</option>
                  {branches.filter(b => b.id !== activeBranchId).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Qty field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Jumlah Kuantitas (Pcs)</label>
              <input
                type="number"
                value={qty || ''}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                required
              />
            </div>

            {/* Explanatory notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Justifikasi / Keterangan Penyesuaian</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Beli dari agen makmur, roti rusak kadaluarsa, stock opname bulanan..."
                className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 h-16 resize-none"
                required
              />
            </div>

            {/* Form actions */}
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
                Simpan Mutasi
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
