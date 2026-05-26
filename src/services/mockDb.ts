import { Product, Transaction, TransactionItem, Customer, Supplier, Purchase, CashFlow, AuditLog, User, Role, StockLog, Voucher, NotificationItem } from '../types';

const INITIAL_USERS = [
  { id: 'u1', username: 'admin', name: 'Super Admin', role: Role.ADMIN, branchId: 'b1', active: true, password: 'admin' },
  { id: 'u2', username: 'owner', name: 'ndy (Owner)', role: Role.OWNER, branchId: 'all', active: true, password: 'owner' },
  { id: 'u3', username: 'kasir1', name: 'Siti (Kasir Jakarta)', role: Role.CASHIER, branchId: 'b1', active: true, password: 'kasir1' },
  { id: 'u4', username: 'kasir2', name: 'Andi (Kasir Bandung)', role: Role.CASHIER, branchId: 'b2', active: true, password: 'kasir2' },
];

const INITIAL_BRANCHES = [
  { id: 'b1', name: 'Cabang Utama Jakarta', address: 'Jl. Sudirman No. 45, Jakarta Selatan', phone: '021-5551234' },
  { id: 'b2', name: 'Cabang Bandung', address: 'Jl. Dago No. 12, Coblong, Bandung', phone: '022-7775678' },
  { id: 'b3', name: 'Cabang Surabaya', address: 'Jl. Pemuda No. 88, Surabaya Pusat', phone: '031-8889900' },
];

const INITIAL_PRODUCTS: Product[] = [
  { sku: 'KOP-SCS-001', barcode: '899123456001', name: 'Kopi Susu Gula Aren Tubruk', description: 'Kopi susu murni dengan tambahan gula aren asli', category: 'Minuman', buyPrice: 5000, sellPrice: 15000, memberPrice: 13500, stock: 120, minStock: 20, branchId: 'b1', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'MIE-INS-002', barcode: '899123456002', name: 'Mie Instan Goreng Sedap + Telur', description: 'Mie instan goreng favorit keluarga dengan telur dadar/mata sapi lezat', category: 'Makanan', buyPrice: 4000, sellPrice: 10000, memberPrice: 9000, stock: 250, minStock: 50, branchId: 'b1', image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'RST-SPO-003', barcode: '899123456003', name: 'Roti Gandum Sehat', description: 'Roti tawar gandum tinggi serat premium', category: 'Makanan', buyPrice: 15000, sellPrice: 24000, memberPrice: 22000, stock: 15, minStock: 20, branchId: 'b1', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'MIN-AQR-004', barcode: '899123456004', name: 'Air Mineral Pegunungan 600ml', description: 'Air mineral alami segar dingin terfiltrasi', category: 'Minuman', buyPrice: 2000, sellPrice: 5000, memberPrice: 4500, stock: 400, minStock: 100, branchId: 'b1', image: 'https://images.unsplash.com/photo-1560060141-7290168f6aced?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'KOP-SCS-001', barcode: '899123456001', name: 'Kopi Susu Gula Aren Tubruk', description: 'Kopi susu murni dengan tambahan gula aren asli', category: 'Minuman', buyPrice: 5000, sellPrice: 15000, memberPrice: 13500, stock: 80, minStock: 20, branchId: 'b2', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'TEH-BOT-005', barcode: '899123456005', name: 'Teh Botol Melati Sosro', description: 'Teh melati manis dalam kemasan botol segar', category: 'Minuman', buyPrice: 3000, sellPrice: 6000, memberPrice: 5500, stock: 5, minStock: 15, branchId: 'b1', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'AYM-GPR-006', barcode: '899123456006', name: 'Ayam Geprek Sambal Korek', description: 'Ayam goreng tepung renyah digeprek dengan cabai rawit setan asli pedas nampol', category: 'Makanan', buyPrice: 9000, sellPrice: 18000, memberPrice: 16500, stock: 45, minStock: 10, branchId: 'b1', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'AYM-GPR-006', barcode: '899123456006', name: 'Ayam Geprek Sambal Korek', description: 'Ayam goreng tepung renyah digeprek dengan cabai rawit setan asli pedas nampol', category: 'Makanan', buyPrice: 9000, sellPrice: 18000, memberPrice: 16500, stock: 30, minStock: 10, branchId: 'b2', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'EST-MAN-007', barcode: '899123456007', name: 'Es Teh Manis Selasih', description: 'Es teh manis segar beraroma melati khas nusantara dengan biji selasih', category: 'Minuman', buyPrice: 1000, sellPrice: 5000, memberPrice: 4500, stock: 150, minStock: 20, branchId: 'b1', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'EST-MAN-007', barcode: '899123456007', name: 'Es Teh Manis Selasih', description: 'Es teh manis segar beraroma melati khas nusantara dengan biji selasih', category: 'Minuman', buyPrice: 1000, sellPrice: 5000, memberPrice: 4500, stock: 100, minStock: 20, branchId: 'b2', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'DIM-SML-008', barcode: '899123456008', name: 'Dimsum Mentai Goreng (3 pcs)', description: 'Dimsum ayam homemade tebal disajikan hangat dengan saus mentai bakar lezat', category: 'Makanan', buyPrice: 6000, sellPrice: 13000, memberPrice: 12000, stock: 50, minStock: 15, branchId: 'b1', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=300&q=80', active: true },
  { sku: 'DIM-SML-008', barcode: '899123456008', name: 'Dimsum Mentai Goreng (3 pcs)', description: 'Dimsum ayam homemade tebal disajikan hangat dengan saus mentai bakar lezat', category: 'Makanan', buyPrice: 6000, sellPrice: 13000, memberPrice: 12000, stock: 40, minStock: 15, branchId: 'b2', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=300&q=80', active: true },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Ahmad Subardjo', phone: '081234567890', email: 'ahmad@gmail.com', point: 1250, memberRank: 'GOLD', notes: 'Grup pedagang lokal' },
  { id: 'c2', name: 'Lina Marlina', phone: '085777888999', email: 'lina@yahoo.com', point: 420, memberRank: 'SILVER', notes: 'Sering membeli paketan roti' },
  { id: 'c3', name: 'Hadi Wijaya', phone: '081999888777', email: 'hadi@gmail.com', point: 15, memberRank: 'REGULAR', notes: 'Pelanggan harian kopi' },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'PT Sumber Pangan Makmur', contact: 'Budi Santoso', phone: '021-998877', address: 'Kawasan Industri Pulogadung Blok C, Jakarta' },
  { id: 's2', name: 'CV Berkah Distribusi Indo', contact: 'Mega Lestari', phone: '0812-3344-5566', address: 'Komp Gading Griya Lestari, Bandung' },
];

const INITIAL_VOUCHERS: Voucher[] = [
  { code: 'DISKON10', type: 'PERCENT', value: 10, minPurchase: 50000, maxDiscount: 20000, active: true },
  { code: 'CASHBACK5K', type: 'CASHBACK', value: 5000, minPurchase: 30000, active: true },
  { code: 'ENTERPRISEPOS', type: 'FIXED', value: 15000, minPurchase: 100000, active: true },
];

export class MockDatabase {
  static get<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(`pos_db_${key}`);
    if (!data) {
      this.set(key, defaultValue);
      return defaultValue;
    }
    return JSON.parse(data);
  }

  static set(key: string, val: any): void {
    localStorage.setItem(`pos_db_${key}`, JSON.stringify(val));
  }

  static init() {
    const isV3 = localStorage.getItem('pos_db_v3_market_prices');

    if (!localStorage.getItem('pos_db_initialized') || !isV3) {
      this.set('users', INITIAL_USERS);
      this.set('branches', INITIAL_BRANCHES);
      this.set('products', INITIAL_PRODUCTS);
      this.set('customers', INITIAL_CUSTOMERS);
      this.set('suppliers', INITIAL_SUPPLIERS);
      this.set('vouchers', INITIAL_VOUCHERS);
      this.set('transactions', [
        {
          id: 'TRX-20260525-001',
          date: '2026-05-25T14:30:00.000Z',
          totalAmount: 54000,
          discountAmount: 5400,
          taxAmount: 4860,
          finalAmount: 53460,
          paymentMethod: 'CASH',
          changeAmount: 46540,
          customerId: 'c1',
          branchId: 'b1',
          cashierId: 'u3',
          cashierName: 'Siti'
        },
        {
          id: 'TRX-20260525-002',
          date: '2026-05-25T16:15:00.000Z',
          totalAmount: 25000,
          discountAmount: 0,
          taxAmount: 2500,
          finalAmount: 27500,
          paymentMethod: 'QRIS',
          changeAmount: 0,
          customerId: '',
          branchId: 'b1',
          cashierId: 'u3',
          cashierName: 'Siti'
        }
      ]);
      
      this.set('transaction_items', [
        { id: 'ti1', transactionId: 'TRX-20260525-001', sku: 'KOP-SCS-001', productName: 'Kopi Susu Gula Aren Tubruk', price: 15000, qty: 2, total: 30000, discount: 0 },
        { id: 'ti2', transactionId: 'TRX-20260525-001', sku: 'RST-SPO-003', productName: 'Roti Gandum Sehat', price: 24000, qty: 1, total: 24000, discount: 0 },
        { id: 'ti3', transactionId: 'TRX-20260525-002', sku: 'MIE-INS-002', productName: 'Mie Instan Goreng Sedap + Telur', price: 10000, qty: 2, total: 20000, discount: 0 },
        { id: 'ti4', transactionId: 'TRX-20260525-002', sku: 'MIN-AQR-004', productName: 'Air Mineral Pegunungan 600ml', price: 5000, qty: 1, total: 5000, discount: 0 }
      ]);

      this.set('stocks', [
        { id: 'st1', sku: 'KOP-SCS-001', branchId: 'b1', type: 'IN', qty: 100, notes: 'Restock supplier makmur', date: '2026-05-20T08:00:00Z', user: 'admin' },
        { id: 'st2', sku: 'MIE-INS-002', branchId: 'b1', type: 'IN', qty: 200, notes: 'Stok awal', date: '2026-05-18T10:00:00Z', user: 'admin' }
      ]);

      this.set('cashflows', [
        { id: 'cf1', date: '2026-05-25T01:00:00.000Z', type: 'EXPENSE', category: 'Operational', amount: 150000, description: 'Beli kertas kasir & sapu lantai', branchId: 'b1', user: 'admin' },
        { id: 'cf2', date: '2026-05-25T14:30:00.000Z', type: 'INCOME', category: 'Sales', amount: 53460, description: 'Penjualan TRX-20260525-001', branchId: 'b1', user: 'kasir1' },
        { id: 'cf3', date: '2026-05-25T16:15:00.000Z', type: 'INCOME', category: 'Sales', amount: 27500, description: 'Penjualan TRX-20260525-002', branchId: 'b1', user: 'kasir1' }
      ]);

      this.set('purchases', [
        { id: 'p1', code: 'PO-20260520-001', supplierId: 's1', supplierName: 'PT Sumber Pangan Makmur', date: '2026-05-20', totalAmount: 600000, status: 'RECEIVED', branchId: 'b1', items: [{ sku: 'KOP-SCS-001', productName: 'Kopi Susu Gula Aren Tubruk', qty: 120, buyPrice: 5000 }] }
      ]);

      this.set('audit_logs', [
        { id: 'al1', userId: 'u1', username: 'admin', action: 'INITIALIZE_DB', ip: '127.0.0.1', timestamp: '2026-05-25T00:00:00Z', details: 'Sistem POS diinisialisasi untuk pertama kali' },
        { id: 'al2', userId: 'u3', username: 'kasir1', action: 'LOGIN_DEVICE', ip: '192.168.1.100', timestamp: '2026-05-25T07:00:00Z', details: 'Login kasir berhasil lewat browser Chrome' }
      ]);

      const NOTIFICATIONS = [
        { id: 'n1', type: 'STOCK_OUT_OF_BOUNDS', title: 'Stok Kritis', message: 'Produk roti tawar gandum menipis (sisa 15 porsi). Segera purchase order.', timestamp: '2026-05-26T01:30:00Z', read: false },
        { id: 'n2', type: 'STOCK_OUT_OF_BOUNDS', title: 'Stok Kritis', message: 'Teh Botol Melati Sosro kritis (sisa 5 porsi).', timestamp: '2026-05-26T02:00:00Z', read: false }
      ];
      this.set('notifications', NOTIFICATIONS);

      localStorage.setItem('pos_db_initialized', 'true');
      localStorage.setItem('pos_db_v3_market_prices', 'true');
    }
  }

  // Helper APIs standard
  static getUsers(): User[] { return this.get('users', []); }
  static getBranches() { return this.get('branches', INITIAL_BRANCHES); }
  static getProducts(): Product[] { return this.get('products', []); }
  static getCustomers(): Customer[] { return this.get('customers', []); }
  static getSuppliers(): Supplier[] { return this.get('suppliers', []); }
  static getVouchers(): Voucher[] { return this.get('vouchers', []); }
  static getTransactions(): Transaction[] { return this.get('transactions', []); }
  static getTransactionItems(): TransactionItem[] { return this.get('transaction_items', []); }
  static getStocks(): StockLog[] { return this.get('stocks', []); }
  static getCashflows(): CashFlow[] { return this.get('cashflows', []); }
  static getPurchases(): Purchase[] { return this.get('purchases', []); }
  static getNotifications(): NotificationItem[] { return this.get('notifications', []); }
  static getAuditLogs(): AuditLog[] { return this.get('audit_logs', []); }
}
