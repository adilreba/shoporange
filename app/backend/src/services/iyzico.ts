/**
 * İyzico Payment Integration Service
 * 3D Secure, taksit, iade entegrasyonu
 * 
 * Test API: https://sandbox-api.iyzipay.com
 * Live API: https://api.iyzipay.com
 */

import Iyzipay from 'iyzipay';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManagerClient({});

// İyzico yapılandırması
interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  uri: string; // sandbox veya production
}

let iyzipayInstance: Iyzipay | null = null;

/**
 * İyzico yapılandırmasını Secrets Manager'dan al
 */
async function getIyzicoConfig(): Promise<IyzicoConfig> {
  try {
    const secret = await secretsManager.send(new GetSecretValueCommand({
      SecretId: process.env.IYZICO_SECRET_NAME || 'atushome/iyzico',
    }));
    
    if (!secret.SecretString) {
      throw new Error('İyzico yapılandırması bulunamadı');
    }
    
    const config = JSON.parse(secret.SecretString);
    return {
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      uri: config.isTestMode ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com',
    };
  } catch (error) {
    console.log('İyzico secret bulunamadı, test modu kullanılacak');
    
    // Test modu için varsayılan değerler (İyzico sandbox)
    if (process.env.IYZICO_MOCK_MODE === 'true') {
      return {
        apiKey: 'sandbox-api-key',
        secretKey: 'sandbox-secret-key',
        uri: 'https://sandbox-api.iyzipay.com',
      };
    }
    
    throw new Error('İyzico yapılandırması eksik');
  }
}

/**
 * İyzico instance'ı al veya oluştur
 */
async function getIyzipay(): Promise<Iyzipay> {
  if (iyzipayInstance) {
    return iyzipayInstance;
  }
  
  const config = await getIyzicoConfig();
  iyzipayInstance = new Iyzipay(config);
  return iyzipayInstance;
}

/**
 * Ödeme isteği oluştur (3D Secure)
 */
export async function createPaymentRequest(params: {
  price: number;
  paidPrice: number;
  currency: string;
  installment: number;
  basketId: string;
  paymentChannel: string;
  paymentGroup: string;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber?: string;
    email: string;
    identityNumber: string;
    lastLoginDate?: string;
    registrationDate?: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode?: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    category2?: string;
    itemType: string;
    price: number;
  }>;
}): Promise<{
  success: boolean;
  paymentPageUrl?: string;
  conversationId?: string;
  error?: string;
  errorCode?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `conv_${Date.now()}_${params.buyer.id}`,
      price: params.price.toFixed(2),
      paidPrice: params.paidPrice.toFixed(2),
      currency: params.currency,
      installment: params.installment,
      basketId: params.basketId,
      paymentChannel: params.paymentChannel,
      paymentGroup: params.paymentGroup,
      paymentCard: {
        cardHolderName: '',
        cardNumber: '',
        expireMonth: '',
        expireYear: '',
        cvc: '',
        registerCard: 0
      },
      buyer: {
        id: params.buyer.id,
        name: params.buyer.name,
        surname: params.buyer.surname,
        gsmNumber: params.buyer.gsmNumber || '',
        email: params.buyer.email,
        identityNumber: params.buyer.identityNumber,
        lastLoginDate: params.buyer.lastLoginDate || new Date().toISOString(),
        registrationDate: params.buyer.registrationDate || new Date().toISOString(),
        registrationAddress: params.buyer.registrationAddress,
        ip: params.buyer.ip,
        city: params.buyer.city,
        country: params.buyer.country,
        zipCode: params.buyer.zipCode || '',
      },
      shippingAddress: {
        contactName: params.shippingAddress.contactName,
        city: params.shippingAddress.city,
        country: params.shippingAddress.country,
        address: params.shippingAddress.address,
        zipCode: params.shippingAddress.zipCode || '',
      },
      billingAddress: {
        contactName: params.billingAddress.contactName,
        city: params.billingAddress.city,
        country: params.billingAddress.country,
        address: params.billingAddress.address,
        zipCode: params.billingAddress.zipCode || '',
      },
      basketItems: params.basketItems.map(item => ({
        id: item.id,
        name: item.name,
        category1: item.category1,
        category2: item.category2 || '',
        itemType: item.itemType === 'PHYSICAL' ? Iyzipay.BASKET_ITEM_TYPE.PHYSICAL : Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        price: item.price.toFixed(2),
      })),
      callbackUrl: params.callbackUrl,
    };

    return new Promise((resolve) => {
      iyzipay.threedsInitialize.create(request, (err: any, result: any) => {
        if (err) {
          console.error('İyzico 3D Secure hatası:', err);
          resolve({
            success: false,
            error: err.message || '3D Secure başlatılamadı',
            errorCode: err.code,
          });
          return;
        }

        if (result.status === 'failure') {
          resolve({
            success: false,
            error: result.errorMessage || 'Ödeme başlatılamadı',
            errorCode: result.errorCode,
          });
          return;
        }

        resolve({
          success: true,
          paymentPageUrl: result.threeDSHtmlContent, // HTML form içeriği
          conversationId: result.conversationId,
        });
      });
    });
  } catch (error: any) {
    console.error('İyzico ödeme hatası:', error);
    return {
      success: false,
      error: error.message || 'Ödeme işlemi başarısız',
    };
  }
}

/**
 * 3D Secure sonucu doğrulama
 */
export async function verify3DSecure(params: {
  paymentId: string;
  conversationData?: string;
  conversationId: string;
}): Promise<{
  success: boolean;
  paymentId?: string;
  conversationId?: string;
  status?: string;
  cardFirstSix?: string;
  cardLastFour?: string;
  installment?: number;
  paidPrice?: number;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: params.conversationId,
      paymentId: params.paymentId,
      conversationData: params.conversationData || '',
    };

    return new Promise((resolve) => {
      iyzipay.threedsPayment.create(request, (err: any, result: any) => {
        if (err) {
          console.error('İyzico 3D doğrulama hatası:', err);
          resolve({
            success: false,
            error: err.message || '3D doğrulama başarısız',
          });
          return;
        }

        if (result.status === 'failure') {
          resolve({
            success: false,
            error: result.errorMessage || 'Ödeme başarısız',
            status: result.status,
          });
          return;
        }

        resolve({
          success: true,
          paymentId: result.paymentId,
          conversationId: result.conversationId,
          status: result.status,
          cardFirstSix: result.cardFirstSix,
          cardLastFour: result.cardLastFour,
          installment: result.installment,
          paidPrice: result.paidPrice,
        });
      });
    });
  } catch (error: any) {
    console.error('İyzico 3D doğrulama hatası:', error);
    return {
      success: false,
      error: error.message || 'Doğrulama başarısız',
    };
  }
}

/**
 * Taksit seçeneklerini kontrol et
 */
export async function getInstallmentInfo(binNumber: string, price: number): Promise<{
  success: boolean;
  installments?: Array<{
    installmentNumber: number;
    totalPrice: number;
    installmentPrice: number;
  }>;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `installment_${Date.now()}`,
      binNumber,
      price: price.toFixed(2),
    };

    return new Promise((resolve) => {
      iyzipay.installmentInfo.retrieve(request, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          resolve({
            success: false,
            error: err?.message || result?.errorMessage || 'Taksit bilgisi alınamadı',
          });
          return;
        }

        resolve({
          success: true,
          installments: result.installmentDetails?.[0]?.installmentPrices || [],
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Ödemeyi iade et
 */
export async function refundPayment(params: {
  paymentTransactionId: string;
  price: number;
  currency: string;
  reason?: string;
}): Promise<{
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `refund_${Date.now()}`,
      paymentTransactionId: params.paymentTransactionId,
      price: params.price.toFixed(2),
      currency: params.currency,
      reason: params.reason || Iyzipay.REFUND_REASON.BUYER_REQUEST,
    };

    return new Promise((resolve) => {
      iyzipay.refund.create(request, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          resolve({
            success: false,
            error: err?.message || result?.errorMessage || 'İade başarısız',
          });
          return;
        }

        resolve({
          success: true,
          refundId: result.refundId,
          status: result.status,
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Ödemeyi iptal et (Tam iade)
 */
export async function cancelPayment(params: {
  paymentId: string;
  ip?: string;
}): Promise<{
  success: boolean;
  cancelId?: string;
  status?: string;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `cancel_${Date.now()}`,
      paymentId: params.paymentId,
      ip: params.ip || '127.0.0.1',
    };

    return new Promise((resolve) => {
      iyzipay.cancel.create(request, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          resolve({
            success: false,
            error: err?.message || result?.errorMessage || 'İptal başarısız',
          });
          return;
        }

        resolve({
          success: true,
          cancelId: result.cancelId,
          status: result.status,
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Ödeme detaylarını getir
 */
export async function getPaymentDetail(paymentId: string): Promise<{
  success: boolean;
  payment?: any;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `detail_${Date.now()}`,
      paymentId,
    };

    return new Promise((resolve) => {
      iyzipay.payment.retrieve(request, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          resolve({
            success: false,
            error: err?.message || result?.errorMessage || 'Ödeme detayı alınamadı',
          });
          return;
        }

        resolve({
          success: true,
          payment: result,
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Bağlantı testi
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  mode?: string;
}> {
  try {
    const config = await getIyzicoConfig();
    
    if (config.apiKey === 'sandbox-api-key') {
      return {
        success: true,
        message: 'Mock mode aktif - Test başarılı',
        mode: 'mock',
      };
    }

    // Basit bir API çağrısı ile test et
    const iyzipay = await getIyzipay();
    
    return new Promise((resolve) => {
      // Bin kontrolü ile test et
      iyzipay.installmentInfo.retrieve({
        locale: Iyzipay.LOCALE.TR,
        conversationId: `test_${Date.now()}`,
        binNumber: '554960',
        price: '100',
      }, (err: any, result: any) => {
        if (err) {
          resolve({
            success: false,
            message: err.message || 'Bağlantı hatası',
          });
          return;
        }

        resolve({
          success: true,
          message: 'İyzico bağlantısı başarılı',
          mode: config.uri.includes('sandbox') ? 'sandbox' : 'production',
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Bağlantı testi başarısız',
    };
  }
}

// ==================== KART SAKLAMA (TOKENIZATION) ====================

/**
 * Kart sakla (Tokenization)
 * Kart bilgileri İyzico'da saklanır, bize token döner
 * Asla kart bilgilerini kendi veritabanımızda saklamıyoruz!
 */
export async function createCardToken(params: {
  userId: string;
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  email?: string;
}): Promise<{
  success: boolean;
  cardToken?: string;
  cardUserKey?: string;
  lastFourDigits?: string;
  cardFamily?: string;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `card_create_${Date.now()}`,
      email: params.email || `${params.userId}@atushome.com`,
      card: {
        cardHolderName: params.cardHolderName,
        cardNumber: params.cardNumber.replace(/\s/g, ''), // Boşlukları kaldır
        expireMonth: params.expireMonth,
        expireYear: params.expireYear.length === 2 ? `20${params.expireYear}` : params.expireYear,
      },
    };

    return new Promise((resolve) => {
      iyzipay.card.create(request, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          resolve({
            success: false,
            error: err?.message || result?.errorMessage || 'Kart saklanamadı',
          });
          return;
        }

        resolve({
          success: true,
          cardToken: result.cardToken,
          cardUserKey: result.cardUserKey,
          lastFourDigits: result.lastFourDigits,
          cardFamily: result.cardFamily,
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Kart saklama hatası',
    };
  }
}

/**
 * Kayıtlı kartları listele
 */
export async function getStoredCards(cardUserKey: string): Promise<{
  success: boolean;
  cards?: Array<{
    cardToken: string;
    lastFourDigits: string;
    cardFamily: string;
    cardType: string;
    cardAssociation: string;
  }>;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `card_list_${Date.now()}`,
      cardUserKey,
    };

    return new Promise((resolve) => {
      iyzipay.cardList.retrieve(request, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          resolve({
            success: false,
            error: err?.message || result?.errorMessage || 'Kartlar listelenemedi',
          });
          return;
        }

        resolve({
          success: true,
          cards: result.cardDetails?.map((card: any) => ({
            cardToken: card.cardToken,
            lastFourDigits: card.lastFourDigits,
            cardFamily: card.cardFamily,
            cardType: card.cardType,
            cardAssociation: card.cardAssociation,
          })) || [],
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Kart listeleme hatası',
    };
  }
}

/**
 * Kayıtlı kartı sil
 */
export async function deleteCardToken(params: {
  cardToken: string;
  cardUserKey: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `card_delete_${Date.now()}`,
      cardToken: params.cardToken,
      cardUserKey: params.cardUserKey,
    };

    return new Promise((resolve) => {
      iyzipay.card.delete(request, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          resolve({
            success: false,
            error: err?.message || result?.errorMessage || 'Kart silinemedi',
          });
          return;
        }

        resolve({
          success: true,
          message: 'Kart başarıyla silindi',
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Kart silme hatası',
    };
  }
}

/**
 * Kayıtlı kart ile ödeme (Tek tıkla ödeme)
 */
export async function payWithStoredCard(params: {
  cardToken: string;
  price: number;
  paidPrice: number;
  currency: string;
  basketId: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
  };
  basketItems: any[];
}): Promise<{
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
}> {
  try {
    const iyzipay = await getIyzipay();
    
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `payment_card_${Date.now()}`,
      price: params.price.toFixed(2),
      paidPrice: params.paidPrice.toFixed(2),
      currency: params.currency,
      installment: '1',
      basketId: params.basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      buyer: {
        id: params.buyer.id,
        name: params.buyer.name,
        surname: params.buyer.surname,
        email: params.buyer.email,
        gsmNumber: params.buyer.phone,
        identityNumber: params.buyer.id,
        registrationAddress: 'İstanbul, Türkiye',
        ip: '85.34.78.112',
        city: 'İstanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: `${params.buyer.name} ${params.buyer.surname}`,
        city: 'İstanbul',
        country: 'Turkey',
        address: 'Kadıköy, İstanbul',
      },
      billingAddress: {
        contactName: `${params.buyer.name} ${params.buyer.surname}`,
        city: 'İstanbul',
        country: 'Turkey',
        address: 'Kadıköy, İstanbul',
      },
      basketItems: params.basketItems,
      paymentCard: {
        cardToken: params.cardToken,
      },
    };

    return new Promise((resolve) => {
      iyzipay.payment.create(request, (err: any, result: any) => {
        if (err || result.status === 'failure') {
          resolve({
            success: false,
            error: err?.message || result?.errorMessage || 'Ödeme başarısız',
          });
          return;
        }

        resolve({
          success: true,
          paymentId: result.paymentId,
          status: result.status,
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Ödeme hatası',
    };
  }
}

export default {
  createPaymentRequest,
  verify3DSecure,
  getInstallmentInfo,
  refundPayment,
  cancelPayment,
  getPaymentDetail,
  testConnection,
  createCardToken,
  getStoredCards,
  deleteCardToken,
  payWithStoredCard,
};
