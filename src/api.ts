const API_BASE = '/api';

// ---- Token Management ----
let authToken: string | null = localStorage.getItem('roadrescue-token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('roadrescue-token', token);
  } else {
    localStorage.removeItem('roadrescue-token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

// ---- Core Request Function ----
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request(url: string, options: RequestOptions = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach JWT token if available
  const token = authToken || localStorage.getItem('roadrescue-token');
  if (token && !isTokenExpired(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    headers,
    ...options,
  });

  if (res.status === 401 || res.status === 403) {
    // Token expired or invalid — clear it
    setAuthToken(null);
    const error = await res.json().catch(() => ({ error: 'Access denied' }));
    throw new Error(error.error || 'Access denied');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// ---- Auth API ----
export const auth = {
  register: (data: Record<string, unknown>) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  mechanicLogin: (email: string, password: string) =>
    request('/auth/mechanic/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  adminLogin: (email: string, password: string) =>
    request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request('/auth/me'),
};

// Stream chat response
export async function streamChat(
  messages: Array<{ sender: string; text: string }>,
  conversationId: string,
  onChunk: (content: string) => void,
  onDone: (fullContent: string) => void,
  onError?: (error: string) => void
) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = authToken || localStorage.getItem('roadrescue-token');
    if (token && !isTokenExpired(token)) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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
  return request('/chat/analyze-image', {
    method: 'POST',
    body: JSON.stringify({ imageUrl, conversationId }),
  });
}

// Upload image file
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const headers: Record<string, string> = {};
  const token = authToken || localStorage.getItem('roadrescue-token');
  if (token && !isTokenExpired(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/chat/upload-image`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export const api = {
  bookings: {
    create: (data: Record<string, unknown>) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    list: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/bookings?${query}`);
    },
    get: (id: string) => request(`/bookings/${id}`),
    update: (id: string, data: Record<string, unknown>) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/bookings/${id}`, { method: 'DELETE' }),
  },
  admin: {
    dashboard: () => request('/admin/dashboard'),
    bookings: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/admin/bookings?${query}`);
    },
    notifications: () => request('/admin/notifications'),
    markAllRead: () => request('/admin/notifications/read-all', { method: 'PUT' }),
    markRead: (id: string) => request(`/admin/notifications/${id}/read`, { method: 'PUT' }),
  },
  mechanics: {
    list: () => request('/mechanics'),
    get: (id: string) => request(`/mechanics/${id}`),
    updateStatus: (id: string, status: string) => request(`/mechanics/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    assign: (bookingId: string, mechanicId: string) => request('/mechanics/assign', { method: 'POST', body: JSON.stringify({ bookingId, mechanicId }) }),
  },
  payments: {
    create: (data: Record<string, unknown>) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
    byBooking: (bookingId: string) => request(`/payments/booking/${bookingId}`),
    stats: () => request('/payments/stats'),
  },
  notifications: {
    list: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/notifications?${query}`);
    },
    create: (data: Record<string, unknown>) => request('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  },
  chat: {
    conversations: (userId?: string) => request(`/chat/conversations${userId ? `?userId=${userId}` : ''}`),
    createConversation: (title?: string) => request('/chat/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
    getMessages: (convId: string) => request(`/chat/conversations/${convId}/messages`),
    deleteConversation: (convId: string) => request(`/chat/conversations/${convId}`, { method: 'DELETE' }),
    adminConversations: () => request('/chat/admin/conversations'),
    adminImageAnalyses: () => request('/chat/admin/image-analyses'),
  },
  emergency: {
    create: (data: Record<string, unknown>) => request('/emergency', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request('/emergency'),
    get: (id: string) => request(`/emergency/${id}`),
    update: (id: string, data: Record<string, unknown>) => request(`/emergency/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/emergency/${id}`, { method: 'DELETE' }),
    assign: (id: string, mechanicName: string, eta: string, price?: number) => 
      request('/emergency/assign', { method: 'POST', body: JSON.stringify({ id, mechanic_name: mechanicName, eta, price }) }),
    updateStatus: (id: string, status: string) => request('/emergency/status', { method: 'POST', body: JSON.stringify({ id, status }) }),
    updatePrice: (id: string, price: number) => request('/emergency/price', { method: 'POST', body: JSON.stringify({ id, price }) }),
    updateETA: (id: string, eta: string, eta_minutes?: number) => 
      request('/emergency/eta', { method: 'POST', body: JSON.stringify({ id, eta, eta_minutes }) }),
    updatePayment: (id: string, payment_status: string, payment_method?: string) => 
      request('/emergency/payment', { method: 'POST', body: JSON.stringify({ id, payment_status, payment_method }) }),
    getInvoice: (id: string) => request(`/emergency/invoice/${id}`),
  },
};
