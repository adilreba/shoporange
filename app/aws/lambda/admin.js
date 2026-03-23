const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE = process.env.ORDERS_TABLE || 'AtusHome-Orders';
const PRODUCTS_TABLE = process.env.TABLE_NAME || 'AtusHome-Products';
const USERS_TABLE = process.env.USERS_TABLE || 'AtusHome-Users';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// Get all orders for admin
exports.getAllOrders = async (event) => {
  console.log('Get all orders for admin');
  
  try {
    const params = {
      TableName: ORDERS_TABLE,
      Limit: 100
    };
    
    const result = await dynamodb.scan(params).promise();
    
    // Enrich with user details
    const ordersWithDetails = await Promise.all(
      result.Items.map(async (order) => {
        try {
          const userParams = {
            TableName: USERS_TABLE,
            Key: { id: order.userId }
          };
          const userResult = await dynamodb.get(userParams).promise();
          return {
            ...order,
            customer: userResult.Item?.name || order.customer || 'Bilinmiyor',
            email: userResult.Item?.email || order.email || 'Bilinmiyor'
          };
        } catch (e) {
          return order;
        }
      })
    );
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ orders: ordersWithDetails })
    };
  } catch (error) {
    console.error('Error getting orders:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Siparişler getirilemedi' })
    };
  }
};

// Get all products for admin
exports.getAllProducts = async (event) => {
  console.log('Get all products for admin');
  
  try {
    const params = {
      TableName: PRODUCTS_TABLE,
      Limit: 100
    };
    
    const result = await dynamodb.scan(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ products: result.Items })
    };
  } catch (error) {
    console.error('Error getting products:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Ürünler getirilemedi' })
    };
  }
};

// Update order status
exports.updateOrderStatus = async (event) => {
  console.log('Update order status:', event.pathParameters);
  
  try {
    const { id } = event.pathParameters;
    const { status } = JSON.parse(event.body);
    
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Geçersiz durum' })
      };
    }
    
    const params = {
      TableName: ORDERS_TABLE,
      Key: { id },
      UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ order: result.Attributes })
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Sipariş durumu güncellenemedi' })
    };
  }
};

// Delete order
exports.deleteOrder = async (event) => {
  console.log('Delete order:', event.pathParameters);
  
  try {
    const { id } = event.pathParameters;
    
    const params = {
      TableName: ORDERS_TABLE,
      Key: { id }
    };
    
    await dynamodb.delete(params).promise();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Sipariş silindi' })
    };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Sipariş silinemedi' })
    };
  }
};

// Get dashboard stats
exports.getDashboardStats = async (event) => {
  console.log('Get dashboard stats');
  
  try {
    // Get all orders
    const ordersResult = await dynamodb.scan({
      TableName: ORDERS_TABLE
    }).promise();
    
    const orders = ordersResult.Items || [];
    
    // Calculate stats
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      processingOrders: orders.filter(o => o.status === 'processing').length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length
    };
    
    // Get products count
    const productsResult = await dynamodb.scan({
      TableName: PRODUCTS_TABLE,
      Select: 'COUNT'
    }).promise();
    
    stats.totalProducts = productsResult.Count || 0;
    
    // Get users count
    const usersResult = await dynamodb.scan({
      TableName: USERS_TABLE,
      Select: 'COUNT'
    }).promise();
    
    stats.totalUsers = usersResult.Count || 0;
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ stats })
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'İstatistikler getirilemedi' })
    };
  }
};
