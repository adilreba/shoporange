import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

// DynamoDB client
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || '';
const STOCK_RESERVATIONS_TABLE = process.env.STOCK_RESERVATIONS_TABLE || '';

// CORS headers
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

// ==================== STOCK CHECK ====================
export const checkStock = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');
    const { quantity = 1 } = body;

    if (!productId) {
      return createResponse(400, { error: 'Product ID required' });
    }

    // Get product stock
    const result = await dynamodb.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
    }));

    if (!result.Item) {
      return createResponse(404, { error: 'Product not found' });
    }

    const availableStock = result.Item.stock || 0;
    const reservedStock = await getReservedStock(productId);
    const actualAvailable = Math.max(0, availableStock - reservedStock);

    return createResponse(200, {
      productId,
      requestedQuantity: quantity,
      availableStock,
      reservedStock,
      actualAvailable,
      inStock: actualAvailable >= quantity,
      canAddToCart: actualAvailable > 0,
    });
  } catch (error) {
    console.error('Error checking stock:', error);
    return createResponse(500, { error: 'Failed to check stock' });
  }
};

// ==================== RESERVE STOCK ====================
export const reserveStock = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      userId, 
      items, 
      reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresAt = Math.floor(Date.now() / 1000) + (30 * 60) // 30 dakika
    } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return createResponse(400, { error: 'userId and items array required' });
    }

    // Check all stocks first
    const stockChecks = await Promise.all(
      items.map(async (item: any) => {
        const productResult = await dynamodb.send(new GetCommand({
          TableName: PRODUCTS_TABLE,
          Key: { id: item.productId },
        }));

        if (!productResult.Item) {
          return { productId: item.productId, error: 'Product not found' };
        }

        const availableStock = productResult.Item.stock || 0;
        const reservedStock = await getReservedStock(item.productId);
        const actualAvailable = Math.max(0, availableStock - reservedStock);

        return {
          productId: item.productId,
          requested: item.quantity,
          available: actualAvailable,
          sufficient: actualAvailable >= item.quantity,
          productName: productResult.Item.name,
        };
      })
    );

    const insufficientItems = stockChecks.filter(check => !check.sufficient);
    if (insufficientItems.length > 0) {
      return createResponse(400, {
        error: 'Insufficient stock',
        insufficientItems: insufficientItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          requested: item.requested,
          available: item.available,
        })),
      });
    }

    // Create reservation
    const reservation = {
      reservationId,
      userId,
      items: items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      status: 'reserved',
      createdAt: new Date().toISOString(),
      expiresAt,
      ttl: expiresAt,
    };

    await dynamodb.send(new PutCommand({
      TableName: STOCK_RESERVATIONS_TABLE,
      Item: reservation,
    }));

    return createResponse(200, {
      success: true,
      reservationId,
      message: 'Stock reserved successfully',
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      items: stockChecks.map(check => ({
        productId: check.productId,
        productName: check.productName,
        reserved: check.requested,
      })),
    });
  } catch (error) {
    console.error('Error reserving stock:', error);
    return createResponse(500, { error: 'Failed to reserve stock' });
  }
};

// ==================== RELEASE STOCK ====================
export const releaseStock = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const reservationId = event.pathParameters?.id;

    if (!reservationId) {
      return createResponse(400, { error: 'Reservation ID required' });
    }

    // Find reservation by scanning (in production, use GSI)
    // For simplicity, we'll update using the composite key
    const body = JSON.parse(event.body || '{}');
    const { userId } = body;

    if (!userId) {
      return createResponse(400, { error: 'userId required in body' });
    }

    // Update status to released
    await dynamodb.send(new UpdateCommand({
      TableName: STOCK_RESERVATIONS_TABLE,
      Key: {
        userId: userId,
        reservationId: reservationId,
      },
      UpdateExpression: 'set #status = :status, releasedAt = :releasedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'released',
        ':releasedAt': new Date().toISOString(),
      },
    }));

    return createResponse(200, {
      success: true,
      message: 'Stock reservation released',
      reservationId,
    });
  } catch (error) {
    console.error('Error releasing stock:', error);
    return createResponse(500, { error: 'Failed to release stock' });
  }
};

// ==================== CONFIRM STOCK (After Payment) ====================
export const confirmStock = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const reservationId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');
    const { userId } = body;

    if (!reservationId || !userId) {
      return createResponse(400, { error: 'Reservation ID and userId required' });
    }

    // Get reservation to find items
    // First, we need to find it - in production use GSI
    // For now, we'll trust the userId provided

    // Decrease actual stock for each item
    // Note: In a real implementation, you'd fetch the reservation first
    // Here we're assuming the order service provides the items
    const { items } = body;
    
    if (items && Array.isArray(items)) {
      const stockUpdates = items.map(async (item: any) => {
        await dynamodb.send(new UpdateCommand({
          TableName: PRODUCTS_TABLE,
          Key: { id: item.productId },
          UpdateExpression: 'set stock = stock - :quantity, salesCount = if_not_exists(salesCount, :zero) + :quantity, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':quantity': item.quantity,
            ':zero': 0,
            ':updatedAt': new Date().toISOString(),
          },
        }));
      });

      await Promise.all(stockUpdates);
    }

    // Update reservation status to confirmed
    await dynamodb.send(new UpdateCommand({
      TableName: STOCK_RESERVATIONS_TABLE,
      Key: {
        userId: userId,
        reservationId: reservationId,
      },
      UpdateExpression: 'set #status = :status, confirmedAt = :confirmedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'confirmed',
        ':confirmedAt': new Date().toISOString(),
      },
    }));

    return createResponse(200, {
      success: true,
      message: 'Stock confirmed and deducted',
      reservationId,
    });
  } catch (error) {
    console.error('Error confirming stock:', error);
    return createResponse(500, { error: 'Failed to confirm stock' });
  }
};

// ==================== UPDATE STOCK (Admin) ====================
export const updateStock = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');
    const { stock, reason } = body;

    if (!productId || stock === undefined) {
      return createResponse(400, { error: 'Product ID and stock value required' });
    }

    const newStock = parseInt(stock);
    if (isNaN(newStock) || newStock < 0) {
      return createResponse(400, { error: 'Invalid stock value' });
    }

    // Update product stock
    await dynamodb.send(new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: 'set stock = :stock, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':stock': newStock,
        ':updatedAt': new Date().toISOString(),
      },
    }));

    // Log stock change
    console.log(`Stock updated for ${productId}: ${newStock}, reason: ${reason || 'No reason provided'}`);

    return createResponse(200, {
      success: true,
      message: 'Stock updated successfully',
      productId,
      newStock,
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return createResponse(500, { error: 'Failed to update stock' });
  }
};

// ==================== BULK STOCK UPDATE (Admin) ====================
export const bulkUpdateStock = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return createResponse(400, { error: 'Updates array required' });
    }

    const results = await Promise.all(
      updates.map(async (update: any) => {
        try {
          await dynamodb.send(new UpdateCommand({
            TableName: PRODUCTS_TABLE,
            Key: { id: update.productId },
            UpdateExpression: 'set stock = :stock, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':stock': update.stock,
              ':updatedAt': new Date().toISOString(),
            },
          }));
          return { productId: update.productId, success: true };
        } catch (err) {
          return { productId: update.productId, success: false, error: (err as Error).message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    return createResponse(200, {
      success: failedCount === 0,
      message: `${successCount} products updated, ${failedCount} failed`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk stock update:', error);
    return createResponse(500, { error: 'Failed to update stocks' });
  }
};

// ==================== GET USER RESERVATIONS ====================
export const getUserReservations = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return createResponse(400, { error: 'User ID required' });
    }

    const result = await dynamodb.send(new QueryCommand({
      TableName: STOCK_RESERVATIONS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));

    const reservations = result.Items || [];

    // Filter out expired reservations
    const now = Math.floor(Date.now() / 1000);
    const validReservations = reservations.filter((res: any) => res.expiresAt > now && res.status === 'reserved');

    return createResponse(200, {
      reservations: validReservations,
      total: validReservations.length,
    });
  } catch (error) {
    console.error('Error getting reservations:', error);
    return createResponse(500, { error: 'Failed to get reservations' });
  }
};

// ==================== GET LOW STOCK PRODUCTS (Admin) ====================
export const getLowStockProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const threshold = parseInt(event.queryStringParameters?.threshold || '10');

    // Scan all products (in production, use GSI on stock field)
    const result = await dynamodb.send(new QueryCommand({
      TableName: PRODUCTS_TABLE,
      IndexName: 'StockIndex',
      KeyConditionExpression: 'stockStatus = :status',
      FilterExpression: 'stock <= :threshold',
      ExpressionAttributeValues: {
        ':status': 'active',
        ':threshold': threshold,
      },
    }));

    // If no GSI exists, scan (for development)
    // In production, this should use a GSI
    return createResponse(200, {
      products: result.Items || [],
      threshold,
    });
  } catch (error) {
    console.error('Error getting low stock products:', error);
    return createResponse(500, { error: 'Failed to get low stock products' });
  }
};

// ==================== HELPER FUNCTIONS ====================
async function getReservedStock(productId: string): Promise<number> {
  try {
    // Tüm aktif rezervasyonlari cek (status = 'reserved' AND expiresAt > now)
    // NOT: Production'da bunun yerine productId uzerinden GSI kullanilmalidir
    const now = Math.floor(Date.now() / 1000);
    
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: STOCK_RESERVATIONS_TABLE,
      FilterExpression: '#status = :status AND expiresAt > :now',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'reserved',
        ':now': now,
      },
    }));
    
    const reservations = scanResult.Items || [];
    let totalReserved = 0;
    
    for (const reservation of reservations) {
      const items = reservation.items || [];
      for (const item of items) {
        if (item.productId === productId) {
          totalReserved += item.quantity || 0;
        }
      }
    }
    
    return totalReserved;
  } catch (error) {
    console.error('Error getting reserved stock:', error);
    // Hata durumunda guvenli taraf tut: tum stok rezerve edilmis varsay
    return Infinity;
  }
}

// ==================== MAIN HANDLER ====================
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path;
  const method = event.httpMethod;

  console.log(`Stock handler: ${method} ${path}`);

  // Route handling
  if (path.match(/\/stock\/check\/[^/]+$/) && method === 'POST') {
    return checkStock(event);
  }

  if (path === '/stock/reserve' && method === 'POST') {
    return reserveStock(event);
  }

  if (path.match(/\/stock\/release\/[^/]+$/) && method === 'POST') {
    return releaseStock(event);
  }

  if (path.match(/\/stock\/confirm\/[^/]+$/) && method === 'POST') {
    return confirmStock(event);
  }

  if (path.match(/\/stock\/update\/[^/]+$/) && method === 'PUT') {
    return updateStock(event);
  }

  if (path === '/stock/bulk-update' && method === 'PUT') {
    return bulkUpdateStock(event);
  }

  if (path.match(/\/stock\/reservations\/[^/]+$/) && method === 'GET') {
    return getUserReservations(event);
  }

  if (path === '/stock/low-stock' && method === 'GET') {
    return getLowStockProducts(event);
  }

  return createResponse(404, { error: 'Not found' });
};
