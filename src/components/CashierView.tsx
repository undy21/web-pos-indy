import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Minus, 
  Plus, 
  User, 
  Tag, 
  CreditCard, 
  Coins, 
  CheckCircle,
  Printer, 
  X,
  FileText,
  BadgePercent,
  QrCode,
  ShoppingCart
} from 'lucide-react';
import { Product, Customer, Voucher, Transaction, TransactionItem } from '../types';

interface CashierViewProps {
  products: Product[];
  customers: Customer[];
  vouchers: Voucher[];
  onAddTransaction: (payload: { transaction: Transaction; items: TransactionItem[] }) => Promise<void>;
  currentBranchId: string;
  activeCashier: { id: string; name: string };
}

export default function CashierView({
  products,
  customers,
  vouchers,
  onAddTransaction,
  currentBranchId,
  activeCashier
}: CashierViewProps) {
  // Queries & state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Cart
  const [cart, setCart] = useState<Array<{ product: Product; qty: number; discount: number }>>([]);
  
  // Custom discounts or memberships
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');

  // Payment popup
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'MEMBER_POINTS'>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Receipt printable
  const [recentTrx, setRecentTrx] = useState<{ transaction: Transaction; items: TransactionItem[] } | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Focus simulation
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['all', ...Array.from(list)];
  }, [products]);

  // Filter products by branch, category and query
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchBranch = p.branchId === currentBranchId;
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchQuery = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.barcode || '').includes(searchQuery);
      return matchBranch && matchCategory && matchQuery && p.active;
    });
  }, [products, currentBranchId, selectedCategory, searchQuery]);

  // Handle barcode click
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // Search for a matching product by barcode or SKU
    const product = products.find(p => 
      p.branchId === currentBranchId && 
      (p.barcode === barcodeInput || p.sku.toLowerCase() === barcodeInput.toLowerCase())
    );

    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan Barcode/SKU "${barcodeInput}" tidak terdaftar di cabang Anda.`);
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok produk "${product.name}" saat ini habis (0).`);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product.sku === product.sku);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`Stok maksimum hanya sisa ${product.stock} porsi.`);
          return prev;
        }
        return prev.map(item => item.product.sku === product.sku ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1, discount: 0 }];
    });
  };

  const updateQty = (sku: string, rate: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.sku === sku) {
          const nextQty = item.qty + rate;
          if (nextQty <= 0) return null;
          if (nextQty > item.product.stock) {
            alert(`Stok maksimum hanya tinggal ${item.product.stock} pcs`);
            return item;
          }
          return { ...item, qty: nextQty };
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  const removeCartItem = (sku: string) => {
    setCart(prev => prev.filter(item => item.product.sku !== sku));
  };

  const clearCartState = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setCashReceived(0);
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    let rawTotal = 0;
    cart.forEach(item => {
      // Use memberPrice if member is active
      const activePrice = selectedCustomer ? item.product.memberPrice : item.product.sellPrice;
      rawTotal += activePrice * item.qty;
    });

    // Discount code deductions
    let voucherDeduction = 0;
    if (appliedVoucher) {
      if (appliedVoucher.type === 'PERCENT') {
        voucherDeduction = (rawTotal * appliedVoucher.value) / 100;
        if (appliedVoucher.maxDiscount && voucherDeduction > appliedVoucher.maxDiscount) {
          voucherDeduction = appliedVoucher.maxDiscount;
        }
      } else if (appliedVoucher.type === 'CASHBACK' || appliedVoucher.type === 'FIXED') {
        voucherDeduction = appliedVoucher.value;
      }
    }

    const subtotalWithPromo = Math.max(0, rawTotal - voucherDeduction);
    // 10% VAT implementation
    const taxAmount = Math.round(subtotalWithPromo * 0.1);
    const finalAmount = subtotalWithPromo + taxAmount;

    return {
      subtotal: rawTotal,
      voucherDeduction,
      taxAmount,
      finalAmount
    };
  }, [cart, selectedCustomer, appliedVoucher]);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;

    const voucher = vouchers.find(v => v.code === code && v.active);
    if (!voucher) {
      setVoucherError('Kode voucher tidak valid atau telah kedaluwarsa.');
      setAppliedVoucher(null);
      return;
    }

    if (calculatedTotals.subtotal < voucher.minPurchase) {
      setVoucherError(`Min purchase Rp ${voucher.minPurchase.toLocaleString()} diperlukan.`);
      setAppliedVoucher(null);
      return;
    }

    setAppliedVoucher(voucher);
    setVoucherError('');
  };

  // Submit transaction logic
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'CASH' && cashReceived < calculatedTotals.finalAmount) {
      alert(`Pembayaran tunai yang dimasukkan (Rp ${cashReceived.toLocaleString()}) kurang dari total tagihan.`);
      return;
    }

    if (paymentMethod === 'MEMBER_POINTS' && !selectedCustomer) {
      alert('Harap pilih customer member terlebih dahulu untuk menebus poin.');
      return;
    }

    setIsProcessing(true);
    
    try {
      const nextId = 'TRX-' + new Date().toISOString().substring(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
      
      const transactionHeader: Transaction = {
        id: nextId,
        date: new Date().toISOString(),
        totalAmount: calculatedTotals.subtotal,
        discountAmount: calculatedTotals.voucherDeduction,
        taxAmount: calculatedTotals.taxAmount,
        finalAmount: calculatedTotals.finalAmount,
        paymentMethod: paymentMethod,
        changeAmount: paymentMethod === 'CASH' ? Math.max(0, cashReceived - calculatedTotals.finalAmount) : 0,
        customerId: selectedCustomer?.id || '',
        branchId: currentBranchId,
        cashierId: activeCashier.id,
        cashierName: activeCashier.name
      };

      const transactionItems: TransactionItem[] = cart.map((item, index) => {
        const activePrice = selectedCustomer ? item.product.memberPrice : item.product.sellPrice;
        return {
          id: `ti_${nextId}_${index}`,
          transactionId: nextId,
          sku: item.product.sku,
          productName: item.product.name,
          price: activePrice,
          qty: item.qty,
          total: activePrice * item.qty,
          discount: 0
        };
      });

      await onAddTransaction({ transaction: transactionHeader, items: transactionItems });
      
      // Save recent for receipt rendering
      setRecentTrx({ transaction: transactionHeader, items: transactionItems });
      
      setIsPaymentOpen(false);
      setIsReceiptOpen(true);
      clearCartState();
    } catch(err: any) {
      alert('Gagal memproses transaksi kasir: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-100 overflow-hidden h-full" id="cashier_layout">
      
      {/* LEFT SECTION: Search & item options board */}
      <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
        
        {/* Lookup Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          
          {/* Query search */}
          <div className="relative bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Cari nama produk, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 font-medium focus:outline-none focus:ring-0 w-full"
              id="search_box_input"
            />
          </div>

          {/* Barcode input emulator */}
          <form onSubmit={handleBarcodeSubmit} className="relative bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center shadow-sm">
            <Barcode className="w-5 h-5 text-teal-500 shrink-0 mr-2" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Sentuh / ketik barcode & enter (Emulator)"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 font-mono tracking-wider focus:outline-none focus:ring-0 w-full"
              id="barcode_scanner_input"
            />
            <button type="submit" className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-400 border border-slate-200 font-bold hover:bg-slate-200">
              OK
            </button>
          </form>

        </div>

        {/* Categories Fast-Tab Pills */}
        <div className="flex gap-1.5 overflow-x-auto shrink-0 pb-1" id="category_fast_pills">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border cursor-pointer capitalize transition-all ${
                selectedCategory === c 
                  ? 'bg-teal-500 border-teal-500 text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c === 'all' ? 'Semua Kategori' : c}
            </button>
          ))}
        </div>

        {/* Dynamic Products Grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => {
              const isLowStock = p.stock <= p.minStock;
              return (
                <div
                  key={p.sku}
                  onClick={() => addToCart(p)}
                  className={`bg-white border rounded-2xl p-3 flex flex-col justify-between hover:border-teal-400 cursor-pointer shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${p.stock <= 0 ? 'opacity-65 select-none' : ''}`}
                >
                  {/* Stock flag */}
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide ${p.stock <= 0 ? 'bg-rose-500 text-white' : isLowStock ? 'bg-amber-400 text-amber-900 border border-amber-500' : 'bg-slate-100 text-slate-500'}`}>
                    {p.stock <= 0 ? 'HABIS' : `Stok: ${p.stock}`}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-full h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 mt-3 relative">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80'}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Detil Title */}
                  <div className="mt-2 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">{p.name}</h4>
                      <p className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">{p.sku}</p>
                    </div>

                    <div className="mt-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 font-mono">
                          Rp{p.sellPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                      
                      {selectedCustomer && (
                        <div className="text-[10px] text-teal-600 font-semibold flex items-center gap-0.5 mt-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          <span>Member: Rp{p.memberPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-3">
              <Barcode className="w-12 h-12 text-slate-300" />
              <p>Tidak ada produk yang sesuai kriteria pencarian cabang ini.</p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT SIDEBAR: Shopping Cart and Checkout board */}
      <div className="w-full md:w-96 bg-white border-l border-slate-200 shadow-lg flex flex-col justify-between h-full shrink-0" id="cart_sidebar">
        
        {/* Cart items list strip */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Keranjang Kasir</h2>
            <p className="text-[11px] text-slate-400 font-mono">Trangaksi ID: AUTO-SYS</p>
          </div>
          
          <button
            onClick={clearCartState}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer disabled:opacity-40"
            disabled={cart.length === 0}
          >
            Bersihkan
          </button>
        </div>

        {/* Customer Membership Select pill */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <User className="w-4 h-4 text-teal-600 shrink-0" />
            {selectedCustomer ? (
              <div className="min-w-0">
                <span className="font-bold text-slate-800 block truncate leading-tight">{selectedCustomer.name}</span>
                <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider">{selectedCustomer.memberRank} Member • {selectedCustomer.point} pts</span>
              </div>
            ) : (
              <span className="text-slate-400">Umum (Bukan Member)</span>
            )}
          </div>

          <select
            onChange={(e) => {
              const cust = customers.find(c => c.id === e.target.value);
              setSelectedCustomer(cust || null);
            }}
            value={selectedCustomer?.id || ''}
            className="text-[10px] font-bold border rounded bg-white py-1 px-1.5 focus:outline-none text-slate-600 cursor-pointer"
          >
            <option value="">-- Hubungkan --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.memberRank})</option>
            ))}
          </select>
        </div>

        {/* Cart Contents list panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length > 0 ? (
            cart.map((item) => {
              const activePrice = selectedCustomer ? item.product.memberPrice : item.product.sellPrice;
              return (
                <div key={item.product.sku} className="flex gap-3 pb-3 border-b border-slate-100 hover:bg-slate-50/40 rounded p-1 transition-colors">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0"
                  />
                  
                  <div className="flex-grow min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-800 leading-tight truncate pr-1">{item.product.name}</h4>
                        <button
                          onClick={() => removeCartItem(item.product.sku)}
                          className="text-slate-300 hover:text-rose-500 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Rp{activePrice.toLocaleString('id-ID')}</p>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      {/* Qty count control triggers */}
                      <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-white shadow-sm shrink-0">
                        <button
                          onClick={() => updateQty(item.product.sku, -1)}
                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-extrabold px-1 font-mono text-slate-800">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.product.sku, 1)}
                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Sub total calc */}
                      <span className="text-xs font-black text-slate-900 font-mono">
                        Rp{(activePrice * item.qty).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-24 text-center text-slate-300 text-xs flex flex-col items-center justify-center gap-3">
              <ShoppingCart className="w-12 h-12 text-slate-200" />
              <p className="font-semibold">Keranjang kosong.</p>
              <p className="text-[10px] text-slate-400">Pilih item menu di samping kiri.</p>
            </div>
          )}
        </div>

        {/* Voucher and Totals block bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3.5 shrink-0">
          
          {/* Apply voucher code inside sidebar */}
          <form onSubmit={handleApplyVoucher} className="flex gap-2">
            <div className="relative flex-grow bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 flex items-center shadow-xs">
              <Tag className="w-3.5 h-3.5 text-teal-600 shrink-0 mr-1.5" />
              <input
                type="text"
                placeholder="Kode Voucher Promo"
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value)}
                className="text-[11px] font-bold bg-transparent border-none text-slate-700 focus:outline-none focus:ring-0 w-full uppercase"
                id="voucher_box_input"
              />
            </div>
            
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white transition-colors cursor-pointer"
            >
              Klaim
            </button>
          </form>

          {/* Applied Voucher or error text */}
          {appliedVoucher && (
            <div className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1.5 rounded-lg flex items-center justify-between font-bold">
              <div className="flex items-center gap-1">
                <BadgePercent className="w-3.5 h-3.5" />
                <span>Kupon {appliedVoucher.code} Aktif (-Rp {calculatedTotals.voucherDeduction.toLocaleString()})</span>
              </div>
              <button type="button" onClick={() => setAppliedVoucher(null)} className="text-slate-400 hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {voucherError && <p className="text-[10px] text-rose-500 font-bold">{voucherError}</p>}

          {/* Computed Ledger Totals */}
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-slate-700">Rp{calculatedTotals.subtotal.toLocaleString()}</span>
            </div>
            
            {calculatedTotals.voucherDeduction > 0 && (
              <div className="flex justify-between text-teal-600 font-semibold">
                <span>Potongan Promo</span>
                <span className="font-mono">-Rp{calculatedTotals.voucherDeduction.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>PPN Pajak Porsi (10%)</span>
              <span className="font-mono font-semibold text-slate-700">Rp{calculatedTotals.taxAmount.toLocaleString()}</span>
            </div>

            <div className="border-t border-slate-200 pt-2.5 flex justify-between text-slate-900">
              <span className="text-sm font-extrabold">Total Tagihan</span>
              <span className="text-lg font-black text-rose-600 font-mono">
                Rp {calculatedTotals.finalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Action button pay */}
          <button
            onClick={() => setIsPaymentOpen(true)}
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-extrabold text-xs text-white uppercase tracking-wider text-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-500/10 hover:shadow-lg hover:shadow-rose-500/20"
            id="pay_btn_trigger"
          >
            Selesaikan & Pilih Bayar
          </button>
        </div>

      </div>

      {/* POPUP MODAL: Payment Process */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5 animate-in fade-in-50 zoom-in-95 shadow-2xl border border-slate-100">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase">Metode Pembayaran</h3>
              <button onClick={() => setIsPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total tagihan read only panel */}
            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Total Tagihan</span>
              <span className="text-2xl font-black text-rose-600 font-mono block mt-1">
                Rp {calculatedTotals.finalAmount.toLocaleString()}
              </span>
            </div>

            {/* Selector pills for custom method options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${paymentMethod === 'CASH' ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                Tunai Cash
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${paymentMethod === 'QRIS' ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                QRIS Bank
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('MEMBER_POINTS')}
                disabled={!selectedCustomer}
                className={`py-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all disabled:opacity-40 ${paymentMethod === 'MEMBER_POINTS' ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
              >
                Poin Member
              </button>
            </div>

            {/* Dynamic input sections */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Jumlah Uang Diterima (Tunai)</label>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full text-lg font-bold font-mono border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Rp 0"
                    id="cash_entered_input"
                  />
                </div>

                {/* Quick money selectors bills */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[calculatedTotals.finalAmount, 20000, 50000, 100000].map((val) => {
                    const rounded = Math.ceil(val);
                    return (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setCashReceived(rounded)}
                        className="py-1 text-[10px] font-bold border rounded-lg bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                      >
                        Rp{rounded.toLocaleString()}
                      </button>
                    );
                  })}
                </div>

                {/* Change return output info */}
                {cashReceived >= calculatedTotals.finalAmount && (
                  <div className="p-3 bg-teal-50 border border-teal-100 text-teal-600 font-bold rounded-xl flex items-center justify-between text-xs">
                    <span>Kembalian</span>
                    <span className="font-mono">Rp {(cashReceived - calculatedTotals.finalAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'QRIS' && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col items-center justify-center space-y-2.5">
                <div className="w-32 h-32 bg-slate-900 flex items-center justify-center rounded-xl p-2 relative shadow-inner">
                  {/* Dynamic clean SVG representation of QRIS code */}
                  <QrCode className="w-full h-full text-white" />
                  <div className="absolute inset-x-0 bottom-1 flex justify-center">
                    <span className="bg-rose-500 text-[8px] font-black tracking-widest text-white px-1 py-0.5 rounded">QRIS POS_AI</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-black">Scan QR menggunakan Ovo / GoPay / ShopeePay</p>
              </div>
            )}

            {paymentMethod === 'MEMBER_POINTS' && selectedCustomer && (
              <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Nama Member:</span>
                  <span className="font-bold text-slate-800">{selectedCustomer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Poin Tersedia:</span>
                  <span className="font-bold text-teal-600 font-mono">{selectedCustomer.point} Pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Nilai Tukar Poin (Simp):</span>
                  {/* Assumed 1 points = 10 IDR */}
                  <span className="font-bold text-rose-500 font-mono">Rp {(selectedCustomer.point * 10).toLocaleString()}</span>
                </div>
                {selectedCustomer.point * 10 < calculatedTotals.finalAmount ? (
                  <p className="text-[10px] text-rose-500 font-bold mt-2 text-center bg-white px-2 py-1 rounded border border-rose-100">
                    ⚠️ Poin Tidak Mencukupi! Tukar seadanya dan lunasi sisa via Tunai.
                  </p>
                ) : (
                  <p className="text-[10px] text-teal-600 font-bold mt-2 text-center bg-white px-2 py-1 rounded border border-teal-100">
                    Poin Mencukupi! Seluruh transaksi akan langsung menebus poin member.
                  </p>
                )}
              </div>
            )}

            {/* Action complete triggers */}
            <button
              onClick={handleCheckoutSubmit}
              disabled={isProcessing}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-xs font-black text-white uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
              id="confirm_payment_btn"
            >
              {isProcessing ? 'Memproses Transaksi...' : 'Konfirmasi & Selesaikan'}
            </button>

          </div>
        </div>
      )}

      {/* POPUP MODAL: POS Thermal Strip Receipt printing representation */}
      {isReceiptOpen && recentTrx && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700/60 shadow-2xl rounded-3xl w-full max-w-sm flex flex-col justify-between overflow-hidden animate-in zoom-in-95">
            
            {/* Header popup info */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between text-white bg-slate-950/40">
              <span className="text-xs font-black uppercase tracking-wider text-teal-400">Transaksi Sukses</span>
              <button onClick={() => setIsReceiptOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* The printable Area representing a standard POS thermal label strip printer */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[420px] bg-white text-slate-800 flex flex-col items-center">
              <div 
                className="w-full text-center border border-dashed border-slate-300 p-5 rounded-2xl relative shadow-inner bg-slate-50 text-[11px] leading-relaxed text-slate-700 font-mono" 
                id="thermal_receipt_print_area"
              >
                {/* Brand Header */}
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest font-sans">KEDAI NUSANTARA POS</h3>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-sans">Cabang: {recentTrx.transaction.branchId === 'b1' ? 'Jakarta Selatan' : 'Bandung'}</p>
                <p className="text-[8px] text-slate-400 font-sans mt-0.5">Sudirman No. 45 • Telp: 021-5551234</p>
                <div className="border-b border-dashed border-slate-300 my-3"></div>

                {/* Subinfo header */}
                <div className="space-y-1 text-left text-[9px] text-slate-500 font-sans">
                  <div className="flex justify-between">
                    <span>No. TRX:</span>
                    <span className="font-mono text-slate-700 font-bold">{recentTrx.transaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span className="text-slate-700 font-bold">{new Date(recentTrx.transaction.date).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span className="text-slate-700 font-bold">{recentTrx.transaction.cashierName}</span>
                  </div>
                  {selectedCustomer && (
                    <div className="flex justify-between text-teal-600 font-bold">
                      <span>Mitra Member:</span>
                      <span>{selectedCustomer.name}</span>
                    </div>
                  )}
                </div>
                <div className="border-b border-dashed border-slate-300 my-3"></div>

                {/* Items loop */}
                <div className="space-y-2 text-left">
                  {recentTrx.items.map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-slate-900 font-bold">
                        <span className="truncate max-w-[150px]">{it.productName}</span>
                        <span>Rp{(it.price * it.qty).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{it.qty} Porsi x Rp {it.price.toLocaleString()}</span>
                        <span>ST: {it.sku}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-b border-dashed border-slate-300 my-3"></div>

                {/* Ledger summary receipts */}
                <div className="space-y-1 text-right text-slate-600 font-sans">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-800">Rp{recentTrx.transaction.totalAmount.toLocaleString()}</span>
                  </div>
                  {recentTrx.transaction.discountAmount > 0 && (
                    <div className="flex justify-between text-teal-600 font-semibold">
                      <span>Diskon Voucher</span>
                      <span className="font-mono">-Rp{recentTrx.transaction.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Biaya PPN Pajak (10%)</span>
                    <span className="font-mono text-slate-800">Rp{recentTrx.transaction.taxAmount.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-1.5 flex justify-between text-slate-950 text-xs font-bold leading-none">
                    <span>TOTAL BERSIH</span>
                    <span className="font-mono text-rose-600 font-black">Rp{recentTrx.transaction.finalAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-b border-slate-200 pb-1.5 my-1"></div>

                  <div className="flex justify-between text-[10px]">
                    <span>Metode Bayar:</span>
                    <span className="font-bold text-slate-700">{recentTrx.transaction.paymentMethod}</span>
                  </div>
                  {recentTrx.transaction.paymentMethod === 'CASH' && (
                    <div className="flex justify-between text-[10px] text-teal-600 font-bold">
                      <span>Uang Kembalian:</span>
                      <span>Rp{recentTrx.transaction.changeAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="border-b border-dashed border-slate-300 my-3"></div>
                <p className="text-[9px] text-center text-slate-400 uppercase tracking-wider">Terima Kasih Atas Kunjungan Anda</p>
                <p className="text-[8px] text-center text-slate-300 mt-1 font-sans">Sistem POS Google Sheets Cloud</p>
              </div>
            </div>

            {/* Receipt Modal buttons */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  alert('Melakukan cetak struk thermal... (Simulasi Printer)');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Thermal</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer"
              >
                Tutup Struk
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
