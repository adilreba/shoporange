/**
 * AUDIT LOGGING MODULE
 * GDPR / KVKK compliant audit trail for all sensitive operations
 * Tüm hassas işlemler için denetim kaydı
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamodb);

const AUDIT_LOG_TABLE = process.env.AUDIT_LOG_TABLE || 'AtusHome-AuditLogs';

// Audit event types
export type AuditEventType = 
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTER'
  | 'USER_UPDATE'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'ORDER_CREATE'
  | 'ORDER_UPDATE'
  | 'ORDER_CANCEL'
  | 'ORDER_REFUND'
  | 'PAYMENT_ATTEMPT'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILURE'
  | 'DATA_EXPORT'
  | 'DATA_DELETE'
  | 'ADMIN_ACTION'
  | 'SECURITY_ALERT';

// Severity levels
export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  logId: string;
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent?: string;
  severity: SeverityLevel;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
  correlationId?: string;
}

// Log audit event
export async function logAuditEvent(
  event: Omit<AuditLogEntry, 'logId' | 'timestamp'>
): Promise<void> {
  const entry: AuditLogEntry = {
    ...event,
    logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    await docClient.send(new PutCommand({
      TableName: AUDIT_LOG_TABLE,
      Item: entry,
    }));

    // Also log to CloudWatch for real-time monitoring
    console.log(`[AUDIT] ${entry.severity.toUpperCase()} ${entry.eventType}:`, {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      success: entry.success,
      ipAddress: entry.ipAddress,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Don't throw - audit failure shouldn't break the main flow
  }
}

// Query audit logs for a user (GDPR/KVKK data portability)
export async function getUserAuditLogs(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<AuditLogEntry[]> {
  try {
    const params: any = {
      TableName: AUDIT_LOG_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Newest first
    };

    if (startDate && endDate) {
      params.KeyConditionExpression += ' AND #timestamp BETWEEN :start AND :end';
      params.ExpressionAttributeNames = { '#timestamp': 'timestamp' };
      params.ExpressionAttributeValues[':start'] = startDate;
      params.ExpressionAttributeValues[':end'] = endDate;
    }

    const result = await docClient.send(new QueryCommand(params));
    return (result.Items || []) as AuditLogEntry[];
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    return [];
  }
}

// Helper functions for common audit events
export const audit = {
  // User authentication events
  login: async (params: {
    userId: string;
    email: string;
    ipAddress: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
    sessionId?: string;
  }) => {
    await logAuditEvent({
      eventType: 'USER_LOGIN',
      severity: params.success ? 'info' : 'warning',
      action: 'LOGIN',
      resource: 'USER',
      resourceId: params.userId,
      userId: params.userId,
      userEmail: params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: params.success,
      errorMessage: params.errorMessage,
      sessionId: params.sessionId,
      details: {
        method: 'email_password',
      },
    });
  },

  logout: async (params: {
    userId: string;
    email: string;
    ipAddress: string;
    sessionId?: string;
  }) => {
    await logAuditEvent({
      eventType: 'USER_LOGOUT',
      severity: 'info',
      action: 'LOGOUT',
      resource: 'USER',
      resourceId: params.userId,
      userId: params.userId,
      userEmail: params.email,
      ipAddress: params.ipAddress,
      success: true,
      sessionId: params.sessionId,
      details: {},
    });
  },

  // Order events
  orderCreate: async (params: {
    userId: string;
    email: string;
    ipAddress: string;
    orderId: string;
    amount: number;
    items: any[];
    success: boolean;
    errorMessage?: string;
  }) => {
    await logAuditEvent({
      eventType: 'ORDER_CREATE',
      severity: params.success ? 'info' : 'error',
      action: 'CREATE',
      resource: 'ORDER',
      resourceId: params.orderId,
      userId: params.userId,
      userEmail: params.email,
      ipAddress: params.ipAddress,
      success: params.success,
      errorMessage: params.errorMessage,
      details: {
        amount: params.amount,
        itemCount: params.items.length,
        // Don't log full item details for privacy
      },
    });
  },

  // Payment events
  paymentAttempt: async (params: {
    userId: string;
    email: string;
    ipAddress: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    success: boolean;
    errorMessage?: string;
  }) => {
    await logAuditEvent({
      eventType: params.success ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILURE',
      severity: params.success ? 'info' : 'error',
      action: 'PAYMENT',
      resource: 'PAYMENT',
      resourceId: params.orderId,
      userId: params.userId,
      userEmail: params.email,
      ipAddress: params.ipAddress,
      success: params.success,
      errorMessage: params.errorMessage,
      details: {
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        // Never store card details!
      },
    });
  },

  // Data privacy events (GDPR/KVKK)
  dataExport: async (params: {
    userId: string;
    email: string;
    ipAddress: string;
    reason: string;
  }) => {
    await logAuditEvent({
      eventType: 'DATA_EXPORT',
      severity: 'warning',
      action: 'EXPORT',
      resource: 'USER_DATA',
      resourceId: params.userId,
      userId: params.userId,
      userEmail: params.email,
      ipAddress: params.ipAddress,
      success: true,
      details: {
        reason: params.reason,
      },
    });
  },

  dataDelete: async (params: {
    userId: string;
    email: string;
    ipAddress: string;
    reason: string;
  }) => {
    await logAuditEvent({
      eventType: 'DATA_DELETE',
      severity: 'critical',
      action: 'DELETE',
      resource: 'USER_DATA',
      resourceId: params.userId,
      userId: params.userId,
      userEmail: params.email,
      ipAddress: params.ipAddress,
      success: true,
      details: {
        reason: params.reason,
      },
    });
  },

  // Admin actions
  adminAction: async (params: {
    adminId: string;
    adminEmail: string;
    ipAddress: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, any>;
  }) => {
    await logAuditEvent({
      eventType: 'ADMIN_ACTION',
      severity: 'warning',
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      userId: params.adminId,
      userEmail: params.adminEmail,
      ipAddress: params.ipAddress,
      success: true,
      details: params.details || {},
    });
  },

  // Security alerts
  securityAlert: async (params: {
    eventType: AuditEventType;
    severity: SeverityLevel;
    action: string;
    ipAddress: string;
    details?: Record<string, any>;
    errorMessage?: string;
  }) => {
    await logAuditEvent({
      eventType: params.eventType,
      severity: params.severity,
      action: params.action,
      resource: 'SECURITY',
      ipAddress: params.ipAddress,
      success: false,
      errorMessage: params.errorMessage,
      details: params.details || {},
    });
  },

  // Direct access to logAuditEvent
  logAuditEvent,
};

// GDPR/KVKK compliance: Generate user data report
export async function generateUserDataReport(userId: string): Promise<{
  userInfo: any;
  orders: any[];
  auditLogs: AuditLogEntry[];
  generatedAt: string;
}> {
  // This would aggregate all user data for GDPR data portability
  // Implementation depends on your data model
  return {
    userInfo: {},
    orders: [],
    auditLogs: await getUserAuditLogs(userId),
    generatedAt: new Date().toISOString(),
  };
}
