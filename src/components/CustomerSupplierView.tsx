import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Award, 
  MapPin, 
  Mail, 
  Truck, 
  ChevronRight, 
  Plus,
  X
} from 'lucide-react';
import { Customer, Supplier } from '../types';

interface CustomerSupplierViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  onAddCustomer: (customerObj: any) => Promise<void>;
  onAddSupplier: (supplierObj: any) => Promise<void>;
}

export default function CustomerSupplierView({
  customers,
  suppliers,
  onAddCustomer,
  onAddSupplier
}: CustomerSupplierViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'suppliers'>('members');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states Customer / Member
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // Form states Supplier
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Filtering lists
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery) ||
      (s.contact || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [suppliers, searchQuery]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeSubTab === 'members') {
        if (!custName || !custPhone) return;
        await onAddCustomer({
          name: custName,
          phone: custPhone,
          email: custEmail,
          notes: custNotes
        });
        setCustName('');
        setCustPhone('');
        setCustEmail('');
        setCustNotes('');
      } else {
        if (!supName || !supPhone) return;
        await onAddSupplier({
          name: supName,
          contact: supContact,
          phone: supPhone,
          address: supAddress
        });
        setSupName('');
        setSupContact('');
        setSupPhone('');
        setSupAddress('');
      }
      setIsModalOpen(false);
    } catch(err: any) {
      alert('Gagal meregistrasi mitra: ' + err.message);
    }
  };

  return (
    <div className="flex-grow overflow-y-auto p-6 bg-slate-50 text-slate-800 space-y-6" id="partners_view_container">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Kemitraan, Member & Supplier</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Registrasi loyalitas poin member, riwayat ranking silver/gold/platinum, dan kontak agen rantai pasok.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 border border-teal-500 text-white shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{activeSubTab === 'members' ? 'Registrasi Member Baru' : 'Daftarkan Supplier Baru'}</span>
        </button>
      </div>

      {/* Sub tabs switches & search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        
        {/* Toggle switches sub tabs */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit border border-slate-200/20">
          <button
            onClick={() => { setActiveSubTab('members'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'members' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Loyalitas Pelanggan (Member)
          </button>
          
          <button
            onClick={() => { setActiveSubTab('suppliers'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'suppliers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Agen Pemasok (Supplier)
          </button>
        </div>

        {/* Search bar input */}
        <input
          type="text"
          placeholder={activeSubTab === 'members' ? "Saring nama member, telepon..." : "Saring nama supplier..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-xs text-xs border rounded-xl py-2 px-3 text-slate-800 bg-white border-slate-200 focus:outline-none"
        />

      </div>

      {/* Dynamic Content Table Lists */}
      {activeSubTab === 'members' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="members_table_card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <th className="p-4">Nama Pelanggan</th>
                  <th className="p-4">Kontak Telepon</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rank Member / Tier</th>
                  <th className="p-4 text-center">Poin Terkumpul</th>
                  <th className="p-4">Catatan Khusus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-950">{c.name}</td>
                      <td className="p-4 font-mono">{c.phone}</td>
                      <td className="p-4">{c.email || '-'}</td>
                      
                      {/* rank member */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                          c.memberRank === 'PLATINUM' ? 'bg-slate-900 border-slate-950 text-slate-100 animate-pulse' :
                          c.memberRank === 'GOLD' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                          c.memberRank === 'SILVER' ? 'bg-slate-100 border-slate-200 text-slate-500' :
                          'bg-emerald-50 border-emerald-200 text-emerald-600'
                        }`}>
                          {c.memberRank} Medal
                        </span>
                      </td>

                      {/* Points earned */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span className="font-extrabold font-mono text-slate-900 text-xs">{c.point} Pts</span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-400 max-w-xs truncate">{c.notes || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      Belum ada mitra loyalitas terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="suppliers_table_card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <th className="p-4">Nama Supplier / PT</th>
                  <th className="p-4">Person In Charge (PIC)</th>
                  <th className="p-4">Kontak Telepon</th>
                  <th className="p-4">Alamat Distribusi Gudang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-950 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{s.name}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{s.contact}</td>
                      <td className="p-4 font-mono">{s.phone}</td>
                      <td className="p-4 max-w-xs truncate">{s.address}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                      Belum ada data supplier terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Add dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleFormSubmit}
            className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 animate-in fade-in-50 zoom-in-95 shadow-2xl border border-slate-100"
          >
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {activeSubTab === 'members' ? 'Registrasi Member Baru' : 'Daftarkan Supplier Baru'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeSubTab === 'members' ? (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nama Lengkap Member</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Budi Setiadi"
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">No. Whatsapp / Telepon</label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Alamat Email</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="budi@gmail.com"
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Catatan Kemitraan</label>
                  <textarea
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    placeholder="Pembeli setia mingguan, pesanan roti grosir..."
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 h-16 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nama Perusahaan / Supplier</label>
                  <input
                    type="text"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="PT Indofood CBP Sukses Makmur"
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Sales Contact PIC (Nama Person)</label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    placeholder="Wawan Hermawan"
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Nomor HP Whatsapp Supplier</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="081998877665"
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Alamat Kantor / Gudang Distribusi</label>
                  <textarea
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    placeholder="Kawasan Industri Pulogadung Blok F5, Jakarta..."
                    className="w-full text-xs border rounded-xl py-2 px-3 text-slate-800 bg-slate-50 border-slate-200 h-16 resize-none"
                    required
                  />
                </div>
              </div>
            )}

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
                Simpan Mitra
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
