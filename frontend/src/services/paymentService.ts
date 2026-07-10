import apiClient from './api';

export const paymentService = {
  create: (data: any) => apiClient.post('/payments', data),
  getByBooking: (bookingId: string) => apiClient.get(`/payments/booking/${bookingId}`),
  getStats: () => apiClient.get('/payments/stats'),
};
