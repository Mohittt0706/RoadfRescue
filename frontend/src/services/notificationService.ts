import apiClient from './api';

export const notificationService = {
  getAll: (params: any = {}) => apiClient.get('/notifications', { params }),
  create: (data: any) => apiClient.post('/notifications', data),
};
