import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const createPaymentIntent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
    }

    const { amount, currency = 'try' } = JSON.parse(event.body);
    
    if (!amount) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Amount required' }) };
    }

    // Placeholder - Stripe entegrasyonu sonradan eklenecek
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      client_secret: `pi_${Date.now()}_secret_placeholder`,
      amount,
      currency,
      status: 'requires_confirmation'
    };

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }) 
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

export const stripeWebhook = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const sig = event.headers['Stripe-Signature'] || '';
    const payload = event.body || '';

    // Placeholder - Webhook verification sonradan eklenecek
    console.log('Webhook received:', payload);

    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ received: true }) 
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

// Main handler - routes to specific functions and handles OPTIONS
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
  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
