import { body, param, query, validationResult } from 'express-validator';

/**
 * Centralized validation middleware.
 * Formats errors into a consistent JSON response structure.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
}

// ============================================================
// COMMON VALIDATION RULES (reusable)
// ============================================================

const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
const vehicleNumberRegex = /^[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,2}[\s-]?\d{1,4}$/i;
const mongoIdParam = param('id').trim().notEmpty().withMessage('Invalid ID parameter.');

// ============================================================
// AUTH VALIDATORS
// ============================================================

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address format.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(phoneRegex).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter.'),
  body('vehicleType')
    .optional()
    .trim()
    .isIn(['Sedan', 'SUV', 'Hatchback', 'Bike', 'Truck', 'Other']).withMessage('Invalid vehicle type.'),
  body('vehicleNumber')
    .optional()
    .trim()
    .matches(vehicleNumberRegex).withMessage('Invalid vehicle number format (e.g., MH-12-XX-9999).'),
  body('emergencyContact')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Emergency contact too long.')
];

export const mechanicRegisterValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address format.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(phoneRegex).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Experience years must be between 0 and 50.'),
  body('specialization')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Specialization cannot be empty.')
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email format.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ max: 128 }).withMessage('Password too long.')
];

export const profileUpdateValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('phone')
    .optional()
    .trim()
    .matches(phoneRegex).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long.'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long.'),
  body('vehicle')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Vehicle name too long.'),
  body('profileImage')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Profile image URL too long.')
];

export const changePasswordValidator = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters.')
    .matches(/\d/).withMessage('New password must contain at least one number.')
    .matches(/[a-zA-Z]/).withMessage('New password must contain at least one letter.')
];

export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email format.')
    .normalizeEmail()
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Reset token is required.')
    .isLength({ min: 10 }).withMessage('Invalid reset token.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters.')
    .matches(/\d/).withMessage('New password must contain at least one number.')
    .matches(/[a-zA-Z]/).withMessage('New password must contain at least one letter.')
];

// ============================================================
// BOOKING VALIDATORS
// ============================================================

export const createBookingValidator = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(phoneRegex).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format.')
    .normalizeEmail(),
  body('vehicleType')
    .trim()
    .notEmpty().withMessage('Vehicle type is required.')
    .isIn(['Sedan', 'SUV', 'Hatchback', 'Bike', 'Truck', 'Other']).withMessage('Invalid vehicle type.'),
  body('vehicleNumber')
    .trim()
    .notEmpty().withMessage('Vehicle number is required.')
    .matches(vehicleNumberRegex).withMessage('Invalid vehicle number format.'),
  body('serviceName')
    .trim()
    .notEmpty().withMessage('Service name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Service name too long.'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long.'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes too long.'),
  body('paymentMethod')
    .optional()
    .trim()
    .isIn(['Cash', 'UPI', 'Card', 'Net Banking']).withMessage('Invalid payment method.')
];

export const updateBookingValidator = [
  param('id').trim().notEmpty().withMessage('Booking ID is required.'),
  body('status')
    .optional()
    .trim()
    .isIn(['Pending', 'Accepted', 'Arrived', 'Completed', 'Cancelled']).withMessage('Invalid status.'),
  body('assigned_mechanic_id')
    .optional()
    .trim()
    .notEmpty().withMessage('Mechanic ID cannot be empty.'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Note too long.')
];

// ============================================================
// EMERGENCY VALIDATORS
// ============================================================

export const createEmergencyValidator = [
  body('customer_name')
    .trim()
    .notEmpty().withMessage('Customer name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(phoneRegex).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format.')
    .normalizeEmail(),
  body('vehicle')
    .trim()
    .notEmpty().withMessage('Vehicle type is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Vehicle type too long.'),
  body('vehicle_number')
    .trim()
    .notEmpty().withMessage('Vehicle number is required.')
    .matches(vehicleNumberRegex).withMessage('Invalid vehicle number format.'),
  body('emergency_type')
    .trim()
    .notEmpty().withMessage('Emergency type is required.'),
  body('latitude')
    .notEmpty().withMessage('Latitude is required.')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required.')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long.'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes too long.'),
  body('payment_method')
    .optional()
    .trim()
    .isIn(['UPI', 'Cash', 'Card', 'Net Banking']).withMessage('Invalid payment method.'),
  body('priority')
    .optional()
    .trim()
    .isIn(['Normal', 'Urgent', 'Critical']).withMessage('Invalid priority level.')
];

export const emergencyAssignValidator = [
  body('id')
    .trim()
    .notEmpty().withMessage('Emergency ID is required.'),
  body('mechanic_name')
    .trim()
    .notEmpty().withMessage('Mechanic name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Mechanic name too long.'),
  body('eta')
    .optional()
    .trim()
    .matches(/^\d+-\d+ mins$/).withMessage('ETA format must be "X-Y mins".'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number.')
];

export const emergencyStatusValidator = [
  body('id')
    .trim()
    .notEmpty().withMessage('Emergency ID is required.'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required.')
    .isIn(['Pending', 'Accepted', 'Mechanic Assigned', 'Mechanic En Route', 'Arrived', 'Completed', 'Cancelled'])
    .withMessage('Invalid status value.')
];

export const emergencyPriceValidator = [
  body('id')
    .trim()
    .notEmpty().withMessage('Emergency ID is required.'),
  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number.')
];

export const emergencyEtaValidator = [
  body('id')
    .trim()
    .notEmpty().withMessage('Emergency ID is required.'),
  body('eta')
    .trim()
    .notEmpty().withMessage('ETA is required.'),
  body('eta_minutes')
    .optional()
    .isInt({ min: 1 }).withMessage('ETA minutes must be a positive integer.')
];

export const emergencyPaymentValidator = [
  body('id')
    .trim()
    .notEmpty().withMessage('Emergency ID is required.'),
  body('payment_status')
    .trim()
    .notEmpty().withMessage('Payment status is required.')
    .isIn(['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled'])
    .withMessage('Invalid payment status.'),
  body('payment_method')
    .optional()
    .trim()
    .isIn(['UPI', 'Cash', 'Card', 'Net Banking']).withMessage('Invalid payment method.')
];

// ============================================================
// PAYMENT VALIDATORS
// ============================================================

export const createPaymentValidator = [
  body('bookingId')
    .trim()
    .notEmpty().withMessage('Booking ID is required.'),
  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ min: 1 }).withMessage('Amount must be greater than 0.'),
  body('method')
    .trim()
    .notEmpty().withMessage('Payment method is required.')
    .isIn(['Cash', 'UPI', 'Card', 'Net Banking']).withMessage('Invalid payment method.'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Transaction ID too long.')
];

// ============================================================
// MECHANIC VALIDATORS
// ============================================================

export const mechanicStatusValidator = [
  param('id').trim().notEmpty().withMessage('Mechanic ID is required.'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required.')
    .isIn(['available', 'busy', 'offline']).withMessage('Invalid status. Must be: available, busy, or offline.')
];

export const mechanicAssignValidator = [
  body('bookingId')
    .trim()
    .notEmpty().withMessage('Booking ID is required.'),
  body('mechanicId')
    .trim()
    .notEmpty().withMessage('Mechanic ID is required.')
];

// ============================================================
// ADMIN USER MANAGEMENT VALIDATORS
// ============================================================

export const adminCreateUserValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address format.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(phoneRegex).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('vehicle_type')
    .optional()
    .trim()
    .isIn(['Sedan', 'SUV', 'Hatchback', 'Bike', 'Truck', 'Other']).withMessage('Invalid vehicle type.'),
  body('vehicle_number')
    .optional()
    .trim()
    .matches(vehicleNumberRegex).withMessage('Invalid vehicle number format.'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long.'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long.')
];

export const adminUpdateUserValidator = [
  param('id').trim().notEmpty().withMessage('User ID is required.'),
  body('status')
    .optional()
    .trim()
    .isIn(['active', 'inactive', 'blocked']).withMessage('Invalid status. Must be: active, inactive, or blocked.'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('phone')
    .optional()
    .trim()
    .matches(phoneRegex).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long.'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long.'),
  body('vehicle')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Vehicle name too long.')
];

export const adminUpdateMechanicValidator = [
  param('id').trim().notEmpty().withMessage('Mechanic ID is required.'),
  body('approval_status')
    .optional()
    .trim()
    .isIn(['pending', 'approved', 'rejected', 'blocked']).withMessage('Invalid approval status.'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('phone')
    .optional()
    .trim()
    .matches(phoneRegex).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('experience_years')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Experience years must be between 0 and 50.'),
  body('specialization')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Specialization too long.'),
  body('status')
    .optional()
    .trim()
    .isIn(['available', 'busy', 'offline']).withMessage('Invalid status.')
];

// ============================================================
// SERVICE VALIDATORS
// ============================================================

export const createServiceValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Service name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description too long.'),
  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),
  body('duration_estimate')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Duration estimate too long.'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean.')
];

export const updateServiceValidator = [
  param('id').trim().notEmpty().withMessage('Service ID is required.'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description too long.'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),
  body('duration_estimate')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Duration estimate too long.'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean.')
];

// ============================================================
// EMERGENCY TYPE VALIDATORS
// ============================================================

export const createEmergencyTypeValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Emergency type name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description too long.'),
  body('base_price')
    .notEmpty().withMessage('Base price is required.')
    .isFloat({ min: 0 }).withMessage('Base price must be a non-negative number.'),
  body('eta_min')
    .optional()
    .isInt({ min: 1 }).withMessage('Minimum ETA must be a positive integer.'),
  body('eta_max')
    .optional()
    .isInt({ min: 1 }).withMessage('Maximum ETA must be a positive integer.'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean.')
];

export const updateEmergencyTypeValidator = [
  param('id').trim().notEmpty().withMessage('Emergency type ID is required.'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description too long.'),
  body('base_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Base price must be a non-negative number.'),
  body('eta_min')
    .optional()
    .isInt({ min: 1 }).withMessage('Minimum ETA must be a positive integer.'),
  body('eta_max')
    .optional()
    .isInt({ min: 1 }).withMessage('Maximum ETA must be a positive integer.'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean.')
];

// ============================================================
// NOTIFICATION VALIDATORS
// ============================================================

export const createNotificationValidator = [
  body('type')
    .trim()
    .notEmpty().withMessage('Notification type is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Type too long.'),
  body('title')
    .trim()
    .notEmpty().withMessage('Notification title is required.')
    .isLength({ min: 2, max: 200 }).withMessage('Title too long.'),
  body('message')
    .trim()
    .notEmpty().withMessage('Notification message is required.')
    .isLength({ min: 2, max: 1000 }).withMessage('Message too long.'),
  body('bookingId')
    .optional()
    .trim(),
  body('targetRole')
    .optional()
    .trim()
    .isIn(['admin', 'user', 'mechanic', 'all']).withMessage('Invalid target role.'),
  body('targetId')
    .optional()
    .trim()
];

// ============================================================
// GENERIC ID PARAM VALIDATOR
// ============================================================

export const idParamValidator = [
  param('id').trim().notEmpty().withMessage('ID parameter is required.')
];
