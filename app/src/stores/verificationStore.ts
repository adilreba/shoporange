import { create } from 'zustand';
import { verificationApi } from '@/services/api';

interface VerificationState {
  // Email verification
  emailVerified: boolean;
  emailLoading: boolean;
  emailError: string | null;
  emailCooldown: number;
  
  // Phone verification
  phoneVerified: boolean;
  phoneLoading: boolean;
  phoneError: string | null;
  phoneCooldown: number;
  
  // Address validation
  addressValid: boolean;
  addressLoading: boolean;
  addressErrors: string[];
  
  // Actions
  sendEmailCode: (email: string, userId: string) => Promise<boolean>;
  verifyEmailCode: (userId: string, otp: string) => Promise<boolean>;
  sendPhoneCode: (phone: string, userId: string) => Promise<boolean>;
  verifyPhoneCode: (userId: string, otp: string) => Promise<boolean>;
  validateAddress: (address: any) => Promise<boolean>;
  resetErrors: () => void;
  startEmailCooldown: () => void;
  startPhoneCooldown: () => void;
}

const COOLDOWN_TIME = 120; // 2 dakika

export const useVerificationStore = create<VerificationState>()((set, get) => ({
  emailVerified: false,
  emailLoading: false,
  emailError: null,
  emailCooldown: 0,
  
  phoneVerified: false,
  phoneLoading: false,
  phoneError: null,
  phoneCooldown: 0,
  
  addressValid: false,
  addressLoading: false,
  addressErrors: [],

  sendEmailCode: async (email: string, userId: string) => {
    if (get().emailCooldown > 0) return false;
    
    set({ emailLoading: true, emailError: null });
    try {
      await verificationApi.sendEmailCode(email, userId);
      set({ emailLoading: false });
      get().startEmailCooldown();
      return true;
    } catch (error: any) {
      set({ emailLoading: false, emailError: error.message });
      return false;
    }
  },

  verifyEmailCode: async (userId: string, otp: string) => {
    set({ emailLoading: true, emailError: null });
    try {
      await verificationApi.verifyEmailCode(userId, otp);
      set({ emailLoading: false, emailVerified: true });
      return true;
    } catch (error: any) {
      set({ emailLoading: false, emailError: error.message });
      return false;
    }
  },

  sendPhoneCode: async (phone: string, userId: string) => {
    if (get().phoneCooldown > 0) return false;
    
    set({ phoneLoading: true, phoneError: null });
    try {
      await verificationApi.sendPhoneCode(phone, userId);
      set({ phoneLoading: false });
      get().startPhoneCooldown();
      return true;
    } catch (error: any) {
      set({ phoneLoading: false, phoneError: error.message });
      return false;
    }
  },

  verifyPhoneCode: async (userId: string, otp: string) => {
    set({ phoneLoading: true, phoneError: null });
    try {
      await verificationApi.verifyPhoneCode(userId, otp);
      set({ phoneLoading: false, phoneVerified: true });
      return true;
    } catch (error: any) {
      set({ phoneLoading: false, phoneError: error.message });
      return false;
    }
  },

  validateAddress: async (address: any) => {
    set({ addressLoading: true, addressErrors: [], addressValid: false });
    try {
      await verificationApi.validateAddress(address);
      set({ addressLoading: false, addressValid: true });
      return true;
    } catch (error: any) {
      const errors = error.message.includes(',') 
        ? error.message.split(',') 
        : [error.message];
      set({ addressLoading: false, addressErrors: errors, addressValid: false });
      return false;
    }
  },

  resetErrors: () => {
    set({
      emailError: null,
      phoneError: null,
      addressErrors: [],
    });
  },

  startEmailCooldown: () => {
    set({ emailCooldown: COOLDOWN_TIME });
    const interval = setInterval(() => {
      set((state) => {
        if (state.emailCooldown <= 1) {
          clearInterval(interval);
          return { emailCooldown: 0 };
        }
        return { emailCooldown: state.emailCooldown - 1 };
      });
    }, 1000);
  },

  startPhoneCooldown: () => {
    set({ phoneCooldown: COOLDOWN_TIME });
    const interval = setInterval(() => {
      set((state) => {
        if (state.phoneCooldown <= 1) {
          clearInterval(interval);
          return { phoneCooldown: 0 };
        }
        return { phoneCooldown: state.phoneCooldown - 1 };
      });
    }, 1000);
  },
}));
