import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand,
  UpdateCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as parasut from '../../services/parasut';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const ses = new SESClient({});

const INVOICES_TABLE = process.env.INVOICES_TABLE || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@atushome.com';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

// Fatura numarası oluştur (Türkiye formatı: AYYYYXXXXXX)
const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `A${year}`;
  
  // Son fatura numarasını bul
  const result = await dynamodb.send(new ScanCommand({
    TableName: INVOICES_TABLE,
    FilterExpression: 'begins_with(invoiceNumber, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': prefix,
    },
  }));
  
  const invoices = result.Items || [];
  const lastNumber = invoices.length > 0 
    ? Math.max(...invoices.map(i => parseInt(i.invoiceNumber?.replace(prefix, '') || '0')))
    : 0;
  
  const newNumber = (lastNumber + 1).toString().padStart(6, '0');
  return `${prefix}${newNumber}`;
};

// e-Fatura oluştur
export const createInvoice = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const {
      orderId,
      customer,
      email,
      phone,
      taxNumber,
      taxOffice,
      companyName,
      address,
      items,
      total,
      vatRate = 18,
      invoiceType = 'EFATURA', // EFATURA veya EARSIV
    } = body;

    if (!orderId || !customer || !email || !items || !total) {
      return createResponse(400, { error: 'Eksik alanlar var' });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const vatAmount = total * (vatRate / 100);
    const grandTotal = total + vatAmount;

    const invoice = {
      invoiceId: `INV-${Date.now()}`,
      invoiceNumber,
      orderId,
      customer,
      email,
      phone,
      taxNumber: taxNumber || '',
      taxOffice: taxOffice || '',
      companyName: companyName || '',
      address,
      items: items.map((item: any) => ({
        ...item,
        vatRate,
        vatAmount: item.price * item.quantity * (vatRate / 100),
      })),
      subtotal: total,
      vatRate,
      vatAmount,
      grandTotal,
      invoiceType,
      status: 'PENDING', // PENDING, SIGNED, SENT, CANCELLED
      gibStatus: 'DRAFT', // DRAFT, SENT, ACCEPTED, REJECTED
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    await dynamodb.send(new PutCommand({
      TableName: INVOICES_TABLE,
      Item: invoice,
    }));

    // Müşteriye e-posta gönder
    await sendInvoiceEmail(invoice);

    return createResponse(201, {
      success: true,
      message: 'Fatura oluşturuldu',
      invoice: {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        grandTotal: invoice.grandTotal,
      },
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return createResponse(500, { error: 'Fatura oluşturulurken hata oluştu' });
  }
};

// Fatura e-posta gönder
const sendInvoiceEmail = async (invoice: any) => {
  try {
    const htmlBody = `
      <h2>Fatura Bilgileriniz</h2>
      <p>Sayın ${invoice.customer},</p>
      <p>Aşağıdaki fatura oluşturulmuştur:</p>
      <hr>
      <p><strong>Fatura No:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Tarih:</strong> ${invoice.issueDate}</p>
      <p><strong>Tutar:</strong> ${invoice.grandTotal.toFixed(2)} TL</p>
      <p><strong>Durum:</strong> ${invoice.status}</p>
      <hr>
      <p>Faturanızı görüntülemek için hesabınıza giriş yapabilirsiniz.</p>
      <p>Teşekkür ederiz,<br>AtusHome</p>
    `;

    await ses.send(new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [invoice.email] },
      Message: {
        Subject: { Data: `Fatura ${invoice.invoiceNumber}` },
        Body: {
          Html: { Data: htmlBody },
        },
      },
    }));
  } catch (error) {
    console.error('Error sending invoice email:', error);
  }
};

// Fatura listele
export const getInvoices = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.queryStringParameters?.userId;
    const status = event.queryStringParameters?.status;

    if (userId) {
      // Kullanıcıya göre filtrele
      const result = await dynamodb.send(new QueryCommand({
        TableName: INVOICES_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: status ? '#status = :status' : undefined,
        ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
        ExpressionAttributeValues: {
          ':userId': userId,
          ...(status && { ':status': status }),
        },
      }));

      return createResponse(200, {
        invoices: result.Items || [],
        total: result.Items?.length || 0,
      });
    }

    // Tüm faturaları getir (Admin için)
    const result = await dynamodb.send(new ScanCommand({
      TableName: INVOICES_TABLE,
      Limit: 100,
    }));

    return createResponse(200, {
      invoices: result.Items || [],
      total: result.Items?.length || 0,
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    return createResponse(500, { error: 'Faturalar getirilirken hata oluştu' });
  }
};

// Tek fatura getir
export const getInvoice = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const invoiceId = event.pathParameters?.id;

    if (!invoiceId) {
      return createResponse(400, { error: 'Fatura ID gerekli' });
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: INVOICES_TABLE,
      Key: { invoiceId },
    }));

    if (!result.Item) {
      return createResponse(404, { error: 'Fatura bulunamadı' });
    }

    return createResponse(200, result.Item);
  } catch (error) {
    console.error('Error getting invoice:', error);
    return createResponse(500, { error: 'Fatura getirilirken hata oluştu' });
  }
};

// Fatura PDF indir (URL oluştur)
export const getInvoicePdf = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const invoiceId = event.pathParameters?.id;

    if (!invoiceId) {
      return createResponse(400, { error: 'Fatura ID gerekli' });
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: INVOICES_TABLE,
      Key: { invoiceId },
    }));

    if (!result.Item) {
      return createResponse(404, { error: 'Fatura bulunamadı' });
    }

    // PDF oluşturma URL'si (Gerçek implementasyonda S3 URL veya PDF generation service)
    const pdfUrl = `https://api.atushome.com/invoices/${invoiceId}/pdf`;

    return createResponse(200, {
      invoiceId,
      pdfUrl,
      downloadUrl: pdfUrl,
    });
  } catch (error) {
    console.error('Error getting invoice PDF:', error);
    return createResponse(500, { error: 'PDF oluşturulurken hata oluştu' });
  }
};

// Fatura iptal et
export const cancelInvoice = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const invoiceId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');
    const { reason } = body;

    if (!invoiceId) {
      return createResponse(400, { error: 'Fatura ID gerekli' });
    }

    await dynamodb.send(new UpdateCommand({
      TableName: INVOICES_TABLE,
      Key: { invoiceId },
      UpdateExpression: 'set #status = :status, gibStatus = :gibStatus, cancellationReason = :reason, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'CANCELLED',
        ':gibStatus': 'CANCELLED',
        ':reason': reason || 'İptal edildi',
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return createResponse(200, {
      success: true,
      message: 'Fatura iptal edildi',
    });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return createResponse(500, { error: 'Fatura iptal edilirken hata oluştu' });
  }
};

// Paraşüt'e fatura gönder (e-Fatura/e-Arşiv)
export const sendToGib = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const invoiceId = event.pathParameters?.id;

    if (!invoiceId) {
      return createResponse(400, { error: 'Fatura ID gerekli' });
    }

    // Faturayı getir
    const result = await dynamodb.send(new GetCommand({
      TableName: INVOICES_TABLE,
      Key: { invoiceId },
    }));

    if (!result.Item) {
      return createResponse(404, { error: 'Fatura bulunamadı' });
    }

    const invoice = result.Item;

    // Paraşüt'e e-fatura/e-arşiv gönder
    const parasutResult = await parasut.createEInvoice({
      invoiceNumber: invoice.invoiceNumber,
      customer: {
        name: invoice.recipient?.name || invoice.customer,
        email: invoice.recipient?.email || invoice.email,
        phone: invoice.recipient?.phone || invoice.phone,
        taxNumber: invoice.recipient?.taxNumber || invoice.taxNumber,
        taxOffice: invoice.recipient?.taxOffice || invoice.taxOffice,
        address: invoice.recipient?.address?.address || invoice.address,
        city: invoice.recipient?.address?.city,
        district: invoice.recipient?.address?.district,
      },
      items: invoice.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.price,
        vatRate: item.kdvRate || item.vatRate || 18,
      })),
      total: invoice.subtotal,
      vatTotal: invoice.vatAmount || invoice.totalKDV,
      grandTotal: invoice.grandTotal || invoice.total,
      invoiceType: invoice.invoiceType || 'EARSIV',
      orderId: invoice.orderId,
    });

    if (!parasutResult.success) {
      await dynamodb.send(new UpdateCommand({
        TableName: INVOICES_TABLE,
        Key: { invoiceId },
        UpdateExpression: 'set gibStatus = :gibStatus, errorMessage = :error, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':gibStatus': 'ERROR',
          ':error': parasutResult.error,
          ':updatedAt': new Date().toISOString(),
        },
      }));

      return createResponse(500, {
        success: false,
        message: 'Fatura Paraşüt\'e gönderilemedi',
        error: parasutResult.error,
      });
    }

    // Başarılı gönderim
    await dynamodb.send(new UpdateCommand({
      TableName: INVOICES_TABLE,
      Key: { invoiceId },
      UpdateExpression: 'set gibStatus = :gibStatus, parasutInvoiceId = :parasutId, pdfUrl = :pdfUrl, sentToGibAt = :sentAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':gibStatus': 'SENT',
        ':parasutId': parasutResult.parasutInvoiceId,
        ':pdfUrl': parasutResult.pdfUrl,
        ':sentAt': new Date().toISOString(),
        ':updatedAt': new Date().toISOString(),
      },
    }));

    // Müşteriye PDF linki ile e-posta gönder
    if (parasutResult.pdfUrl) {
      await sendInvoiceEmail({
        ...invoice,
        pdfUrl: parasutResult.pdfUrl,
      });
    }

    return createResponse(200, {
      success: true,
      message: 'Fatura Paraşüt üzerinden GIB\'e başarıyla gönderildi',
      gibStatus: 'SENT',
      parasutInvoiceId: parasutResult.parasutInvoiceId,
      pdfUrl: parasutResult.pdfUrl,
    });
  } catch (error: any) {
    console.error('Error sending to GIB via Parasut:', error);
    return createResponse(500, { 
      error: 'Fatura gönderilirken hata oluştu',
      details: error.message 
    });
  }
};

// Mali mühür ile imzala
export const signInvoice = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const invoiceId = event.pathParameters?.id;

    if (!invoiceId) {
      return createResponse(400, { error: 'Fatura ID gerekli' });
    }

    // Mali mühür entegrasyonu burada yapılacak
    // Gerçek implementasyonda TÜBİTAK e-imza API'si kullanılacak

    await dynamodb.send(new UpdateCommand({
      TableName: INVOICES_TABLE,
      Key: { invoiceId },
      UpdateExpression: 'set #status = :status, signedAt = :signedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'SIGNED',
        ':signedAt': new Date().toISOString(),
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return createResponse(200, {
      success: true,
      message: 'Fatura başarıyla imzalandı',
    });
  } catch (error) {
    console.error('Error signing invoice:', error);
    return createResponse(500, { error: 'İmzalama işlemi başarısız oldu' });
  }
};

// Fatura istatistikleri (Admin)
export const getInvoiceStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: INVOICES_TABLE,
    }));

    const invoices = result.Items || [];
    
    const stats = {
      total: invoices.length,
      pending: invoices.filter(i => i.status === 'PENDING').length,
      signed: invoices.filter(i => i.status === 'SIGNED').length,
      sent: invoices.filter(i => i.status === 'SENT').length,
      cancelled: invoices.filter(i => i.status === 'CANCELLED').length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0),
    };

    return createResponse(200, stats);
  } catch (error) {
    console.error('Error getting invoice stats:', error);
    return createResponse(500, { error: 'İstatistikler getirilirken hata oluştu' });
  }
};

// Main handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  console.log(`Invoicing handler: ${method} ${path}`);

  // Routes
  if (path === '/invoices' && method === 'POST') {
    return createInvoice(event);
  }

  if (path === '/invoices' && method === 'GET') {
    return getInvoices(event);
  }

  if (path === '/invoices/stats' && method === 'GET') {
    return getInvoiceStats(event);
  }

  if (path.match(/\/invoices\/[^/]+$/) && method === 'GET') {
    return getInvoice(event);
  }

  if (path.match(/\/invoices\/[^/]+\/pdf$/) && method === 'GET') {
    return getInvoicePdf(event);
  }

  if (path.match(/\/invoices\/[^/]+\/cancel$/) && method === 'POST') {
    return cancelInvoice(event);
  }

  if (path.match(/\/invoices\/[^/]+\/send-to-gib$/) && method === 'POST') {
    return sendToGib(event);
  }

  if (path.match(/\/invoices\/[^/]+\/sign$/) && method === 'POST') {
    return signInvoice(event);
  }

  return createResponse(404, { error: 'Not found' });
};
