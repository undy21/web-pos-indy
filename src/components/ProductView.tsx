import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Barcode, 
  AlertTriangle,
  X,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Product, Role } from '../types';

interface ProductViewProps {
  products: Product[];
  currentBranchId: string;
  currentUserRole: Role;
  onAddProduct: (productObj: Product) => Promise<void>;
  onUpdateProduct: (productObj: Product) => Promise<void>;
  onDeleteProduct: (sku: string, branchId: string) => Promise<void>;
}

export default function ProductView({
  products,
  currentBranchId,
  currentUserRole,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: ProductViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Form fields
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [memberPrice, setMemberPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [image, setImage] = useState('');

  // Categories parsing
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['all', ...Array.from(list)];
  }, [products]);

  // Filter products by branch & query
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchBranch = p.branchId === currentBranchId;
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchQuery = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.barcode || '').includes(searchQuery);
      return matchBranch && matchCategory && matchQuery;
    });
  }, [products, currentBranchId, selectedCategory, searchQuery]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSku('KOP-SCS-' + Math.floor(100 + Math.random() * 899));
    setBarcode('899' + Math.floor(100000000 + Math.random() * 900000000));
    setName('');
    setDescription('');
    setCategory('Minuman');
    setBuyPrice(4500);
    setSellPrice(8000);
    setMemberPrice(7500);
    setStock(100);
    setMinStock(15);
    setImage('https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setModalMode('edit');
    setSku(p.sku);
    setBarcode(p.barcode);
    setName(p.name);
    setDescription(p.description);
    setCategory(p.category);
    setBuyPrice(p.buyPrice);
    setSellPrice(p.sellPrice);
    setMemberPrice(p.memberPrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setImage(p.image);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    const payload: Product = {
      sku,
      barcode,
      name,
      description,
      category,
      buyPrice,
      sellPrice,
      memberPrice,
      stock,
      minStock,
      branchId: currentBranchId,
      image,
      active: true
    };

    try {
      if (modalMode === 'create') {
        const dupl = products.find(p => p.sku === sku && p.branchId === currentBranchId);
        if (dupl) {
          alert('SKU Produk sudah terdaftar di cabang Anda.');
          return;
        }
        await onAddProduct(payload);
      } else {
        await onUpdateProduct(payload);
      }
      setIsModalOpen(false);
    } catch(err: any) {
      alert('Gagal menyimpan produk: ' + err.message);
    }
  };

  const handleDeleteClick = async (skuStr: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk SKU: ${skuStr} dari cabang ini?`)) {
      try {
        await onDeleteProduct(skuStr, currentBranchId);
      } catch(err: any) {
        alert('Gagal menghapus produk: ' + err.message);
      }
    }
  };

  const isEditable = currentUserRole !== Role.CASHIER;

  return (
    <div className="flex-grow overflow-y-auto p-6 bg-slate-50 text-slate-800 space-y-5" id="product_view_container">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-500" />
            <span>Katalog & Inventaris Produk</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Daftar menu dagangan, SKU barcode, dan koordinasi harga jual.</p>
        </div>

        {isEditable && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/10 cursor-pointer"
            id="add_new_product_btn"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah SKU Baru</span>
          </button>
        )}
      </div>

      {/* Query Search filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
        
        {/* Search Input box */}
        <div className="relative bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center shadow-xs w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Cari SKU, Barcode, atau Nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-transparent border-none text-slate-700 font-medium focus:outline-none focus:ring-0 w-full"
            id="prod_search_input"
          />
        </div>

        {/* Categories fast selector option */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.slice(0, 5).map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                selectedCategory === c
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c === 'all' ? 'Semua Kategori' : c}
            </button>
          ))}
        </div>

      </div>

      {/* Tabular Lists Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="products_table_card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold tracking-wider font-sans uppercase">
                <th className="p-4">SKU / Barcode</th>
                <th className="p-4">Nama Produk</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga Beli (Modal)</th>
                <th className="p-4">Harga Jual (Umum)</th>
                <th className="p-4">Harga Member</th>
                <th className="p-4 text-center">Stok</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isCriticalStock = p.stock <= p.minStock;
                  return (
                    <tr key={p.sku} className="hover:bg-slate-50/50 transition-colors">
                      {/* SKU barcode identifier */}
                      <td className="p-4">
                        <span className="font-bold font-mono text-slate-900 block">{p.sku}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>

                      {/* Product display thumbnail & title */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 pr-1">
                            <span className="text-slate-900 font-bold block truncate max-w-[170px]">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5 max-w-[150px]">{p.description}</span>
                          </div>
                        </div>
                      </td>

                      {/* category quick pills */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                          {p.category}
                        </span>
                      </td>

                      {/* pricing levels */}
                      <td className="p-4 font-mono font-bold text-slate-600">Rp{p.buyPrice.toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-slate-900">Rp{p.sellPrice.toLocaleString()}</td>
                      <td className="p-4 text-teal-600 font-mono font-bold">Rp{p.memberPrice.toLocaleString()}</td>

                      {/* stocks status level */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`font-black font-mono px-2 py-0.5 rounded text-[11px] ${
                            p.stock <= 0 ? 'bg-rose-500 text-white' : isCriticalStock ? 'bg-amber-400 text-amber-950 font-bold' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {p.stock} porsi
                          </span>
                          
                          {isCriticalStock && (
                            <div className="text-[9px] text-rose-500 font-bold flex items-center gap-0.5 mt-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Min {p.minStock}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* actions trigger block */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
                            title="Edit Produk"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {isEditable && (
                            <button
                              onClick={() => handleDeleteClick(p.sku)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white cursor-pointer text-rose-500 transition-colors"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    Belum ada data produk tersedia di cabang ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: CRUD Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleFormSubmit}
            className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 animate-in fade-in-50 zoom-in-95 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {modalMode === 'create' ? 'Tambah SKU Produk Baru' : 'Ubah Detail SKU Produk'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fields grid logic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">SKU (Kode Unik)</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  disabled={modalMode === 'edit'}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono disabled:opacity-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Barcode EAN-13</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Nama Produk Dagangan</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kopi Susu Espresso, Mie Goreng Sedap..."
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200"
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Deskripsi Singkat</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan spesifikasi rasa, ukuran botol atau berat kemasan..."
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 h-16 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200"
                >
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Camilan">Camilan</option>
                  <option value="Rokok">Rokok</option>
                  <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Contoh Link Foto JPEG (Unsplash)</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Harga Beli Modal (Rp)</label>
                <input
                  type="number"
                  value={buyPrice || ''}
                  onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Harga Jual Umum (Rp)</label>
                <input
                  type="number"
                  value={sellPrice || ''}
                  onChange={(e) => setSellPrice(Number(e.target.value))}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Harga Jual Mitra Member (Rp)</label>
                <input
                  type="number"
                  value={memberPrice || ''}
                  onChange={(e) => setMemberPrice(Number(e.target.value))}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Batas Stok Minimum Kritis</label>
                <input
                  type="number"
                  value={minStock || ''}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                  required
                />
              </div>

              {modalMode === 'create' && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Stok Awal Inventaris</label>
                  <input
                    type="number"
                    value={stock || ''}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                    required
                  />
                </div>
              )}

            </div>

            {/* Form actions panel buttons */}
            <div className="border-t pt-4 border-slate-100 flex items-center justify-end gap-2">
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
                Simpan SKU
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
