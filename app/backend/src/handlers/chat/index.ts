import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Custom WebSocket event type
interface WebSocketEvent {
  requestContext: {
    connectionId: string;
    eventType: 'CONNECT' | 'DISCONNECT' | 'MESSAGE';
    domainName?: string;
    stage?: string;
  };
  queryStringParameters?: {
    userId?: string;
    userType?: string;
    sessionId?: string;
  };
  body?: string;
}
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamodb);

const CHAT_CONNECTIONS_TABLE = process.env.CHAT_CONNECTIONS_TABLE || 'AtusHome-ChatConnections';
const CHAT_SESSIONS_TABLE = process.env.CHAT_SESSIONS_TABLE || 'AtusHome-ChatSessions';
const CHAT_MESSAGES_TABLE = process.env.CHAT_MESSAGES_TABLE || 'AtusHome-ChatMessages';

// CORS headers for HTTP endpoints
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
};

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return { statusCode, headers, body: JSON.stringify(body) };
}

// WebSocket connection handler ($connect)
async function handleConnect(event: WebSocketEvent): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId;
  const queryParams = event.queryStringParameters || {};
  const { userId, userType = 'customer', sessionId } = queryParams;

  console.log('WebSocket connect:', { connectionId, userId, userType, sessionId });

  if (!userId) {
    return { statusCode: 400, body: 'userId required' };
  }

  try {
    // Save connection
    await docClient.send(new PutCommand({
      TableName: CHAT_CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        userType, // 'customer' or 'agent'
        sessionId: sessionId || null,
        connectedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
      }
    }));

    // If customer and no sessionId, create new session
    if (userType === 'customer' && !sessionId) {
      const newSessionId = `chat_${Date.now()}`;
      await docClient.send(new PutCommand({
        TableName: CHAT_SESSIONS_TABLE,
        Item: {
          sessionId: newSessionId,
          customerId: userId,
          customerConnectionId: connectionId,
          agentId: null,
          agentConnectionId: null,
          status: 'waiting', // waiting, active, closed
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessage: null
        }
      }));

      // Notify customer about session
      await sendToConnection(connectionId, {
        type: 'session_created',
        sessionId: newSessionId,
        status: 'waiting',
        message: 'Bekleme listesine alındınız. Müşteri temsilcimiz en kısa sürede bağlanacak.'
      });

      // Notify all agents about new waiting customer
      await notifyAgents({
        type: 'new_waiting_customer',
        sessionId: newSessionId,
        customerId: userId,
        timestamp: new Date().toISOString()
      });
    }

    // If agent, update session if sessionId provided
    if (userType === 'agent' && sessionId) {
      await docClient.send(new UpdateCommand({
        TableName: CHAT_SESSIONS_TABLE,
        Key: { sessionId },
        UpdateExpression: 'SET agentId = :agentId, agentConnectionId = :connectionId, #status = :status, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':agentId': userId,
          ':connectionId': connectionId,
          ':status': 'active',
          ':now': new Date().toISOString()
        }
      }));

      // Notify customer that agent joined
      const session = await docClient.send(new GetCommand({
        TableName: CHAT_SESSIONS_TABLE,
        Key: { sessionId }
      }));

      if (session.Item?.customerConnectionId) {
        await sendToConnection(session.Item.customerConnectionId, {
          type: 'agent_joined',
          agentId: userId,
          message: 'Müşteri temsilcimiz bağlandı. Size nasıl yardımcı olabilirim?'
        });
      }
    }

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Connect error:', error);
    return { statusCode: 500, body: 'Connection failed' };
  }
}

// WebSocket disconnect handler ($disconnect)
async function handleDisconnect(event: WebSocketEvent): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId;

  console.log('WebSocket disconnect:', connectionId);

  try {
    // Get connection info
    const connection = await docClient.send(new GetCommand({
      TableName: CHAT_CONNECTIONS_TABLE,
      Key: { connectionId }
    }));

    if (connection.Item) {
      const { sessionId, userType } = connection.Item;

      // Update session status
      if (sessionId) {
        if (userType === 'agent') {
          // Agent disconnected - session back to waiting
          await docClient.send(new UpdateCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Key: { sessionId },
            UpdateExpression: 'SET agentId = :null, agentConnectionId = :null, #status = :status, updatedAt = :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':null': null,
              ':status': 'waiting',
              ':now': new Date().toISOString()
            }
          }));

          // Notify customer
          const session = await docClient.send(new GetCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Key: { sessionId }
          }));

          if (session.Item?.customerConnectionId) {
            await sendToConnection(session.Item.customerConnectionId, {
              type: 'agent_left',
              message: 'Temsilcimiz bağlantısı kesildi. Yeni temsilci atanması bekleniyor...'
            });
          }
        } else {
          // Customer disconnected - mark session as closed
          await docClient.send(new UpdateCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Key: { sessionId },
            UpdateExpression: 'SET #status = :status, updatedAt = :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'closed',
              ':now': new Date().toISOString()
            }
          }));
        }
      }

      // Remove connection
      await docClient.send(new DeleteCommand({
        TableName: CHAT_CONNECTIONS_TABLE,
        Key: { connectionId }
      }));
    }

    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Disconnect error:', error);
    return { statusCode: 500, body: 'Disconnect failed' };
  }
}

// Send message to a connection
async function sendToConnection(connectionId: string, data: any): Promise<void> {
  try {
    const endpoint = process.env.WEBSOCKET_API_ENDPOINT?.replace('wss://', 'https://');
    if (!endpoint) {
      console.error('WebSocket endpoint not configured');
      return;
    }

    const apiGateway = new ApiGatewayManagementApiClient({
      region: process.env.AWS_REGION || 'eu-west-1',
      endpoint
    });

    await apiGateway.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(data))
    }));
  } catch (error: any) {
    if (error.name === 'GoneException') {
      // Connection is stale, remove it
      await docClient.send(new DeleteCommand({
        TableName: CHAT_CONNECTIONS_TABLE,
        Key: { connectionId }
      }));
    } else {
      console.error('Send to connection error:', error);
    }
  }
}

// Notify all connected agents
async function notifyAgents(data: any): Promise<void> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: CHAT_CONNECTIONS_TABLE,
      FilterExpression: 'userType = :type',
      ExpressionAttributeValues: {
        ':type': 'agent'
      }
    }));

    const sendPromises = (result.Items || []).map(conn => 
      sendToConnection(conn.connectionId, data)
    );

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Notify agents error:', error);
  }
}

// WebSocket message handler
async function handleMessage(event: WebSocketEvent): Promise<APIGatewayProxyResult> {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || '{}');
  const { action, message, sessionId } = body;

  console.log('WebSocket message:', { connectionId, action, sessionId });

  try {
    // Get sender info
    const connection = await docClient.send(new GetCommand({
      TableName: CHAT_CONNECTIONS_TABLE,
      Key: { connectionId }
    }));

    if (!connection.Item) {
      return { statusCode: 400, body: 'Connection not found' };
    }

    const { userId, userType } = connection.Item;
    const chatSessionId = sessionId || connection.Item.sessionId;

    if (!chatSessionId) {
      return { statusCode: 400, body: 'No session' };
    }

    // Get session
    const session = await docClient.send(new GetCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { sessionId: chatSessionId }
    }));

    if (!session.Item) {
      return { statusCode: 400, body: 'Session not found' };
    }

    // Handle different actions
    switch (action) {
      case 'request_agent':
        // Customer requests agent
        await docClient.send(new UpdateCommand({
          TableName: CHAT_SESSIONS_TABLE,
          Key: { sessionId: chatSessionId },
          UpdateExpression: 'SET #status = :status, priority = :priority, updatedAt = :now',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'waiting',
            ':priority': 1, // Higher priority for explicit requests
            ':now': new Date().toISOString()
          }
        }));

        // Get queue position (count waiting customers)
        const queueResult = await docClient.send(new ScanCommand({
          TableName: CHAT_SESSIONS_TABLE,
          FilterExpression: '#status = :status AND createdAt <= :createdAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'waiting',
            ':createdAt': session.Item.createdAt
          }
        }));

        const position = queueResult.Count || 1;

        // Notify customer
        await sendToConnection(connectionId, {
          type: 'queue_status',
          position,
          total: position,
          message: position === 1 
            ? 'Sıranız geldi, temsilci atanması bekleniyor...'
            : `Önünüzde ${position - 1} kişi var. Sıranız geldiğinde otomatik bağlanacaksınız.`
        });

        // Notify all agents
        await notifyAgents({
          type: 'new_waiting_customer',
          sessionId: chatSessionId,
          customerId: userId,
          priority: 1,
          timestamp: new Date().toISOString()
        });

        return { statusCode: 200, body: 'Agent requested' };

      case 'send_message':
        // Save message
        const messageId = `msg_${Date.now()}`;
        const messageData = {
          messageId,
          sessionId: chatSessionId,
          senderId: userId,
          senderType: userType,
          content: message,
          timestamp: new Date().toISOString(),
          isRead: false
        };

        await docClient.send(new PutCommand({
          TableName: CHAT_MESSAGES_TABLE,
          Item: messageData
        }));

        // Update session last message
        await docClient.send(new UpdateCommand({
          TableName: CHAT_SESSIONS_TABLE,
          Key: { sessionId: chatSessionId },
          UpdateExpression: 'SET lastMessage = :msg, updatedAt = :now',
          ExpressionAttributeValues: {
            ':msg': messageData,
            ':now': new Date().toISOString()
          }
        }));

        // Broadcast to session participants
        const recipientConnectionId = userType === 'customer' 
          ? session.Item.agentConnectionId 
          : session.Item.customerConnectionId;

        if (recipientConnectionId) {
          await sendToConnection(recipientConnectionId, {
            type: 'new_message',
            message: messageData
          });
        }

        // Confirm to sender
        await sendToConnection(connectionId, {
          type: 'message_sent',
          messageId,
          timestamp: messageData.timestamp
        });
        break;

      case 'typing':
        // Notify recipient about typing
        const typingRecipientId = userType === 'customer'
          ? session.Item.agentConnectionId
          : session.Item.customerConnectionId;

        if (typingRecipientId) {
          await sendToConnection(typingRecipientId, {
            type: 'typing',
            userType,
            userId
          });
        }
        break;

      case 'mark_read':
        // Mark messages as read
        const { messageIds } = body;
        for (const msgId of messageIds) {
          await docClient.send(new UpdateCommand({
            TableName: CHAT_MESSAGES_TABLE,
            Key: { messageId: msgId },
            UpdateExpression: 'SET isRead = :read',
            ExpressionAttributeValues: { ':read': true }
          }));
        }
        break;

      default:
        return { statusCode: 400, body: 'Unknown action' };
    }

    return { statusCode: 200, body: 'Message processed' };
  } catch (error) {
    console.error('Message handler error:', error);
    return { statusCode: 500, body: 'Message processing failed' };
  }
}

// HTTP API: Get waiting chats (for agents)
async function getWaitingChats(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: CHAT_SESSIONS_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'waiting'
      }
    }));

    return createResponse(200, {
      success: true,
      data: result.Items || []
    });
  } catch (error) {
    console.error('Get waiting chats error:', error);
    return createResponse(500, { success: false, message: 'Failed to get waiting chats' });
  }
}

// HTTP API: Get agent's active chats
async function getAgentChats(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const agentId = event.pathParameters?.agentId || event.queryStringParameters?.agentId;

  if (!agentId) {
    return createResponse(400, { success: false, message: 'agentId required' });
  }

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: CHAT_SESSIONS_TABLE,
      FilterExpression: 'agentId = :agentId AND #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':agentId': agentId,
        ':status': 'active'
      }
    }));

    return createResponse(200, {
      success: true,
      data: result.Items || []
    });
  } catch (error) {
    console.error('Get agent chats error:', error);
    return createResponse(500, { success: false, message: 'Failed to get agent chats' });
  }
}

// HTTP API: Assign agent to chat
async function assignAgent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createResponse(400, { success: false, message: 'Request body required' });
  }

  const { sessionId, agentId } = JSON.parse(event.body);

  if (!sessionId || !agentId) {
    return createResponse(400, { success: false, message: 'sessionId and agentId required' });
  }

  try {
    // Update session
    await docClient.send(new UpdateCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { sessionId },
      UpdateExpression: 'SET agentId = :agentId, #status = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':agentId': agentId,
        ':status': 'active',
        ':now': new Date().toISOString()
      }
    }));

    // Get session to find customer connection
    const session = await docClient.send(new GetCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { sessionId }
    }));

    if (session.Item?.customerConnectionId) {
      await sendToConnection(session.Item.customerConnectionId, {
        type: 'agent_assigned',
        agentId,
        message: 'Müşteri temsilcimiz bağlandı. Size nasıl yardımcı olabilirim?'
      });
    }

    return createResponse(200, {
      success: true,
      message: 'Agent assigned successfully'
    });
  } catch (error) {
    console.error('Assign agent error:', error);
    return createResponse(500, { success: false, message: 'Failed to assign agent' });
  }
}

// HTTP API: Get chat messages
async function getChatMessages(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const sessionId = event.pathParameters?.sessionId;

  if (!sessionId) {
    return createResponse(400, { success: false, message: 'sessionId required' });
  }

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: CHAT_MESSAGES_TABLE,
      IndexName: 'SessionIdIndex',
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId
      },
      ScanIndexForward: true
    }));

    return createResponse(200, {
      success: true,
      data: result.Items || []
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return createResponse(500, { success: false, message: 'Failed to get messages' });
  }
}

// HTTP API: Close chat session
async function closeChat(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const sessionId = event.pathParameters?.sessionId;

  if (!sessionId) {
    return createResponse(400, { success: false, message: 'sessionId required' });
  }

  try {
    const session = await docClient.send(new GetCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { sessionId }
    }));

    if (!session.Item) {
      return createResponse(404, { success: false, message: 'Session not found' });
    }

    // Update session
    await docClient.send(new UpdateCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { sessionId },
      UpdateExpression: 'SET #status = :status, closedAt = :now, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'closed',
        ':now': new Date().toISOString()
      }
    }));

    // Notify both parties
    if (session.Item.customerConnectionId) {
      await sendToConnection(session.Item.customerConnectionId, {
        type: 'chat_closed',
        message: 'Sohbet sonlandırıldı. Başka bir konuda yardımcı olabilir miyim?'
      });
    }

    if (session.Item.agentConnectionId) {
      await sendToConnection(session.Item.agentConnectionId, {
        type: 'chat_closed',
        sessionId
      });
    }

    return createResponse(200, {
      success: true,
      message: 'Chat closed successfully'
    });
  } catch (error) {
    console.error('Close chat error:', error);
    return createResponse(500, { success: false, message: 'Failed to close chat' });
  }
}

// Main handler - routes based on event type
export const handler = async (event: any): Promise<any> => {
  console.log('Event:', JSON.stringify(event));

  // WebSocket events
  if (event.requestContext?.eventType) {
    const eventType = event.requestContext.eventType;

    switch (eventType) {
      case 'CONNECT':
        return handleConnect(event);
      case 'DISCONNECT':
        return handleDisconnect(event);
      case 'MESSAGE':
        return handleMessage(event);
      default:
        return { statusCode: 400, body: 'Unknown event type' };
    }
  }

  // HTTP API events
  if (event.httpMethod) {
    const path = event.path;
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
      return createResponse(200, {});
    }

    // Routes
    if (path === '/chat/waiting' && method === 'GET') {
      return getWaitingChats(event);
    }

    if (path.startsWith('/chat/agent/') && method === 'GET') {
      return getAgentChats(event);
    }

    if (path === '/chat/assign' && method === 'POST') {
      return assignAgent(event);
    }

    if (path.startsWith('/chat/') && path.includes('/messages') && method === 'GET') {
      return getChatMessages(event);
    }

    if (path.startsWith('/chat/') && path.includes('/close') && method === 'POST') {
      return closeChat(event);
    }

    return createResponse(404, { success: false, message: 'Endpoint not found' });
  }

  return { statusCode: 400, body: 'Unknown event type' };
};
