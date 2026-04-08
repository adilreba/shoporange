// ==================== USER TYPES ====================
// RBAC - Role Based Access Control
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'support' | 'user';

// Permission/Yetki tipleri
export type Permission = 
  | 'users:view' | 'users:create' | 'users:edit' | 'users:delete'
  | 'products:view' | 'products:create' | 'products:edit' | 'products:delete'
  | 'orders:view' | 'orders:edit' | 'orders:cancel'
  | 'payments:view' | 'payments:refund'
  | 'content:view' | 'content:edit'
  | 'settings:view' | 'settings:edit'
  | 'chat:view' | 'chat:respond'
  | 'reports:view'
  | 'audit:view';

// Rol bazlı yetki haritası
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'products:view', 'products:create', 'products:edit', 'products:delete',
    'orders:view', 'orders:edit', 'orders:cancel',
    'payments:view', 'payments:refund',
    'content:view', 'content:edit',
    'settings:view', 'settings:edit',
    'chat:view', 'chat:respond',
    'reports:view',
    'audit:view',
  ],
  admin: [
    'users:view', 'users:create', 'users:edit',
    'products:view', 'products:create', 'products:edit', 'products:delete',
    'orders:view', 'orders:edit', 'orders:cancel',
    'payments:view',
    'content:view', 'content:edit',
    'settings:view',
    'chat:view', 'chat:respond',
    'reports:view',
  ],
  editor: [
    'products:view', 'products:edit',
    'content:view', 'content:edit',
    'orders:view',
  ],
  support: [
    'users:view',
    'orders:view', 'orders:edit',
    'chat:view', 'chat:respond',
  ],
  user: [],
};

// Rol isimleri (Türkçe)
export const ROLE_NAMES: Record<UserRole, string> = {
  super_admin: 'Süper Admin',
  admin: 'Admin',
  editor: 'Editör',
  support: 'Destek Temsilcisi',
  user: 'Müşteri',
};

// Rol renkleri (UI için)
export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-500',
  admin: 'bg-red-500',
  editor: 'bg-blue-500',
  support: 'bg-green-500',
  user: 'bg-gray-400',
};

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  address?: Address[];
  createdAt: string;
  role: UserRole;
  // Soft Delete fields
  isActive?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

// Yetki kontrolü yardımcı fonksiyonu
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

// Birden fazla yetki kontrolü (AND)
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(userRole, p));
}

// Birden fazla yetki kontrolü (OR)
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(userRole, p));
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  zipCode: string;
  isDefault: boolean;
}

// ==================== PRODUCT TYPES ====================
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: Category;
  subcategory?: string;
  brand: string;
  sku: string; // Stok Kodu (Stock Keeping Unit)
  barcode?: string; // EAN/UPC Barkod
  stock: number;
  stockCode?: string; // Depo/Stok yönetimi kodu
  supplierCode?: string; // Tedarikçi ürün kodu
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  features?: Record<string, string>;
  tags?: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  salesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  verified: boolean;
}

export type Category = 
  | 'elektronik'
  | 'moda'
  | 'ev-yasam'
  | 'kozmetik'
  | 'spor'
  | 'kitap'
  | 'oyuncak'
  | 'supermarket';

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
  image: string;
  productCount: number;
}

// ==================== CART TYPES ====================
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  discountAmount: number;
  shippingCost: number;
  finalPrice: number;
}

// ==================== ORDER TYPES ====================
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingCost: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

// ==================== WISHLIST & COMPARE TYPES ====================
export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export interface CompareItem {
  product: Product;
  addedAt: string;
}

// ==================== FILTER TYPES ====================
export interface ProductFilter {
  category?: Category;
  subcategory?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'popular' | 'rating';
  search?: string;
  inStock?: boolean;
  discount?: boolean;
}

// ==================== AUTH TYPES ====================
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// ==================== ADMIN TYPES ====================
export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  monthlySales: { month: string; amount: number }[];
  recentOrders: Order[];
  topProducts: Product[];
}

export interface AdminProductForm {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  subcategory: string;
  brand: string;
  stock: number;
  images: string[];
  features: Record<string, string>;
  tags: string[];
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
}

// ==================== PAYMENT TYPES ====================
export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

// ==================== NOTIFICATION TYPES ====================
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  createdAt: string;
}
