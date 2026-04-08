/**
 * Shipping/Kargo Handler
 * Yurtiçi Kargo, Aras, MNG entegrasyonları
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as yurtici from '../../services/yurticiKargo';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const SHIPPING_TABLE = process.env.SHIPPING_TABLE || '';
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

const createErrorResponse = (statusCode: number, message: string): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
});

const createSuccessResponse = (data: any, statusCode = 200): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify(data),
});

/**
 * Yeni kargo oluştur
 */
export const createShipment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const body = JSON.parse(event.body);
    const {
      orderId,
      provider = 'yurtici', // yurtici, aras, mng, ptt
      receiverName,
      receiverAddress,
      receiverCity,
      receiverDistrict,
      receiverPhone,
      receiverEmail,
      weight = 1,
      description,
      cargoType = 'STANDARD',
      paymentType = 'PREPAID',
      collectionPrice = 0,
    } = body;

    if (!orderId || !receiverName || !receiverAddress || !receiverCity || !receiverPhone) {
      return createErrorResponse(400, 'Required fields missing');
    }

    // Siparişi kontrol et
    const orderResult = await dynamodb.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
    }));

    if (!orderResult.Item) {
      return createErrorResponse(404, 'Order not found');
    }

    const order = orderResult.Item;
    const trackingNumber = `YT${Date.now().toString(36).toUpperCase()}`;

    let shipmentResult;

    // Kargo firmasına göre işlem yap
    switch (provider) {
      case 'yurtici':
        shipmentResult = await yurtici.createShipment({
          cargoKey: trackingNumber,
          invoiceNumber: orderId,
          receiverName,
          receiverAddress,
          receiverCity,
          receiverDistrict,
          receiverPhone,
          receiverEmail,
          weight,
          description: description || `Sipariş #${orderId}`,
          cargoType,
          paymentType,
          collectionPrice,
        });
        break;
      
      // Diğer kargo firmaları buraya eklenecek
      case 'aras':
      case 'mng':
        // Henüz entegre değil
        return createErrorResponse(400, `${provider} henüz entegre değil`);
      
      default:
        return createErrorResponse(400, 'Invalid provider');
    }

    if (!shipmentResult.success) {
      return createErrorResponse(400, shipmentResult.error || 'Kargo oluşturulamadı');
    }

    // Kargo kaydını veritabanına ekle
    const shipment = {
      shippingId: `SHIP-${Date.now()}`,
      orderId,
      provider,
      trackingNumber: shipmentResult.trackingNumber || trackingNumber,
      jobId: shipmentResult.jobId,
      status: 'CREATED',
      receiver: {
        name: receiverName,
        address: receiverAddress,
        city: receiverCity,
        district: receiverDistrict,
        phone: receiverPhone,
        email: receiverEmail,
      },
      weight,
      description,
      cargoType,
      paymentType,
      collectionPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({
      TableName: SHIPPING_TABLE,
      Item: shipment,
    }));

    // Siparişi güncelle
    await dynamodb.send(new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'set shippingId = :shippingId, trackingNumber = :trackingNumber, shippingStatus = :status, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':shippingId': shipment.shippingId,
        ':trackingNumber': shipment.trackingNumber,
        ':status': 'shipped',
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return createSuccessResponse({
      success: true,
      message: 'Kargo başarıyla oluşturuldu',
      shipment: {
        shippingId: shipment.shippingId,
        trackingNumber: shipment.trackingNumber,
        provider,
        status: 'CREATED',
      },
    });
  } catch (error: any) {
    console.error('Create shipment error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * Kargo takip sorgula
 */
export const trackShipment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const trackingNumber = event.pathParameters?.trackingNumber;
    const provider = event.queryStringParameters?.provider || 'yurtici';

    if (!trackingNumber) {
      return createErrorResponse(400, 'Tracking number required');
    }

    let trackResult;

    switch (provider) {
      case 'yurtici':
        trackResult = await yurtici.trackShipment(trackingNumber);
        break;
      
      default:
        return createErrorResponse(400, 'Invalid provider');
    }

    if (!trackResult.success) {
      return createErrorResponse(404, trackResult.error || 'Takip bilgisi bulunamadı');
    }

    return createSuccessResponse({
      success: true,
      trackingNumber,
      provider,
      status: trackResult.status,
      location: trackResult.location,
      date: trackResult.date,
      details: trackResult.details,
    });
  } catch (error: any) {
    console.error('Track shipment error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * Kargo iptal et
 */
export const cancelShipment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const shippingId = event.pathParameters?.id;

    if (!shippingId) {
      return createErrorResponse(400, 'Shipping ID required');
    }

    // Kargo kaydını bul
    const shipmentResult = await dynamodb.send(new GetCommand({
      TableName: SHIPPING_TABLE,
      Key: { shippingId },
    }));

    if (!shipmentResult.Item) {
      return createErrorResponse(404, 'Shipment not found');
    }

    const shipment = shipmentResult.Item;

    // Kargo firmasına göre iptal et
    let cancelResult;

    switch (shipment.provider) {
      case 'yurtici':
        cancelResult = await yurtici.cancelShipment(shipment.trackingNumber);
        break;
      
      default:
        return createErrorResponse(400, 'Provider not supported');
    }

    if (!cancelResult.success) {
      return createErrorResponse(400, cancelResult.error || 'İptal işlemi başarısız');
    }

    // Veritabanını güncelle
    await dynamodb.send(new UpdateCommand({
      TableName: SHIPPING_TABLE,
      Key: { shippingId },
      UpdateExpression: 'set #status = :status, cancelledAt = :cancelledAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'CANCELLED',
        ':cancelledAt': new Date().toISOString(),
        ':updatedAt': new Date().toISOString(),
      },
    }));

    // Siparişi de güncelle
    await dynamodb.send(new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId: shipment.orderId },
      UpdateExpression: 'set shippingStatus = :status, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':status': 'cancelled',
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return createSuccessResponse({
      success: true,
      message: 'Kargo iptal edildi',
    });
  } catch (error: any) {
    console.error('Cancel shipment error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * Kargo listesi (siparişe göre)
 */
export const getShipmentsByOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.orderId;

    if (!orderId) {
      return createErrorResponse(400, 'Order ID required');
    }

    const result = await dynamodb.send(new QueryCommand({
      TableName: SHIPPING_TABLE,
      IndexName: 'OrderIdIndex',
      KeyConditionExpression: 'orderId = :orderId',
      ExpressionAttributeValues: {
        ':orderId': orderId,
      },
    }));

    return createSuccessResponse({
      shipments: result.Items || [],
    });
  } catch (error: any) {
    console.error('Get shipments error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * Barkod/PDF oluştur
 */
export const createBarcode = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { trackingNumbers, provider = 'yurtici' } = body;

    if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      return createErrorResponse(400, 'Tracking numbers required');
    }

    let barcodeResult;

    switch (provider) {
      case 'yurtici':
        barcodeResult = await yurtici.createBarcode(trackingNumbers);
        break;
      
      default:
        return createErrorResponse(400, 'Provider not supported');
    }

    if (!barcodeResult.success) {
      return createErrorResponse(400, barcodeResult.error || 'Barkod oluşturulamadı');
    }

    return createSuccessResponse({
      success: true,
      pdfBase64: barcodeResult.pdfBase64,
    });
  } catch (error: any) {
    console.error('Create barcode error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * Bağlantı testi
 */
export const testConnection = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const provider = event.pathParameters?.provider || 'yurtici';

    let testResult;

    switch (provider) {
      case 'yurtici':
        testResult = await yurtici.testConnection();
        break;
      
      default:
        return createErrorResponse(400, 'Invalid provider');
    }

    return createSuccessResponse(testResult);
  } catch (error: any) {
    console.error('Test connection error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  console.log(`Shipping handler: ${method} ${path}`);

  // Create shipment
  if (path === '/shipping' || path.endsWith('/shipping')) {
    if (method === 'POST') return createShipment(event);
  }

  // Track shipment
  if (path.includes('/shipping/track/')) {
    if (method === 'GET') return trackShipment(event);
  }

  // Cancel shipment
  if (path.includes('/shipping/') && path.includes('/cancel')) {
    if (method === 'POST') return cancelShipment(event);
  }

  // Get shipments by order
  if (path.includes('/shipping/order/')) {
    if (method === 'GET') return getShipmentsByOrder(event);
  }

  // Create barcode
  if (path.includes('/shipping/barcode')) {
    if (method === 'POST') return createBarcode(event);
  }

  // Test connection
  if (path.includes('/shipping/test/')) {
    if (method === 'GET') return testConnection(event);
  }

  return createErrorResponse(404, 'Not found');
};
