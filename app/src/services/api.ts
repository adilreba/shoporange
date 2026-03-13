// AWS API Service Layer
// This service connects the frontend to AWS Lambda functions via API Gateway

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-gateway-url.execute-api.region.amazonaws.com/prod';

// CORS headers are handled by API Gateway
const headers = {
  'Content-Type': 'application/json',
};

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ==================== PRODUCTS API ====================

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  subcategory?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const productsApi = {
  // Get all products with optional filters
  getAll: (filters?: { category?: string; minPrice?: number; maxPrice?: number; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall<Product[]>(`/products${query}`);
  },

  // Get single product
  getById: (id: string) => apiCall<Product>(`/products/${id}`),

  // Create product (admin only)
  create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiCall<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  // Update product (admin only)
  update: (id: string, product: Partial<Product>) => 
    apiCall<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),

  // Delete product (admin only)
  delete: (id: string) => 
    apiCall<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== ORDERS API ====================

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const ordersApi = {
  // Get all orders (admin) or user orders
  getAll: (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return apiCall<Order[]>(`/orders${params}`);
  },

  // Get single order
  getById: (id: string) => apiCall<Order>(`/orders/${id}`),

  // Create order
  create: (order: Omit<Order, 'id' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt'>) => 
    apiCall<{ message: string; order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }),

  // Update order status (admin only)
  updateStatus: (id: string, status: Order['status']) => 
    apiCall<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// ==================== USERS API ====================

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

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  // Get user by ID
  getById: (id: string) => apiCall<User>(`/users/${id}`),

  // Get user by email
  getByEmail: (email: string) => apiCall<User>(`/users/email/${email}`),

  // Create user (register)
  create: (user: { email: string; name: string; password: string; phone?: string }) => 
    apiCall<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),

  // Update user
  update: (id: string, updates: Partial<User>) => 
    apiCall<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Add address
  addAddress: (userId: string, address: Omit<Address, 'id'>) => 
    apiCall<User>(`/users/${userId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(address),
    }),

  // Update address
  updateAddress: (userId: string, addressId: string, address: Partial<Address>) => 
    apiCall<User>(`/users/${userId}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    }),

  // Delete address
  deleteAddress: (userId: string, addressId: string) => 
    apiCall<User>(`/users/${userId}/addresses/${addressId}`, {
      method: 'DELETE',
    }),
};

// ==================== REVIEWS API ====================

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export const reviewsApi = {
  // Get reviews for a product
  getByProduct: (productId: string) => 
    apiCall<Review[]>(`/reviews?productId=${productId}`),

  // Get reviews by user
  getByUser: (userId: string) => 
    apiCall<Review[]>(`/reviews?userId=${userId}`),

  // Create review
  create: (review: Omit<Review, 'id' | 'helpful' | 'verified' | 'createdAt'>) => 
    apiCall<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    }),

  // Mark review as helpful
  markHelpful: (reviewId: string) => 
    apiCall<Review>(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
    }),

  // Delete review
  delete: (reviewId: string) => 
    apiCall<{ message: string }>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    }),
};

// ==================== CATEGORIES API ====================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  productCount: number;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export const categoriesApi = {
  // Get all categories
  getAll: () => apiCall<Category[]>('/categories'),

  // Get category by slug
  getBySlug: (slug: string) => apiCall<Category>(`/categories/${slug}`),

  // Create category (admin only)
  create: (category: Omit<Category, 'id' | 'productCount'>) => 
    apiCall<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),

  // Update category (admin only)
  update: (id: string, category: Partial<Category>) => 
    apiCall<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),

  // Delete category (admin only)
  delete: (id: string) => 
    apiCall<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== AUTH API ====================

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  // Login with email/password
  login: (email: string, password: string) => 
    apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Register
  register: (userData: { email: string; password: string; name: string; phone?: string }) => 
    apiCall<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Social login (Google/Facebook)
  socialLogin: (provider: 'google' | 'facebook', token: string) => 
    apiCall<AuthResponse>(`/auth/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // Verify token
  verifyToken: (token: string) => 
    apiCall<User>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // Forgot password
  forgotPassword: (email: string) => 
    apiCall<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Reset password
  resetPassword: (token: string, password: string) => 
    apiCall<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

export default {
  products: productsApi,
  orders: ordersApi,
  users: usersApi,
  reviews: reviewsApi,
  categories: categoriesApi,
  auth: authApi,
};
