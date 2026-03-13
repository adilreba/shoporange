import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types';
import { mockUser, mockAdminUser } from '@/data/mockData';
import { authApi, usersApi } from '@/services/api';

// Check if API URL is configured
const API_URL = import.meta.env.VITE_API_URL;
const USE_AWS_API = API_URL && !API_URL.includes('your-api-gateway');

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
  logout: () => void;
  socialLogin: (provider: 'google' | 'facebook', token?: string, userData?: any) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<boolean>;
  removeAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  clearError: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initAuth: () => {
        const { token, user } = get();
        if (token && user) {
          // Verify token with backend if using AWS API
          if (USE_AWS_API) {
            authApi.verifyToken(token).catch(() => {
              // Token invalid, logout
              get().logout();
            });
          }
        }
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          if (USE_AWS_API) {
            // Use AWS API
            const response = await authApi.login(credentials.email, credentials.password);
            set({ 
              user: response.user as User, 
              token: response.token,
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            // Use mock data (development mode)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (credentials.email === 'admin@shoporange.com' && credentials.password === 'admin123') {
              set({ 
                user: mockAdminUser, 
                token: 'mock_token_admin',
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            } else if (credentials.email && credentials.password.length >= 6) {
              set({ 
                user: { 
                  ...mockUser, 
                  email: credentials.email 
                }, 
                token: 'mock_token_user',
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            } else {
              set({ 
                error: 'Geçersiz email veya şifre', 
                isLoading: false 
              });
              return false;
            }
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
          if (USE_AWS_API) {
            // Use AWS API
            const response = await authApi.register({
              email: data.email,
              password: data.password,
              name: data.name,
              phone: data.phone
            });
            set({ 
              user: response.user as User, 
              token: response.token,
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            // Use mock data (development mode)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const newUser: User = {
              id: `u${Date.now()}`,
              email: data.email,
              name: data.name,
              phone: data.phone || '',
              createdAt: new Date().toISOString(),
              role: 'user'
            };
            
            set({ 
              user: newUser, 
              token: 'mock_token_user',
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
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

      logout: () => {
        set({ 
          user: null, 
          token: null,
          isAuthenticated: false, 
          error: null 
        });
      },

      socialLogin: async (provider: 'google' | 'facebook', token?: string, userData?: any) => {
        set({ isLoading: true, error: null });
        
        try {
          if (USE_AWS_API && token && userData) {
            // Use AWS API
            const response = await authApi.socialLogin(provider, token);
            set({ 
              user: response.user as User, 
              token: response.token,
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
          } else {
            // Use mock data (development mode)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const socialUser: User = {
              id: `social_${Date.now()}`,
              email: `user@${provider}.com`,
              name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Kullanıcı`,
              avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200`,
              createdAt: new Date().toISOString(),
              role: 'user'
            };
            
            set({ 
              user: socialUser, 
              token: `mock_token_${provider}`,
              isAuthenticated: true, 
              isLoading: false 
            });
            return true;
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

      updateUser: async (userData: Partial<User>) => {
        const { user, token } = get();
        if (!user) return false;

        try {
          if (USE_AWS_API && token) {
            const updatedUser = await usersApi.update(user.id, userData);
            set({ user: { ...user, ...updatedUser } });
          } else {
            set({ user: { ...user, ...userData } });
          }
          return true;
        } catch (error) {
          set({ error: 'Profil güncellenirken hata oluştu' });
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
          
          if (USE_AWS_API) {
            await usersApi.addAddress(user.id, newAddress);
          }
          
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
          if (USE_AWS_API) {
            await usersApi.deleteAddress(user.id, addressId);
          }
          
          const updatedAddresses = user.address.filter(a => a.id !== addressId);
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
          
          if (USE_AWS_API) {
            await usersApi.updateAddress(user.id, addressId, { isDefault: true });
          }
          
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
      })
    }
  )
);
