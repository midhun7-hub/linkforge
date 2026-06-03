import { body, validationResult } from 'express-validator';

const strongPasswordMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('\x1b[31m%s\x1b[0m', '[VALIDATION ERROR]', errors.array());
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .matches(strongPasswordRegex).withMessage(strongPasswordMessage),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const validateUrl = [
  body('originalUrl')
    .trim()
    .notEmpty().withMessage('Original URL is required')
    .isURL().withMessage('Please provide a valid URL'),
  body('password')
    .optional({ checkFalsy: true })
    .trim()
    .if(() => true)
    .custom((value) => {
      if (value && !strongPasswordRegex.test(value)) {
        throw new Error(strongPasswordMessage);
      }
      return true;
    }),
  handleValidationErrors
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .matches(strongPasswordRegex).withMessage(strongPasswordMessage),
  handleValidationErrors
];
