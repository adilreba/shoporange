import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types';
import * as cognito from '@/services/cognito';
import * as googleAuth from '@/services/googleAuth';
import { checkPasswordStrength, isValidEmail, ClientRateLimiter } from '@/utils/security';

// Rate limiters for auth operations
const loginRateLimiter = new ClientRateLimiter();
const registerRateLimiter = new ClientRateLimiter();

// Mock kullanıcılar (demo için)
const MOCK_USERS = [
  {
    id: 'superadmin-1',
    email: 'superadmin@atushome.com',
    password: 'superadmin123',
    name: 'Super Admin',
    role: 'super_admin',
    phone: '+90 555 999 0000',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [],
    createdAt: '2024-01-01'
  },
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

// Mock mode kontrolü
const FORCE_MOCK_MODE = import.meta.env.VITE_FORCE_MOCK_MODE === 'true';
const isMockMode = () => {
  if (FORCE_MOCK_MODE) return true;
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '') return true;
  if (envUrl.includes('your-api-gateway-url')) return true;
  return false;
};

interface Address {
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

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsVerification: boolean;
  pendingVerificationEmail: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  verifyEmail: (code: string) => Promise<boolean>;
  resendVerificationCode: () => Promise<boolean>;
  logout: () => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook', token?: string, userData?: any) => Promise<boolean>;
  googleSignIn: (credential: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<boolean>;
  removeAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  clearError: () => void;
  clearVerification: () => void;
  initAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, password: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

// Mock login fonksiyonu
const mockLogin = async (email: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  if (!user) {
    throw new Error('Geçersiz e-posta veya şifre');
  }
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    tokens: {
      accessToken: `mock_token_${user.id}`,
      idToken: `mock_id_token_${user.id}`,
      refreshToken: `mock_refresh_${user.id}`,
      expiresAt: Date.now() + 3600000,
    }
  };
};

// Mock register fonksiyonu
const mockRegister = async (data: { email: string; password: string; name: string; phone?: string }) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (MOCK_USERS.some(u => u.email === data.email)) {
    throw new Error('Bu e-posta adresi zaten kullanılıyor');
  }
  const newUser = {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role: 'user',
    phone: data.phone || '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    address: [],
    createdAt: new Date().toISOString()
  };
  MOCK_USERS.push({ ...newUser, password: data.password } as any);
  return {
    user: newUser,
    tokens: {
      accessToken: `mock_token_${newUser.id}`,
      idToken: `mock_id_token_${newUser.id}`,
      refreshToken: `mock_refresh_${newUser.id}`,
      expiresAt: Date.now() + 3600000,
    }
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      needsVerification: false,
      pendingVerificationEmail: null,

      initAuth: async () => {
        if (isMockMode()) {
          // Mock mode'da localStorage'dan kontrol et
          const saved = localStorage.getItem('auth-storage');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.state?.isAuthenticated) {
              set({ ...parsed.state });
            }
          }
          set({ isLoading: false });
          return;
        }

        // Gerçek Cognito auth
        try {
          set({ isLoading: true });
          const session = await cognito.getCurrentSession();
          
          if (session) {
            if (cognito.needsTokenRefresh(session.tokens)) {
              try {
                const newTokens = await cognito.refreshSession(session.tokens.refreshToken);
                set({ 
                  user: session.user as User, 
                  tokens: { ...session.tokens, ...newTokens },
                  isAuthenticated: true,
                  isLoading: false 
                });
              } catch (refreshError) {
                await cognito.signOut();
                set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
              }
            } else {
              set({ 
                user: session.user as User, 
                tokens: session.tokens,
                isAuthenticated: true,
                isLoading: false 
              });
            }
          } else {
            set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
        }
      },

      login: async (credentials: LoginCredentials) => {
        // Rate limiting - brute force protection
        if (!loginRateLimiter.check('login', 5, 300000)) { // 5 deneme, 5 dakika
          set({ 
            error: 'Çok fazla giriş denemesi. Lütfen 5 dakika sonra tekrar deneyin.',
            isLoading: false 
          });
          return false;
        }

        // Input validation
        if (!isValidEmail(credentials.email)) {
          set({ error: 'Geçersiz e-posta formatı', isLoading: false });
          return false;
        }

        set({ isLoading: true, error: null, needsVerification: false });
        
        try {
          let result;
          
          if (isMockMode()) {
            result = await mockLogin(credentials.email, credentials.password);
          } else {
            result = await cognito.signIn({
              email: credentials.email,
              password: credentials.password,
            });
          }
          
          set({ 
            user: result.user as User, 
            tokens: result.tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Login error:', error);
          const errorMessage = error.message || 'Giriş yapılırken bir hata oluştu';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        // Rate limiting
        if (!registerRateLimiter.check('register', 3, 3600000)) { // 3 deneme, 1 saat
          set({ 
            error: 'Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin.',
            isLoading: false 
          });
          return false;
        }

        // Email validation
        if (!isValidEmail(data.email)) {
          set({ error: 'Geçersiz e-posta formatı', isLoading: false });
          return false;
        }

        // Password strength validation
        const passwordCheck = checkPasswordStrength(data.password);
        if (!passwordCheck.valid) {
          set({ 
            error: `Şifre güvenlik gereksinimlerini karşılamıyor: ${passwordCheck.feedback.join(', ')}`,
            isLoading: false 
          });
          return false;
        }

        set({ isLoading: true, error: null, needsVerification: false });
        
        try {
          let result;
          
          if (isMockMode()) {
            result = await mockRegister(data);
          } else {
            await cognito.signUp({
              email: data.email,
              password: data.password,
              name: data.name,
              phone: data.phone,
            });
            set({ 
              needsVerification: true,
              pendingVerificationEmail: data.email,
              isLoading: false 
            });
            return true;
          }
          
          set({ 
            user: result.user as User, 
            tokens: result.tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Register error:', error);
          const errorMessage = error.message || 'Kayıt olurken bir hata oluştu';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      verifyEmail: async (code: string) => {
        const { pendingVerificationEmail } = get();
        
        if (!pendingVerificationEmail) {
          set({ error: 'Doğrulama e-postası bulunamadı' });
          return false;
        }
        
        if (isMockMode()) {
          set({ needsVerification: false, pendingVerificationEmail: null });
          return true;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await cognito.confirmSignUp(pendingVerificationEmail, code);
          set({ needsVerification: false, pendingVerificationEmail: null, isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Doğrulama başarısız oldu', isLoading: false });
          return false;
        }
      },

      resendVerificationCode: async () => {
        const { pendingVerificationEmail } = get();
        
        if (!pendingVerificationEmail) {
          set({ error: 'Doğrulama e-postası bulunamadı' });
          return false;
        }
        
        if (isMockMode()) {
          return true;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await cognito.resendConfirmationCode(pendingVerificationEmail);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Kod gönderilemedi', isLoading: false });
          return false;
        }
      },

      clearVerification: () => {
        set({ needsVerification: false, pendingVerificationEmail: null });
      },

      logout: async () => {
        if (!isMockMode()) {
          try {
            await cognito.globalSignOut();
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        set({ 
          user: null, 
          tokens: null,
          isAuthenticated: false, 
          error: null,
          needsVerification: false,
          pendingVerificationEmail: null
        });
      },

      refreshToken: async () => {
        if (isMockMode()) return true;
        
        const { tokens } = get();
        if (!tokens?.refreshToken) return false;
        
        try {
          const newTokens = await cognito.refreshSession(tokens.refreshToken);
          set({ tokens: { ...tokens, ...newTokens } });
          return true;
        } catch (error) {
          set({ user: null, tokens: null, isAuthenticated: false });
          return false;
        }
      },

      socialLogin: async (provider: 'google' | 'facebook', token?: string, userData?: any) => {
        set({ isLoading: true, error: null });
        
        try {
          if (!token) {
            set({ error: 'Sosyal medya token bulunamadı', isLoading: false });
            return false;
          }
          
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
            set({ 
              user: mockSocialUser as User, 
              tokens: {
                accessToken: `mock_token_${mockSocialUser.id}`,
                idToken: `mock_token_${mockSocialUser.id}`,
                refreshToken: `mock_refresh_${mockSocialUser.id}`,
                expiresAt: Date.now() + 3600000,
              },
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
          
          // Gerçek API çağrısı
          const API_URL = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${API_URL}/auth/${provider}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, user: userData }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `${provider} ile giriş başarısız`);
          }
          
          const data = await response.json();
          
          set({ 
            user: data.user, 
            tokens: {
              accessToken: data.accessToken,
              idToken: data.token,
              refreshToken: data.refreshToken,
              expiresAt: Date.now() + (data.expiresIn * 1000),
            },
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          const errorMessage = error.message || `${provider} ile giriş yapılırken hata oluştu`;
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },

      googleSignIn: async (credential: string) => {
        set({ isLoading: true, error: null });
        
        try {
          if (isMockMode()) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockGoogleUser = {
              id: `google-${Date.now()}`,
              email: 'google@demo.com',
              name: 'Google Kullanıcı',
              role: 'user',
              phone: '',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
              address: [],
              createdAt: new Date().toISOString()
            };
            set({ 
              user: mockGoogleUser as User, 
              tokens: {
                accessToken: `mock_token_${mockGoogleUser.id}`,
                idToken: `mock_token_${mockGoogleUser.id}`,
                refreshToken: `mock_refresh_${mockGoogleUser.id}`,
                expiresAt: Date.now() + 3600000,
              },
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          }
          
          const result = await googleAuth.signInWithGoogle(credential);
          
          set({ 
            user: result.user as User, 
            tokens: result.tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
          return true;
        } catch (error: any) {
          console.error('Google sign in error:', error);
          set({ error: error.message || 'Google ile giriş yapılırken hata oluştu', isLoading: false });
          return false;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        if (isMockMode()) {
          set({ isLoading: false });
          return true;
        }
        
        try {
          await cognito.forgotPassword(email);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ isLoading: false });
          return true; // Güvenlik için her zaman başarılı döndür
        }
      },

      resetPassword: async (email: string, code: string, password: string) => {
        set({ isLoading: true, error: null });
        
        if (isMockMode()) {
          set({ isLoading: false });
          return true;
        }
        
        try {
          await cognito.confirmForgotPassword(email, code, password);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Şifre sıfırlanamadı', isLoading: false });
          return false;
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        if (isMockMode()) {
          set({ isLoading: false });
          return true;
        }
        
        try {
          await cognito.changePassword(oldPassword, newPassword);
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({ error: error.message || 'Şifre değiştirilemedi', isLoading: false });
          return false;
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        if (!user) return false;

        try {
          set({ isLoading: true });
          set({ 
            user: { ...user, ...userData },
            isLoading: false 
          });
          return true;
        } catch (error) {
          set({ error: 'Profil güncellenirken hata oluştu', isLoading: false });
          return false;
        }
      },

      addAddress: async (address: Omit<Address, 'id'>) => {
        const { user } = get();
        if (!user) return false;

        try {
          const newAddress = { ...address, id: `addr_${Date.now()}` };
          const currentAddresses = user.address || [];
          const updatedAddresses = [...currentAddresses, newAddress];
          
          set({ user: { ...user, address: updatedAddresses } });
          return true;
        } catch (error) {
          set({ error: 'Adres eklenirken hata oluştu' });
          return false;
        }
      },

      removeAddress: async (addressId: string) => {
        const { user } = get();
        if (!user || !user.address) return false;

        try {
          const updatedAddresses = user.address.filter(a => a.id !== addressId);
          set({ user: { ...user, address: updatedAddresses } });
          return true;
        } catch (error) {
          set({ error: 'Adres silinirken hata oluştu' });
          return false;
        }
      },

      setDefaultAddress: async (addressId: string) => {
        const { user } = get();
        if (!user || !user.address) return false;

        try {
          const updatedAddresses = user.address.map(a => ({
            ...a,
            isDefault: a.id === addressId
          }));
          set({ user: { ...user, address: updatedAddresses } });
          return true;
        } catch (error) {
          set({ error: 'Varsayılan adres ayarlanırken hata oluştu' });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        needsVerification: state.needsVerification,
        pendingVerificationEmail: state.pendingVerificationEmail,
      }),
    }
  )
);

// Uygulama başladığında auth'u initialize et
export const initializeAuth = async () => {
  await useAuthStore.getState().initAuth();
};

// Get access token for API calls
export const getAccessToken = async (): Promise<string | null> => {
  if (isMockMode()) return 'mock_token';
  return cognito.getAccessToken();
};

// Get ID token for API calls
export const getIdToken = async (): Promise<string | null> => {
  if (isMockMode()) return 'mock_token';
  return cognito.getIdToken();
};
