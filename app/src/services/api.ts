// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-gateway-url.execute-api.eu-west-1.amazonaws.com/prod';

// Helper function for API calls
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ====================
// Products API
// ====================
export const productsApi = {
  getAll: (params?: { category?: string; search?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return fetchApi(`/products?${queryParams.toString()}`);
  },

  getById: (id: string) => fetchApi(`/products/${id}`),

  search: (query: string) => fetchApi(`/products/search?q=${encodeURIComponent(query)}`),
};

// ====================
// Cart API
// ====================
export const cartApi = {
  get: () => fetchApi('/cart'),

  addItem: (item: {
    productId: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
  }) => fetchApi('/cart', {
    method: 'POST',
    body: JSON.stringify(item),
  }),

  updateItem: (productId: string, quantity: number) => 
    fetchApi(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (productId: string) => 
    fetchApi(`/cart/${productId}`, {
      method: 'DELETE',
    }),

  clear: () => fetchApi('/cart', { method: 'DELETE' }),
};

// ====================
// Orders API
// ====================
export const ordersApi = {
  getAll: () => fetchApi('/orders'),

  getById: (id: string) => fetchApi(`/orders/${id}`),

  create: (order: {
    items: any[];
    total: number;
    shippingAddress: any;
    paymentMethod: string;
  }) => fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
};

// ====================
// User API
// ====================
export const userApi = {
  getProfile: () => fetchApi('/users/me'),

  updateProfile: (data: { name?: string; phone?: string; address?: any }) =>
    fetchApi('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ====================
// Payment API
// ====================
export const paymentApi = {
  createIntent: (amount: number, currency: string = 'try') =>
    fetchApi('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    }),
};

// ====================
// Verification API (Email, Phone, Address)
// ====================
export const verificationApi = {
  // Email verification
  sendEmailCode: (email: string, userId: string) =>
    fetchApi('/verify/email/send', {
      method: 'POST',
      body: JSON.stringify({ email, userId }),
    }),

  verifyEmailCode: (userId: string, otp: string) =>
    fetchApi('/verify/email/confirm', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    }),

  // Phone verification
  sendPhoneCode: (phone: string, userId: string) =>
    fetchApi('/verify/phone/send', {
      method: 'POST',
      body: JSON.stringify({ phone, userId }),
    }),

  verifyPhoneCode: (userId: string, otp: string) =>
    fetchApi('/verify/phone/confirm', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    }),

  // Address validation
  validateAddress: (address: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    addressLine: string;
    zipCode: string;
  }) =>
    fetchApi('/verify/address', {
      method: 'POST',
      body: JSON.stringify(address),
    }),
};
