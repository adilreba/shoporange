// API Configuration
const DEFAULT_API_URL = 'https://your-api-gateway-url.execute-api.eu-west-1.amazonaws.com/prod';
const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

// Mock kullanıcılar (development/demo için)
const MOCK_USERS = [
  {
    id: 'admin-1',
    email: 'admin@atushome.com',
    password: 'admin123',
    name: 'Admin Kullanıcı',
    role: 'admin',
    phone: '+90 555 999 8888',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [],
    createdAt: '2024-01-01'
  },
  {
    id: 'user-1',
    email: 'test@example.com',
    password: 'password123',
    name: 'Test Kullanıcı',
    role: 'user',
    phone: '+90 555 123 4567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [
      {
        id: 'addr-1',
        title: 'Ev',
        fullName: 'Test Kullanıcı',
        phone: '+90 555 123 4567',
        city: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Moda',
        addressLine: 'Moda Caddesi No:123 D:5',
        zipCode: '34710',
        isDefault: true
      }
    ],
    createdAt: '2024-01-01'
  }
];

// Geliştirme/test için Mock mode AÇIK
// NOT: Production'da false yapılmalı ve AWS Cognito kullanılmalı
const FORCE_MOCK_MODE = true;

// Check if using mock API (no real backend configured)
const isMockMode = () => {
  // Force mock mode aktifse her zaman true döndür
  if (FORCE_MOCK_MODE) return true;
  
  const envUrl = import.meta.env.VITE_API_URL;
  return !envUrl || envUrl === DEFAULT_API_URL || envUrl === '';
};

// Helper function for API calls
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Eğer mock mode aktifse, gerçek API çağrısı yapma
  if (isMockMode()) {
    throw new Error('Mock mode aktif - fetchApi kullanılamaz');
  }
  
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
// Auth API (with Mock Support)
// ====================
export const authApi = {
  login: async (email: string, password: string) => {
    // Mock mode - local authentication
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      // Önce tanımlı mock kullanıcılara bak
      let user = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      // Tanımlı kullanıcı yoksa ve geçerli email/şifre formatındaysa yeni kullanıcı oluştur
      if (!user && email.includes('@') && password.length >= 6) {
        user = {
          id: `user-${Date.now()}`,
          email: email,
          password: password,
          name: email.split('@')[0],
          role: 'user',
          phone: '',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
          address: [],
          createdAt: new Date().toISOString()
        };
        MOCK_USERS.push(user);
      }
      
      if (!user) {
        throw new Error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
      
      // Don't send password in response
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        token: `mock_token_${user.id}_${Date.now()}`,
        user: userWithoutPassword
      };
    }
    
    // Real API mode
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if email already exists
      if (MOCK_USERS.some(u => u.email === data.email)) {
        throw new Error('Bu e-posta adresi zaten kayıtlı.');
      }
      
      const newUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'user',
        phone: data.phone || '',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        address: [],
        createdAt: new Date().toISOString()
      };
      
      MOCK_USERS.push(newUser);
      
      const { password: _, ...userWithoutPassword } = newUser;
      
      return {
        token: `mock_token_${newUser.id}_${Date.now()}`,
        user: userWithoutPassword
      };
    }
    
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { success: true };
    }
    
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },

  verifyToken: async (token: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Extract user ID from mock token
      const match = token.match(/mock_token_(.+?)_/);
      if (!match) {
        throw new Error('Geçersiz token');
      }
      
      const userId = match[1];
      const user = MOCK_USERS.find(u => u.id === userId);
      
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      return { user: userWithoutPassword };
    }
    
    return fetchApi('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  forgotPassword: async (email: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user) {
        throw new Error('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
      }
      
      return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' };
    }
    
    return fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Şifreniz başarıyla güncellendi.' };
    }
    
    return fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  socialLogin: async (provider: 'google' | 'facebook', token: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For demo, create or return a mock user for social login
      const mockSocialUser = {
        id: `social-${provider}-${Date.now()}`,
        email: `demo@${provider}.com`,
        name: `${provider} Kullanıcı`,
        role: 'user',
        phone: '',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        address: [],
        createdAt: new Date().toISOString()
      };
      
      return {
        token: `mock_token_${mockSocialUser.id}_${Date.now()}`,
        user: mockSocialUser
      };
    }
    
    return fetchApi(`/auth/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};

// ====================
// Categories API
// ====================
export const categoriesApi = {
  getAll: () => fetchApi('/categories'),
  getBySlug: (slug: string) => fetchApi(`/categories/${slug}`),
  getById: (id: string) => fetchApi(`/categories/${id}`),
};

// ====================
// Reviews API
// ====================
export const reviewsApi = {
  getByProduct: (productId: string) =>
    fetchApi(`/reviews?productId=${productId}`),

  getByUser: (userId: string) =>
    fetchApi(`/reviews?userId=${userId}`),

  create: (data: {
    productId: string;
    rating: number;
    comment: string;
    userName: string;
  }) =>
    fetchApi('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markHelpful: (reviewId: string) =>
    fetchApi(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
    }),

  delete: (reviewId: string) =>
    fetchApi(`/reviews/${reviewId}`, {
      method: 'DELETE',
    }),
};

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
    customer?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  
  update: (id: string, order: any) => fetchApi(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(order),
  }),

  updateStatus: (id: string, status: string) => fetchApi(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
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

// ====================
// Stock API
// ====================
export { stockApi } from './stockApi';

// ====================
// Generic API (for admin pages)
// ====================
export const api = {
  get: (endpoint: string) => fetchApi(endpoint),
  post: (endpoint: string, data: any) => fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint: string, data: any) => fetchApi(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint: string) => fetchApi(endpoint, {
    method: 'DELETE',
  }),
};

// Chat API URLs
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'https://tfc7anixgd.execute-api.eu-west-1.amazonaws.com/prod';
const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL || 'wss://jjhtiwu2j9.execute-api.eu-west-1.amazonaws.com/prod';

// Chat API
export const chatApi = {
  // Create agent request
  requestAgent: async (data: { userId: string; userName: string; userEmail: string }) => {
    const response = await fetch(`${CHAT_API_URL}/chat/request-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Agent request failed');
    return response.json();
  },

  // Get waiting sessions
  getWaitingSessions: async () => {
    const response = await fetch(`${CHAT_API_URL}/chat/waiting`);
    if (!response.ok) throw new Error('Failed to fetch waiting sessions');
    return response.json();
  },

  // Assign agent to session
  assignAgent: async (sessionId: string, agentId: string) => {
    const response = await fetch(`${CHAT_API_URL}/chat/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, agentId }),
    });
    if (!response.ok) throw new Error('Failed to assign agent');
    return response.json();
  },

  // WebSocket URL
  getWebSocketUrl: () => CHAT_WS_URL,
};
