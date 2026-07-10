import apiClient from './api';

export const adminService = {
  getDashboardStats: () => apiClient.get('/admin/dashboard'),
  getBookings: (params: any = {}) => apiClient.get('/admin/bookings', { params }),
  getNotifications: () => apiClient.get('/admin/notifications'),
  markAllNotificationsRead: () => apiClient.put('/admin/notifications/read-all'),
  markNotificationRead: (id: string) => apiClient.put(`/admin/notifications/${id}/read`),
  getUsers: (params: any = {}) => apiClient.get('/admin/users', { params }),
  createUser: (data: any) => apiClient.post('/admin/users', data),
  updateUser: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  updateMechanic: (id: string, data: any) => apiClient.put(`/admin/mechanics/${id}`, data),
  deleteMechanic: (id: string) => apiClient.delete(`/admin/mechanics/${id}`),
};
