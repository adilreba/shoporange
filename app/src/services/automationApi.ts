/**
 * Automation API Service
 * Customer Journey Otomasyon API çağrıları
 */

import { fetchApi } from './api';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  category: 'transactional' | 'marketing' | 'automation';
  variables: string[];
}

export interface AutomationLog {
  logId: string;
  userId: string;
  email: string;
  templateId: string;
  triggerType: string;
  status: 'pending' | 'sent' | 'failed';
  channel: 'email' | 'sms' | 'both';
  messageId?: string;
  error?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TriggerAutomationRequest {
  userId: string;
  email: string;
  phone?: string;
  templateId: string;
  templateData: Record<string, any>;
  channel?: 'email' | 'sms' | 'both';
  scheduledAt?: string;
}

export interface PreviewTemplateRequest {
  templateId: string;
  templateData: Record<string, any>;
}

export const automationApi = {
  /** Tüm email şablonlarını getir */
  getTemplates: async (): Promise<{ templates: EmailTemplate[] }> => {
    return fetchApi('/automation/templates');
  },

  /** Otomasyon tetikle (manuel) */
  trigger: async (data: TriggerAutomationRequest): Promise<{
    success: boolean;
    emailResult?: any;
    smsResult?: any;
    logId: string;
  }> => {
    return fetchApi('/automation/trigger', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Gönderim loglarını getir */
  getLogs: async (limit = 50): Promise<{ logs: AutomationLog[]; count: number }> => {
    return fetchApi(`/automation/logs?limit=${limit}`);
  },

  /** Email şablonunu önizle */
  previewTemplate: async (data: PreviewTemplateRequest): Promise<{
    subject: string;
    html: string;
    text: string;
    templateId: string;
  }> => {
    return fetchApi('/automation/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default automationApi;
