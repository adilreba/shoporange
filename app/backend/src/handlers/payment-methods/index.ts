import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, SecretsManager } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();
const secretsManager = new SecretsManager();

const TABLE_NAME = process.env.PAYMENT_METHODS_TABLE || 'AtusHome-PaymentMethods';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
};

export interface PaymentMethod {
  id: string;
  code: string; // 'cash_on_delivery', 'bank_transfer', 'stripe', 'iyzico', 'paytr'
  name: string;
  displayName: string;
  description: string;
  icon: string;
  isActive: boolean;
  isTestMode: boolean;
  sortOrder: number;
  config: Record<string, any>; // API key'ler hariç ayarlar
  supportedCurrencies: string[];
  requires3D: boolean;
  installmentEnabled: boolean;
  maxInstallment?: number;
  minAmount?: number;
  maxAmount?: number;
  lastUpdated: string;
  updatedBy?: string;
}

// Varsayılan ödeme yöntemleri - ilk kurulum için
const DEFAULT_PAYMENT_METHODS: Omit<PaymentMethod, 'id' | 'lastUpdated'>[] = [
  {
    code: 'cash_on_delivery',
    name: 'Kapıda Ödeme',
    displayName: 'Kapıda Nakit veya Kredi Kartı ile Öde',
    description: 'Ürün teslimatında kapıda nakit veya kredi kartı ile ödeme yapabilirsiniz.',
    icon: 'truck',
    isActive: true,
    isTestMode: false,
    sortOrder: 1,
    config: {
      extraFee: 0,
      allowedCities: [], // Boş = tüm şehirler
    },
    supportedCurrencies: ['TRY'],
    requires3D: false,
    installmentEnabled: false,
    minAmount: 0,
    maxAmount: 50000,
  },
  {
    code: 'bank_transfer',
    name: 'Havale/EFT',
    displayName: 'Banka Havalesi/EFT',
    description: 'Sipariş sonrası banka hesaplarımıza havale/EFT yapabilirsiniz.',
    icon: 'building-bank',
    isActive: true,
    isTestMode: false,
    sortOrder: 2,
    config: {
      accountHolder: '',
      bankName: '',
      iban: '',
      accountNumber: '',
      branchCode: '',
      swiftCode: '',
      instructions: 'Sipariş numaranızı açıklama kısmına yazmayı unutmayın.',
    },
    supportedCurrencies: ['TRY', 'USD', 'EUR'],
    requires3D: false,
    installmentEnabled: false,
    minAmount: 0,
    maxAmount: 100000,
  },
  {
    code: 'stripe',
    name: 'Stripe',
    displayName: 'Kredi/Banka Kartı (Stripe)',
    description: 'Güvenli ödeme altyapısı ile kredi veya banka kartınızla ödeyin.',
    icon: 'credit-card',
    isActive: false,
    isTestMode: true,
    sortOrder: 3,
    config: {
      webhookEnabled: false,
      webhookUrl: '',
    },
    supportedCurrencies: ['TRY', 'USD', 'EUR', 'GBP'],
    requires3D: true,
    installmentEnabled: false,
    minAmount: 1,
    maxAmount: 1000000,
  },
  {
    code: 'iyzico',
    name: 'İyzico',
    displayName: 'Kredi Kartı (Taksitli)',
    description: 'Tüm banka kartlarına taksit seçenekleriyle güvenli ödeme.',
    icon: 'credit-card',
    isActive: false,
    isTestMode: true,
    sortOrder: 4,
    config: {
      webhookEnabled: false,
      webhookUrl: '',
      subMerchantEnabled: false,
    },
    supportedCurrencies: ['TRY'],
    requires3D: true,
    installmentEnabled: true,
    maxInstallment: 12,
    minAmount: 1,
    maxAmount: 500000,
  },
  {
    code: 'paytr',
    name: 'PayTR',
    displayName: 'Kredi Kartı (PayTR)',
    description: 'PayTR güvenli ödeme altyapısı ile kolay ödeme.',
    icon: 'credit-card',
    isActive: false,
    isTestMode: true,
    sortOrder: 5,
    config: {
      webhookEnabled: false,
      webhookUrl: '',
      noInstallment: false,
      maxInstallment: 12,
    },
    supportedCurrencies: ['TRY'],
    requires3D: true,
    installmentEnabled: true,
    maxInstallment: 12,
    minAmount: 1,
    maxAmount: 500000,
  },
];

// API key'leri Secrets Manager'dan al
const getApiKeysFromSecrets = async (provider: string, isTest: boolean): Promise<any> => {
  try {
    const secretName = `atushome/payment/${provider}/${isTest ? 'test' : 'production'}`;
    const result = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    if (result.SecretString) {
      return JSON.parse(result.SecretString);
    }
    return null;
  } catch (error) {
    console.error(`Secret not found for ${provider}:`, error);
    return null;
  }
};

/**
 * GET /payment-methods/admin
 * Tüm ödeme yöntemlerini listele (admin için - detaylı)
 */
export const listAdmin = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.scan({
      TableName: TABLE_NAME,
    }).promise();

    const methods = (result.Items || []).sort((a, b) => a.sortOrder - b.sortOrder);

    // API key'ler hariç güvenli bir şekilde döndür
    const safeMethods = methods.map(m => ({
      ...m,
      apiKeyStatus: m.isActive ? 'configured' : 'not_configured', // API key durumu
      apiKeyLast4: '****', // Maskeli göster
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(safeMethods),
    };
  } catch (error: any) {
    console.error('List payment methods error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Ödeme yöntemleri yüklenemedi' }),
    };
  }
};

/**
 * GET /payment-methods/public
 * Aktif ödeme yöntemlerini listele (public için)
 */
export const listPublic = async (): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':active': true,
      },
    }).promise();

    const methods = (result.Items || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(m => ({
        id: m.id,
        code: m.code,
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        icon: m.icon,
        isTestMode: m.isTestMode,
        sortOrder: m.sortOrder,
        supportedCurrencies: m.supportedCurrencies,
        requires3D: m.requires3D,
        installmentEnabled: m.installmentEnabled,
        maxInstallment: m.maxInstallment,
        minAmount: m.minAmount,
        maxAmount: m.maxAmount,
        config: {
          // Sadece güvenli config bilgileri
          extraFee: m.config?.extraFee,
          instructions: m.config?.instructions,
          allowedCities: m.config?.allowedCities,
        },
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(methods),
    };
  } catch (error: any) {
    console.error('List public payment methods error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Ödeme yöntemleri yüklenemedi' }),
    };
  }
};

/**
 * GET /payment-methods/:id/admin
 * Tek ödeme yöntemi detayı (admin)
 */
export const getById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID gerekli' }),
      };
    }

    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Ödeme yöntemi bulunamadı' }),
      };
    }

    // API key durumunu kontrol et
    const secrets = await getApiKeysFromSecrets(result.Item.code, result.Item.isTestMode);
    
    const safeMethod = {
      ...result.Item,
      apiKeyConfigured: !!secrets,
      apiKeyStatus: secrets ? 'configured' : 'not_configured',
      apiKeyLast4: secrets?.apiKey ? `****${secrets.apiKey.slice(-4)}` : null,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(safeMethod),
    };
  } catch (error: any) {
    console.error('Get payment method error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Ödeme yöntemi yüklenemedi' }),
    };
  }
};

/**
 * PUT /payment-methods/:id
 * Ödeme yöntemi güncelle (admin)
 */
export const update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id || !event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID ve veri gerekli' }),
      };
    }

    const data = JSON.parse(event.body);
    const userId = event.requestContext.authorizer?.claims?.sub || 'admin';

    // Mevcut kaydı al
    const existing = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();

    if (!existing.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Ödeme yöntemi bulunamadı' }),
      };
    }

    // Güvenlik: Sadece izin verilen alanları güncelle
    const allowedUpdates: Partial<PaymentMethod> = {
      isActive: data.isActive !== undefined ? data.isActive : existing.Item.isActive,
      isTestMode: data.isTestMode !== undefined ? data.isTestMode : existing.Item.isTestMode,
      displayName: data.displayName || existing.Item.displayName,
      description: data.description || existing.Item.description,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : existing.Item.sortOrder,
      config: {
        ...existing.Item.config,
        ...(data.config || {}),
      },
      minAmount: data.minAmount !== undefined ? data.minAmount : existing.Item.minAmount,
      maxAmount: data.maxAmount !== undefined ? data.maxAmount : existing.Item.maxAmount,
      maxInstallment: data.maxInstallment !== undefined ? data.maxInstallment : existing.Item.maxInstallment,
      lastUpdated: new Date().toISOString(),
      updatedBy: userId,
    };

    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: {
        ...existing.Item,
        ...allowedUpdates,
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Ödeme yöntemi güncellendi' }),
    };
  } catch (error: any) {
    console.error('Update payment method error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Güncellenemedi' }),
    };
  }
};

/**
 * POST /payment-methods/:id/test
 * Ödeme yöntemi bağlantı testi
 */
export const testConnection = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID gerekli' }),
      };
    }

    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { id },
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Ödeme yöntemi bulunamadı' }),
      };
    }

    const method = result.Item as PaymentMethod;

    // Manuel ödeme yöntemleri için test gerekmez
    if (method.code === 'cash_on_delivery' || method.code === 'bank_transfer') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Manuel ödeme yöntemi - Test gerekmez',
          provider: method.code,
        }),
      };
    }

    // API key'leri kontrol et
    const secrets = await getApiKeysFromSecrets(method.code, method.isTestMode);

    if (!secrets || !secrets.apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'API anahtarı yapılandırılmamış',
          provider: method.code,
        }),
      };
    }

    // Burada gerçek bağlantı testi yapılabilir
    // Örn: Stripe için ping at, İyzico için auth testi yap

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'API anahtarı yapılandırılmış',
        provider: method.code,
        mode: method.isTestMode ? 'test' : 'production',
        note: 'Gerçek bağlantı testi backend eklentisi gerektirir',
      }),
    };
  } catch (error: any) {
    console.error('Test connection error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Bağlantı testi yapılamadı' }),
    };
  }
};

/**
 * POST /payment-methods/seed
 * Varsayılan ödeme yöntemlerini oluştur
 */
export const seed = async (): Promise<APIGatewayProxyResult> => {
  try {
    const now = new Date().toISOString();

    for (const defaultMethod of DEFAULT_PAYMENT_METHODS) {
      // Önce var mı kontrol et
      const existing = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'code = :code',
        ExpressionAttributeValues: {
          ':code': defaultMethod.code,
        },
      }).promise();

      if (existing.Items && existing.Items.length > 0) {
        continue; // Zaten var, atla
      }

      const method: PaymentMethod = {
        ...defaultMethod,
        id: `payment-${defaultMethod.code}-${Date.now()}`,
        lastUpdated: now,
      };

      await dynamodb.put({
        TableName: TABLE_NAME,
        Item: method,
      }).promise();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Varsayılan ödeme yöntemleri oluşturuldu' }),
    };
  } catch (error: any) {
    console.error('Seed payment methods error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Oluşturulamadı' }),
    };
  }
};
