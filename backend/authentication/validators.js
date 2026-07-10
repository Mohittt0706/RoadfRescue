import { body, validationResult } from 'express-validator';

// Middleware to format validation error response
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
}

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address format.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^(\+91[\-\s]?)?[6789]\d{9}$/).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter.'),
  body('vehicleType')
    .optional()
    .trim()
    .isIn(['Sedan', 'SUV', 'Hatchback', 'Bike', 'Truck', 'Other']).withMessage('Invalid vehicle type.'),
  body('vehicleNumber')
    .optional()
    .trim()
    .matches(/^[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,2}[\s-]?\d{1,4}$/i).withMessage('Invalid vehicle number format (e.g., MH-12-XX-9999).'),
  body('emergencyContact')
    .optional()
    .trim()
];

export const mechanicRegisterValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address format.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^(\+91[\-\s]?)?[6789]\d{9}$/).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0 }).withMessage('Experience years must be a positive integer.'),
  body('specialization')
    .optional()
    .trim()
    .notEmpty().withMessage('Specialization cannot be empty.')
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email format.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
];

export const profileUpdateValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+91[\-\s]?)?[6789]\d{9}$/).withMessage('Must be a valid 10-digit Indian phone number.'),
  body('address')
    .optional()
    .trim(),
  body('city')
    .optional()
    .trim(),
  body('vehicle')
    .optional()
    .trim(),
  body('profileImage')
    .optional()
    .trim()
];

export const changePasswordValidator = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
    .matches(/\d/).withMessage('New password must contain at least one number.')
    .matches(/[a-zA-Z]/).withMessage('New password must contain at least one letter.')
];

export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email format.')
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Reset token is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
    .matches(/\d/).withMessage('New password must contain at least one number.')
];
