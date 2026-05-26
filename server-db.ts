import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Ensure parent directory and seed data exist
function ensureDbDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const INITIAL_USERS = [
  { id: 'u1', username: 'admin', name: 'Super Admin', role: 'ADMIN', branchId: 'b1', active: true, password: 'admin' },
  { id: 'u2', username: 'owner', name: 'ndy (Owner)', role: 'OWNER', branchId: 'all', active: true, password: 'owner' },
  { id: 'u3', username: 'kasir1', name: 'Aisyah (Kasir Lahat)', role: 'CASHIER', branchId: 'b1', active: true, password: 'kasir1' },
  { id: 'u4', username: 'kasir2', name: 'Beni (Kasir Pagar Alam)', role: 'CASHIER', branchId: 'b2', active: true, password: 'kasir2' },
];

const INITIAL_BRANCHES = [
  { id: 'b1', name: 'Cabang Lahat', address: 'Jl. Mayor Ruslan No. 45, Lahat', phone: '0731-555123' },
  { id: 'b2', name: 'Cabang Pagar Alam', address: 'Jl. Kombes H. Umar No. 12, Pagar Alam', phone: '0730-777567' },
  { id: 'b3', name: 'Cabang Surabaya', address: 'Jl. Pemuda No. 88, Surabaya Pusat', phone: '031-8889900' },
];

const INITIAL_PRODUCTS = [
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

const INITIAL_CUSTOMERS = [
  { id: 'c1', name: 'Ahmad Subardjo', phone: '081234567890', email: 'ahmad@gmail.com', point: 1250, memberRank: 'GOLD', notes: 'Grup pedagang lokal' },
  { id: 'c2', name: 'Lina Marlina', phone: '085777888999', email: 'lina@yahoo.com', point: 420, memberRank: 'SILVER', notes: 'Sering membeli paketan roti' },
  { id: 'c3', name: 'Hadi Wijaya', phone: '081999888777', email: 'hadi@gmail.com', point: 15, memberRank: 'REGULAR', notes: 'Pelanggan harian kopi' },
];

const INITIAL_SUPPLIERS = [
  { id: 's1', name: 'PT Sumber Pangan Makmur', contact: 'Budi Santoso', phone: '021-998877', address: 'Kawasan Industri Pulogadung Blok C, Jakarta' },
  { id: 's2', name: 'CV Berkah Distribusi Indo', contact: 'Mega Lestari', phone: '0812-3344-5566', address: 'Komp Gading Griya Lestari, Bandung' },
];

const INITIAL_VOUCHERS = [
  { code: 'DISKON10', type: 'PERCENT', value: 10, minPurchase: 50000, maxDiscount: 20000, active: true },
  { code: 'CASHBACK5K', type: 'CASHBACK', value: 5000, minPurchase: 30000, active: true },
  { code: 'ENTERPRISEPOS', type: 'FIXED', value: 15000, minPurchase: 100000, active: true },
];

const INITIAL_TRANSACTIONS = [
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
    cashierName: 'Aisyah'
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
    cashierName: 'Aisyah'
  }
];

const INITIAL_TRANSACTION_ITEMS = [
  { id: 'ti1', transactionId: 'TRX-20260525-001', sku: 'KOP-SCS-001', productName: 'Kopi Susu Gula Aren Tubruk', price: 15000, qty: 2, total: 30000, discount: 0 },
  { id: 'ti2', transactionId: 'TRX-20260525-001', sku: 'RST-SPO-003', productName: 'Roti Gandum Sehat', price: 24000, qty: 1, total: 24000, discount: 0 },
  { id: 'ti3', transactionId: 'TRX-20260525-002', sku: 'MIE-INS-002', productName: 'Mie Instan Goreng Sedap + Telur', price: 10000, qty: 2, total: 20000, discount: 0 },
  { id: 'ti4', transactionId: 'TRX-20260525-002', sku: 'MIN-AQR-004', productName: 'Air Mineral Pegunungan 600ml', price: 5000, qty: 1, total: 5000, discount: 0 }
];

const INITIAL_STOCKS = [
  { id: 'st1', sku: 'KOP-SCS-001', branchId: 'b1', type: 'IN', qty: 100, notes: 'Restock supplier makmur', date: '2026-05-20T08:00:00Z', user: 'admin' },
  { id: 'st2', sku: 'MIE-INS-002', branchId: 'b1', type: 'IN', qty: 200, notes: 'Stok awal', date: '2026-05-18T10:00:00Z', user: 'admin' }
];

const INITIAL_CASHFLOWS = [
  { id: 'cf1', date: '2026-05-25T01:00:00.000Z', type: 'EXPENSE', category: 'Operational', amount: 150000, description: 'Beli kertas kasir & sapu lantai', branchId: 'b1', user: 'admin' },
  { id: 'cf2', date: '2026-05-25T14:30:00.000Z', type: 'INCOME', category: 'Sales', amount: 53460, description: 'Penjualan TRX-20260525-001', branchId: 'b1', user: 'kasir1' },
  { id: 'cf3', date: '2026-05-25T16:15:00.000Z', type: 'INCOME', category: 'Sales', amount: 27500, description: 'Penjualan TRX-20260525-002', branchId: 'b1', user: 'kasir1' }
];

const INITIAL_PURCHASES = [
  { id: 'p1', code: 'PO-20260520-001', supplierId: 's1', supplierName: 'PT Sumber Pangan Makmur', date: '2026-05-20', totalAmount: 600000, status: 'RECEIVED', branchId: 'b1', items: [{ sku: 'KOP-SCS-001', productName: 'Kopi Susu Gula Aren Tubruk', qty: 120, buyPrice: 5000 }] }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'al1', userId: 'u1', username: 'admin', action: 'INITIALIZE_DB', ip: '127.0.0.1', timestamp: '2026-05-25T00:00:00Z', details: 'Sistem POS diinisialisasi untuk pertama kali' },
  { id: 'al2', userId: 'u3', username: 'kasir1', action: 'LOGIN_DEVICE', ip: '192.168.1.100', timestamp: '2026-05-25T07:00:00Z', details: 'Login kasir berhasil lewat browser Chrome' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', type: 'STOCK_OUT_OF_BOUNDS', title: 'Stok Kritis', message: 'Produk roti tawar gandum menipis (sisa 15 porsi). Segera purchase order.', timestamp: '2026-05-26T01:30:00Z', read: false },
  { id: 'n2', type: 'STOCK_OUT_OF_BOUNDS', title: 'Stok Kritis', message: 'Teh Botol Melati Sosro kritis (sisa 5 porsi).', timestamp: '2026-05-26T02:00:00Z', read: false }
];

interface DatabaseSchema {
  users: any[];
  branches: any[];
  products: any[];
  customers: any[];
  suppliers: any[];
  vouchers: any[];
  transactions: any[];
  transaction_items: any[];
  stocks: any[];
  cashflows: any[];
  purchases: any[];
  notifications: any[];
  audit_logs: any[];
}

export function getDb(): DatabaseSchema {
  ensureDbDir();
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: DatabaseSchema = {
      users: INITIAL_USERS,
      branches: INITIAL_BRANCHES,
      products: INITIAL_PRODUCTS,
      customers: INITIAL_CUSTOMERS,
      suppliers: INITIAL_SUPPLIERS,
      vouchers: INITIAL_VOUCHERS,
      transactions: INITIAL_TRANSACTIONS,
      transaction_items: INITIAL_TRANSACTION_ITEMS,
      stocks: INITIAL_STOCKS,
      cashflows: INITIAL_CASHFLOWS,
      purchases: INITIAL_PURCHASES,
      notifications: INITIAL_NOTIFICATIONS,
      audit_logs: INITIAL_AUDIT_LOGS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading JSON database file, returning emergency backup seeds:", err);
    return {
      users: INITIAL_USERS,
      branches: INITIAL_BRANCHES,
      products: INITIAL_PRODUCTS,
      customers: INITIAL_CUSTOMERS,
      suppliers: INITIAL_SUPPLIERS,
      vouchers: INITIAL_VOUCHERS,
      transactions: INITIAL_TRANSACTIONS,
      transaction_items: INITIAL_TRANSACTION_ITEMS,
      stocks: INITIAL_STOCKS,
      cashflows: INITIAL_CASHFLOWS,
      purchases: INITIAL_PURCHASES,
      notifications: INITIAL_NOTIFICATIONS,
      audit_logs: INITIAL_AUDIT_LOGS
    };
  }
}

export function saveDb(data: DatabaseSchema) {
  ensureDbDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function triggerStockNotification(dbData: DatabaseSchema, product: any, currentStock: number) {
  dbData.notifications.unshift({
    id: 'n_' + Date.now() + '_' + Math.random().toString(36).substring(4),
    type: 'STOCK_OUT_OF_BOUNDS',
    title: 'Stok Kritis!',
    message: `Produk "${product.name}" di cabang sisa ${currentStock} porsi (minimum ${product.minStock}).`,
    timestamp: new Date().toISOString(),
    read: false
  });
}

function addAuditLog(dbData: DatabaseSchema, action: string, details: string, userId?: string, username?: string) {
  dbData.audit_logs.unshift({
    id: 'al_' + Date.now(),
    userId: userId || 'u1',
    username: username || 'admin',
    action,
    ip: '127.0.0.1',
    timestamp: new Date().toISOString(),
    details
  });
}

export function handleAction(action: string, payload?: any): any {
  const dbData = getDb();

  switch (action) {
    case 'getBranches':
      return dbData.branches;
    case 'getProducts':
      return dbData.products;
    case 'getCustomers':
      return dbData.customers;
    case 'getSuppliers':
      return dbData.suppliers;
    case 'getVouchers':
      return dbData.vouchers;
    case 'getTransactions':
      return dbData.transactions;
    case 'getTransactionItems':
      return dbData.transaction_items;
    case 'getStocks':
      return dbData.stocks;
    case 'getCashflows':
      return dbData.cashflows;
    case 'getPurchases':
      return dbData.purchases;
    case 'getNotifications':
      return dbData.notifications;
    case 'getAuditLogs':
      return dbData.audit_logs;
    case 'getUsers':
      return dbData.users;

    case 'addProduct': {
      dbData.products.push(payload);
      addAuditLog(dbData, 'ADD_PRODUCT', `Menambahkan produk baru SKU: ${payload.sku}`);
      saveDb(dbData);
      return payload;
    }
    
    case 'updateProduct': {
      dbData.products = dbData.products.map(p => 
        (p.sku === payload.sku && p.branchId === payload.branchId) ? { ...p, ...payload } : p
      );
      addAuditLog(dbData, 'UPDATE_PRODUCT', `Update produk SKU: ${payload.sku} Cabang: ${payload.branchId}`);
      saveDb(dbData);
      return payload;
    }
    
    case 'deleteProduct': {
      dbData.products = dbData.products.filter(p => !(p.sku === payload.sku && p.branchId === payload.branchId));
      addAuditLog(dbData, 'DELETE_PRODUCT', `Menghapus produk SKU: ${payload.sku} Cabang: ${payload.branchId}`);
      saveDb(dbData);
      return true;
    }

    case 'addStockLog': {
      const nextId = 'st_' + Date.now();
      const newLog = { ...payload, id: nextId, date: new Date().toISOString() };
      dbData.stocks.push(newLog);

      // Update product stock level in current branch
      dbData.products = dbData.products.map(p => {
        if (p.sku === payload.sku && p.branchId === payload.branchId) {
          let nextStock = p.stock;
          if (payload.type === 'IN') nextStock += payload.qty;
          if (payload.type === 'OUT') nextStock -= payload.qty;
          if (payload.type === 'ADJUST') nextStock = payload.qty;
          
          if (nextStock <= p.minStock) {
            triggerStockNotification(dbData, p, nextStock);
          }
          return { ...p, stock: nextStock };
        }
        return p;
      });
      addAuditLog(dbData, 'STOCK_MUTATION', `Mutasi stok ${payload.type} SKU: ${payload.sku} Qty: ${payload.qty}`);
      saveDb(dbData);
      return newLog;
    }

    case 'addTransaction': {
      // Add Header
      dbData.transactions.unshift(payload.transaction);

      // Add Items
      payload.items.forEach((item: any) => {
        dbData.transaction_items.push(item);
        
        // Deduct Product Stock Level
        dbData.products = dbData.products.map(p => {
          if (p.sku === item.sku && p.branchId === payload.transaction.branchId) {
            const nextStock = p.stock - item.qty;
            if (nextStock <= p.minStock) {
              triggerStockNotification(dbData, p, nextStock);
            }
            return { ...p, stock: nextStock };
          }
          return p;
        });

        // Add to Stock logs
        dbData.stocks.unshift({
          id: 'st_t_' + Date.now() + '_' + Math.random().toString(36).substring(4),
          sku: item.sku,
          branchId: payload.transaction.branchId,
          type: 'OUT',
          qty: item.qty,
          notes: `Penjualan ${payload.transaction.id}`,
          date: new Date().toISOString(),
          user: payload.transaction.cashierName
        });
      });

      // Add to Cashflow
      dbData.cashflows.unshift({
        id: 'cf_t_' + Date.now(),
        date: new Date().toISOString(),
        type: 'INCOME',
        category: 'Sales',
        amount: payload.transaction.finalAmount,
        description: `Penjualan transaksi ${payload.transaction.id}`,
        branchId: payload.transaction.branchId,
        user: payload.transaction.cashierName
      });

      // Handle points rewards if customer id is present
      if (payload.transaction.customerId) {
        dbData.customers = dbData.customers.map(c => {
          if (c.id === payload.transaction.customerId) {
            const pointsEarned = Math.floor(payload.transaction.finalAmount / 10000);
            const nextPoints = c.point + pointsEarned;
            let nextRank = c.memberRank;
            if (nextPoints > 1000) nextRank = 'PLATINUM';
            else if (nextPoints > 500) nextRank = 'GOLD';
            else if (nextPoints > 150) nextRank = 'SILVER';
            return { ...c, point: nextPoints, memberRank: nextRank };
          }
          return c;
        });
      }

      addAuditLog(dbData, 'TRANSACTION_CREATED', `Transaksi baru ID: ${payload.transaction.id} Total: Rp ${payload.transaction.finalAmount.toLocaleString()}`);
      saveDb(dbData);
      return true;
    }

    case 'addCustomer': {
      const newCustomer = {
        ...payload,
        id: 'c_' + Date.now(),
        point: 0,
        memberRank: 'REGULAR'
      };
      dbData.customers.push(newCustomer);
      addAuditLog(dbData, 'ADD_CUSTOMER', `Registrasi member baru: ${payload.name}`);
      saveDb(dbData);
      return newCustomer;
    }

    case 'addSupplier': {
      const newSupplier = { ...payload, id: 's_' + Date.now() };
      dbData.suppliers.push(newSupplier);
      addAuditLog(dbData, 'ADD_SUPPLIER', `Registrasi supplier baru: ${payload.name}`);
      saveDb(dbData);
      return newSupplier;
    }

    case 'addCashflow': {
      const entry = {
        ...payload,
        id: 'cf_' + Date.now(),
        date: new Date().toISOString()
      };
      dbData.cashflows.unshift(entry);
      addAuditLog(dbData, 'FINANCE_ENTRY', `Log Keuangan [${payload.type}] ${payload.category}: Rp ${payload.amount.toLocaleString()}`);
      saveDb(dbData);
      return entry;
    }

    case 'addPurchase': {
      const entry = {
        ...payload,
        id: 'pur_' + Date.now()
      };
      dbData.purchases.unshift(entry);
      addAuditLog(dbData, 'PURCHASE_ORDER', `PO baru: ${payload.code} Rp ${payload.totalAmount.toLocaleString()}`);
      saveDb(dbData);
      return entry;
    }

    case 'receivePurchase': {
      let pFound: any | undefined;
      dbData.purchases = dbData.purchases.map(p => {
        if (p.id === payload.id) {
          pFound = { ...p, status: 'RECEIVED' };
          return pFound;
        }
        return p;
      });
      if (pFound) {
        // Trigger stock update for items
        pFound.items.forEach((item: any) => {
          // Re-triggering standard stock mutation logic on server
          const nextId = 'st_' + Date.now() + Math.random().toString(36).substring(4);
          const newLog = {
            id: nextId,
            sku: item.sku,
            branchId: pFound.branchId,
            type: 'IN',
            qty: item.qty,
            notes: `Penerimaan PO ${pFound.code}`,
            date: new Date().toISOString(),
            user: payload.userId || 'admin'
          };
          dbData.stocks.push(newLog);

          dbData.products = dbData.products.map(p => {
            if (p.sku === item.sku && p.branchId === pFound.branchId) {
              const nextStock = p.stock + item.qty;
              return { ...p, stock: nextStock };
            }
            return p;
          });
        });

        // Add to expense cashflow
        dbData.cashflows.unshift({
          id: 'cf_p_' + Date.now(),
          date: new Date().toISOString(),
          type: 'EXPENSE',
          category: 'Purchase PO',
          amount: pFound.totalAmount,
          description: `Penerimaan Barang PO ${pFound.code}`,
          branchId: pFound.branchId,
          user: 'admin'
        });

        addAuditLog(dbData, 'RECEIVE_GOODS', `Barang PO ${pFound.code} berhasil diterima`);
        saveDb(dbData);
        return true;
      }
      return false;
    }

    case 'addAuditLog': {
      addAuditLog(dbData, payload.action, payload.details, payload.userId, payload.username);
      saveDb(dbData);
      return true;
    }

    case 'readNotification': {
      dbData.notifications = dbData.notifications.map(n => 
        n.id === payload.id ? { ...n, read: true } : n
      );
      saveDb(dbData);
      return true;
    }

    default:
      return null;
  }
}
