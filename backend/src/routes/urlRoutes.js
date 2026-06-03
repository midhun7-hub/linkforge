import express from 'express';
import { createUrl, getUrls, getUrlById, updateUrl, deleteUrl, redirectUrl, getPublicStats, verifyPassword } from '../controllers/urlController.js';
import { protect } from '../middlewares/auth.js';
import { validateUrl } from '../middlewares/validation.js';
import { urlRateLimiter } from '../middlewares/security.js';

const router = express.Router();

router.post('/', protect, urlRateLimiter, validateUrl, createUrl);
router.get('/', protect, getUrls);
router.post('/verify/:shortCode', verifyPassword);
router.get('/public/:shortCode', getPublicStats);
router.get('/:id', protect, getUrlById);
router.put('/:id', protect, updateUrl);
router.delete('/:id', protect, deleteUrl);

export default router;
