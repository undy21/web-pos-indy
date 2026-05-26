export enum Role {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  branchId: string;
  active: boolean;
  password?: string;
}

export interface Product {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  memberPrice: number;
  stock: number;
  minStock: number;
  branchId: string;
  image: string;
  active: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface StockLog {
  id: string;
  sku: string;
  branchId: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  qty: number;
  notes: string;
  date: string;
  user: string;
}

export interface Transaction {
  id: string;
  date: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT' | 'MEMBER_POINTS';
  changeAmount: number;
  customerId?: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  sku: string;
  productName: string;
  price: number;
  qty: number;
  total: number;
  discount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  point: number;
  memberRank: 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM';
  notes: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
}

export interface Purchase {
  id: string;
  code: string; // PO-xxxxx
  supplierId: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  status: 'PENDING' | 'RECEIVED';
  branchId: string;
  items: Array<{
    sku: string;
    productName: string;
    qty: number;
    buyPrice: number;
  }>;
}

export interface CashFlow {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  branchId: string;
  user: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  type: 'STOCK_OUT_OF_BOUNDS' | 'DUE_DEBT' | 'NEW_LOGIN' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  ip: string;
  timestamp: string;
  details: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  branchId: string;
  ip: string;
}

export interface Voucher {
  code: string;
  type: 'PERCENT' | 'CASHBACK' | 'FIXED' | 'BUNDLING';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  active: boolean;
}
