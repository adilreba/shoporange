/**
 * Audit Logging System
 * Security event logging for compliance (GDPR, PCI-DSS, SOC2)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);

const AUDIT_LOGS_TABLE = process.env.AUDIT_LOGS_TABLE || 'AuditLogs';

// Log levels
export type LogSeverity = 'info' | 'warning' | 'error' | 'critical';

// Event types
export type AuditEventType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTER'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'ORDER_CREATE'
  | 'ORDER_UPDATE'
  | 'ORDER_CANCEL'
  | 'ORDER_VIEW'
  | 'PAYMENT_PROCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUND'
  | 'DATA_EXPORT'
  | 'DATA_DELETE'
  | 'ADMIN_ACTION'
  | 'CONFIG_CHANGE'
  | 'SECURITY_ALERT'
  | 'RATE_LIMIT_HIT';

// Base audit event interface
interface AuditEvent {
  eventType: AuditEventType;
  severity: LogSeverity;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  details?: Record<string, any>;
  timestamp: string;
  ttl?: number;
}

/**
 * Main audit logging function
 */
export async function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
  const auditRecord: AuditEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    // TTL: 7 years for compliance (PCI-DSS requires 1 year)
    ttl: Math.floor(Date.now() / 1000) + 7 * 365 * 24 * 60 * 60,
  };

  // Always log to CloudWatch
  console.log(JSON.stringify({
    _logType: 'AUDIT_EVENT',
    ...auditRecord,
  }));

  // Also save to DynamoDB for queryable audit trail
  try {
    await docClient.send(new PutCommand({
      TableName: AUDIT_LOGS_TABLE,
      Item: auditRecord,
    }));
  } catch (error) {
    // Don't fail the operation if audit logging fails
    // But log the error for investigation
    console.error('Failed to write audit log to DynamoDB:', error);
  }
}

/**
 * User authentication events
 */
export async function logAuthEvent(params: {
  eventType: 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_REGISTER';
  userId: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}): Promise<void> {
  await logAuditEvent({
    eventType: params.eventType,
    severity: params.success ? 'info' : 'warning',
    action: params.eventType,
    resource: 'USER',
    resourceId: params.userId,
    userId: params.userId,
    userEmail: params.email,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    success: params.success,
    errorMessage: params.failureReason,
    details: {
      method: params.eventType === 'USER_LOGIN' ? 'password' : 'registration',
    },
  });
}

/**
 * Order events
 */
export async function logOrderEvent(params: {
  eventType: 'ORDER_CREATE' | 'ORDER_UPDATE' | 'ORDER_CANCEL' | 'ORDER_VIEW';
  orderId: string;
  userId: string;
  email: string;
  ipAddress: string;
  amount?: number;
  success: boolean;
  details?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: params.eventType,
    severity: params.success ? 'info' : 'warning',
    action: params.eventType,
    resource: 'ORDER',
    resourceId: params.orderId,
    userId: params.userId,
    userEmail: params.email,
    ipAddress: params.ipAddress,
    success: params.success,
    details: {
      amount: params.amount,
      ...params.details,
    },
  });
}

/**
 * Payment events
 */
export async function logPaymentEvent(params: {
  eventType: 'PAYMENT_PROCESS' | 'PAYMENT_FAILED' | 'PAYMENT_REFUND';
  orderId: string;
  paymentId?: string;
  userId: string;
  email: string;
  ipAddress: string;
  amount: number;
  paymentMethod: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}): Promise<void> {
  await logAuditEvent({
    eventType: params.eventType,
    severity: params.success ? 'info' : 'error',
    action: params.eventType,
    resource: 'PAYMENT',
    resourceId: params.paymentId,
    userId: params.userId,
    userEmail: params.email,
    ipAddress: params.ipAddress,
    success: params.success,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    details: {
      orderId: params.orderId,
      amount: params.amount,
      paymentMethod: params.paymentMethod.substring(0, 4) + '***', // Mask sensitive info
    },
  });
}

/**
 * Admin action events
 */
export async function logAdminEvent(params: {
  action: string;
  adminId: string;
  adminEmail: string;
  ipAddress: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: 'ADMIN_ACTION',
    severity: 'warning', // Admin actions are always warning level for visibility
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    userId: params.adminId,
    userEmail: params.adminEmail,
    userRole: 'admin',
    ipAddress: params.ipAddress,
    success: true,
    details: params.details,
  });
}

/**
 * Data access events (GDPR compliance)
 */
export async function logDataAccess(params: {
  userId: string;
  email: string;
  ipAddress: string;
  dataType: 'personal' | 'order' | 'payment';
  action: 'view' | 'export' | 'delete';
  targetUserId?: string;
  success: boolean;
}): Promise<void> {
  await logAuditEvent({
    eventType: params.action === 'export' ? 'DATA_EXPORT' : params.action === 'delete' ? 'DATA_DELETE' : 'ADMIN_ACTION',
    severity: params.action === 'delete' ? 'critical' : 'warning',
    action: `DATA_${params.action.toUpperCase()}`,
    resource: params.dataType.toUpperCase(),
    userId: params.userId,
    userEmail: params.email,
    ipAddress: params.ipAddress,
    success: params.success,
    details: {
      dataType: params.dataType,
      targetUserId: params.targetUserId,
    },
  });
}

/**
 * Security alert events
 */
export async function logSecurityAlert(params: {
  alertType: 'suspicious_login' | 'rate_limit_exceeded' | 'data_exfiltration' | 'privilege_escalation';
  severity: 'warning' | 'error' | 'critical';
  userId?: string;
  ipAddress: string;
  details: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: 'SECURITY_ALERT',
    severity: params.severity,
    action: params.alertType.toUpperCase(),
    resource: 'SECURITY',
    userId: params.userId,
    ipAddress: params.ipAddress,
    success: false,
    details: params.details,
  });
}

/**
 * Legacy compatibility exports
 */
export const logSecurityEvent = logAuditEvent;
export const logDataAccessEvent = logDataAccess;

// Convenience exports for orders handler
export const audit = {
  logAuditEvent,
  auth: logAuthEvent,
  orderCreate: (params: any) => logOrderEvent({ ...params, eventType: 'ORDER_CREATE' }),
  orderView: (params: any) => logOrderEvent({ ...params, eventType: 'ORDER_VIEW' }),
  orderCancel: (params: any) => logOrderEvent({ ...params, eventType: 'ORDER_CANCEL' }),
  payment: logPaymentEvent,
  adminAction: logAdminEvent,
  dataAccess: logDataAccess,
  securityAlert: logSecurityAlert,
};

export default audit;
