import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as iyzico from '../../services/iyzico';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';
import { sendOrderEmail, sendOrderSMS } from '../../handlers/orders';
import { audit } from '../../utils/auditLogger';
import { logMetric } from '../../utils/monitoring';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const ORDERS_TABLE = process.env.ORDERS_TABLE || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@atushome.com';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const headers = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

// Helper functions
export const createPaymentIntent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { amount, currency = 'try', orderId } = JSON.parse(event.body);

    if (!amount || amount <= 0) {
      return createErrorResponse(400, 'Valid amount required');
    }

    // TODO: Gerçek Stripe entegrasyonu
    // const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // kuruş cinsinden
    //   currency: currency.toLowerCase(),
    //   metadata: { orderId },
    // });

    // Placeholder - Stripe entegrasyonu sonradan eklenecek
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      client_secret: `pi_${Date.now()}_secret_placeholder`,
      amount,
      currency,
      status: 'requires_confirmation'
    };

    return createSuccessResponse({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
    });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

export const stripeWebhook = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const sig = event.headers['Stripe-Signature'] || '';
    const payload = event.body || '';

    // TODO: Gerçek webhook verification
    // const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    // const event = stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET);

    // Placeholder - Webhook verification sonradan eklenecek
    console.log('Webhook received:', payload);
    console.log('Stripe-Signature:', sig);

    return createSuccessResponse({ received: true });
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  if (path === '/payments/intent' || path.endsWith('/payments/intent')) {
    if (method === 'POST') return createPaymentIntent(event);
  }
  if (path === '/payments/webhook' || path.endsWith('/payments/webhook')) {
    if (method === 'POST') return stripeWebhook(event);
  }

  // İyzico Routes
  if (path === '/payments/iyzico/create' || path.endsWith('/payments/iyzico/create')) {
    if (method === 'POST') return iyzicoCreatePayment(event);
  }
  if (path === '/payments/iyzico/verify' || path.endsWith('/payments/iyzico/verify')) {
    if (method === 'POST') return iyzicoVerifyPayment(event);
  }
  if (path === '/payments/iyzico/installments' || path.endsWith('/payments/iyzico/installments')) {
    if (method === 'GET') return iyzicoGetInstallments(event);
  }
  if (path === '/payments/iyzico/refund' || path.endsWith('/payments/iyzico/refund')) {
    if (method === 'POST') return iyzicoRefund(event);
  }
  if (path === '/payments/iyzico/cancel' || path.endsWith('/payments/iyzico/cancel')) {
    if (method === 'POST') return iyzicoCancel(event);
  }

  return createErrorResponse(404, 'Not found');
};

// ========== İYZICO PAYMENT HANDLERS ==========

/**
 * İyzico 3D Secure ödeme başlat
 */
export const iyzicoCreatePayment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const body = JSON.parse(event.body);
    const clientIp = event.requestContext?.identity?.sourceIp || '127.0.0.1';

    const result = await iyzico.createPaymentRequest({
      price: body.amount,
      paidPrice: body.amount,
      currency: body.currency?.toUpperCase() || 'TRY',
      installment: body.installment || 1,
      basketId: body.orderId,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      callbackUrl: `${process.env.FRONTEND_URL || 'https://atushome.com'}/payment/iyzico/callback`,
      buyer: {
        id: body.customer.id,
        name: body.customer.name,
        surname: body.customer.surname,
        gsmNumber: body.customer.phone,
        email: body.customer.email,
        identityNumber: body.customer.identityNumber || '11111111111',
        registrationAddress: body.customer.address,
        ip: body.customer.ip || clientIp,
        city: body.customer.city,
        country: body.customer.country || 'Turkey',
        zipCode: body.customer.zipCode,
      },
      shippingAddress: {
        contactName: body.shippingAddress.name,
        city: body.shippingAddress.city,
        country: body.shippingAddress.country || 'Turkey',
        address: body.shippingAddress.address,
        zipCode: body.shippingAddress.zipCode,
      },
      billingAddress: body.billingAddress ? {
        contactName: body.billingAddress.name,
        city: body.billingAddress.city,
        country: body.billingAddress.country || 'Turkey',
        address: body.billingAddress.address,
        zipCode: body.billingAddress.zipCode,
      } : {
        contactName: body.shippingAddress.name,
        city: body.shippingAddress.city,
        country: body.shippingAddress.country || 'Turkey',
        address: body.shippingAddress.address,
        zipCode: body.shippingAddress.zipCode,
      },
      basketItems: body.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        category1: item.category,
        category2: item.subCategory || '',
        itemType: 'PHYSICAL',
        price: item.price * item.quantity,
      })),
    });

    if (!result.success) {
      return createErrorResponse(400, result.error || 'Ödeme başlatılamadı');
    }

    return createSuccessResponse({
      success: true,
      paymentPageUrl: result.paymentPageUrl,
      conversationId: result.conversationId,
    });
  } catch (error: any) {
    console.error('İyzico create payment error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * İyzico 3D Secure sonucu doğrula
 */
export const iyzicoVerifyPayment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { paymentId, conversationData, conversationId, orderId } = JSON.parse(event.body);

    if (!paymentId || !conversationId) {
      return createErrorResponse(400, 'Payment ID and Conversation ID required');
    }

    const result = await iyzico.verify3DSecure({
      paymentId,
      conversationData,
      conversationId,
    });

    if (!result.success) {
      // Audit log for failed payment
      audit.paymentAttempt({
        userId: 'unknown',
        email: 'unknown',
        ipAddress: event.requestContext?.identity?.sourceIp || '',
        orderId: orderId || 'unknown',
        amount: 0,
        paymentMethod: 'iyzico',
        success: false,
        errorMessage: result.error || 'Ödeme doğrulanamadı',
      }).catch(() => {});

      return createErrorResponse(400, result.error || 'Ödeme doğrulanamadı');
    }

    // Siparişi güncelle (eğer orderId varsa)
    if (orderId && ORDERS_TABLE) {
      try {
        const orderResult = await dynamodb.send(new GetCommand({
          TableName: ORDERS_TABLE,
          Key: { id: orderId },
        }));

        const order = orderResult.Item;
        if (order) {
          await dynamodb.send(new UpdateCommand({
            TableName: ORDERS_TABLE,
            Key: { id: orderId },
            UpdateExpression: 'SET #status = :status, paymentStatus = :paymentStatus, paidAt = :paidAt, updatedAt = :updatedAt, paymentMethod = :paymentMethod',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'processing',
              ':paymentStatus': 'completed',
              ':paidAt': new Date().toISOString(),
              ':updatedAt': new Date().toISOString(),
              ':paymentMethod': 'iyzico',
            },
          }));

          // Bildirim gönder
          if (order.email) {
            sendOrderEmail(order.email, 'payment_success', {
              orderId: order.id,
              orderNumber: order.id,
              customerName: order.fullName || order.customer,
              total: order.total,
              paymentMethod: 'iyzico',
            }).catch(err => console.error('[Payment] Email error:', err));
          }
          if (order.phone) {
            sendOrderSMS(order.phone, 'order_status_update', {
              orderId: order.id,
              orderNumber: order.id,
              status: 'Ödeme Tamamlandı - Hazırlanıyor',
            }).catch(err => console.error('[Payment] SMS error:', err));
          }

          // Audit log
          audit.paymentAttempt({
            userId: order.userId || 'unknown',
            email: order.email || 'unknown',
            ipAddress: event.requestContext?.identity?.sourceIp || '',
            orderId: order.id,
            amount: order.total || 0,
            paymentMethod: 'iyzico',
            success: true,
          }).catch(() => {});

          logMetric('PAYMENT_SUCCESS', 1, 'Count', { paymentMethod: 'iyzico', orderId: order.id });
        }
      } catch (orderError) {
        console.error('[Payment] Order update error:', orderError);
        // Don't fail the payment verification if order update fails
      }
    }

    return createSuccessResponse({
      success: true,
      paymentId: result.paymentId,
      status: result.status,
      cardFirstSix: result.cardFirstSix,
      cardLastFour: result.cardLastFour,
      installment: result.installment,
      paidPrice: result.paidPrice,
    });
  } catch (error: any) {
    console.error('İyzico verify payment error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * İyzico taksit seçeneklerini getir
 */
export const iyzicoGetInstallments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const binNumber = event.queryStringParameters?.bin || '';
    const price = parseFloat(event.queryStringParameters?.price || '0');

    if (!binNumber || binNumber.length < 6) {
      return createErrorResponse(400, 'BIN number required (first 6 digits of card)');
    }

    if (!price || price <= 0) {
      return createErrorResponse(400, 'Valid price required');
    }

    const result = await iyzico.getInstallmentInfo(binNumber, price);

    if (!result.success) {
      return createErrorResponse(400, result.error || 'Taksit bilgisi alınamadı');
    }

    return createSuccessResponse({
      success: true,
      installments: result.installments,
    });
  } catch (error: any) {
    console.error('İyzico installments error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * İyzico iade işlemi
 */
export const iyzicoRefund = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { paymentTransactionId, price, reason } = JSON.parse(event.body);

    if (!paymentTransactionId || !price) {
      return createErrorResponse(400, 'Payment transaction ID and price required');
    }

    const result = await iyzico.refundPayment({
      paymentTransactionId,
      price,
      currency: 'TRY',
      reason,
    });

    if (!result.success) {
      return createErrorResponse(400, result.error || 'İade başarısız');
    }

    return createSuccessResponse({
      success: true,
      refundId: result.refundId,
      status: result.status,
    });
  } catch (error: any) {
    console.error('İyzico refund error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

/**
 * İyzico iptal işlemi
 */
export const iyzicoCancel = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { paymentId } = JSON.parse(event.body);
    const clientIp = event.requestContext?.identity?.sourceIp || '127.0.0.1';

    if (!paymentId) {
      return createErrorResponse(400, 'Payment ID required');
    }

    const result = await iyzico.cancelPayment({
      paymentId,
      ip: clientIp,
    });

    if (!result.success) {
      return createErrorResponse(400, result.error || 'İptal başarısız');
    }

    return createSuccessResponse({
      success: true,
      cancelId: result.cancelId,
      status: result.status,
    });
  } catch (error: any) {
    console.error('İyzico cancel error:', error);
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};
