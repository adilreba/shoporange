import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types';
import { authApi, userApi } from '@/services/api';

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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook', token?: string, _userData?: any) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<boolean>;
  removeAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  clearError: () => void;
  initAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('auth_token'),
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          set({ isLoading: true });
          // Token'ı doğrula ve kullanıcı bilgilerini al
          const response = await authApi.verifyToken(token);
          
          if (response.user) {
            set({ 
              user: response.user, 
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            // Token geçersiz
            localStorage.removeItem('auth_token');
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false,
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('auth_token');
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            isLoading: false 
          });
        }
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(credentials.email, credentials.password);
          
          if (response.token && response.user) {
            localStorage.setItem('auth_token', response.token);
            set({ 
              user: response.user, 
              token: response.token,
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            set({ 
              error: 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.', 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Giriş yapılırken bir hata oluştu';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register({
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone
          });
          
          if (response.token && response.user) {
            localStorage.setItem('auth_token', response.token);
            set({ 
              user: response.user, 
              token: response.token,
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            set({ 
              error: 'Kayıt başarısız oldu.', 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Kayıt olurken bir hata oluştu';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      logout: async () => {
        try {
          // Backend'e logout isteği gönder (opsiyonel)
          await authApi.logout().catch(() => {
            // Hata olsa bile devam et
          });
        } finally {
          localStorage.removeItem('auth_token');
          set({ 
            user: null, 
            token: null,
            isAuthenticated: false, 
            error: null 
          });
        }
      },

      socialLogin: async (provider: 'google' | 'facebook', token?: string, _userData?: any) => {
        set({ isLoading: true, error: null });
        
        try {
          if (!token) {
            set({ 
              error: 'Sosyal medya token bulunamadı', 
              isLoading: false 
            });
            return false;
          }
          
          const response = await authApi.socialLogin(provider, token);
          
          if (response.token && response.user) {
            localStorage.setItem('auth_token', response.token);
            set({ 
              user: response.user, 
              token: response.token,
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            set({ 
              error: `${provider} ile giriş başarısız oldu`, 
              isLoading: false 
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `${provider} ile giriş yapılırken hata oluştu`;
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await authApi.forgotPassword(email);
          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Şifre sıfırlama isteği gönderilirken hata oluştu';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await authApi.resetPassword(token, password);
          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Şifre sıfırlanırken hata oluştu';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return false;
        }
      },

      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        if (!user) return false;

        try {
          set({ isLoading: true });
          const updatedUser = await userApi.updateProfile(userData);
          set({ 
            user: { ...user, ...updatedUser },
            isLoading: false 
          });
          return true;
        } catch (error) {
          set({ 
            error: 'Profil güncellenirken hata oluştu',
            isLoading: false 
          });
          return false;
        }
      },

      addAddress: async (address: Omit<Address, 'id'>) => {
        const { user } = get();
        if (!user) return false;

        try {
          const newAddress = {
            ...address,
            id: `addr_${Date.now()}`
          };
          
          const updatedAddresses = [...(user.address || []), newAddress];
          
          // Backend'e adres ekleme isteği gönder
          await userApi.updateProfile({ address: updatedAddresses });
          
          set({ 
            user: { 
              ...user, 
              address: updatedAddresses 
            } 
          });
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
          
          // Backend'e adres silme isteği gönder
          await userApi.updateProfile({ address: updatedAddresses });
          
          set({ 
            user: { 
              ...user, 
              address: updatedAddresses 
            } 
          });
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
          
          // Backend'e güncelleme isteği gönder
          await userApi.updateProfile({ address: updatedAddresses });
          
          set({ 
            user: { 
              ...user, 
              address: updatedAddresses 
            } 
          });
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
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // Persist storage yeniden yüklenince token'ı localStorage'a yaz
        if (state?.token) {
          localStorage.setItem('auth_token', state.token);
        }
      }
    }
  )
);

// Uygulama başladığında auth'u initialize et (App.tsx'te kullanılacak)
export const initializeAuth = async () => {
  await useAuthStore.getState().initAuth();
};
