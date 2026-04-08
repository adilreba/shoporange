/**
 * Kart Saklama API - İyzico Tokenization
 * Asla kart bilgilerini kendi sunucularımızda saklamıyoruz!
 * Tüm kart bilgileri İyzico tarafından şifrelenerek saklanır.
 */

import { api } from './api';

export interface StoredCard {
  cardToken: string;
  lastFourDigits: string;
  cardFamily: string;
  cardType: string;
  cardAssociation: string;
}

export interface SaveCardRequest {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
}

/**
 * Kart sakla (Tokenization)
 * Kart bilgileri direkt İyzico'ya gönderilir, token döner
 */
export async function saveCard(data: SaveCardRequest): Promise<{
  success: boolean;
  cardToken?: string;
  lastFourDigits?: string;
  cardFamily?: string;
  error?: string;
}> {
  try {
    const response = await api.post('/payments/card/save', data);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Kart saklanamadı',
    };
  }
}

/**
 * Kayıtlı kartları listele
 */
export async function getSavedCards(): Promise<{
  success: boolean;
  cards?: StoredCard[];
  error?: string;
}> {
  try {
    const response = await api.get('/payments/cards');
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Kartlar listelenemedi',
    };
  }
}

/**
 * Kayıtlı kartı sil
 */
export async function deleteCard(cardToken: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await api.delete(`/payments/card/${cardToken}`);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Kart silinemedi',
    };
  }
}

/**
 * Kayıtlı kart ile ödeme yap
 */
export async function payWithCard(params: {
  cardToken: string;
  amount: number;
  orderId: string;
}): Promise<{
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
}> {
  try {
    const response = await api.post('/payments/card/pay', params);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Ödeme başarısız',
    };
  }
}

/**
 * Kart maskesi oluştur (**** **** **** 1234)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return cleaned;
  return `**** **** **** ${cleaned.slice(-4)}`;
}

/**
 * Kart tipi ikonu belirle
 */
export function getCardIcon(cardAssociation?: string): string {
  const icons: Record<string, string> = {
    'VISA': '💳',
    'MASTER_CARD': '💳',
    'AMEX': '💳',
    'TROY': '💳',
  };
  return icons[cardAssociation || ''] || '💳';
}
