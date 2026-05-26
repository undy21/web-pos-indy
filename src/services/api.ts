import { MockDatabase } from './mockDb';
import { Product, Transaction, TransactionItem, Customer, Supplier, Purchase, CashFlow, AuditLog, User, Role, StockLog, Voucher, NotificationItem, Branch } from '../types';

export class ApiService {
  private static isServerAvailable: boolean | null = null;

  private static async checkServerAvailability(): Promise<boolean> {
    if (this.isServerAvailable !== null) return this.isServerAvailable;
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json();
      this.isServerAvailable = data && data.status === 'ok';
    } catch (e) {
      this.isServerAvailable = false;
    }
    return this.isServerAvailable;
  }

  private static get url(): string {
    return localStorage.getItem('pos_apps_script_url') || ((import.meta as any).env.VITE_GAS_DEPLOYMENT_URL as string) || '';
  }

  static isConnectedToGoogleSheets(): boolean {
    return !!this.url;
  }

  static async request<T>(action: string, payload?: any): Promise<T> {
    if (!this.isConnectedToGoogleSheets()) {
      const serverAlive = await this.checkServerAvailability();
      if (!serverAlive) {
        return this.handleLocalRequest(action, payload);
      }

      try {
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, payload }),
        });
        const resData = await response.json();
        if (resData.status === 'error') {
          throw new Error(resData.message);
        }
        return resData.data as T;
      } catch (err: any) {
        console.error(`Failed Server DB Request [${action}]. Falling back to client state:`, err);
        return this.handleLocalRequest(action, payload);
      }
    }

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Bypass preflight trigger in GAS Web Apps
        },
        body: JSON.stringify({ action, payload }),
      });
      const data = await response.json();
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      return data.data as T;
    } catch (err: any) {
      console.warn(`Failed GAS Web App Request [${action}]:`, err, `- Falling back to server database or client-side storage`);
      const serverAlive = await this.checkServerAvailability();
      if (!serverAlive) {
        return this.handleLocalRequest(action, payload);
      }

      try {
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, payload }),
        });
        const resData = await response.json();
        if (resData.status === 'error') {
          throw new Error(resData.message);
        }
        return resData.data as T;
      } catch (innerErr: any) {
        console.error(`Failed fallback Server DB Request [${action}]. Falling back to client state:`, innerErr);
        return this.handleLocalRequest(action, payload);
      }
    }
  }

  // Fallback to SQLite/LocalStorage simulated state
  private static handleLocalRequest(action: string, payload?: any): any {
    MockDatabase.init();

    switch (action) {
      case 'getBranches':
        return MockDatabase.getBranches();
      case 'getProducts':
        return MockDatabase.getProducts();
      case 'getCustomers':
        return MockDatabase.getCustomers();
      case 'getSuppliers':
        return MockDatabase.getSuppliers();
      case 'getVouchers':
        return MockDatabase.getVouchers();
      case 'getTransactions':
        return MockDatabase.getTransactions();
      case 'getTransactionItems':
        return MockDatabase.getTransactionItems();
      case 'getStocks':
        return MockDatabase.getStocks();
      case 'getCashflows':
        return MockDatabase.getCashflows();
      case 'getPurchases':
        return MockDatabase.getPurchases();
      case 'getNotifications':
        return MockDatabase.getNotifications();
      case 'getAuditLogs':
        return MockDatabase.getAuditLogs();
      case 'getUsers':
        return MockDatabase.getUsers();

      case 'addProduct': {
        const products = MockDatabase.getProducts();
        products.push(payload);
        MockDatabase.set('products', products);
        this.addAuditLog('ADD_PRODUCT', `Menambahkan produk baru SKU: ${payload.sku}`);
        return payload;
      }
      case 'updateProduct': {
        let products = MockDatabase.getProducts();
        products = products.map(p => (p.sku === payload.sku && p.branchId === payload.branchId) ? { ...p, ...payload } : p);
        MockDatabase.set('products', products);
        this.addAuditLog('UPDATE_PRODUCT', `Update produk SKU: ${payload.sku} Cabang: ${payload.branchId}`);
        return payload;
      }
      case 'deleteProduct': {
        let products = MockDatabase.getProducts();
        products = products.filter(p => !(p.sku === payload.sku && p.branchId === payload.branchId));
        MockDatabase.set('products', products);
        this.addAuditLog('DELETE_PRODUCT', `Menghapus produk SKU: ${payload.sku} Cabang: ${payload.branchId}`);
        return true;
      }

      case 'addStockLog': {
        const logs = MockDatabase.getStocks();
        const nextId = 'st_' + Date.now();
        const newLog: StockLog = { ...payload, id: nextId, date: new Date().toISOString() };
        logs.push(newLog);
        MockDatabase.set('stocks', logs);

        // Update product stock level in current branch
        let products = MockDatabase.getProducts();
        products = products.map(p => {
          if (p.sku === payload.sku && p.branchId === payload.branchId) {
            let nextStock = p.stock;
            if (payload.type === 'IN') nextStock += payload.qty;
            if (payload.type === 'OUT') nextStock -= payload.qty;
            if (payload.type === 'ADJUST') nextStock = payload.qty;
            // Handle limits and notifications
            if (nextStock <= p.minStock) {
              this.triggerStockNotification(p, nextStock);
            }
            return { ...p, stock: nextStock };
          }
          return p;
        });
        MockDatabase.set('products', products);
        this.addAuditLog('STOCK_MUTATION', `Mutasi stok ${payload.type} SKU: ${payload.sku} Qty: ${payload.qty}`);
        return newLog;
      }

      case 'addTransaction': {
        const transactions = MockDatabase.getTransactions();
        const transactionItems = MockDatabase.getTransactionItems();
        
        // Add Header
        transactions.unshift(payload.transaction); // Unshift so it's sorted descending by default
        MockDatabase.set('transactions', transactions);

        // Add Items
        payload.items.forEach((item: TransactionItem) => {
          transactionItems.push(item);
          
          // Deduct Product Stock Level
          let products = MockDatabase.getProducts();
          products = products.map(p => {
            if (p.sku === item.sku && p.branchId === payload.transaction.branchId) {
              const nextStock = p.stock - item.qty;
              if (nextStock <= p.minStock) {
                this.triggerStockNotification(p, nextStock);
              }
              return { ...p, stock: nextStock };
            }
            return p;
          });
          MockDatabase.set('products', products);

          // Add to Stock logs
          const stocks = MockDatabase.getStocks();
          stocks.unshift({
            id: 'st_t_' + Date.now() + '_' + Math.random().toString(36).substring(4),
            sku: item.sku,
            branchId: payload.transaction.branchId,
            type: 'OUT',
            qty: item.qty,
            notes: `Penjualan ${payload.transaction.id}`,
            date: new Date().toISOString(),
            user: payload.transaction.cashierName
          });
          MockDatabase.set('stocks', stocks);
        });
        MockDatabase.set('transaction_items', transactionItems);

        // Add to Cashflow
        const cashflows = MockDatabase.getCashflows();
        cashflows.unshift({
          id: 'cf_t_' + Date.now(),
          date: new Date().toISOString(),
          type: 'INCOME',
          category: 'Sales',
          amount: payload.transaction.finalAmount,
          description: `Penjualan transaksi ${payload.transaction.id}`,
          branchId: payload.transaction.branchId,
          user: payload.transaction.cashierName
        });
        MockDatabase.set('cashflows', cashflows);

        // Handle points rewards if customer id is present
        if (payload.transaction.customerId) {
          let customers = MockDatabase.getCustomers();
          customers = customers.map(c => {
            if (c.id === payload.transaction.customerId) {
              // Rule: 1 point earned for every IDR 10,000 spent
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
          MockDatabase.set('customers', customers);
        }

        this.addAuditLog('TRANSACTION_CREATED', `Transaksi baru berhasil dibuat ID: ${payload.transaction.id} Total: Rp ${payload.transaction.finalAmount.toLocaleString()}`);
        return true;
      }

      case 'addCustomer': {
        const customers = MockDatabase.getCustomers();
        const newCustomer: Customer = {
          ...payload,
          id: 'c_' + Date.now(),
          point: 0,
          memberRank: 'REGULAR'
        };
        customers.push(newCustomer);
        MockDatabase.set('customers', customers);
        this.addAuditLog('ADD_CUSTOMER', `Registrasi member baru: ${payload.name}`);
        return newCustomer;
      }

      case 'addSupplier': {
        const suppliers = MockDatabase.getSuppliers();
        const newSupplier: Supplier = { ...payload, id: 's_' + Date.now() };
        suppliers.push(newSupplier);
        MockDatabase.set('suppliers', suppliers);
        this.addAuditLog('ADD_SUPPLIER', `Registrasi supplier baru: ${payload.name}`);
        return newSupplier;
      }

      case 'addCashflow': {
        const cashflows = MockDatabase.getCashflows();
        const entry: CashFlow = {
          ...payload,
          id: 'cf_' + Date.now(),
          date: new Date().toISOString()
        };
        cashflows.unshift(entry);
        MockDatabase.set('cashflows', cashflows);
        this.addAuditLog('FINANCE_ENTRY', `Log Keuangan [${payload.type}] ${payload.category}: Rp ${payload.amount.toLocaleString()}`);
        return entry;
      }

      case 'addPurchase': {
        const purchases = MockDatabase.getPurchases();
        const entry: Purchase = {
          ...payload,
          id: 'pur_' + Date.now()
        };
        purchases.unshift(entry);
        MockDatabase.set('purchases', purchases);
        this.addAuditLog('PURCHASE_ORDER', `PO baru: ${payload.code} Rp ${payload.totalAmount.toLocaleString()}`);
        return entry;
      }

      case 'receivePurchase': {
        let purchases = MockDatabase.getPurchases();
        let pFound: Purchase | undefined;
        purchases = purchases.map(p => {
          if (p.id === payload.id) {
            pFound = { ...p, status: 'RECEIVED' };
            return pFound;
          }
          return p;
        });
        if (pFound) {
          MockDatabase.set('purchases', purchases);
          
          // Trigger stock update for items
          pFound.items.forEach(item => {
            this.handleLocalRequest('addStockLog', {
              sku: item.sku,
              branchId: pFound!.branchId,
              type: 'IN',
              qty: item.qty,
              notes: `Penerimaan PO ${pFound!.code}`,
              user: payload.userId || 'admin'
            });
          });

          // Add to expense cashflow
          const cashflows = MockDatabase.getCashflows();
          cashflows.unshift({
            id: 'cf_p_' + Date.now(),
            date: new Date().toISOString(),
            type: 'EXPENSE',
            category: 'Purchase PO',
            amount: pFound.totalAmount,
            description: `Penerimaan Barang PO ${pFound.code}`,
            branchId: pFound.branchId,
            user: 'admin'
          });
          MockDatabase.set('cashflows', cashflows);

          this.addAuditLog('RECEIVE_GOODS', `Barang PO ${pFound.code} berhasil diterima`);
          return true;
        }
        return false;
      }

      case 'addAuditLog': {
        this.addAuditLog(payload.action, payload.details, payload.userId, payload.username);
        return true;
      }

      case 'getVouchers':
        return MockDatabase.getVouchers();
      
      case 'readNotification': {
        let notifs = MockDatabase.getNotifications();
        notifs = notifs.map(n => n.id === payload.id ? { ...n, read: true } : n);
        MockDatabase.set('notifications', notifs);
        return true;
      }

      default:
        return null;
    }
  }

  private static triggerStockNotification(product: Product, currentStock: number) {
    const notifs = MockDatabase.getNotifications();
    notifs.unshift({
      id: 'n_' + Date.now() + '_' + Math.random().toString(36).substring(4),
      type: 'STOCK_OUT_OF_BOUNDS',
      title: 'Stok Kritis!',
      message: `Produk "${product.name}" di cabang Anda sisa ${currentStock} porsi (minimum ${product.minStock}).`,
      timestamp: new Date().toISOString(),
      read: false
    });
    MockDatabase.set('notifications', notifs);
  }

  private static addAuditLog(action: string, details: string, userId?: string, username?: string) {
    const logs = MockDatabase.getAuditLogs();
    logs.unshift({
      id: 'al_' + Date.now(),
      userId: userId || 'u1',
      username: username || 'admin',
      action,
      ip: '127.0.0.1',
      timestamp: new Date().toISOString(),
      details
    });
    MockDatabase.set('audit_logs', logs);
  }
}

// Instantiate and export standard API object expected by App.tsx
import { ActivityLog } from '../types';

export const api = {
  setGasUrl(url: string): void {
    localStorage.setItem('pos_apps_script_url', url);
    localStorage.setItem('GAS_DEPLOYMENT_URL', url);
  },

  async fetchAllData() {
    MockDatabase.init(); // Make sure seed data exists on load
    const [
      products,
      customers,
      suppliers,
      vouchers,
      purchases,
      stocks,
      transactions,
      transactionItems,
      cashflows,
      auditLogs
    ] = await Promise.all([
      ApiService.request<Product[]>('getProducts'),
      ApiService.request<Customer[]>('getCustomers'),
      ApiService.request<Supplier[]>('getSuppliers'),
      ApiService.request<Voucher[]>('getVouchers'),
      ApiService.request<Purchase[]>('getPurchases'),
      ApiService.request<StockLog[]>('getStocks'),
      ApiService.request<Transaction[]>('getTransactions'),
      ApiService.request<TransactionItem[]>('getTransactionItems'),
      ApiService.request<CashFlow[]>('getCashflows'),
      ApiService.request<AuditLog[]>('getAuditLogs')
    ]);

    // Map AuditLog to ActivityLog structure expected by App.tsx
    const activityLogs: ActivityLog[] = (auditLogs || []).map((item, idx) => ({
      id: item.id || `al_${idx}`,
      timestamp: item.timestamp || new Date().toISOString(),
      user: item.username || 'System',
      role: Role.ADMIN,
      action: `${item.action} - ${item.details}`,
      branchId: 'b1',
      ip: item.ip || '127.0.0.1'
    }));

    return {
      products: products || [],
      customers: customers || [],
      suppliers: suppliers || [],
      vouchers: vouchers || [],
      purchases: purchases || [],
      stocks: stocks || [],
      transactions: transactions || [],
      transactionItems: transactionItems || [],
      cashflows: cashflows || [],
      activityLogs
    };
  },

  async submitCheckoutTrx(payload: { transaction: Transaction; items: TransactionItem[] }) {
    await ApiService.request('addTransaction', payload);
  },

  async addProduct(prod: Product) {
    await ApiService.request('addProduct', prod);
  },

  async updateProduct(prod: Product) {
    await ApiService.request('updateProduct', prod);
  },

  async deleteProduct(sku: string, branchId: string) {
    await ApiService.request('deleteProduct', { sku, branchId });
  },

  async submitStockMutation(payload: any) {
    await ApiService.request('addStockLog', payload);
  },

  async addCustomer(cust: Customer) {
    await ApiService.request('addCustomer', cust);
  },

  async addSupplier(sup: Supplier) {
    await ApiService.request('addSupplier', sup);
  },

  async addPurchase(po: Purchase) {
    await ApiService.request('addPurchase', po);
  },

  async receivePurchase(id: string, branchId: string) {
    await ApiService.request('receivePurchase', { id, branchId });
  },

  async addCashFlow(cf: any) {
    // Map properties from notes to description to ensure perfect database column synchronization
    await ApiService.request('addCashflow', {
      id: cf.id,
      date: cf.date || new Date().toISOString(),
      type: cf.type,
      category: cf.type === 'INCOME' ? 'Pemasukan Manual' : 'Beban Operasional',
      amount: cf.amount,
      description: cf.notes || cf.description || 'Pencatatan kas',
      branchId: cf.branchId,
      user: 'Kasir Utama'
    });
  },

  async saveActivityLog(log: ActivityLog) {
    await ApiService.request('addAuditLog', {
      action: log.action,
      details: `User Role: ${log.role} Branch: ${log.branchId}`
    });
  },

  async getUsers(): Promise<User[]> {
    return await ApiService.request<User[]>('getUsers');
  }
};
