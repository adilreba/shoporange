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

  console.log('========== WEBSOCKET CONNECT ==========');
  console.log('ConnectionID:', connectionId);
  console.log('UserID:', userId);
  console.log('UserType:', userType);
  console.log('SessionID:', sessionId || 'YOK');
  console.log('Timestamp:', new Date().toISOString());

  if (!userId) {
    console.error('HATA: userId gerekli');
    return { statusCode: 400, body: 'userId required' };
  }

  try {
    console.log('DynamoDB: Bağlantı kaydediliyor...');
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
    console.log('DynamoDB: Bağlantı kaydedildi - ConnectionID:', connectionId);

    // If customer and no sessionId, create new session
    if (userType === 'customer' && !sessionId) {
      const newSessionId = `chat_${Date.now()}`;
      console.log('Yeni müşteri session oluşturuluyor:', newSessionId);
      
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
      console.log('Session oluşturuldu:', newSessionId);

      // Notify customer about session
      console.log('Müşteriye session_created mesajı gönderiliyor...');
      await sendToConnection(connectionId, {
        type: 'session_created',
        sessionId: newSessionId,
        status: 'waiting',
        message: 'Bekleme listesine alındınız. Müşteri temsilcimiz en kısa sürede bağlanacak.'
      });
      console.log('Müşteriye bildirim gönderildi');

      // Notify all agents about new waiting customer
      console.log('Tüm agentlara yeni müşteri bildirimi gönderiliyor...');
      await notifyAgents({
        type: 'new_waiting_customer',
        sessionId: newSessionId,
        customerId: userId,
        timestamp: new Date().toISOString()
      });
      console.log('Agentlara bildirim gönderildi');
    }

    // If agent, update session if sessionId provided
    if (userType === 'agent' && sessionId) {
      console.log('Agent bağlantısı - Session kontrol ediliyor:', sessionId);
      
      // First get the session to check if it's waiting
      const session = await docClient.send(new GetCommand({
        TableName: CHAT_SESSIONS_TABLE,
        Key: { sessionId }
      }));

      if (session.Item) {
        console.log('Session bulundu, agent atanıyor...');
        console.log('CustomerConnectionID:', session.Item.customerConnectionId);
        
        // Update session with agent info
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
        console.log('Session güncellendi - Agent atandı');

        // Update connection record with sessionId
        await docClient.send(new UpdateCommand({
          TableName: CHAT_CONNECTIONS_TABLE,
          Key: { connectionId },
          UpdateExpression: 'SET sessionId = :sessionId',
          ExpressionAttributeValues: {
            ':sessionId': sessionId
          }
        }));
        console.log('Bağlantı kaydı güncellendi');

        // Notify customer that agent joined
        if (session.Item.customerConnectionId) {
          console.log('Müşteriye agent_joined mesajı gönderiliyor. CustomerConnectionID:', session.Item.customerConnectionId);
          await sendToConnection(session.Item.customerConnectionId, {
            type: 'agent_joined',
            agentId: userId,
            message: 'Müşteri temsilcimiz bağlandı. Size nasıl yardımcı olabilirim?'
          });
          console.log('Müşteriye agent_joined mesajı gönderildi');
        } else {
          console.warn('UYARI: Customer connection ID bulunamadı!');
        }

        // Notify other agents that this session is taken
        console.log('Diğer agentlara session_assigned bildirimi gönderiliyor...');
        await notifyAgents({
          type: 'session_assigned',
          sessionId,
          agentId: userId,
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn('UYARI: Session bulunamadı:', sessionId);
      }
    }

    console.log('========== CONNECT BAŞARILI ==========');
    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('========== CONNECT HATASI ==========');
    console.error('Hata:', error);
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
  console.log('---------- SEND TO CONNECTION ----------');
  console.log('Hedef ConnectionID:', connectionId);
  console.log('Gönderilen data:', JSON.stringify(data));
  
  try {
    const endpoint = process.env.WEBSOCKET_API_ENDPOINT?.replace('wss://', 'https://');
    console.log('WebSocket Endpoint:', endpoint);
    
    if (!endpoint) {
      console.error('HATA: WebSocket endpoint yapılandırılmamış!');
      return;
    }

    const apiGateway = new ApiGatewayManagementApiClient({
      region: process.env.AWS_REGION || 'eu-west-1',
      endpoint
    });

    console.log('PostToConnectionCommand gönderiliyor...');
    await apiGateway.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(data))
    }));
    console.log('✅ Mesaj başarıyla gönderildi - ConnectionID:', connectionId);
  } catch (error: any) {
    console.error('❌ Mesaj gönderim hatası:', error.name || 'Bilinmeyen hata');
    console.error('Hata detayı:', error.message || error);
    
    if (error.name === 'GoneException') {
      console.log('GoneException: Bağlantı artık aktif değil, temizleniyor...');
      // Connection is stale, remove it
      await docClient.send(new DeleteCommand({
        TableName: CHAT_CONNECTIONS_TABLE,
        Key: { connectionId }
      }));
      console.log('Eski bağlantı temizlendi');
    } else {
      console.error('Send to connection error:', error);
    }
  }
  console.log('----------------------------------------');
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

  console.log('========== WEBSOCKET MESSAGE ==========');
  console.log('ConnectionID:', connectionId);
  console.log('Action:', action);
  console.log('SessionID (body):', sessionId);
  console.log('Message:', message);
  console.log('Body:', JSON.stringify(body));

  try {
    // Get sender info
    console.log('DynamoDB: Bağlantı bilgisi alınıyor...');
    const connection = await docClient.send(new GetCommand({
      TableName: CHAT_CONNECTIONS_TABLE,
      Key: { connectionId }
    }));

    if (!connection.Item) {
      console.error('HATA: Bağlantı bulunamadı - ConnectionID:', connectionId);
      return { statusCode: 400, body: 'Connection not found' };
    }

    const { userId, userType } = connection.Item;
    const chatSessionId = sessionId || connection.Item.sessionId;
    
    console.log('Bağlantı bulundu - UserID:', userId, 'UserType:', userType);
    console.log('ChatSessionID:', chatSessionId);

    if (!chatSessionId) {
      console.error('HATA: Session ID yok');
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

      case 'accept_chat':
        // Agent accepts a waiting customer
        const { sessionId: acceptSessionId, agentId } = body;
        console.log('---------- ACCEPT_CHAT İŞLENİYOR ----------');
        console.log('Agent:', agentId, 'Session:', acceptSessionId);
        
        if (!acceptSessionId || !agentId) {
          return { statusCode: 400, body: 'sessionId and agentId required' };
        }
        
        // Get agent's connection
        const agentConnections = await docClient.send(new ScanCommand({
          TableName: CHAT_CONNECTIONS_TABLE,
          FilterExpression: 'userId = :agentId AND userType = :agentType',
          ExpressionAttributeValues: {
            ':agentId': agentId,
            ':agentType': 'agent'
          }
        }));
        
        const agentConnection = agentConnections.Items?.[0];
        
        if (!agentConnection) {
          return { statusCode: 404, body: 'Agent connection not found' };
        }
        
        // Get session
        const acceptSession = await docClient.send(new GetCommand({
          TableName: CHAT_SESSIONS_TABLE,
          Key: { sessionId: acceptSessionId }
        }));
        
        if (!acceptSession.Item) {
          return { statusCode: 404, body: 'Session not found' };
        }
        
        // Update session with agent
        await docClient.send(new UpdateCommand({
          TableName: CHAT_SESSIONS_TABLE,
          Key: { sessionId: acceptSessionId },
          UpdateExpression: 'SET agentId = :agentId, agentConnectionId = :agentConnId, #status = :status, updatedAt = :now',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':agentId': agentId,
            ':agentConnId': agentConnection.connectionId,
            ':status': 'active',
            ':now': new Date().toISOString()
          }
        }));
        
        // Update agent's connection with session
        await docClient.send(new UpdateCommand({
          TableName: CHAT_CONNECTIONS_TABLE,
          Key: { connectionId: agentConnection.connectionId },
          UpdateExpression: 'SET sessionId = :sessionId',
          ExpressionAttributeValues: {
            ':sessionId': acceptSessionId
          }
        }));
        
        // Notify customer
        if (acceptSession.Item.customerConnectionId) {
          await sendToConnection(acceptSession.Item.customerConnectionId, {
            type: 'agent_assigned',
            agentId: agentId,
            message: 'Müşteri temsilciniz bağlandı. Size nasıl yardımcı olabilirim?'
          });
        }
        
        // Notify agent
        await sendToConnection(agentConnection.connectionId, {
          type: 'session_assigned',
          sessionId: acceptSessionId,
          customerId: acceptSession.Item.customerId
        });
        
        console.log('✅ Chat accepted by agent:', agentId);
        return { statusCode: 200, body: 'Chat accepted' };

      case 'send_message':
        console.log('---------- SEND_MESSAGE İŞLENİYOR ----------');
        console.log('Gönderen:', userId, 'Tip:', userType);
        console.log('Session:', chatSessionId);
        console.log('Mesaj:', message);
        
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
        console.log('Mesaj verisi oluşturuldu:', messageData);

        console.log('DynamoDB: Mesaj kaydediliyor...');
        await docClient.send(new PutCommand({
          TableName: CHAT_MESSAGES_TABLE,
          Item: messageData
        }));
        console.log('Mesaj kaydedildi');

        // Update session last message
        console.log('Session son mesajı güncelleniyor...');
        await docClient.send(new UpdateCommand({
          TableName: CHAT_SESSIONS_TABLE,
          Key: { sessionId: chatSessionId },
          UpdateExpression: 'SET lastMessage = :msg, updatedAt = :now',
          ExpressionAttributeValues: {
            ':msg': messageData,
            ':now': new Date().toISOString()
          }
        }));
        console.log('Session güncellendi');

        // Broadcast to session participants
        console.log('Alıcı connection ID belirleniyor...');
        console.log('Session.AgentConnectionID:', session.Item.agentConnectionId);
        console.log('Session.CustomerConnectionID:', session.Item.customerConnectionId);
        
        const recipientConnectionId = userType === 'customer' 
          ? session.Item.agentConnectionId 
          : session.Item.customerConnectionId;

        console.log('Alıcı ConnectionID:', recipientConnectionId);

        if (recipientConnectionId) {
          console.log('Alıcıya mesaj gönderiliyor...');
          await sendToConnection(recipientConnectionId, {
            type: 'new_message',
            message: messageData
          });
          console.log('Alıcıya mesaj gönderildi');
        } else {
          console.warn('UYARI: Alıcı ConnectionID bulunamadı!');
          console.warn('Session durumu:', JSON.stringify(session.Item, null, 2));
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

      case 'close_session':
        // Close chat session
        console.log('---------- CLOSE_SESSION İŞLENİYOR ----------');
        console.log('Session:', chatSessionId);
        console.log('UserType:', userType);
        
        // Get session details
        const sessionToClose = await docClient.send(new GetCommand({
          TableName: CHAT_SESSIONS_TABLE,
          Key: { sessionId: chatSessionId }
        }));

        if (sessionToClose.Item) {
          // Update session status
          await docClient.send(new UpdateCommand({
            TableName: CHAT_SESSIONS_TABLE,
            Key: { sessionId: chatSessionId },
            UpdateExpression: 'SET #status = :status, closedAt = :now, updatedAt = :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'closed',
              ':now': new Date().toISOString()
            }
          }));

          // Notify customer
          if (sessionToClose.Item.customerConnectionId) {
            console.log('Müşteriye chat_closed mesajı gönderiliyor...');
            await sendToConnection(sessionToClose.Item.customerConnectionId, {
              type: 'chat_closed',
              message: 'Sohbet sonlandırıldı. Başka bir konuda yardımcı olabilir miyim?'
            });
          }

          // Notify agent
          if (sessionToClose.Item.agentConnectionId) {
            console.log('Agent\'e chat_closed mesajı gönderiliyor...');
            await sendToConnection(sessionToClose.Item.agentConnectionId, {
              type: 'chat_closed',
              sessionId: chatSessionId
            });
          }
          
          console.log('✅ Sohbet başarıyla kapatıldı');
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

  const { sessionId, agentId, agentConnectionId } = JSON.parse(event.body);

  if (!sessionId || !agentId) {
    return createResponse(400, { success: false, message: 'sessionId and agentId required' });
  }

  try {
    // Get current session
    const session = await docClient.send(new GetCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { sessionId }
    }));

    if (!session.Item) {
      return createResponse(404, { success: false, message: 'Session not found' });
    }

    // Update session
    const updateExpression = agentConnectionId 
      ? 'SET agentId = :agentId, agentConnectionId = :agentConnectionId, #status = :status, updatedAt = :now'
      : 'SET agentId = :agentId, #status = :status, updatedAt = :now';
    
    const expressionValues: any = {
      ':agentId': agentId,
      ':status': 'active',
      ':now': new Date().toISOString()
    };
    
    if (agentConnectionId) {
      expressionValues[':agentConnectionId'] = agentConnectionId;
    }

    await docClient.send(new UpdateCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { sessionId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: expressionValues
    }));

    // Notify customer
    if (session.Item.customerConnectionId) {
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
