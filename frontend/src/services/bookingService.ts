import apiClient from './api';

export const bookingService = {
  create: (data: any) => apiClient.post('/bookings', data),
  getAll: (params: any = {}) => apiClient.get('/bookings', { params }),
  getById: (id: string) => apiClient.get(`/bookings/${id}`),
  update: (id: string, data: any) => apiClient.put(`/bookings/${id}`, data),
  delete: (id: string) => apiClient.delete(`/bookings/${id}`),
};
