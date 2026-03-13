// ==================== USER TYPES ====================
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  address?: Address[];
  createdAt: string;
  role: 'user' | 'admin';
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
  sku: string;
  stock: number;
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
