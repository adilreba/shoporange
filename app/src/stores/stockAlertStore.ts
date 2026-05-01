import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StockAlert {
  productId: string;
  productName: string;
  email: string;
  createdAt: string;
}

interface StockAlertState {
  alerts: StockAlert[];
  addAlert: (productId: string, productName: string, email: string) => boolean;
  removeAlert: (productId: string, email: string) => void;
  hasAlert: (productId: string, email: string) => boolean;
  getUserAlerts: (email: string) => StockAlert[];
  clearAll: () => void;
}

export const useStockAlertStore = create<StockAlertState>()(
  persist(
    (set, get) => ({
      alerts: [],

      addAlert: (productId: string, productName: string, email: string) => {
        const exists = get().hasAlert(productId, email);
        if (exists) return false;

        const newAlert: StockAlert = {
          productId,
          productName,
          email,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          alerts: [...state.alerts, newAlert],
        }));

        return true;
      },

      removeAlert: (productId: string, email: string) => {
        set((state) => ({
          alerts: state.alerts.filter(
            (alert) => !(alert.productId === productId && alert.email === email)
          ),
        }));
      },

      hasAlert: (productId: string, email: string) => {
        return get().alerts.some(
          (alert) => alert.productId === productId && alert.email === email
        );
      },

      getUserAlerts: (email: string) => {
        return get().alerts.filter((alert) => alert.email === email);
      },

      clearAll: () => {
        set({ alerts: [] });
      },
    }),
    {
      name: 'stock-alert-storage',
      partialize: (state) => ({
        alerts: state.alerts,
      }),
    }
  )
);

// Clear stock alerts on logout
import { onLogout } from './authStore';
onLogout(() => {
  useStockAlertStore.getState().clearAll();
});
