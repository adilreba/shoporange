/**
 * Customer Journey Automation Handler
 * ===================================
 * Email/SMS otomasyon tetikleyicilerini yönetir.
 * 
 * Tetikleyiciler:
 * - welcome: Kayıt sonrası hoş geldin serisi
 * - cart_abandonment: Sepet terk (1h, 24h, 72h)
 * - order_status: Sipariş durum değişiklikleri
 * - birthday: Doğum günü indirimi
 * - win_back: 60 gün aktif olmayan kullanıcı
 * - stock_alert: Stok alarmı
 * - review_request: Yorum isteği
 * 
 * Endpoint'ler:
 * POST /automation/trigger — Manuel tetikleme (admin)
 * GET /automation/templates — Şablon listesi
 * GET /automation/logs — Gönderim logları
 * POST /automation/webhook — Event webhook (DynamoDB Stream'den)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { renderEmailTemplate, getEmailTemplates, type EmailTemplateData } from '../../lib/emailTemplates';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';
import { getUserFromToken, requireStaff } from '../../utils/authorization';
import { audit } from '../../utils/auditLogger';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const ses = new SESClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const sns = new SNSClient({ region: process.env.AWS_REGION || 'eu-west-1' });

const AUTOMATION_LOGS_TABLE = process.env.AUTOMATION_LOGS_TABLE || 'AtusHome-AutomationLogs';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@atushome.com';
const SMS_ORIGINATOR = process.env.SMS_ORIGINATOR || 'AtusHome';

// =============================================================================
// EMAIL SENDER
// =============================================================================

async function sendEmail(
  to: string,
  templateId: string,
  data: EmailTemplateData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { subject, html, text } = renderEmailTemplate(templateId, data);

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
    });

    const result = await ses.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    console.error('Send email error:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// SMS SENDER
// =============================================================================

async function sendSMS(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = '+90' + phone.replace(/^0/, '').replace(/\s/g, '');
    }

    const command = new PublishCommand({
      PhoneNumber: formattedPhone,
      Message: message.length > 160 ? message.substring(0, 157) + '...' : message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: SMS_ORIGINATOR },
        'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
      },
    });

    const result = await sns.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error: any) {
    console.error('Send SMS error:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// LOG AUTOMATION EVENT
// =============================================================================

async function logAutomationEvent(event: {
  logId: string;
  userId: string;
  email: string;
  templateId: string;
  triggerType: string;
  status: 'pending' | 'sent' | 'failed';
  channel: 'email' | 'sms' | 'both';
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await dynamodb.send(new PutCommand({
      TableName: AUTOMATION_LOGS_TABLE,
      Item: {
        ...event,
        timestamp: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 gün sonra sil
      },
    }));
  } catch (error) {
    console.error('Automation log error:', error);
  }
}

// =============================================================================
// TRIGGER HANDLERS
// =============================================================================

interface TriggerRequest {
  userId: string;
  email: string;
  phone?: string;
  templateId: string;
  templateData: EmailTemplateData;
  channel?: 'email' | 'sms' | 'both';
  scheduledAt?: string;
}

async function handleTrigger(request: TriggerRequest): Promise<{
  success: boolean;
  emailResult?: any;
  smsResult?: any;
  logId: string;
}> {
  const logId = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const channel = request.channel || 'email';

  // Eğer ileri tarihli ise scheduled olarak kaydet
  if (request.scheduledAt && new Date(request.scheduledAt) > new Date()) {
    await logAutomationEvent({
      logId,
      userId: request.userId,
      email: request.email,
      templateId: request.templateId,
      triggerType: 'scheduled',
      status: 'pending',
      channel,
      metadata: { scheduledAt: request.scheduledAt, templateData: request.templateData },
    });
    return { success: true, logId };
  }

  // Email gönder
  let emailResult;
  if (channel === 'email' || channel === 'both') {
    emailResult = await sendEmail(request.email, request.templateId, request.templateData);
  }

  // SMS gönder
  let smsResult;
  if ((channel === 'sms' || channel === 'both') && request.phone) {
    const { text } = renderEmailTemplate(request.templateId, request.templateData);
    smsResult = await sendSMS(request.phone, text.substring(0, 160));
  }

  // Log kaydet
  await logAutomationEvent({
    logId,
    userId: request.userId,
    email: request.email,
    templateId: request.templateId,
    triggerType: 'immediate',
    status: emailResult?.success ? 'sent' : 'failed',
    channel,
    messageId: emailResult?.messageId,
    error: emailResult?.error,
    metadata: { templateData: request.templateData },
  });

  return {
    success: emailResult?.success || false,
    emailResult,
    smsResult,
    logId,
  };
}

// =============================================================================
// API HANDLERS
// =============================================================================

export const triggerAutomation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    requireStaff(event);

    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const body: TriggerRequest = JSON.parse(event.body);

    if (!body.userId || !body.email || !body.templateId) {
      return createErrorResponse(400, 'userId, email, and templateId are required');
    }

    const result = await handleTrigger(body);

    // Audit log
    const user = getUserFromToken(event);
    await audit.adminAction({
      adminId: user?.userId || 'system',
      adminEmail: user?.email || 'system',
      ipAddress: event.requestContext?.identity?.sourceIp || '',
      action: 'TRIGGER_AUTOMATION',
      resource: 'AUTOMATION',
      details: { templateId: body.templateId, userId: body.userId, channel: body.channel },
    }).catch(() => {});

    return createSuccessResponse(result);
  } catch (error: any) {
    console.error('Trigger automation error:', error);
    if (error.message === 'FORBIDDEN') {
      return createErrorResponse(403, 'Admin access required');
    }
    return createErrorResponse(500, error.message || 'Internal server error');
  }
};

export const getTemplates = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const templates = getEmailTemplates();
    return createSuccessResponse({ templates });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return createErrorResponse(500, error.message);
  }
};

export const getLogs = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    requireStaff(event);

    const limit = parseInt(event.queryStringParameters?.limit || '50');

    const result = await dynamodb.send(new ScanCommand({
      TableName: AUTOMATION_LOGS_TABLE,
      Limit: limit,
    }));

    return createSuccessResponse({
      logs: result.Items || [],
      count: result.Items?.length || 0,
    });
  } catch (error: any) {
    console.error('Get logs error:', error);
    if (error.message === 'FORBIDDEN') {
      return createErrorResponse(403, 'Admin access required');
    }
    return createErrorResponse(500, error.message);
  }
};

export const previewTemplate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    requireStaff(event);

    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { templateId, templateData } = JSON.parse(event.body);

    if (!templateId) {
      return createErrorResponse(400, 'templateId is required');
    }

    const { subject, html, text } = renderEmailTemplate(templateId, templateData || {});

    return createSuccessResponse({
      subject,
      html,
      text,
      templateId,
    });
  } catch (error: any) {
    console.error('Preview template error:', error);
    if (error.message === 'FORBIDDEN') {
      return createErrorResponse(403, 'Admin access required');
    }
    return createErrorResponse(500, error.message);
  }
};

// =============================================================================
// MAIN HANDLER
// =============================================================================

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      },
      body: '',
    };
  }

  const path = event.path;
  const method = event.httpMethod;

  if (path === '/automation/trigger' || path.endsWith('/automation/trigger')) {
    if (method === 'POST') return triggerAutomation(event);
  }

  if (path === '/automation/templates' || path.endsWith('/automation/templates')) {
    if (method === 'GET') return getTemplates(event);
  }

  if (path === '/automation/logs' || path.endsWith('/automation/logs')) {
    if (method === 'GET') return getLogs(event);
  }

  if (path === '/automation/preview' || path.endsWith('/automation/preview')) {
    if (method === 'POST') return previewTemplate(event);
  }

  return createErrorResponse(404, 'Not found');
};
