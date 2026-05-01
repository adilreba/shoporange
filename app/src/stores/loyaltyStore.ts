import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  isUsed: boolean;
}

interface LoyaltyState {
  points: number;
  totalEarned: number;
  coupons: Coupon[];
  
  // Actions
  earnPoints: (amount: number) => void;
  usePoints: (amount: number) => boolean;
  addCoupon: (coupon: Coupon) => void;
  useCoupon: (couponId: string) => boolean;
  getAvailableCoupons: () => Coupon[];
  getPointsValue: () => number; // Points in currency
}

const POINTS_TO_CURRENCY_RATE = 0.01; // 1 point = 0.01 TL
const POINTS_PER_TL = 1; // 1 TL spent = 1 point

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      points: 500, // Starting bonus
      totalEarned: 500,
      coupons: [
        {
          id: 'WELCOME2024',
          code: 'HOSGELDIN50',
          name: 'Hoş Geldin İndirimi',
          description: 'İlk alışverişinize 50₺ indirim',
          discountType: 'fixed',
          discountValue: 50,
          minOrderAmount: 250,
          expiryDate: '2024-12-31',
          isUsed: false,
        },
        {
          id: 'SUMMER2024',
          code: 'YAZ20',
          name: 'Yaz İndirimi',
          description: 'Tüm ürünlerde %20 indirim',
          discountType: 'percentage',
          discountValue: 20,
          minOrderAmount: 500,
          expiryDate: '2024-08-31',
          isUsed: false,
        },
      ],

      earnPoints: (amount: number) => {
        const pointsToAdd = Math.floor(amount * POINTS_PER_TL);
        set((state) => ({
          points: state.points + pointsToAdd,
          totalEarned: state.totalEarned + pointsToAdd,
        }));
      },

      usePoints: (amount: number) => {
        const { points } = get();
        if (points < amount) return false;
        
        set((state) => ({
          points: state.points - amount,
        }));
        return true;
      },

      addCoupon: (coupon: Coupon) => {
        set((state) => ({
          coupons: [...state.coupons, coupon],
        }));
      },

      useCoupon: (couponId: string) => {
        const coupon = get().coupons.find((c) => c.id === couponId);
        if (!coupon || coupon.isUsed) return false;

        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.id === couponId ? { ...c, isUsed: true } : c
          ),
        }));
        return true;
      },

      getAvailableCoupons: () => {
        return get().coupons.filter(
          (c) => !c.isUsed && new Date(c.expiryDate) > new Date()
        );
      },

      getPointsValue: () => {
        return get().points * POINTS_TO_CURRENCY_RATE;
      },
    }),
    {
      name: 'loyalty-storage',
      partialize: (state) => ({
        points: state.points,
        totalEarned: state.totalEarned,
        coupons: state.coupons,
      }),
    }
  )
);
