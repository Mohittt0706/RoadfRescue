import apiClient from './api';

export const mechanicService = {
  getAll: () => apiClient.get('/mechanics'),
  getById: (id: string) => apiClient.get(`/mechanics/${id}`),
  updateStatus: (id: string, status: string) => apiClient.put(`/mechanics/${id}/status`, { status }),
  assign: (bookingId: string, mechanicId: string) => apiClient.post('/mechanics/assign', { bookingId, mechanicId }),
};
