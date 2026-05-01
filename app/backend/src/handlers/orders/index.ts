/**
 * SECURE ORDERS HANDLER
 * PII encryption, audit logging, and secure order management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { encryptObjectFields, decryptObjectFields, maskSensitiveData } from '../../utils/encryption';
import { audit } from '../../utils/auditLogger';
import { logLatency, logBusinessEvent, startTimer } from '../../utils/monitoring';
import { getClientIP } from '../../utils/security';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';
import { generateInvoicePDF } from '../../utils/pdf';
import { getUserFromToken, requireAuth, requireStaff } from '../../utils/authorization';

// DynamoDB client - SDK v3
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const ses = new SESClient({ region: process.env.AWS_REGION || 'eu-central-1' });
const sns = new SNSClient({ region: process.env.AWS_REGION || 'eu-central-1' });
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';
const USERS_TABLE = process.env.USERS_TABLE || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@atushome.com';
const SMS_ORIGINATOR = process.env.SMS_ORIGINATOR || 'AtusHome';

// PII fields to encrypt
const ORDER_PII_FIELDS = ['shippingAddress', 'billingAddress', 'phone', 'email', 'fullName'];



// Get user info from Cognito Authorizer claims
const getUserInfo = (event: APIGatewayProxyEvent): { userId: string; email: string } => {
  const user = getUserFromToken(event);
  if (user) {
    return { userId: user.userId, email: user.email };
  }
  // Fallback for backward compatibility / local testing
  return { userId: 'unknown', email: 'unknown' };
};

// ============== NOTIFICATION HELPERS ==============

// Email templates for order notifications
const emailTemplates: Record<string, (data: any) => { subject: string; body: string }> = {
  order_created: (data) => ({
    subject: `AtusHome - Siparişiniz Alındı #${data.orderNumber || data.orderId}`,
    body: `Merhaba ${data.customerName || 'Değerli Müşterimiz'},

Siparişiniz başarıyla alındı. Teşekkür ederiz!

Sipariş No: ${data.orderNumber || data.orderId}
Tarih: ${new Date(data.createdAt).toLocaleDateString('tr-TR')}
Toplam Tutar: ${data.total?.toFixed(2)} TL
Ödeme Yöntemi: ${data.paymentMethod || 'Kredi Kartı'}

Sipariş detaylarınızı görüntülemek için hesabınıza giriş yapabilirsiniz.

Teşekkürler,
AtusHome Ekibi`
  }),
  payment_success: (data) => ({
    subject: `AtusHome - Ödeme Başarılı #${data.orderNumber || data.orderId}`,
    body: `Merhaba ${data.customerName || 'Değerli Müşterimiz'},

Ödemeniz başarıyla tamamlandı. Siparişiniz hazırlanmaya başlandı.

Sipariş No: ${data.orderNumber || data.orderId}
Ödenen Tutar: ${data.total?.toFixed(2)} TL
Ödeme Yöntemi: ${data.paymentMethod || 'Kredi Kartı'}

Sipariş detaylarınızı görüntülemek için hesabınıza giriş yapabilirsiniz.

Teşekkürler,
AtusHome Ekibi`
  }),
  order_status_update: (data) => ({
    subject: `AtusHome - Sipariş Durumu Güncellendi #${data.orderNumber || data.orderId}`,
    body: `Merhaba ${data.customerName || 'Değerli Müşterimiz'},

Siparişinizin durumu güncellendi.

Sipariş No: ${data.orderNumber || data.orderId}
Yeni Durum: ${data.status}
${data.trackingNumber ? `Kargo Takip No: ${data.trackingNumber}` : ''}
${data.paymentStatus ? `Ödeme Durumu: ${data.paymentStatus}` : ''}

Sipariş detaylarını görüntülemek için hesabınıza giriş yapabilirsiniz.

Teşekkürler,
AtusHome Ekibi`
  })
};

// SMS templates for order notifications
const smsTemplates: Record<string, (data: any) => string> = {
  order_created: (data) =>
    `AtusHome: Siparis #${data.orderNumber || data.orderId} alindi. Tutar: ${data.total?.toFixed(2)} TL. Tesekkurler!`,
  order_status_update: (data) => 
    `AtusHome: Siparis #${data.orderNumber || data.orderId} durumu: ${data.status}. Bizi tercih ettiginiz icin tesekkurler!`,
  payment_success: (data) =>
    `AtusHome: Siparis #${data.orderNumber || data.orderId} odemesi tamamlandi. Tutar: ${data.total?.toFixed(2)} TL. Hazirlaniyor!`
};

// Send email via SES
export async function sendOrderEmail(to: string, template: string, data: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const templateFn = emailTemplates[template];
    if (!templateFn) {
      return { success: false, error: 'Unknown email template' };
    }
    
    const { subject, body } = templateFn(data);
    
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Text: { Data: body, Charset: 'UTF-8' } }
      }
    });

    const result = await ses.send(command);
    console.log('Email sent:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Send email error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send SMS via SNS
export async function sendOrderSMS(phone: string, template: string, data: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format phone number (must start with country code)
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = '+90' + phone.replace(/^0/, '').replace(/\s/g, '');
    }

    const templateFn = smsTemplates[template];
    const message = templateFn ? templateFn(data) : `AtusHome: ${JSON.stringify(data)}`;

    // Truncate SMS to 160 characters for single SMS
    const truncatedMessage = message.length > 160 ? message.substring(0, 157) + '...' : message;

    const command = new PublishCommand({
      PhoneNumber: formattedPhone,
      Message: truncatedMessage,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: SMS_ORIGINATOR },
        'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' }
      }
    });

    const result = await sns.send(command);
    console.log('SMS sent:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Send SMS error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send notification based on user preference
async function sendOrderNotification(
  preference: 'email' | 'sms' | 'both',
  userEmail: string,
  userPhone: string | undefined,
  template: string,
  data: any
): Promise<{ email?: any; sms?: any }> {
  const results: { email?: any; sms?: any } = {};
  
  if (preference === 'email' || preference === 'both') {
    results.email = await sendOrderEmail(userEmail, template, data);
  }
  
  if ((preference === 'sms' || preference === 'both') && userPhone) {
    results.sms = await sendOrderSMS(userPhone, template, data);
  }
  
  return results;
}

// Stok kontrolü fonksiyonu
async function checkStockAvailability(
  items: Array<{ productId: string; quantity: number }>
): Promise<{ available: boolean; errors: Array<{ productId: string; name: string; requested: number; available: number }> }> {
  const errors: Array<{ productId: string; name: string; requested: number; available: number }> = [];

  for (const item of items) {
    const result = await dynamodb.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: item.productId }
    }));

    const product = result.Item;
    if (!product) {
      errors.push({
        productId: item.productId,
        name: 'Bilinmeyen Ürün',
        requested: item.quantity,
        available: 0
      });
    } else if ((product.stock || 0) < item.quantity) {
      errors.push({
        productId: item.productId,
        name: product.name,
        requested: item.quantity,
        available: product.stock
      });
    }
  }

  return { available: errors.length === 0, errors };
}

// Stok düşürme fonksiyonu - Negatif stok olmamasini garanti eder
async function deductStock(items: Array<{ productId: string; quantity: number }>): Promise<void> {
  for (const item of items) {
    await dynamodb.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: item.productId },
      UpdateExpression: 'SET stock = stock - :quantity, updatedAt = :updatedAt',
      ConditionExpression: 'stock >= :quantity',  // ← NEGATIF STOK KORUMASI
      ExpressionAttributeValues: {
        ':quantity': item.quantity,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }
}

// Stok iade fonksiyonu (sipariş iptalinde)
async function returnStock(items: Array<{ productId: string; quantity: number }>): Promise<void> {
  for (const item of items) {
    await dynamodb.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: item.productId },
      UpdateExpression: 'SET stock = stock + :quantity, updatedAt = :updatedAt',
      // Stok negatif olamaz (guvenlik kontrolu)
      ConditionExpression: 'stock >= :zero',
      ExpressionAttributeValues: {
        ':quantity': item.quantity,
        ':zero': 0,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }
}

export const getOrders = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const queryUserId = event.queryStringParameters?.userId;
    const authUser = getUserFromToken(event);
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const lastKey = event.queryStringParameters?.lastKey;
    
    // Max limit 100 ile sınırla (performans icin)
    const safeLimit = Math.min(limit, 100);
    const exclusiveStartKey = lastKey ? { id: lastKey } : undefined;

    let result;
    if (queryUserId) {
      // UserId index'i varsa Query kullan
      // Non-admin users can only view their own orders
      if (authUser && authUser.userId !== queryUserId) {
        requireStaff(event);
      }
      result = await dynamodb.send(new QueryCommand({
        TableName: ORDERS_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': queryUserId },
        Limit: safeLimit,
        ExclusiveStartKey: exclusiveStartKey,
      }));
    } else {
      // Admin yetkisi kontrolü gerekli
      const adminUser = requireStaff(event);
      result = await dynamodb.send(new ScanCommand({
        TableName: ORDERS_TABLE,
        Limit: safeLimit,
        ExclusiveStartKey: exclusiveStartKey,
      }));
      
      // Log admin access
      await audit.adminAction({
        adminId: adminUser.userId,
        adminEmail: adminUser.email,
        ipAddress: getClientIP(event),
        action: 'VIEW_ALL_ORDERS',
        resource: 'ORDER',
        details: { count: result.Items?.length || 0, limit: safeLimit },
      });
    }

    // Decrypt PII fields for response
    const decryptedItems = await Promise.all(
      (result.Items || []).map(async (item) => {
        return await decryptObjectFields(item, ORDER_PII_FIELDS);
      })
    );

    return createSuccessResponse({
      orders: decryptedItems,
      total: decryptedItems.length,
      hasMore: !!result.LastEvaluatedKey,
      nextKey: result.LastEvaluatedKey ? result.LastEvaluatedKey.id : null,
    });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const generateInvoice = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return createErrorResponse(400, 'Order ID required');
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }));

    if (!result.Item) {
      return createErrorResponse(404, 'Order not found');
    }

    // Authorization: users can only view their own orders, staff can view all
    const authUser = getUserFromToken(event);
    if (authUser && authUser.userId !== result.Item.userId) {
      try {
        requireStaff(event);
      } catch {
        return createErrorResponse(403, 'You do not have permission to view this order');
      }
    }

    // Decrypt PII fields
    const order = await decryptObjectFields(result.Item, ORDER_PII_FIELDS);

    const pdfBytes = await generateInvoicePDF({
      orderId: order.id,
      createdAt: order.createdAt,
      customerName: order.fullName || order.customer || 'Müşteri',
      customerEmail: order.email || '',
      customerPhone: order.phone || '',
      shippingAddress: order.shippingAddress || { street: '', city: '', postalCode: '' },
      items: (order.items || []).map((item: any) => ({
        name: item.name || 'Ürün',
        quantity: item.quantity || 1,
        price: item.price || 0,
      })),
      subtotal: order.subtotal || order.total * 0.8 || 0,
      shippingCost: order.shippingCost || 0,
      taxAmount: order.taxAmount || order.total * 0.2 || 0,
      total: order.total || 0,
      paymentMethod: order.paymentMethod || 'Kredi Kartı',
      companyInfo: {
        name: process.env.COMPANY_NAME || 'AtusHome',
        address: process.env.COMPANY_ADDRESS || '',
        taxOffice: process.env.COMPANY_TAX_OFFICE || '',
        taxNumber: process.env.COMPANY_TAX_NUMBER || '',
        phone: process.env.COMPANY_PHONE || '',
        email: process.env.COMPANY_EMAIL || '',
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fatura-${orderId}.pdf"`,
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: Buffer.from(pdfBytes).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Invoice generation error:', error);
    return createErrorResponse(500, 'Failed to generate invoice');
  }
};

export const getOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId) {
      return createErrorResponse(400, 'Order ID required');
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }));

    if (!result.Item) {
      return createErrorResponse(404, 'Order not found');
    }

    // Authorization: users can only view their own orders, staff can view all
    const authUser = getUserFromToken(event);
    if (authUser && authUser.userId !== result.Item.userId) {
      try {
        requireStaff(event);
      } catch {
        return createErrorResponse(403, 'You do not have permission to view this order');
      }
    }

    // Decrypt PII fields
    const decryptedOrder = await decryptObjectFields(result.Item, ORDER_PII_FIELDS);

    return createSuccessResponse(decryptedOrder);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const createOrder = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const timer = startTimer();
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    // Authenticate user from JWT token
    let authUser;
    try {
      authUser = requireAuth(event);
    } catch {
      return createErrorResponse(401, 'Authentication required');
    }

    const orderData = JSON.parse(event.body);
    const { items, shippingAddress, billingAddress, legalConsents } = orderData;
    const userId = authUser.userId;
    const email = authUser.email;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return createErrorResponse(400, 'Order items required');
    }

    // Stok kontrolü yap
    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.available) {
      // Audit log for failed order
      await audit.orderCreate({
        userId,
        email,
        ipAddress: getClientIP(event),
        orderId: 'FAILED',
        amount: orderData.totalAmount || 0,
        items: items,
        success: false,
        errorMessage: 'Stock insufficient',
      });

      return createErrorResponse(400, 'Stock insufficient', stockCheck.errors);
    }

    // FIYAT DOGRULAMASI: Siparisteki fiyatlar ile guncel urun fiyatlarini karsilastir
    const priceErrors: Array<{ productId: string; name: string; expected: number; actual: number }> = [];
    let calculatedTotal = 0;
    
    for (const item of items) {
      const productResult = await dynamodb.send(new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { id: item.productId },
      }));
      
      const product = productResult.Item;
      if (!product) {
        return createErrorResponse(400, `Product not found: ${item.productId}`);
      }
      
      const currentPrice = product.price || 0;
      const orderPrice = item.unitPrice || item.price || 0;
      
      // Fiyat degismisse hata ver (±1 kuruş tolerans)
      if (Math.abs(currentPrice - orderPrice) > 0.01) {
        priceErrors.push({
          productId: item.productId,
          name: product.name || item.productName || 'Unknown',
          expected: currentPrice,
          actual: orderPrice,
        });
      }
      
      calculatedTotal += currentPrice * (item.quantity || 1);
    }
    
    if (priceErrors.length > 0) {
      await audit.orderCreate({
        userId,
        email,
        ipAddress: getClientIP(event),
        orderId: 'FAILED',
        amount: orderData.totalAmount || 0,
        items: items,
        success: false,
        errorMessage: 'Price mismatch detected',
      });
      
      return createErrorResponse(409, 'Urun fiyatlari guncellendi, lutfen sepetinizi kontrol edin', {
        priceErrors,
        calculatedTotal,
      });
    }

    const orderId = `ORD-${Date.now()}`;

    // Prepare order with encrypted PII - override userId/email with token values
    const order = {
      id: orderId,
      ...orderData,
      userId,
      email,
      legalConsents: legalConsents || {},
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Encrypt PII fields before saving
    const encryptedOrder = await encryptObjectFields(order, ORDER_PII_FIELDS);

    // ATOMIK TRANSACTION: Siparis kaydet + stok düsür (hepsi ya basarili ya basarisiz)
    // Bu sayede race condition ve veri tutarsizligi onlenir
    const transactItems: any[] = [
      {
        Put: {
          TableName: ORDERS_TABLE,
          Item: encryptedOrder,
        },
      },
      ...items.map((item: any) => ({
        Update: {
          TableName: PRODUCTS_TABLE,
          Key: { id: item.productId },
          UpdateExpression: 'SET stock = stock - :quantity, updatedAt = :updatedAt',
          ConditionExpression: 'stock >= :quantity',  // Negatif stok olmaz
          ExpressionAttributeValues: {
            ':quantity': item.quantity,
            ':updatedAt': new Date().toISOString(),
          },
        },
      })),
    ];

    try {
      await dynamodb.send(new TransactWriteCommand({
        TransactItems: transactItems,
      }));
    } catch (transactionError: any) {
      console.error('Transaction failed:', transactionError);
      
      // Stok yetersizse TransactionCanceledException gelir
      if (transactionError.name === 'TransactionCanceledException') {
        await audit.orderCreate({
          userId,
          email,
          ipAddress: getClientIP(event),
          orderId: 'FAILED',
          amount: orderData.totalAmount || 0,
          items: items,
          success: false,
          errorMessage: 'Transaction failed - stock may have changed',
        });
        return createErrorResponse(409, 'Stok durumu degisti, lutfen sepetinizi kontrol edin');
      }
      
      throw transactionError;
    }

    // Audit log - sadece transaction basarili olduktan sonra
    await audit.orderCreate({
      userId: userId || 'unknown',
      email: email || 'unknown',
      ipAddress: getClientIP(event),
      orderId: orderId,
      amount: orderData.totalAmount || 0,
      items: items,
      success: true,
    });

    // Return decrypted data to user
    const decryptedOrder = await decryptObjectFields(encryptedOrder, ORDER_PII_FIELDS);

    // Monitoring metrics
    logLatency('createOrder', timer());
    logBusinessEvent('ORDER_CREATED', 1, { orderId: decryptedOrder.id, total: String(decryptedOrder.total) });
    
    // Sipariş onay bildirimleri (async, non-blocking)
    // Kullanıcı tercihini USERS_TABLE'dan çek
    (async () => {
      try {
        const userResult = await dynamodb.send(new GetCommand({
          TableName: USERS_TABLE,
          Key: { id: userId }
        }));
        const user = userResult.Item;
        const preference = user?.notificationPreference || 'email';

        await sendOrderNotification(
          preference,
          email,
          decryptedOrder.phone,
          'order_created',
          {
            orderId: decryptedOrder.id,
            orderNumber: decryptedOrder.orderNumber || decryptedOrder.id,
            customerName: decryptedOrder.fullName,
            total: decryptedOrder.total,
            paymentMethod: decryptedOrder.paymentMethod,
            createdAt: decryptedOrder.createdAt,
          }
        );
      } catch (notificationError) {
        console.error('[Order] Notification error:', notificationError);
      }
    })();

    // Mask sensitive data in response
    const maskedOrder = maskSensitiveData(decryptedOrder, ['email', 'phone']);

    return createSuccessResponse(maskedOrder, 201);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const updateOrderStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const orderId = event.pathParameters?.id;
    if (!orderId || !event.body) {
      return createErrorResponse(400, 'Order ID and body required');
    }

    const { status, paymentStatus } = JSON.parse(event.body);
    const { email, userId } = getUserInfo(event);

    // Mevcut siparişi al
    const orderResult = await dynamodb.send(new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId }
    }));

    if (!orderResult.Item) {
      return createErrorResponse(404, 'Order not found');
    }

    const order = orderResult.Item;

    // Sipariş iptal, iade veya ödeme başarısız olursa stok iade et
    const shouldReturnStock = (
      (status === 'cancelled' && order.status !== 'cancelled') ||
      (status === 'refunded' && order.status !== 'refunded') ||
      (paymentStatus === 'failed' && order.paymentStatus !== 'failed')
    );
    
    if (shouldReturnStock) {
      await returnStock(order.items);
      
      // Audit log
      await audit.logAuditEvent({
        eventType: 'ORDER_CANCEL',
        severity: 'warning',
        action: 'CANCEL_ORDER',
        resource: 'ORDER',
        resourceId: orderId,
        userId: userId || order.userId,
        userEmail: email || order.email,
        ipAddress: getClientIP(event),
        success: true,
        details: {
          previousStatus: order.status,
          newStatus: status,
          reason: 'Order cancelled or refunded',
        },
      });
    }

    // İptal/iade/ödeme başarısız olan sipariş tekrar aktif olursa stok düşür
    const wasInactive = ['cancelled', 'refunded'].includes(order.status) || order.paymentStatus === 'failed';
    const isNowActive = status && !['cancelled', 'refunded'].includes(status) && paymentStatus !== 'failed';
    
    if (wasInactive && isNowActive) {
      const stockCheck = await checkStockAvailability(order.items);
      if (!stockCheck.available) {
        return createErrorResponse(400, 'Cannot reactivate order - stock insufficient', stockCheck.errors);
      }
      await deductStock(order.items);
    }

    // Siparişi güncelle
    const updateExpressions: string[] = [];
    const expressionValues: Record<string, any> = { ':updatedAt': new Date().toISOString() };
    const expressionNames: Record<string, string> = {};

    if (status) {
      updateExpressions.push('#status = :status');
      expressionValues[':status'] = status;
      expressionNames['#status'] = 'status';
    }
    if (paymentStatus) {
      updateExpressions.push('paymentStatus = :paymentStatus');
      expressionValues[':paymentStatus'] = paymentStatus;
    }
    updateExpressions.push('updatedAt = :updatedAt');

    const result = await dynamodb.send(new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { id: orderId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW'
    }));

    // ============== SEND NOTIFICATION BASED ON USER PREFERENCE ==============
    try {
      // Get user info from USERS_TABLE
      const userResult = await dynamodb.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: order.userId }
      }));

      const user = userResult.Item;
      if (user) {
        const notificationPreference = user.notificationPreference || 'email'; // Default to email
        
        // Only send notification if status actually changed
        if (status && status !== order.status) {
          const notificationData = {
            orderId: orderId,
            orderNumber: order.orderNumber || orderId,
            customerName: user.name || order.fullName || 'Değerli Müşterimiz',
            status: status,
            paymentStatus: paymentStatus || order.paymentStatus,
            totalAmount: order.totalAmount
          };

          const notificationResults = await sendOrderNotification(
            notificationPreference,
            user.email || order.email,
            user.phone || order.phone,
            'order_status_update',
            notificationData
          );

          console.log('Notification sent:', {
            preference: notificationPreference,
            orderId,
            results: notificationResults
          });

          // Audit log for notification
          await audit.logAuditEvent({
            eventType: 'NOTIFICATION_SENT',
            severity: 'info',
            action: 'SEND_ORDER_STATUS_NOTIFICATION',
            resource: 'ORDER',
            resourceId: orderId,
            userId: order.userId,
            userEmail: user.email || order.email,
            ipAddress: getClientIP(event),
            success: true,
            details: {
              notificationPreference,
              newStatus: status,
              emailSent: !!notificationResults.email?.success,
              smsSent: !!notificationResults.sms?.success,
            },
          });
        }
      }
    } catch (notificationError) {
      // Don't fail the order update if notification fails
      console.error('Failed to send notification:', notificationError);
    }

    return createSuccessResponse(result.Attributes);
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return createSuccessResponse({}, 200);
  }

  const path = event.path;
  const method = event.httpMethod;

  // Parse path: /orders/{id}/invoice, /orders/{id}, /orders
  const ordersPathMatch = path.match(/^\/orders(?:\/(.+))?\/?$/);
  const subPath = ordersPathMatch?.[1];

  if (subPath) {
    const isInvoice = subPath.endsWith('/invoice');
    const orderId = isInvoice ? subPath.replace('/invoice', '') : subPath;
    event.pathParameters = { ...event.pathParameters, id: orderId };

    if (isInvoice && method === 'GET') return generateInvoice(event);
    if (method === 'GET') return getOrder(event);
    if (method === 'PUT') return updateOrderStatus(event);
  }

  if (path === '/orders' || path.endsWith('/orders')) {
    if (method === 'GET') return getOrders(event);
    if (method === 'POST') return createOrder(event);
  }

  return createErrorResponse(404, 'Not found');
};
