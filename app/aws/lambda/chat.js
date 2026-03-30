// AWS SDK v3 - Node.js 18+ compatible
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const dynamodbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

const apiGatewayClient = process.env.WEBSOCKET_API_ID 
  ? new ApiGatewayManagementApiClient({
      endpoint: `https://${process.env.WEBSOCKET_API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/prod`
    })
  : null;

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const MESSAGES_TABLE = process.env.MESSAGES_TABLE;
const SESSIONS_TABLE = process.env.SESSIONS_TABLE;

// Helper: Send message to WebSocket connection
async function sendToConnection(connectionId, data) {
  if (!apiGatewayClient) return;
  
  try {
    await apiGatewayClient.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(data))
    }));
  } catch (error) {
    if (error.statusCode === 410 || error.name === 'GoneException') {
      // Connection is stale, delete it
      await dynamodb.send(new DeleteCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId }
      }));
    }
    console.error('Error sending message:', error);
  }
}

// $connect handler
exports.connect = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const queryParams = event.queryStringParameters || {};
  const userId = queryParams.userId || 'anonymous';
  const userType = queryParams.userType || 'customer';
  
  console.log('Connect:', { connectionId, userId, userType });
  
  try {
    await dynamodb.send(new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        userType,
        connectedAt: new Date().toISOString(),
        sessionId: null
      }
    }));
    
    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Connect error:', error);
    return { statusCode: 500, body: 'Connection failed' };
  }
};

// $disconnect handler
exports.disconnect = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  console.log('Disconnect:', connectionId);
  
  try {
    const { Item: connection } = await dynamodb.send(new GetCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId }
    }));
    
    if (connection?.sessionId) {
      // Session'ı disconnected yap
      await dynamodb.send(new UpdateCommand({
        TableName: SESSIONS_TABLE,
        Key: { sessionId: connection.sessionId },
        UpdateExpression: 'SET #status = :status, disconnectedAt = :disconnectedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'disconnected',
          ':disconnectedAt': new Date().toISOString()
        }
      }));
      
      // Agent'e bildirim gönder
      const { Items: agentConnections } = await dynamodb.send(new ScanCommand({
        TableName: CONNECTIONS_TABLE,
        FilterExpression: 'userType = :userType AND sessionId = :sessionId',
        ExpressionAttributeValues: { 
          ':userType': 'agent',
          ':sessionId': connection.sessionId
        }
      }));
      
      const disconnectNotification = {
        type: 'customer_disconnected',
        sessionId: connection.sessionId,
        timestamp: new Date().toISOString(),
        message: 'Müşteri bağlantıyı kesti'
      };
      
      await Promise.all(
        agentConnections.map(conn => 
          sendToConnection(conn.connectionId, disconnectNotification)
        )
      );
    }
    
    await dynamodb.send(new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId }
    }));
    
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Disconnect error:', error);
    return { statusCode: 500, body: 'Disconnect failed' };
  }
};

// $default handler
exports.default = async (event) => {
  console.log('Default route:', event);
  return { statusCode: 200, body: 'Default route' };
};

// sendMessage handler
exports.sendMessage = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || '{}');
  const { message, sessionId } = body;
  
  console.log('SendMessage:', { connectionId, sessionId, message });
  
  try {
    const { Item: senderConnection } = await dynamodb.send(new GetCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId }
    }));
    
    if (!senderConnection) {
      return { statusCode: 400, body: 'Connection not found' };
    }
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await dynamodb.send(new PutCommand({
      TableName: MESSAGES_TABLE,
      Item: {
        sessionId,
        messageId,
        senderId: senderConnection.userId,
        senderType: senderConnection.userType,
        content: message,
        timestamp: new Date().toISOString(),
        isRead: false
      }
    }));
    
    const { Items: sessionConnections } = await dynamodb.send(new ScanCommand({
      TableName: CONNECTIONS_TABLE,
      FilterExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: { ':sessionId': sessionId }
    }));
    
    const messageData = {
      type: 'new_message',
      message: {
        messageId,
        sessionId,
        senderId: senderConnection.userId,
        senderType: senderConnection.userType,
        content: message,
        timestamp: new Date().toISOString()
      }
    };
    
    await Promise.all(
      sessionConnections.map(conn => 
        sendToConnection(conn.connectionId, messageData)
      )
    );
    
    return { statusCode: 200, body: 'Message sent' };
  } catch (error) {
    console.error('SendMessage error:', error);
    return { statusCode: 500, body: 'Failed to send message' };
  }
};

// Agent request handler (for REST API)
exports.requestAgent = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const { userId, userName, userEmail } = body;
  
  console.log('RequestAgent:', { userId, userName, userEmail });
  
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await dynamodb.send(new PutCommand({
      TableName: SESSIONS_TABLE,
      Item: {
        sessionId,
        customerId: userId,
        customerName: userName,
        customerEmail: userEmail,
        agentId: null,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }));
    
    const { Items: agentConnections } = await dynamodb.send(new ScanCommand({
      TableName: CONNECTIONS_TABLE,
      FilterExpression: 'userType = :userType',
      ExpressionAttributeValues: { ':userType': 'agent' }
    }));
    
    const notification = {
      type: 'new_waiting_customer',
      session: {
        sessionId,
        customerId: userId,
        customerName: userName,
        customerEmail: userEmail,
        createdAt: new Date().toISOString()
      }
    };
    
    await Promise.all(
      agentConnections.map(conn => 
        sendToConnection(conn.connectionId, notification)
      )
    );
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        success: true,
        sessionId,
        message: 'Agent request created'
      })
    };
  } catch (error) {
    console.error('RequestAgent error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create agent request'
      })
    };
  }
};

// Get waiting sessions (for REST API)
exports.getWaitingSessions = async (event) => {
  try {
    const { Items: sessions } = await dynamodb.send(new QueryCommand({
      TableName: SESSIONS_TABLE,
      IndexName: 'StatusIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'waiting' }
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        success: true,
        data: sessions || []
      })
    };
  } catch (error) {
    console.error('GetWaitingSessions error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch waiting sessions'
      })
    };
  }
};

// Assign agent to session (for REST API)
exports.assignAgent = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const { sessionId, agentId } = body;
  
  try {
    await dynamodb.send(new UpdateCommand({
      TableName: SESSIONS_TABLE,
      Key: { sessionId },
      UpdateExpression: 'SET agentId = :agentId, #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':agentId': agentId,
        ':status': 'active',
        ':updatedAt': new Date().toISOString()
      }
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        success: true,
        message: 'Agent assigned'
      })
    };
  } catch (error) {
    console.error('AssignAgent error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to assign agent'
      })
    };
  }
};
