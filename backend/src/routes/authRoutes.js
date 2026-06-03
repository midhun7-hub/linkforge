import express from 'express';
import { register, login, getProfile, changePassword, deleteAccount } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { validateRegister, validateLogin, validateChangePassword } from '../middlewares/validation.js';
import { authRateLimiter } from '../middlewares/security.js';

const router = express.Router();

router.post('/register', authRateLimiter, validateRegister, register);
router.post('/login', authRateLimiter, validateLogin, login);
router.get('/profile', protect, getProfile);
router.put('/change-password', protect, validateChangePassword, changePassword);
router.delete('/delete-account', protect, deleteAccount);

export default router;
