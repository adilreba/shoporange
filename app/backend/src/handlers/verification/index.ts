import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { createErrorResponse, createSuccessResponse } from '../../utils/response';

// SDK v3 Clients
const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'eu-west-1' });

const VERIFICATION_TABLE = process.env.VERIFICATION_TABLE || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@atushome.com';
const SMS_ORIGINATOR = process.env.SMS_ORIGINATOR || 'AtusHome';

const headers = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

// Helper functions
// 6 haneli OTP kodu oluştur
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP süresi: 10 dakika (milisaniye)
const OTP_EXPIRY = 10 * 60 * 1000;

// E-POSTA DOĞRULAMA
export const sendEmailVerification = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { email, userId } = JSON.parse(event.body);

    if (!email || !userId) {
      return createErrorResponse(400, 'Email and userId required');
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(400, 'Invalid email format');
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + OTP_EXPIRY;

    // OTP'yi DynamoDB'ye kaydet
    await dynamodb.send(new PutCommand({
      TableName: VERIFICATION_TABLE,
      Item: {
        userId: userId,
        type: 'email',
        email,
        otp,
        expiryTime,
        verified: false,
        attempts: 0,
        createdAt: new Date().toISOString(),
      },
    }));

    // E-posta gönder (SES v3)
    await sesClient.send(new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: {
          Data: 'AtusHome - E-posta Doğrulama Kodu',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f97316;">AtusHome</h2>
                <p>Merhaba,</p>
                <p>E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                  ${otp}
                </div>
                <p>Bu kod 10 dakika içinde geçerliliğini yitirecektir.</p>
                <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelin.</p>
              </div>
            `,
            Charset: 'UTF-8',
          },
        },
      },
    }));

    return createSuccessResponse({
      message: 'Verification code sent',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      expiryMinutes: 10,
    });
  } catch (error) {
    console.error('Error sending email verification:', error);
    return createErrorResponse(500, 'Failed to send verification email');
  }
};

// E-posta OTP doğrulama
export const verifyEmailOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { userId, otp } = JSON.parse(event.body);

    if (!userId || !otp) {
      return createErrorResponse(400, 'UserId and OTP required');
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: VERIFICATION_TABLE,
      Key: { userId, type: 'email' },
    }));

    if (!result.Item) {
      return createErrorResponse(400, 'Verification not found');
    }

    const record = result.Item;

    if (Date.now() > record.expiryTime) {
      return createErrorResponse(400, 'Code expired');
    }

    if (record.attempts >= 3) {
      return createErrorResponse(400, 'Too many attempts');
    }

    if (record.otp !== otp) {
      await dynamodb.send(new UpdateCommand({
        TableName: VERIFICATION_TABLE,
        Key: { userId, type: 'email' },
        UpdateExpression: 'SET attempts = attempts + :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      }));

      return createErrorResponse(400, 'Invalid code');
    }

    await dynamodb.send(new UpdateCommand({
      TableName: VERIFICATION_TABLE,
      Key: { userId, type: 'email' },
      UpdateExpression: 'SET verified = :verified, verifiedAt = :verifiedAt',
      ExpressionAttributeValues: {
        ':verified': true,
        ':verifiedAt': new Date().toISOString(),
      },
    }));

    return createSuccessResponse({ message: 'Email verified successfully', verified: true });
  } catch (error) {
    console.error('Error verifying email:', error);
    return createErrorResponse(500, 'Failed to verify email');
  }
};

// TELEFON DOĞRULAMA (SMS)
export const sendPhoneVerification = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { phone, userId } = JSON.parse(event.body);

    if (!phone || !userId) {
      return createErrorResponse(400, 'Phone and userId required');
    }

    // Türkiye formatı: +90 ile başlamalı
    const phoneRegex = /^\+90[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return createErrorResponse(400, 'Use +90XXXXXXXXXX format');
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + OTP_EXPIRY;

    await dynamodb.send(new PutCommand({
      TableName: VERIFICATION_TABLE,
      Item: {
        userId,
        type: 'phone',
        phone,
        otp,
        expiryTime,
        verified: false,
        attempts: 0,
        createdAt: new Date().toISOString(),
      },
    }));

    const message = `${SMS_ORIGINATOR} dogrulama kodunuz: ${otp}. 10 dakika gecerlidir.`;

    // SMS gönder (SNS v3)
    await snsClient.send(new PublishCommand({
      Message: message,
      PhoneNumber: phone,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    }));

    return createSuccessResponse({
      message: 'SMS sent',
      phone: phone.replace(/(\+90)\d{6}(\d{4})/, '$1******$2'),
      expiryMinutes: 10,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return createErrorResponse(500, 'Failed to send SMS');
  }
};

// Telefon OTP doğrulama
export const verifyPhoneOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const { userId, otp } = JSON.parse(event.body);

    if (!userId || !otp) {
      return createErrorResponse(400, 'UserId and OTP required');
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: VERIFICATION_TABLE,
      Key: { userId, type: 'phone' },
    }));

    if (!result.Item) return createErrorResponse(400, 'Not found');

    const record = result.Item;

    if (Date.now() > record.expiryTime) return createErrorResponse(400, 'Expired');
    if (record.attempts >= 3) return createErrorResponse(400, 'Too many attempts');

    if (record.otp !== otp) {
      await dynamodb.send(new UpdateCommand({
        TableName: VERIFICATION_TABLE,
        Key: { userId, type: 'phone' },
        UpdateExpression: 'SET attempts = attempts + :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      }));
      return createErrorResponse(400, 'Invalid code');
    }

    await dynamodb.send(new UpdateCommand({
      TableName: VERIFICATION_TABLE,
      Key: { userId, type: 'phone' },
      UpdateExpression: 'SET verified = :verified, verifiedAt = :verifiedAt',
      ExpressionAttributeValues: {
        ':verified': true,
        ':verifiedAt': new Date().toISOString(),
      },
    }));

    return createSuccessResponse({ message: 'Phone verified', verified: true });
  } catch (error) {
    console.error('Error verifying phone:', error);
    return createErrorResponse(500, 'Failed to verify phone');
  }
};

// ADRES DOĞRULAMA
export const validateAddress = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return createErrorResponse(400, 'Request body required');
    }

    const address = JSON.parse(event.body);
    const errors: string[] = [];

    // Zorunlu alanlar
    const required = ['fullName', 'phone', 'city', 'district', 'neighborhood', 'addressLine', 'zipCode'];
    required.forEach(field => {
      if (!address[field] || address[field].trim() === '') {
        errors.push(`${field} is required`);
      }
    });

    // Telefon formatı
    if (address.phone && !/^\+?\d{10,12}$/.test(address.phone.replace(/\s/g, ''))) {
      errors.push('Invalid phone number');
    }

    // Posta kodu (Türkiye için 5 haneli)
    if (address.zipCode && !/^\d{5}$/.test(address.zipCode)) {
      errors.push('ZIP code must be 5 digits');
    }

    if (errors.length > 0) {
      return createSuccessResponse({ valid: false, errors }, 400);
    }

    return createSuccessResponse({ valid: true, message: 'Address is valid' });
  } catch (error) {
    console.error('Error validating address:', error);
    return createErrorResponse(500, 'Failed to validate address');
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  if (path === '/verify/email/send' || path.endsWith('/verify/email/send')) {
    if (method === 'POST') return sendEmailVerification(event);
  }
  if (path === '/verify/email/verify' || path.endsWith('/verify/email/verify')) {
    if (method === 'POST') return verifyEmailOTP(event);
  }
  if (path === '/verify/phone/send' || path.endsWith('/verify/phone/send')) {
    if (method === 'POST') return sendPhoneVerification(event);
  }
  if (path === '/verify/phone/verify' || path.endsWith('/verify/phone/verify')) {
    if (method === 'POST') return verifyPhoneOTP(event);
  }
  if (path === '/verify/address' || path.endsWith('/verify/address')) {
    if (method === 'POST') return validateAddress(event);
  }

  return createErrorResponse(404, 'Not found');
};
