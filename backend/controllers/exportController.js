import { generateCSV, sendCSVResponse } from '../utils/csvExport.js';
import { exportService } from '../services/exportService.js';

/**
 * GET /api/admin/export/bookings - Export bookings as CSV.
 * Query params: dateFrom, dateTo, status, mechanicId, userId
 */
export function exportBookings(req, res) {
  const { db } = req;
  try {
    const bookings = exportService.getBookings(db, req.query);

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'No bookings found for the given filters.' });
    }

    const headers = [
      'Booking ID', 'Customer Name', 'Phone', 'Email', 'Vehicle Type',
      'Vehicle Number', 'Service', 'Price', 'Status', 'Payment Method',
      'Payment Status', 'Address', 'Assigned Mechanic', 'Booking Time', 'Updated At'
    ];
    const keys = [
      'id', 'customer_name', 'phone', 'email', 'vehicle_type',
      'vehicle_number', 'service_name', 'price', 'status', 'payment_method',
      'payment_status', 'address', 'assigned_mechanic_id', 'booking_time', 'updated_at'
    ];

    const csv = generateCSV(headers, bookings, keys);
    const timestamp = new Date().toISOString().split('T')[0];
    sendCSVResponse(res, csv, `bookings-export-${timestamp}.csv`);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export bookings.', error: err.message });
  }
}

/**
 * GET /api/admin/export/payments - Export payments as CSV.
 * Query params: dateFrom, dateTo, status, mechanicId, userId
 */
export function exportPayments(req, res) {
  const { db } = req;
  try {
    const payments = exportService.getPayments(db, req.query);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'No payments found for the given filters.' });
    }

    const headers = [
      'Payment ID', 'Booking ID', 'Customer Name', 'Service', 'Phone',
      'Amount', 'Method', 'Status', 'Transaction ID', 'Created At'
    ];
    const keys = [
      'id', 'booking_id', 'customer_name', 'service_name', 'phone',
      'amount', 'method', 'payment_status', 'transaction_id', 'created_at'
    ];

    const csv = generateCSV(headers, payments, keys);
    const timestamp = new Date().toISOString().split('T')[0];
    sendCSVResponse(res, csv, `payments-export-${timestamp}.csv`);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export payments.', error: err.message });
  }
}

/**
 * GET /api/admin/export/emergencies - Export emergencies as CSV.
 * Query params: dateFrom, dateTo, status
 */
export function exportEmergencies(req, res) {
  const { db } = req;
  try {
    const emergencies = exportService.getEmergencies(db, req.query);

    if (emergencies.length === 0) {
      return res.status(404).json({ success: false, message: 'No emergencies found for the given filters.' });
    }

    const headers = [
      'Emergency ID', 'Customer Name', 'Phone', 'Email', 'Vehicle',
      'Vehicle Number', 'Emergency Type', 'Price', 'Status', 'Priority',
      'Address', 'Assigned Mechanic', 'Payment Status', 'Created Time', 'Updated Time'
    ];
    const keys = [
      'id', 'customer_name', 'phone', 'email', 'vehicle',
      'vehicle_number', 'emergency_type', 'price', 'status', 'priority',
      'address', 'assigned_mechanic', 'payment_status', 'created_time', 'updated_time'
    ];

    const csv = generateCSV(headers, emergencies, keys);
    const timestamp = new Date().toISOString().split('T')[0];
    sendCSVResponse(res, csv, `emergencies-export-${timestamp}.csv`);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export emergencies.', error: err.message });
  }
}
