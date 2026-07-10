import apiClient from './api';

export const chatService = {
  getConversations: (userId?: string) => apiClient.get(`/chat/conversations${userId ? `?userId=${userId}` : ''}`),
  createConversation: (title?: string) => apiClient.post('/chat/conversations', { title }),
  getMessages: (convId: string) => apiClient.get(`/chat/conversations/${convId}/messages`),
  deleteConversation: (convId: string) => apiClient.delete(`/chat/conversations/${convId}`),
  adminGetConversations: () => apiClient.get('/chat/admin/conversations'),
  adminGetImageAnalyses: () => apiClient.get('/chat/admin/image-analyses'),
  
  // Emergency SOS flow
  createEmergency: (data: any) => apiClient.post('/emergency', data),
  getEmergencies: () => apiClient.get('/emergency'),
  getEmergencyById: (id: string) => apiClient.get(`/emergency/${id}`),
  updateEmergency: (id: string, data: any) => apiClient.put(`/emergency/${id}`, data),
  deleteEmergency: (id: string) => apiClient.delete(`/emergency/${id}`),
  assignEmergency: (id: string, mechanicName: string, eta: string, price?: number) => 
    apiClient.post('/emergency/assign', { id, mechanic_name: mechanicName, eta, price }),
  updateEmergencyStatus: (id: string, status: string) => apiClient.post('/emergency/status', { id, status }),
  updateEmergencyPrice: (id: string, price: number) => apiClient.post('/emergency/price', { id, price }),
  updateEmergencyETA: (id: string, eta: string, eta_minutes?: number) => 
    apiClient.post('/emergency/eta', { id, eta, eta_minutes }),
  updateEmergencyPayment: (id: string, payment_status: string, payment_method?: string) => 
    apiClient.post('/emergency/payment', { id, payment_status, payment_method }),
  getEmergencyInvoice: (id: string) => apiClient.get(`/emergency/invoice/${id}`),
};
