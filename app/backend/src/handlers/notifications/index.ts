import { APIGatewayProxyEvent, APIGatewayProxyResult, DynamoDBStreamEvent, SNSMessage } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const ses = new SESClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const sns = new SNSClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamodb);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@atushome.com';
const SMS_ORIGINATOR = process.env.SMS_ORIGINATOR || 'AtusHome';
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'AtusHome-Orders';
const USERS_TABLE = process.env.USERS_TABLE || 'AtusHome-Users';

// Notification types
interface NotificationRequest {
  type: 'email' | 'sms' | 'both';
  to: string; // Email or phone number
  template: string;
  data: Record<string, any>;
  userId?: string;
}

interface OrderNotification {
  orderId: string;
  userId: string;
  status: string;
  previousStatus?: string;
  email?: string;
  phone?: string;
}

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return { statusCode, headers, body: JSON.stringify(body) };
}

// Email templates
const emailTemplates: Record<string, (data: any) => { subject: string; html: string; text: string }> = {
  order_confirmed: (data) => ({
    subject: `Siparişiniz Alındı - #${data.orderNumber || data.orderId?.slice(-8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">Siparişiniz Alındı! 🎉</h2>
        <p>Merhaba ${data.customerName},</p>
        <p>Siparişiniz başarıyla alındı. İşte sipariş detaylarınız:</p>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Sipariş No:</strong> #${data.orderNumber || data.orderId?.slice(-8)}</p>
          <p><strong>Tarih:</strong> ${new Date(data.createdAt || Date.now()).toLocaleDateString('tr-TR')}</p>
          <p><strong>Tutar:</strong> ₺${data.total?.toFixed(2)}</p>
          <p><strong>Ödeme:</strong> ${data.paymentMethod === 'cod' ? 'Kapıda Ödeme' : 'Online Ödeme'}</p>
        </div>
        <p>Siparişiniz hazırlandığında size bilgi vereceğiz.</p>
        <p style="margin-top: 30px;">Teşekkürler,<br>AtusHome Ekibi</p>
      </div>
    `,
    text: `Siparişiniz Alındı!\n\nMerhaba ${data.customerName},\n\nSiparişiniz başarıyla alındı.\nSipariş No: #${data.orderNumber || data.orderId?.slice(-8)}\nTutar: ₺${data.total?.toFixed(2)}\n\nTeşekkürler,\nAtusHome Ekibi`
  }),

  order_shipped: (data) => ({
    subject: `Siparişiniz Yola Çıktı - #${data.orderNumber || data.orderId?.slice(-8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">Siparişiniz Yola Çıktı! 🚚</h2>
        <p>Merhaba ${data.customerName},</p>
        <p>Siparişiniz kargoya verildi. Takip numaranız:</p>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2c5282;">${data.trackingNumber}</p>
          <p><strong>Kargo:</strong> ${data.providerName}</p>
        </div>
        <p>Kargonuzu <a href="${data.trackingUrl}" style="color: #2c5282;">buradan</a> takip edebilirsiniz.</p>
        <p>Tahmini teslimat: ${new Date(data.estimatedDelivery).toLocaleDateString('tr-TR')}</p>
        <p style="margin-top: 30px;">Teşekkürler,<br>AtusHome Ekibi</p>
      </div>
    `,
    text: `Siparişiniz Yola Çıktı!\n\nMerhaba ${data.customerName},\n\nSiparişiniz kargoya verildi.\nTakip No: ${data.trackingNumber}\nKargo: ${data.providerName}\n\nTeşekkürler,\nAtusHome Ekibi`
  }),

  order_delivered: (data) => ({
    subject: `Siparişiniz Teslim Edildi - #${data.orderNumber || data.orderId?.slice(-8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">Siparişiniz Teslim Edildi! 📦</h2>
        <p>Merhaba ${data.customerName},</p>
        <p>Siparişiniz teslim edildi. Umarız beğenirsiniz!</p>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Sipariş No:</strong> #${data.orderNumber || data.orderId?.slice(-8)}</p>
          <p><strong>Teslim Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>
        <p>Bizi tercih ettiğiniz için teşekkür ederiz. Bir sorunuz olursa <a href="mailto:destek@atushome.com" style="color: #2c5282;">destek ekibimiz</a> ile iletişime geçebilirsiniz.</p>
        <p style="margin-top: 30px;">İyi günler,<br>AtusHome Ekibi</p>
      </div>
    `,
    text: `Siparişiniz Teslim Edildi!\n\nMerhaba ${data.customerName},\n\nSiparişiniz teslim edildi.\nSipariş No: #${data.orderNumber || data.orderId?.slice(-8)}\n\nTeşekkürler,\nAtusHome Ekibi`
  }),

  order_cancelled: (data) => ({
    subject: `Siparişiniz İptal Edildi - #${data.orderNumber || data.orderId?.slice(-8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c53030;">Sipariş İptali</h2>
        <p>Merhaba ${data.customerName},</p>
        <p><strong>Sipariş No #${data.orderNumber || data.orderId?.slice(-8)}</strong> iptal edilmiştir.</p>
        ${data.refundAmount ? `<p>İade tutarı <strong>₺${data.refundAmount.toFixed(2)}</strong> 3-5 iş günü içinde hesabınıza yatırılacaktır.</p>` : ''}
        <p>Bir sorunuz varsa destek ekibimizle iletişime geçebilirsiniz.</p>
        <p style="margin-top: 30px;">AtusHome Ekibi</p>
      </div>
    `,
    text: `Sipariş İptali\n\nMerhaba ${data.customerName},\n\nSipariş No #${data.orderNumber || data.orderId?.slice(-8)} iptal edilmiştir.${data.refundAmount ? ` İade tutarı: ₺${data.refundAmount.toFixed(2)}` : ''}\n\nAtusHome Ekibi`
  }),

  low_stock_alert: (data) => ({
    subject: `⚠️ Düşük Stok Uyarısı - ${data.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c53030;">Düşük Stok Uyarısı</h2>
        <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #feb2b2;">
          <p><strong>Ürün:</strong> ${data.productName}</p>
          <p><strong>Mevcut Stok:</strong> ${data.stock}</p>
          <p><strong>Rezerve:</strong> ${data.reserved || 0}</p>
          <p><strong>Kalan:</strong> ${data.available || data.stock}</p>
        </div>
        <p>Lütfen stok takviyesi yapın.</p>
      </div>
    `,
    text: `Düşük Stok Uyarısı\n\nÜrün: ${data.productName}\nMevcut Stok: ${data.stock}\nKalan: ${data.available || data.stock}\n\nLütfen stok takviyesi yapın.`
  }),

  payment_failed: (data) => ({
    subject: `Ödeme Başarısız - #${data.orderNumber || data.orderId?.slice(-8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c53030;">Ödeme Başarısız</h2>
        <p>Merhaba ${data.customerName},</p>
        <p>Siparişiniz için ödeme işlemi başarısız oldu.</p>
        <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Sipariş No:</strong> #${data.orderNumber || data.orderId?.slice(-8)}</p>
          <p><strong>Tutar:</strong> ₺${data.total?.toFixed(2)}</p>
        </div>
        <p>Lütfen ödeme bilgilerinizi kontrol edip tekrar deneyin veya farklı bir ödeme yöntemi seçin.</p>
        <p style="margin-top: 30px;">AtusHome Ekibi</p>
      </div>
    `,
    text: `Ödeme Başarısız\n\nMerhaba ${data.customerName},\n\nSipariş No #${data.orderNumber || data.orderId?.slice(-8)} için ödeme başarısız oldu. Tutar: ₺${data.total?.toFixed(2)}\n\nLütfen tekrar deneyin.\n\nAtusHome Ekibi`
  })
};

// SMS templates (shorter)
const smsTemplates: Record<string, (data: any) => string> = {
  order_confirmed: (data) => 
    `AtusHome: Siparisiniz alindi! Siparis No: #${data.orderNumber || data.orderId?.slice(-8)}. Tutar: ₺${data.total?.toFixed(2)}. Tesekkurler!`,
  
  order_shipped: (data) => 
    `AtusHome: Siparisiniz yola cikti! Takip No: ${data.trackingNumber}. Kargo: ${data.providerName}. Takip: ${data.trackingUrl}`,
  
  order_delivered: (data) => 
    `AtusHome: Siparisiniz teslim edildi! Siparis No: #${data.orderNumber || data.orderId?.slice(-8)}. Bizi tercih ettiginiz icin tesekkurler!`,
  
  order_cancelled: (data) => 
    `AtusHome: Siparisiniz #${data.orderNumber || data.orderId?.slice(-8)} iptal edildi. ${data.refundAmount ? `Iade: ₺${data.refundAmount.toFixed(2)}` : ''}`,
  
  payment_failed: (data) => 
    `AtusHome: Odeme basarisiz! Siparis #${data.orderNumber || data.orderId?.slice(-8)}. Lutfen tekrar deneyin.`
};

// Send email via SES
async function sendEmail(to: string, template: string, data: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const templateFn = emailTemplates[template];
    if (!templateFn) {
      return { success: false, error: `Template '${template}' not found` };
    }

    const { subject, html, text } = templateFn(data);

    const command = new SendEmailCommand({
      Source: `AtusHome <${FROM_EMAIL}>`,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' }
        }
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
async function sendSMS(phone: string, template: string, data: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
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

// API: Send notification manually
export async function sendNotification(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return createResponse(400, { success: false, message: 'Request body required' });
    }

    const body: NotificationRequest = JSON.parse(event.body);
    const { type, to, template, data } = body;

    if (!type || !to || !template) {
      return createResponse(400, { success: false, message: 'type, to, and template are required' });
    }

    const results: any = {};

    if (type === 'email' || type === 'both') {
      results.email = await sendEmail(to, template, data);
    }

    if (type === 'sms' || type === 'both') {
      results.sms = await sendSMS(to, template, data);
    }

    const hasError = (results.email && !results.email.success) || (results.sms && !results.sms.success);

    return createResponse(hasError ? 500 : 200, {
      success: !hasError,
      results
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return createResponse(500, { success: false, message: 'Bildirim gönderilirken hata' });
  }
}

// Get user info by ID
async function getUserInfo(userId: string): Promise<{ email?: string; phone?: string; name?: string } | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }));
    
    if (!result.Item) return null;
    
    return {
      email: result.Item.email,
      phone: result.Item.phone,
      name: result.Item.name || result.Item.fullName
    };
  } catch (err) {
    console.log('Get user info error:', err);
    return null;
  }
}

// Handle order status change notifications
async function handleOrderStatusChange(orderData: any, previousStatus?: string): Promise<void> {
  const { orderId, userId, status, total, paymentMethod, shipping, items } = orderData;
  
  // Get user contact info
  const userInfo = await getUserInfo(userId);
  if (!userInfo || (!userInfo.email && !userInfo.phone)) {
    console.log('No contact info for user:', userId);
    return;
  }

  // Determine notification type based on status
  let template = '';
  switch (status) {
    case 'confirmed':
      template = 'order_confirmed';
      break;
    case 'shipped':
      template = 'order_shipped';
      break;
    case 'delivered':
      template = 'order_delivered';
      break;
    case 'cancelled':
      template = 'order_cancelled';
      break;
    case 'payment_failed':
      template = 'payment_failed';
      break;
    default:
      console.log('No notification template for status:', status);
      return;
  }

  const notificationData = {
    orderId,
    orderNumber: orderData.orderNumber || orderId.slice(-8),
    customerName: userInfo.name || 'Değerli Müşterimiz',
    total,
    paymentMethod,
    createdAt: orderData.createdAt,
    trackingNumber: shipping?.trackingNumber,
    providerName: shipping?.providerName,
    trackingUrl: shipping?.trackingUrl,
    estimatedDelivery: shipping?.estimatedDelivery,
    refundAmount: orderData.refundAmount || total
  };

  // Send email
  if (userInfo.email) {
    console.log(`Sending ${template} email to ${userInfo.email}`);
    await sendEmail(userInfo.email, template, notificationData);
  }

  // Send SMS for important updates
  if (userInfo.phone && ['shipped', 'delivered', 'cancelled'].includes(status)) {
    console.log(`Sending ${template} SMS to ${userInfo.phone}`);
    await sendSMS(userInfo.phone, template, notificationData);
  }
}

// DynamoDB Stream Handler - processes order changes
export async function processOrderStream(event: DynamoDBStreamEvent): Promise<void> {
  console.log('Processing DynamoDB stream:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
        const newImage = record.dynamodb?.NewImage ? unmarshall(record.dynamodb.NewImage as any) : null;
        const oldImage = record.dynamodb?.OldImage ? unmarshall(record.dynamodb.OldImage as any) : null;

        if (!newImage) continue;

        // Only process orders table
        if (!newImage.orderId) continue;

        const previousStatus = oldImage?.status;
        const newStatus = newImage.status;

        // Only notify on status change
        if (previousStatus !== newStatus) {
          console.log(`Order ${newImage.orderId} status changed: ${previousStatus} -> ${newStatus}`);
          await handleOrderStatusChange(newImage, previousStatus);
        }
      }
    } catch (error) {
      console.error('Process record error:', error);
      // Don't throw - continue processing other records
    }
  }
}

// API: Test notification
export async function testNotification(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const testData = {
    orderId: 'test-123',
    orderNumber: 'TEST001',
    customerName: 'Test Kullanıcı',
    total: 999.99,
    paymentMethod: 'credit_card',
    createdAt: new Date().toISOString()
  };

  return createResponse(200, {
    success: true,
    message: 'Test notification templates available',
    templates: Object.keys(emailTemplates),
    sample: {
      email: emailTemplates.order_confirmed(testData),
      sms: smsTemplates.order_confirmed(testData)
    }
  });
}

// Main handler
export const handler = async (event: APIGatewayProxyEvent | DynamoDBStreamEvent | any): Promise<any> => {
  console.log('Event:', JSON.stringify(event));

  // Detect event type
  // DynamoDB Stream event
  if (event.Records && event.Records[0]?.eventSource === 'aws:dynamodb') {
    return processOrderStream(event as DynamoDBStreamEvent);
  }

  // API Gateway event
  if (event.httpMethod) {
    const path = event.path;
    const method = event.httpMethod;

    // CORS preflight
    if (method === 'OPTIONS') {
      return createResponse(200, {});
    }

    if (path === '/notifications/send' && method === 'POST') {
      return sendNotification(event as APIGatewayProxyEvent);
    }

    if (path === '/notifications/test' && method === 'GET') {
      return testNotification(event as APIGatewayProxyEvent);
    }

    return createResponse(404, { success: false, message: 'Endpoint not found' });
  }

  console.log('Unknown event type');
  return { statusCode: 400, body: 'Unknown event type' };
};
