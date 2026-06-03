import express from 'express';
import { bulkUpload } from '../controllers/bulkController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/upload', protect, bulkUpload);

export default router;
