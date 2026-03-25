import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

// Helper functions
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

  return createErrorResponse(404, 'Not found');
};
