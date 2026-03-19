import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const ses = new AWS.SES({ region: process.env.AWS_REGION || 'eu-west-1' });
const sns = new AWS.SNS({ region: process.env.AWS_REGION || 'eu-west-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const VERIFICATION_TABLE = process.env.VERIFICATION_TABLE || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@atushome.com';
const SMS_ORIGINATOR = process.env.SMS_ORIGINATOR || 'AtusHome';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

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
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
    }

    const { email, userId } = JSON.parse(event.body);

    if (!email || !userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and userId required' }) };
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email format' }) };
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + OTP_EXPIRY;

    // OTP'yi DynamoDB'ye kaydet
    await dynamodb.put({
      TableName: VERIFICATION_TABLE,
      Item: {
        id: `email_${userId}`,
        type: 'email',
        email,
        otp,
        expiryTime,
        verified: false,
        attempts: 0,
        createdAt: new Date().toISOString(),
      },
    }).promise();

    // E-posta gönder
    await ses.sendEmail({
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
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Verification code sent',
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        expiryMinutes: 10,
      }),
    };
  } catch (error) {
    console.error('Error sending email verification:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send verification email' }) };
  }
};

// E-posta OTP doğrulama
export const verifyEmailOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
    }

    const { userId, otp } = JSON.parse(event.body);

    if (!userId || !otp) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'UserId and OTP required' }) };
    }

    const result = await dynamodb.get({
      TableName: VERIFICATION_TABLE,
      Key: { id: `email_${userId}`, type: 'email' },
    }).promise();

    if (!result.Item) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Verification not found' }) };
    }

    const record = result.Item;

    if (Date.now() > record.expiryTime) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Code expired' }) };
    }

    if (record.attempts >= 3) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Too many attempts' }) };
    }

    if (record.otp !== otp) {
      await dynamodb.update({
        TableName: VERIFICATION_TABLE,
        Key: { id: `email_${userId}`, type: 'email' },
        UpdateExpression: 'SET attempts = attempts + :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      }).promise();

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid code' }) };
    }

    await dynamodb.update({
      TableName: VERIFICATION_TABLE,
      Key: { id: `email_${userId}`, type: 'email' },
      UpdateExpression: 'SET verified = :verified, verifiedAt = :verifiedAt',
      ExpressionAttributeValues: {
        ':verified': true,
        ':verifiedAt': new Date().toISOString(),
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Email verified successfully', verified: true }),
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to verify email' }) };
  }
};

// TELEFON DOĞRULAMA (SMS)
export const sendPhoneVerification = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
    }

    const { phone, userId } = JSON.parse(event.body);

    if (!phone || !userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Phone and userId required' }) };
    }

    // Türkiye formatı: +90 ile başlamalı
    const phoneRegex = /^\+90[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Use +90XXXXXXXXXX format' }) };
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + OTP_EXPIRY;

    await dynamodb.put({
      TableName: VERIFICATION_TABLE,
      Item: {
        id: `phone_${userId}`,
        type: 'phone',
        phone,
        otp,
        expiryTime,
        verified: false,
        attempts: 0,
        createdAt: new Date().toISOString(),
      },
    }).promise();

    const message = `${SMS_ORIGINATOR} dogrulama kodunuz: ${otp}. 10 dakika gecerlidir.`;
    
    await sns.publish({
      Message: message,
      PhoneNumber: phone,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'SMS sent',
        phone: phone.replace(/(\+90)\d{6}(\d{4})/, '$1******$2'),
        expiryMinutes: 10,
      }),
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send SMS' }) };
  }
};

// Telefon OTP doğrulama
export const verifyPhoneOTP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
    }

    const { userId, otp } = JSON.parse(event.body);

    if (!userId || !otp) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'UserId and OTP required' }) };
    }

    const result = await dynamodb.get({
      TableName: VERIFICATION_TABLE,
      Key: { id: `phone_${userId}`, type: 'phone' },
    }).promise();

    if (!result.Item) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not found' }) };

    const record = result.Item;

    if (Date.now() > record.expiryTime) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Expired' }) };
    if (record.attempts >= 3) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Too many attempts' }) };
    if (record.otp !== otp) {
      await dynamodb.update({
        TableName: VERIFICATION_TABLE,
        Key: { id: `phone_${userId}`, type: 'phone' },
        UpdateExpression: 'SET attempts = attempts + :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      }).promise();
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid code' }) };
    }

    await dynamodb.update({
      TableName: VERIFICATION_TABLE,
      Key: { id: `phone_${userId}`, type: 'phone' },
      UpdateExpression: 'SET verified = :verified, verifiedAt = :verifiedAt',
      ExpressionAttributeValues: { ':verified': true, ':verifiedAt': new Date().toISOString() },
    }).promise();

    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Phone verified', verified: true }) };
  } catch (error) {
    console.error('Error verifying phone:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to verify phone' }) };
  }
};

// ADRES DOĞRULAMA
export const validateAddress = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
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
      return { statusCode: 400, headers, body: JSON.stringify({ valid: false, errors }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ valid: true, message: 'Address is valid' }) };
  } catch (error) {
    console.error('Error validating address:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to validate address' }) };
  }
};
