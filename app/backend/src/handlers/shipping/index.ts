import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamodb);

const SHIPPING_TABLE = process.env.SHIPPING_TABLE || 'AtusHome-Shipping';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'AtusHome-Orders';

// Shipping providers configuration
const SHIPPING_PROVIDERS = {
  YURTICI: {
    name: 'Yurtiçi Kargo',
    baseUrl: process.env.YURTICI_API_URL || 'https://webservices.yurticikargo.com',
    username: process.env.YURTICI_USERNAME || '',
    password: process.env.YURTICI_PASSWORD || '',
  },
  ARAS: {
    name: 'Aras Kargo',
    baseUrl: process.env.ARAS_API_URL || 'https://ws.araskargo.com.tr',
    username: process.env.ARAS_USERNAME || '',
    password: process.env.ARAS_PASSWORD || '',
  },
  MNG: {
    name: 'MNG Kargo',
    baseUrl: process.env.MNG_API_URL || 'https://service.mngkargo.com.tr',
    username: process.env.MNG_USERNAME || '',
    password: process.env.MNG_PASSWORD || '',
  },
  PTT: {
    name: 'PTT Kargo',
    baseUrl: process.env.PTT_API_URL || '',
    username: process.env.PTT_USERNAME || '',
    password: process.env.PTT_PASSWORD || '',
  }
};

interface ShippingRequest {
  orderId: string;
  provider: 'YURTICI' | 'ARAS' | 'MNG' | 'PTT';
  receiver: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    zipCode?: string;
  };
  sender?: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  package: {
    weight: number; // kg
    width?: number; // cm
    height?: number; // cm
    length?: number; // cm
    content: string;
    value: number;
  };
  paymentType: 'SENDER' | 'RECEIVER'; // Ödeyen: Gönderen/Alıcı
  shipmentType: 'STANDARD' | 'NEXT_DAY' | 'EXPRESS';
  codAmount?: number; // Kapıda ödeme tutarı (0 ise kapıda ödeme yok)
}

interface TrackingUpdate {
  trackingNumber: string;
  status: string;
  location?: string;
  timestamp: string;
  description: string;
}

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
};

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

// Generate tracking number based on provider
function generateTrackingNumber(provider: string): string {
  const prefix = {
    'YURTICI': 'YTI',
    'ARAS': 'ARS',
    'MNG': 'MNG',
    'PTT': 'PTT'
  }[provider] || 'SHP';
  
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Create shipment
export async function createShipment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return createResponse(400, { success: false, message: 'Request body required' });
    }

    const data: ShippingRequest = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.orderId || !data.provider || !data.receiver || !data.package) {
      return createResponse(400, { 
        success: false, 
        message: 'Eksik alanlar: orderId, provider, receiver, package zorunludur' 
      });
    }

    // Check if provider is valid
    if (!SHIPPING_PROVIDERS[data.provider]) {
      return createResponse(400, { 
        success: false, 
        message: 'Geçersiz kargo firması. Desteklenen: YURTICI, ARAS, MNG, PTT' 
      });
    }

    const trackingNumber = generateTrackingNumber(data.provider);
    const shippingId = `ship_${Date.now()}`;
    const now = new Date().toISOString();

    // Calculate estimated delivery (2-5 business days based on type)
    const deliveryDays = {
      'NEXT_DAY': 1,
      'EXPRESS': 2,
      'STANDARD': 3
    }[data.shipmentType] || 3;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    const shippingRecord = {
      shippingId,
      orderId: data.orderId,
      provider: data.provider,
      providerName: SHIPPING_PROVIDERS[data.provider].name,
      trackingNumber,
      status: 'CREATED',
      receiver: data.receiver,
      sender: data.sender || {
        name: 'AtusHome',
        phone: '0850 XXX XXXX',
        address: 'İstanbul, Türkiye',
        city: 'İstanbul'
      },
      package: data.package,
      paymentType: data.paymentType,
      shipmentType: data.shipmentType,
      codAmount: data.codAmount || 0,
      estimatedDelivery: estimatedDelivery.toISOString(),
      createdAt: now,
      updatedAt: now,
      history: [{
        status: 'CREATED',
        location: 'Depo',
        timestamp: now,
        description: 'Kargo oluşturuldu'
      }]
    };

    // Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: SHIPPING_TABLE,
      Item: shippingRecord
    }));

    // Update order with shipping info
    try {
      await docClient.send(new UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: { orderId: data.orderId },
        UpdateExpression: 'SET shipping = :shipping, #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':shipping': {
            provider: data.provider,
            trackingNumber,
            status: 'CREATED'
          },
          ':status': 'shipped',
          ':updatedAt': now
        }
      }));
    } catch (err) {
      console.log('Order update warning:', err);
    }

    // TODO: Integrate with actual shipping provider API
    // For now, simulate API call
    console.log(`[${data.provider}] Shipment created:`, trackingNumber);

    return createResponse(201, {
      success: true,
      message: 'Kargo başarıyla oluşturuldu',
      data: {
        shippingId,
        trackingNumber,
        provider: data.provider,
        providerName: SHIPPING_PROVIDERS[data.provider].name,
        estimatedDelivery: shippingRecord.estimatedDelivery,
        trackingUrl: generateTrackingUrl(data.provider, trackingNumber)
      }
    });

  } catch (error) {
    console.error('Create shipment error:', error);
    return createResponse(500, { 
      success: false, 
      message: 'Kargo oluşturulurken hata oluştu',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Generate tracking URL for customer
function generateTrackingUrl(provider: string, trackingNumber: string): string {
  const urls: Record<string, string> = {
    'YURTICI': `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}`,
    'ARAS': `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNumber}`,
    'MNG': `https://www.mngkargo.com.tr/gonderitakip?=${trackingNumber}`,
    'PTT': `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${trackingNumber}`
  };
  return urls[provider] || '';
}

// Get shipment by order ID
export async function getShipment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const orderId = event.pathParameters?.orderId;
    
    if (!orderId) {
      return createResponse(400, { success: false, message: 'Order ID gerekli' });
    }

    // Query by orderId
    const result = await docClient.send(new QueryCommand({
      TableName: SHIPPING_TABLE,
      IndexName: 'OrderIdIndex',
      KeyConditionExpression: 'orderId = :orderId',
      ExpressionAttributeValues: {
        ':orderId': orderId
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, { success: false, message: 'Kargo kaydı bulunamadı' });
    }

    return createResponse(200, {
      success: true,
      data: result.Items[0]
    });

  } catch (error) {
    console.error('Get shipment error:', error);
    return createResponse(500, { success: false, message: 'Kargo bilgisi alınırken hata' });
  }
}

// Track shipment
export async function trackShipment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const trackingNumber = event.pathParameters?.trackingNumber;
    
    if (!trackingNumber) {
      return createResponse(400, { success: false, message: 'Takip numarası gerekli' });
    }

    // Get from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: SHIPPING_TABLE,
      Key: { shippingId: trackingNumber }
    }));

    if (!result.Item) {
      // Try to find by trackingNumber GSI
      const queryResult = await docClient.send(new QueryCommand({
        TableName: SHIPPING_TABLE,
        IndexName: 'TrackingNumberIndex',
        KeyConditionExpression: 'trackingNumber = :tn',
        ExpressionAttributeValues: { ':tn': trackingNumber }
      }));
      
      if (!queryResult.Items || queryResult.Items.length === 0) {
        return createResponse(404, { success: false, message: 'Kargo takip numarası bulunamadı' });
      }
      
      return createResponse(200, {
        success: true,
        data: {
          trackingNumber,
          provider: queryResult.Items[0].provider,
          status: queryResult.Items[0].status,
          history: queryResult.Items[0].history,
          estimatedDelivery: queryResult.Items[0].estimatedDelivery,
          trackingUrl: generateTrackingUrl(queryResult.Items[0].provider, trackingNumber)
        }
      });
    }

    // TODO: Refresh status from provider API

    return createResponse(200, {
      success: true,
      data: {
        trackingNumber,
        provider: result.Item.provider,
        status: result.Item.status,
        history: result.Item.history,
        estimatedDelivery: result.Item.estimatedDelivery,
        trackingUrl: generateTrackingUrl(result.Item.provider, trackingNumber)
      }
    });

  } catch (error) {
    console.error('Track shipment error:', error);
    return createResponse(500, { success: false, message: 'Takip bilgisi alınırken hata' });
  }
}

// Update shipment status (webhook from shipping provider)
export async function updateShipmentStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return createResponse(400, { success: false, message: 'Request body required' });
    }

    const data: TrackingUpdate = JSON.parse(event.body);
    const { trackingNumber, status, location, timestamp, description } = data;

    if (!trackingNumber || !status) {
      return createResponse(400, { success: false, message: 'trackingNumber ve status gerekli' });
    }

    // Find shipment by tracking number
    const queryResult = await docClient.send(new QueryCommand({
      TableName: SHIPPING_TABLE,
      IndexName: 'TrackingNumberIndex',
      KeyConditionExpression: 'trackingNumber = :tn',
      ExpressionAttributeValues: { ':tn': trackingNumber }
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return createResponse(404, { success: false, message: 'Kargo bulunamadı' });
    }

    const shippingId = queryResult.Items[0].shippingId;
    const now = new Date().toISOString();

    // Update status
    await docClient.send(new UpdateCommand({
      TableName: SHIPPING_TABLE,
      Key: { shippingId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, history = list_append(if_not_exists(history, :emptyList), :newEvent)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': now,
        ':emptyList': [],
        ':newEvent': [{
          status,
          location: location || 'Bilinmiyor',
          timestamp: timestamp || now,
          description: description || `Durum güncellendi: ${status}`
        }]
      }
    }));

    // Update order status if delivered
    if (status === 'DELIVERED') {
      try {
        await docClient.send(new UpdateCommand({
          TableName: ORDERS_TABLE,
          Key: { orderId: queryResult.Items[0].orderId },
          UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'delivered',
            ':updatedAt': now
          }
        }));
      } catch (err) {
        console.log('Order status update warning:', err);
      }
    }

    return createResponse(200, {
      success: true,
      message: 'Kargo durumu güncellendi'
    });

  } catch (error) {
    console.error('Update shipment status error:', error);
    return createResponse(500, { success: false, message: 'Durum güncellenirken hata' });
  }
}

// Cancel shipment
export async function cancelShipment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const shippingId = event.pathParameters?.shippingId;
    
    if (!shippingId) {
      return createResponse(400, { success: false, message: 'Shipping ID gerekli' });
    }

    const now = new Date().toISOString();

    // Update status to CANCELLED
    await docClient.send(new UpdateCommand({
      TableName: SHIPPING_TABLE,
      Key: { shippingId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, cancelledAt = :cancelledAt, history = list_append(history, :newEvent)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'CANCELLED',
        ':updatedAt': now,
        ':cancelledAt': now,
        ':newEvent': [{
          status: 'CANCELLED',
          timestamp: now,
          description: 'Kargo iptal edildi'
        }]
      }
    }));

    // TODO: Call provider API to cancel

    return createResponse(200, {
      success: true,
      message: 'Kargo başarıyla iptal edildi'
    });

  } catch (error) {
    console.error('Cancel shipment error:', error);
    return createResponse(500, { success: false, message: 'İptal işlemi başarısız' });
  }
}

// Get shipping rates (estimate)
export async function getShippingRates(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return createResponse(400, { success: false, message: 'Request body required' });
    }

    const { weight, fromCity, toCity, shipmentType = 'STANDARD' } = JSON.parse(event.body);

    if (!weight || !fromCity || !toCity) {
      return createResponse(400, { success: false, message: 'weight, fromCity ve toCity gerekli' });
    }

    // Calculate rates for each provider (mock rates)
    const baseRates: Record<string, number> = {
      'YURTICI': 45,
      'ARAS': 42,
      'MNG': 48,
      'PTT': 35
    };

    const typeMultiplier = {
      'STANDARD': 1,
      'NEXT_DAY': 1.8,
      'EXPRESS': 1.5
    }[shipmentType] || 1;

    const rates = Object.entries(SHIPPING_PROVIDERS).map(([code, config]) => {
      const baseRate = baseRates[code] || 50;
      const weightCost = Math.max(0, (weight - 1) * 10); // 10 TL per kg after first kg
      const total = (baseRate + weightCost) * typeMultiplier;

      return {
        provider: code,
        providerName: config.name,
        amount: Math.round(total * 100) / 100,
        currency: 'TRY',
        estimatedDays: shipmentType === 'NEXT_DAY' ? 1 : shipmentType === 'EXPRESS' ? 2 : 3,
        features: getProviderFeatures(code)
      };
    });

    return createResponse(200, {
      success: true,
      data: rates.sort((a, b) => a.amount - b.amount)
    });

  } catch (error) {
    console.error('Get shipping rates error:', error);
    return createResponse(500, { success: false, message: 'Fiyat hesaplanırken hata' });
  }
}

function getProviderFeatures(provider: string): string[] {
  const features: Record<string, string[]> = {
    'YURTICI': ['Kapıda Ödeme', 'SMS Bilgilendirme', 'Adresten Alım', 'Aynı Gün Teslimat'],
    'ARAS': ['Kapıda Ödeme', 'SMS/E-posta Bilgilendirme', 'Güvenli Paketleme'],
    'MNG': ['Kapıda Ödeme', 'Mobil Takip', 'DHL Global Ağı'],
    'PTT': ['Tüm Türkiye Kapsamı', 'Uygun Fiyat', 'Köy Teslimatı']
  };
  return features[provider] || [];
}

// Get all providers info
export async function getProviders(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const providers = Object.entries(SHIPPING_PROVIDERS).map(([code, config]) => ({
    code,
    name: config.name,
    trackingUrl: generateTrackingUrl(code, ''),
    features: getProviderFeatures(code)
  }));

  return createResponse(200, {
    success: true,
    data: providers
  });
}

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));

  const path = event.path;
  const method = event.httpMethod;

  // CORS preflight
  if (method === 'OPTIONS') {
    return createResponse(200, {});
  }

  // Routes
  if (path === '/shipping' && method === 'POST') {
    return createShipment(event);
  }

  if (path.startsWith('/shipping/order/') && method === 'GET') {
    return getShipment(event);
  }

  if (path.startsWith('/shipping/track/') && method === 'GET') {
    return trackShipment(event);
  }

  if (path.startsWith('/shipping/') && path.includes('/cancel') && method === 'POST') {
    return cancelShipment(event);
  }

  if (path === '/shipping/webhook' && method === 'POST') {
    return updateShipmentStatus(event);
  }

  if (path === '/shipping/rates' && method === 'POST') {
    return getShippingRates(event);
  }

  if (path === '/shipping/providers' && method === 'GET') {
    return getProviders(event);
  }

  return createResponse(404, { success: false, message: 'Endpoint not found' });
};
