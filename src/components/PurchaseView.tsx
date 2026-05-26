import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  PlusSquare,
  Trash2
} from 'lucide-react';
import { Purchase, Supplier, Product } from '../types';

interface PurchaseViewProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  currentBranchId: string;
  onAddPurchase: (purchaseObj: Purchase) => Promise<void>;
  onReceivePurchase: (id: string, branchId: string) => Promise<void>;
}

export default function PurchaseView({
  purchases,
  suppliers,
  products,
  currentBranchId,
  onAddPurchase,
  onReceivePurchase
}: PurchaseViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  
  // Custom multi-item builder inside PO
  const [poItems, setPoItems] = useState<Array<{ sku: string; qty: number; buyPrice: number }>>([]);
  const [itemSku, setItemSku] = useState('');
  const [itemQty, setItemQty] = useState(10);
  const [itemBuyPrice, setItemBuyPrice] = useState(5000);

  const filteredPurchases = useMemo(() => {
    return purchases
      .filter(p => p.branchId === currentBranchId)
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [purchases, currentBranchId]);

  const branchProducts = useMemo(() => {
    return products.filter(p => p.branchId === currentBranchId && p.active);
  }, [products, currentBranchId]);

  const handleAddItemToPo = () => {
    if (!itemSku || itemQty <= 0) return;
    const existing = poItems.find(it => it.sku === itemSku);
    if (existing) {
      setPoItems(prev => prev.map(it => it.sku === itemSku ? { ...it, qty: it.qty + itemQty } : it));
    } else {
      setPoItems(prev => [...prev, { sku: itemSku, qty: itemQty, buyPrice: itemBuyPrice }]);
    }
  };

  const handleRemoveItemFromPo = (skuStr: string) => {
    setPoItems(prev => prev.filter(it => it.sku !== skuStr));
  };

  const totals = useMemo(() => {
    return poItems.reduce((sum, item) => sum + (item.buyPrice * item.qty), 0);
  }, [poItems]);

  const handleCreatePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || poItems.length === 0) {
      alert('Harap lengkapi data supplier dan minimal masukkan 1 item PO.');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    try {
      const code = 'PO-' + new Date().toISOString().substring(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
      const nextId = 'pur_' + Date.now();
      
      const payload: Purchase = {
        id: nextId,
        code,
        supplierId,
        supplierName: supplier.name,
        date: new Date().toISOString().substring(0, 10),
        totalAmount: totals,
        status: 'PENDING',
        branchId: currentBranchId,
        items: poItems.map(it => {
          const matchingProd = products.find(p => p.sku === it.sku && p.branchId === currentBranchId);
          return {
            sku: it.sku,
            productName: matchingProd?.name || 'Produk Tidak Terdaftar',
            qty: it.qty,
            buyPrice: it.buyPrice
          };
        })
      };

      await onAddPurchase(payload);
      setIsModalOpen(false);
      setSupplierId('');
      setPoItems([]);
    } catch(err: any) {
      alert('Gagal merekam Purchase Order: ' + err.message);
    }
  };

  const handleReceiveGoods = async (id: string) => {
    if (confirm('Konfirmasi penerimaan barang? Tindakan ini akan menambah stok produk aktif dan memotong saldo kas keuangan cabang.')) {
      try {
        await onReceivePurchase(id, currentBranchId);
        alert('Penerimaan PO sukses tersinkronisasi ke penambahan stok sela.');
      } catch(err: any) {
        alert('Gagal mencatatkan penerimaan PO: ' + err.message);
      }
    }
  };

  return (
    <div className="flex-grow overflow-y-auto p-6 bg-slate-50 text-slate-800 space-y-6" id="purchases_view_container">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" />
            <span>Rantai Pasok & Pembelian (Purchase Order)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Buat dokumen Purchase Order (PO) ke supplier, verifikasi penerimaan barang gudang.</p>
        </div>

        <button
          onClick={() => {
            if (suppliers.length === 0) {
              alert('Harap daftarkan minimal 1 supplier terlebih dahulu di tab Mitra.');
              return;
            }
            if (branchProducts.length === 0) {
              alert('Belum ada katalog barang terdaftar di cabang Anda.');
              return;
            }
            setSupplierId(suppliers[0].id);
            setItemSku(branchProducts[0].sku);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 border border-teal-500 text-white shadow-md cursor-pointer"
        >
          <PlusSquare className="w-4 h-4" />
          <span>Buat PO Baru</span>
        </button>
      </div>

      {/* PO Lists Display table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="purchases_table_card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <th className="p-4">Kode PO</th>
                <th className="p-4">Tanggal PO</th>
                <th className="p-4">Agen Supplier</th>
                <th className="p-4">Daftar Item & Jumlah</th>
                <th className="p-4">Total Belanja Modal</th>
                <th className="p-4">Status PO</th>
                <th className="p-4 text-right">Verifikasi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Code PO */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900 font-mono">{p.code}</span>
                      </div>
                    </td>

                    {/* Date PO */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{p.date}</span>
                      </div>
                    </td>

                    {/* Supplier Name */}
                    <td className="p-4 text-slate-800 font-bold">{p.supplierName}</td>

                    {/* Items List inside tooltip styled content */}
                    <td className="p-4">
                      <div className="space-y-1 max-w-xs">
                        {p.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-medium">
                            <span className="truncate max-w-[120px]">{it.productName}</span>
                            <span className="text-slate-800 font-bold font-mono">x{it.qty}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* total belanja price */}
                    <td className="p-4 font-mono font-bold text-slate-900 text-xs">
                      Rp{p.totalAmount.toLocaleString()}
                    </td>

                    {/* status PO status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                        p.status === 'RECEIVED' ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse'
                      }`}>
                        {p.status === 'RECEIVED' ? 'Diterima' : 'Diproses'}
                      </span>
                    </td>

                    {/* Verification Goods Action trigger banner */}
                    <td className="p-4 text-right">
                      {p.status === 'PENDING' ? (
                        <button
                          onClick={() => handleReceiveGoods(p.id)}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-indigo-500 hover:bg-indigo-600 text-white shadow-xs cursor-pointer"
                        >
                          Barang Tiba
                        </button>
                      ) : (
                        <div className="text-teal-600 font-bold text-[10px] flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Sudah Masuk Toko</span>
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    Belum ada Purchase Order (PO) direkam di cabang ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: Add dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 animate-in fade-in-50 zoom-in-95 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase">Buat Dokumen PO Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Pilih Agen Supplier Utama</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 cursor-pointer"
                  required
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contact})</option>
                  ))}
                </select>
              </div>

              {/* Items builder board */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tambah Baris Item Belanja</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500">Pilih SKU Produk</label>
                    <select
                      value={itemSku}
                      onChange={(e) => {
                        setItemSku(e.target.value);
                        const pFound = branchProducts.find(p => p.sku === e.target.value);
                        if (pFound) setItemBuyPrice(pFound.buyPrice);
                      }}
                      className="w-full text-[10px] border rounded bg-white py-1 px-2 focus:outline-none focus:ring-1 text-slate-700 cursor-pointer"
                    >
                      {branchProducts.map(p => (
                        <option key={p.sku} value={p.sku}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500">Beli Qty (pcs)</label>
                    <input
                      type="number"
                      value={itemQty || ''}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-full text-[10px] border rounded bg-white py-1 px-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500">Harga Beli Modal (Rp)</label>
                    <input
                      type="number"
                      value={itemBuyPrice || ''}
                      onChange={(e) => setItemBuyPrice(Number(e.target.value))}
                      className="w-full text-[10px] border rounded bg-white py-1 px-2 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItemToPo}
                      className="w-full py-1.5 rounded bg-indigo-505 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] text-center cursor-pointer"
                    >
                      Masukkan Item
                    </button>
                  </div>
                </div>

                {/* Internal Items preview list inside creation modal */}
                {poItems.length > 0 && (
                  <div className="border-t pt-2.5 space-y-1.5 max-h-36 overflow-y-auto">
                    {poItems.map((item, idx) => {
                      const p = products.find(prod => prod.sku === item.sku && prod.branchId === currentBranchId);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-slate-100 text-[10px]">
                          <div className="min-w-0 pr-1">
                            <span className="font-bold text-slate-800 block truncate max-w-[130px]">{p ? p.name : item.sku}</span>
                            <span className="text-slate-400 font-mono text-[9px] block">Rp {item.buyPrice.toLocaleString()} x{item.qty} pcs</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromPo(item.sku)}
                            className="text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Display total belanja po */}
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-500 flex justify-between font-bold shrink-0">
                <span>Estimasi Total Belanja PO:</span>
                <span className="font-mono">Rp {totals.toLocaleString()}</span>
              </div>

            </div>

            {/* Modal actions */}
            <div className="border-t pt-3 border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                Batalkan
              </button>
              
              <button
                type="button"
                onClick={handleCreatePoSubmit}
                disabled={poItems.length === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                Rilis PO Resmi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
