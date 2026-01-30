import axios from 'axios';
import { API_URL, API_KEY } from './config';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key to all requests
api.interceptors.request.use((config) => {
  if (API_KEY) {
    config.headers['X-API-Key'] = API_KEY;
  }
  return config;
});

// Session API
export const sessionApi = {
  list: () => api.get('/sessions'),
  create: (sessionId: string) => api.post('/sessions', { sessionId }),
  get: (sessionId: string) => api.get(`/sessions/${sessionId}`),
  getQR: (sessionId: string) => api.get(`/sessions/${sessionId}/qr`),
  delete: (sessionId: string) => api.delete(`/sessions/${sessionId}`),
  getChats: (sessionId: string) => api.get(`/sessions/${sessionId}/chats`),
  getContacts: (sessionId: string) => api.get(`/sessions/${sessionId}/contacts`),
};

// Message API
export const messageApi = {
  send: (data: {
    sessionId: string;
    to: string;
    message?: string;
    type?: string;
    mediaUrl?: string;
    caption?: string;
    filename?: string;
  }) => api.post('/messages/send', data),
  
  sendText: (sessionId: string, to: string, message: string) =>
    api.post(`/messages/${sessionId}/send/text`, { to, message }),
  
  sendBulk: (data: {
    sessionId: string;
    recipients: string[];
    message: string;
    type?: string;
    mediaUrl?: string;
    delay?: number;
  }) => api.post('/messages/send-bulk', data),
  
  getChats: (sessionId: string) => api.get(`/messages/${sessionId}/chats`),
  
  getMessages: (sessionId: string, chatId: string, limit?: number) =>
    api.get(`/messages/${sessionId}/${encodeURIComponent(chatId)}`, { params: { limit } }),
};

// Auto-Responder API
export const autoResponderApi = {
  list: (sessionId?: string) => 
    api.get('/auto-responders', { params: sessionId ? { sessionId } : {} }),
  
  create: (sessionId: string, data: {
    name?: string;
    trigger: string;
    matchType?: string;
    response: string;
    responseType?: string;
    mediaUrl?: string;
    stopOnMatch?: boolean;
    templateId?: string;
    priority?: number;
    enabled?: boolean;
  }) => api.post('/auto-responders', { ...data, sessionId }),
  
  update: (sessionId: string, id: string, data: Record<string, unknown>) =>
    api.put(`/auto-responders/${id}`, { ...data, sessionId }),
  
  delete: (sessionId: string, id: string) =>
    api.delete(`/auto-responders/${id}`, { params: { sessionId } }),
  
  toggle: (id: string, sessionId: string, enabled: boolean) =>
    api.post(`/auto-responders/${id}/toggle`, { sessionId, enabled }),
};

// Scheduled Messages API
export const scheduledApi = {
  list: (sessionId?: string) =>
    api.get('/scheduled', { params: sessionId ? { sessionId } : {} }),
  
  create: (sessionId: string, data: {
    recipient: string;
    message: string;
    messageType?: string;
    mediaUrl?: string;
    type: 'once' | 'recurring';
    scheduledAt?: string;
    cronExpression?: string;
    templateId?: string;
    enabled?: boolean;
  }) => api.post('/scheduled', { ...data, sessionId }),
  
  update: (sessionId: string, id: string, data: Record<string, unknown>) =>
    api.put(`/scheduled/${id}`, { ...data, sessionId }),
  
  delete: (sessionId: string, id: string) =>
    api.delete(`/scheduled/${id}`, { params: { sessionId } }),
  
  runNow: (sessionId: string, id: string) =>
    api.post(`/scheduled/${id}/run`, { sessionId }),
  
  toggle: (id: string, enabled: boolean) =>
    api.post(`/scheduled/${id}/toggle`, { enabled }),
};

// Templates API
export const templateApi = {
  list: () => api.get('/templates'),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: { name: string; content: string; category?: string; variables?: string[] }) =>
    api.post('/templates', data),
  update: (id: string, data: { name?: string; content?: string; category?: string }) =>
    api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  render: (id: string, variables: Record<string, string>) =>
    api.post(`/templates/${id}/render`, { variables }),
};

// Contacts API
export const contactApi = {
  list: (params?: { search?: string; tag?: string }) =>
    api.get('/contacts', { params }),
  get: (id: string) => api.get(`/contacts/${id}`),
  create: (data: { name: string; phone: string; email?: string; notes?: string; tags?: string[] }) =>
    api.post('/contacts', data),
  update: (id: string, data: { name?: string; phone?: string; email?: string; notes?: string; tags?: string[] }) =>
    api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
  import: (contacts: Array<{ name: string; phone: string; email?: string; tags?: string[] }>) =>
    api.post('/contacts/import', { contacts }),
  export: () => api.get('/contacts/export'),
  getTags: () => api.get('/contacts/meta/tags'),
};

export default api;
