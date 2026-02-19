import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import { AppError } from './errorHandler';

// Middleware to handle validation errors
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err: any) => err.msg).join(', ');
    return next(new AppError(errorMessages, 400));
  }
  next();
};

// Student validation rules
export const validateStudent = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name too long'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name too long'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('currentClass').notEmpty().withMessage('Current class is required'),
  body('currentStream').notEmpty().withMessage('Current stream is required'),
  body('admissionDate').isISO8601().withMessage('Valid admission date required'),
  body('residentialAddress').notEmpty().withMessage('Residential address is required'),
  validate
];

// User/Auth validation rules
export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

export const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').notEmpty().withMessage('Role is required'),
  validate
];

export const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('confirmPassword').custom((value: any, { req }: any) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  validate
];

// Fee validation rules
export const validateFeeInvoice = [
  body('studentId').isMongoId().withMessage('Valid student ID required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('term').isInt({ min: 1, max: 3 }).withMessage('Term must be 1, 2, or 3'),
  body('items').isArray({ min: 1 }).withMessage('At least one fee item required'),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  validate
];

export const validatePayment = [
  body('invoiceId').isMongoId().withMessage('Valid invoice ID required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('method').isIn(['cash', 'mpesa', 'bank_transfer', 'cheque', 'card']).withMessage('Invalid payment method'),
  body('paidDate').isISO8601().withMessage('Valid payment date required'),
  validate
];

// Attendance validation
export const validateAttendance = [
  body('studentId').isMongoId().withMessage('Valid student ID required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid attendance status'),
  validate
];

// Exam validation
export const validateExam = [
  body('name').trim().notEmpty().withMessage('Exam name is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('term').isInt({ min: 1, max: 3 }).withMessage('Term must be 1, 2, or 3'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required')
    .custom((value: any, { req }: any) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  validate
];

// MongoDB ID validation
export const validateMongoId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate
];

// Pagination validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];

// Date range validation
export const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
    .custom((value: any, { req }: any) => {
      if (req.query.startDate && new Date(value) <= new Date(req.query.startDate as string)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  validate
];

// Sanitization middleware
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potentially dangerous fields
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];
  
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key of dangerousFields) {
      delete obj[key];
    }
    
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        obj[key] = sanitize(obj[key]);
      }
    }
    
    return obj;
  };
  
  req.body = sanitize(req.body);
  next();
};
