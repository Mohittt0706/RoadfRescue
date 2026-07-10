import apiClient from './api';

export const adminService = {
  getDashboardStats: () => apiClient.get('/admin/dashboard'),
  getBookings: (params: any = {}) => apiClient.get('/admin/bookings', { params }),
  getNotifications: () => apiClient.get('/admin/notifications'),
  markAllNotificationsRead: () => apiClient.put('/admin/notifications/read-all'),
  markNotificationRead: (id: string) => apiClient.put(`/admin/notifications/${id}/read`),
};
