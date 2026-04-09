import { getIdToken, MOCK_USERS as AuthStoreMockUsers } from '@/stores/authStore';
import { hashPassword, verifyPassword } from '@/utils/security';

// API Configuration
const DEFAULT_API_URL = 'https://your-api-gateway-url.execute-api.eu-west-1.amazonaws.com/prod';
const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

// Mock kullanıcılar - authStore.ts'den al, böylece her yerde aynı dizi olur
const MOCK_USERS = AuthStoreMockUsers as any[];

// Mock kullanıcıları initialize et (bcrypt hash ile)
async function initializeMockUsers() {
  if (MOCK_USERS.length > 0) return; // Zaten initialize edilmiş
  
  // Admin kullanıcısı
  MOCK_USERS.push({
    id: 'admin-1',
    email: 'admin@atushome.com',
    password: await hashPassword('admin123'), // bcrypt hash
    name: 'Admin Kullanıcı',
    role: 'admin',
    phone: '+90 555 999 8888',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [],
    createdAt: '2024-01-01',
    isActive: true,
    deletedAt: null,
    deletedBy: null,
  });
  
  // Test kullanıcısı
  MOCK_USERS.push({
    id: 'user-1',
    email: 'test@example.com',
    password: await hashPassword('password123'), // bcrypt hash
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
    createdAt: '2024-01-01',
    isActive: true,
    deletedAt: null,
    deletedBy: null,
  });
}

// Geliştirme/test için Mock mode - VITE_FORCE_MOCK_MODE=true ile aktif edilir
// NOT: Production'da bu env var undefined veya false olmalı
const FORCE_MOCK_MODE = import.meta.env.VITE_FORCE_MOCK_MODE === 'true';

// Check if using mock API (no real backend configured)
export const isMockMode = () => {
  // Force mock mode aktifse her zaman true döndür
  if (FORCE_MOCK_MODE) return true;
  
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '' || envUrl === DEFAULT_API_URL) return true;
  // Placeholder URL iceriyorsa mock mode
  if (envUrl.includes('your-api-gateway-url')) return true;
  
  return false;
};

// Helper function for API calls
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Eğer mock mode aktifse, gerçek API çağrısı yapma
  if (isMockMode()) {
    throw new Error('Mock mode aktif - fetchApi kullanılamaz');
  }
  
  // Get Cognito ID token for authorization
  const token = await getIdToken();
  
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
    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      // Trigger auth refresh by throwing specific error
      const error = new Error('UNAUTHORIZED');
      (error as any).status = 401;
      throw error;
    }
    
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ====================
// Auth API (with Mock Support)
// ====================
// Mock auth helpers
const mockLogin = async (email: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Initialize mock users with bcrypt hashes
  await initializeMockUsers();
  
  // Kullanıcıyı email ile bul
  const user = MOCK_USERS.find(u => u.email === email);
  
  if (!user) {
    throw new Error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
  }
  
  // Şifreyi doğrula (bcrypt)
  const isPasswordValid = await verifyPassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return { token: `mock_token_${user.id}_${Date.now()}`, user: userWithoutPassword };
};

const mockRegister = async (data: { email: string; password: string; name: string; phone?: string }) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Initialize mock users
  await initializeMockUsers();
  
  if (MOCK_USERS.some(u => u.email === data.email)) {
    throw new Error('Bu e-posta adresi zaten kayıtlı.');
  }
  
  // Şifreyi hashle (bcrypt)
  const hashedPassword = await hashPassword(data.password);
  
  const newUser = {
    id: `user-${Date.now()}`,
    email: data.email,
    password: hashedPassword,
    name: data.name,
    role: 'user',
    phone: data.phone || '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [],
    createdAt: new Date().toISOString()
  };
  MOCK_USERS.push(newUser);
  const { password: _, ...userWithoutPassword } = newUser;
  return { token: `mock_token_${newUser.id}_${Date.now()}`, user: userWithoutPassword };
};

const mockVerifyToken = async (token: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const match = token.match(/mock_token_(.+?)_/);
  if (!match) throw new Error('Geçersiz token');
  const userId = match[1];
  const user = MOCK_USERS.find(u => u.id === userId);
  if (!user) throw new Error('Kullanıcı bulunamadı');
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
};

export const authApi = {
  login: async (email: string, password: string) => {
    if (isMockMode()) return mockLogin(email, password);
    try {
      return await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      console.warn('Real auth/login failed, falling back to mock:', error);
      return mockLogin(email, password);
    }
  },

  register: async (data: { email: string; password: string; name: string; phone?: string }) => {
    if (isMockMode()) return mockRegister(data);
    try {
      return await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Real auth/register failed, falling back to mock:', error);
      return mockRegister(data);
    }
  },

  logout: async () => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { success: true };
    }
    try {
      return await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      return { success: true };
    }
  },

  verifyToken: async (token: string) => {
    if (isMockMode()) return mockVerifyToken(token);
    try {
      return await fetchApi('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      console.warn('Real auth/verify failed, falling back to mock:', error);
      return mockVerifyToken(token);
    }
  },

  forgotPassword: async (email: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user) throw new Error('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
      return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' };
    }
    try {
      return await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' };
    }
  },

  resetPassword: async (token: string, password: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Şifreniz başarıyla güncellendi.' };
    }
    try {
      return await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
    } catch (error) {
      return { message: 'Şifreniz başarıyla güncellendi.' };
    }
  },

  socialLogin: async (provider: 'google' | 'facebook', token: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
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
      return { token: `mock_token_${mockSocialUser.id}_${Date.now()}`, user: mockSocialUser };
    }
    try {
      return await fetchApi(`/auth/${provider}`, {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    } catch (error) {
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
      return { token: `mock_token_${mockSocialUser.id}_${Date.now()}`, user: mockSocialUser };
    }
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
  getProfile: async () => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { name: 'Test Kullanıcı', email: 'test@example.com', phone: '+90 555 123 4567', address: [] };
    }
    try {
      return await fetchApi('/users/me');
    } catch (error) {
      console.warn('Real users/me GET failed, falling back to mock:', error);
      return { name: 'Test Kullanıcı', email: 'test@example.com', phone: '+90 555 123 4567', address: [] };
    }
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: any }) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { ...data, updatedAt: new Date().toISOString() };
    }
    try {
      return await fetchApi('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Real users/me PUT failed, falling back to mock:', error);
      return { ...data, updatedAt: new Date().toISOString() };
    }
  },

  // Soft delete - kullanıcıyı pasif yapar (veriyi silmez)
  softDelete: async (userId: string, adminId?: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      if (userIndex === -1) throw new Error('Kullanıcı bulunamadı');
      
      MOCK_USERS[userIndex] = {
        ...MOCK_USERS[userIndex],
        isActive: false,
        deletedAt: new Date().toISOString(),
        deletedBy: adminId || null,
      };
      return { success: true, message: 'Kullanıcı başarıyla pasif yapıldı' };
    }
    try {
      return await fetchApi(`/users/${userId}/soft-delete`, {
        method: 'PUT',
        body: JSON.stringify({ adminId }),
      });
    } catch (error) {
      console.error('Soft delete failed:', error);
      throw error;
    }
  },

  // Kullanıcıyı geri aktif et
  restore: async (userId: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      if (userIndex === -1) throw new Error('Kullanıcı bulunamadı');
      
      MOCK_USERS[userIndex] = {
        ...MOCK_USERS[userIndex],
        isActive: true,
        deletedAt: null,
        deletedBy: null,
      };
      return { success: true, message: 'Kullanıcı başarıyla aktif edildi' };
    }
    try {
      return await fetchApi(`/users/${userId}/restore`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  },

  // Silinmiş kullanıcıları listele (sadece admin)
  getDeletedUsers: async () => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const deletedUsers = MOCK_USERS.filter(u => u.isActive === false);
      return { data: deletedUsers.map(u => {
        const { password, ...rest } = u as any;
        return rest;
      })};
    }
    return fetchApi('/admin/users/deleted');
  },

  // Kullanıcı rolünü güncelle (sadece admin/super_admin)
  updateRole: async (userId: string, newRole: string) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('[updateRole] START - userId:', userId, 'newRole:', newRole);
      console.log('[updateRole] api.ts MOCK_USERS count:', MOCK_USERS.length);
      
      // 1. api.ts MOCK_USERS'u güncelle
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      console.log('[updateRole] Found in api.ts MOCK_USERS at index:', userIndex);
      if (userIndex !== -1) {
        console.log('[updateRole] BEFORE:', MOCK_USERS[userIndex]);
        MOCK_USERS[userIndex] = {
          ...MOCK_USERS[userIndex],
          role: newRole,
        };
        console.log('[updateRole] AFTER:', MOCK_USERS[userIndex]);
      }
      
      // 2. authStore MOCK_USERS'u da güncelle (BUNU localStorage'dan ÖNCE yap)
      const { MOCK_USERS: authStoreMockUsers, refreshUserFromMock } = await import('@/stores/authStore');
      console.log('[updateRole] authStore MOCK_USERS count:', authStoreMockUsers.length);
      const authStoreIndex = authStoreMockUsers.findIndex((u: any) => u.id === userId);
      console.log('[updateRole] Found in authStore MOCK_USERS at index:', authStoreIndex);
      if (authStoreIndex !== -1) {
        console.log('[updateRole] authStore BEFORE:', authStoreMockUsers[authStoreIndex]);
        authStoreMockUsers[authStoreIndex] = {
          ...authStoreMockUsers[authStoreIndex],
          role: newRole,
        };
        console.log('[updateRole] authStore AFTER:', authStoreMockUsers[authStoreIndex]);
      }
      
      // 3. localStorage'daki kullanıcıyı güncelle
      try {
        const saved = localStorage.getItem('google-users');
        console.log('[updateRole] google-users in localStorage:', saved ? 'found' : 'not found');
        if (saved) {
          const googleUsers = JSON.parse(saved);
          const googleUserIndex = googleUsers.findIndex((u: any) => u.id === userId);
          console.log('[updateRole] Found in google-users at index:', googleUserIndex);
          if (googleUserIndex !== -1) {
            googleUsers[googleUserIndex] = {
              ...googleUsers[googleUserIndex],
              role: newRole,
            };
            localStorage.setItem('google-users', JSON.stringify(googleUsers));
            console.log('[updateRole] google-users updated in localStorage');
          }
        }
      } catch (e) {
        console.log('[updateRole] localStorage güncelleme hatası:', e);
      }
      
      // 4. Eğer güncellenen kullanıcı mevcut login olmuş kullanıcıysa, user state'ini de güncelle
      refreshUserFromMock();
      
      if (userIndex === -1 && authStoreIndex === -1) {
        console.log('[updateRole] ERROR: User not found in any MOCK_USERS');
        throw new Error('Kullanıcı bulunamadı');
      }
      
      console.log('[updateRole] SUCCESS');
      return { success: true, message: 'Rol güncellendi' };
    }
    try {
      return await fetchApi(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
    } catch (error) {
      console.error('Role update failed:', error);
      throw error;
    }
  },
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
  get: async (endpoint: string) => {
    // Mock mode'da /admin/users isteği
    if (isMockMode() && endpoint === '/admin/users') {
      await new Promise(resolve => setTimeout(resolve, 300));
      // MOCK_USERS'tan şifreleri çıkararak döndür
      const usersWithoutPasswords = MOCK_USERS.map(user => {
        const { password, ...userWithoutPassword } = user as any;
        return userWithoutPassword;
      });
      return { data: usersWithoutPasswords };
    }
    return fetchApi(endpoint);
  },
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
const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL || 'wss://faj6241vp7.execute-api.eu-west-1.amazonaws.com/prod';

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
