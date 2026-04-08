/**
 * Audit Log API Service
 * Admin panelinde denetim kayıtlarını görüntülemek için
 */

import { fetchApi } from './api';

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

export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
  logId: string;
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  userRole?: string;
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
}

// Mock audit log verileri
const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    logId: 'log_1704067200000_abc123',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 dakika önce
    eventType: 'USER_LOGIN',
    userId: 'user-1',
    userEmail: 'test@example.com',
    userRole: 'user',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: 'info',
    action: 'LOGIN',
    resource: 'USER',
    resourceId: 'user-1',
    success: true,
    details: { method: 'email_password' },
  },
  {
    logId: 'log_1704067100000_def456',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 dakika önce
    eventType: 'ADMIN_ACTION',
    userId: 'admin-1',
    userEmail: 'admin@atushome.com',
    userRole: 'admin',
    ipAddress: '192.168.1.50',
    severity: 'warning',
    action: 'USER_SOFT_DELETE',
    resource: 'USER',
    resourceId: 'user-old',
    success: true,
    details: { reason: 'Kullanıcı talebi üzerine' },
  },
  {
    logId: 'log_1704066000000_ghi789',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 saat önce
    eventType: 'ORDER_CREATE',
    userId: 'user-1',
    userEmail: 'test@example.com',
    userRole: 'user',
    ipAddress: '192.168.1.100',
    severity: 'info',
    action: 'CREATE',
    resource: 'ORDER',
    resourceId: 'order-123',
    success: true,
    details: { amount: 1250.00, itemCount: 3 },
  },
  {
    logId: 'log_1704063000000_jkl012',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 saat önce
    eventType: 'PAYMENT_SUCCESS',
    userId: 'user-1',
    userEmail: 'test@example.com',
    userRole: 'user',
    ipAddress: '192.168.1.100',
    severity: 'info',
    action: 'PAYMENT',
    resource: 'PAYMENT',
    resourceId: 'pay-456',
    success: true,
    details: { amount: 1250.00, paymentMethod: 'credit_card' },
  },
  {
    logId: 'log_1704059400000_mno345',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 saat önce
    eventType: 'SECURITY_ALERT',
    userId: 'unknown',
    userEmail: 'hacker@evil.com',
    ipAddress: '45.123.45.67',
    severity: 'critical',
    action: 'FAILED_LOGIN_ATTEMPT',
    resource: 'SECURITY',
    success: false,
    errorMessage: 'Multiple failed login attempts detected',
    details: { attempts: 5, target: 'admin@atushome.com' },
  },
  {
    logId: 'log_1704055800000_pqr678',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 saat önce
    eventType: 'DATA_EXPORT',
    userId: 'user-1',
    userEmail: 'test@example.com',
    userRole: 'user',
    ipAddress: '192.168.1.100',
    severity: 'warning',
    action: 'EXPORT',
    resource: 'USER_DATA',
    resourceId: 'user-1',
    success: true,
    details: { reason: 'KVKK veri talebi', format: 'JSON' },
  },
  {
    logId: 'log_1704052200000_stu901',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 saat önce
    eventType: 'USER_UPDATE',
    userId: 'user-1',
    userEmail: 'test@example.com',
    userRole: 'user',
    ipAddress: '192.168.1.100',
    severity: 'info',
    action: 'PROFILE_UPDATE',
    resource: 'USER',
    resourceId: 'user-1',
    success: true,
    details: { fields: ['phone', 'address'] },
  },
  {
    logId: 'log_1704048600000_vwx234',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 gün önce
    eventType: 'PASSWORD_CHANGE',
    userId: 'admin-1',
    userEmail: 'admin@atushome.com',
    userRole: 'admin',
    ipAddress: '192.168.1.50',
    severity: 'warning',
    action: 'PASSWORD_CHANGE',
    resource: 'USER',
    resourceId: 'admin-1',
    success: true,
    details: { reason: 'Routine security update' },
  },
];

// Mock mode kontrolü
const isMockMode = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '' || envUrl.includes('your-api-gateway-url')) return true;
  return false;
};

export const auditLogApi = {
  // Tüm audit loglarını getir (sayfalama ile)
  getAll: async (params?: {
    page?: number;
    limit?: number;
    eventType?: AuditEventType;
    severity?: SeverityLevel;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let logs = [...MOCK_AUDIT_LOGS];
      
      // Filtreleme
      if (params?.eventType) {
        logs = logs.filter(l => l.eventType === params.eventType);
      }
      if (params?.severity) {
        logs = logs.filter(l => l.severity === params.severity);
      }
      if (params?.userId) {
        logs = logs.filter(l => l.userId === params.userId);
      }
      if (params?.startDate && params?.endDate) {
        logs = logs.filter(l => 
          l.timestamp >= params.startDate! && 
          l.timestamp <= params.endDate!
        );
      }
      
      // Sıralama (en yeni önce)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Sayfalama
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const start = (page - 1) * limit;
      const paginatedLogs = logs.slice(start, start + limit);
      
      return {
        data: paginatedLogs,
        pagination: {
          page,
          limit,
          total: logs.length,
          totalPages: Math.ceil(logs.length / limit),
        },
      };
    }
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.eventType) queryParams.append('eventType', params.eventType);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    return fetchApi(`/admin/audit-logs?${queryParams.toString()}`);
  },

  // Kullanıcıya ait audit logları getir
  getByUser: async (userId: string, params?: { startDate?: string; endDate?: string }) => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      let logs = MOCK_AUDIT_LOGS.filter(l => l.userId === userId);
      
      if (params?.startDate && params?.endDate) {
        logs = logs.filter(l => 
          l.timestamp >= params.startDate! && 
          l.timestamp <= params.endDate!
        );
      }
      
      return { data: logs };
    }
    
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    return fetchApi(`/admin/audit-logs/user/${userId}?${queryParams.toString()}`);
  },

  // İstatistikler
  getStats: async () => {
    if (isMockMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = MOCK_AUDIT_LOGS.filter(l => l.timestamp.startsWith(today));
      
      return {
        data: {
          total: MOCK_AUDIT_LOGS.length,
          today: todayLogs.length,
          bySeverity: {
            info: MOCK_AUDIT_LOGS.filter(l => l.severity === 'info').length,
            warning: MOCK_AUDIT_LOGS.filter(l => l.severity === 'warning').length,
            error: MOCK_AUDIT_LOGS.filter(l => l.severity === 'error').length,
            critical: MOCK_AUDIT_LOGS.filter(l => l.severity === 'critical').length,
          },
          byEventType: {
            USER_LOGIN: MOCK_AUDIT_LOGS.filter(l => l.eventType === 'USER_LOGIN').length,
            ORDER_CREATE: MOCK_AUDIT_LOGS.filter(l => l.eventType === 'ORDER_CREATE').length,
            PAYMENT_SUCCESS: MOCK_AUDIT_LOGS.filter(l => l.eventType === 'PAYMENT_SUCCESS').length,
            ADMIN_ACTION: MOCK_AUDIT_LOGS.filter(l => l.eventType === 'ADMIN_ACTION').length,
            SECURITY_ALERT: MOCK_AUDIT_LOGS.filter(l => l.eventType === 'SECURITY_ALERT').length,
          },
        },
      };
    }
    
    return fetchApi('/admin/audit-logs/stats');
  },
};

export default auditLogApi;
