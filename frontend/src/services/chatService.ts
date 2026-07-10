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

// Stream chat response using SSE (Server-Sent Events) fetch reader
export async function streamChat(
  messages: Array<{ sender: string; text: string }>,
  conversationId: string,
  onChunk: (content: string) => void,
  onDone: (fullContent: string) => void,
  onError?: (error: string) => void
) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('roadrescue-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const res = await fetch(`${API_BASE}/chat/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, conversationId }),
    });

    if (!res.ok) {
      throw new Error('Chat request failed');
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              onDone(data.fullContent || fullContent);
            } else if (data.content) {
              fullContent += data.content;
              onChunk(data.content);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (error: any) {
    if (onError) onError(error.message || 'Chat failed');
  }
}

// Analyze image with Vision AI
export async function analyzeImage(imageUrl: string, conversationId?: string): Promise<any> {
  return apiClient.post('/chat/analyze-image', { imageUrl, conversationId });
}

// Upload image file
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient.post('/chat/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
