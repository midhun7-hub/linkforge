import express from 'express';
import {
  getAnalytics,
  getWorkspaceAnalytics,
  getWorkspaceTrends,
  getVisits,
  getTrends,
  getCountryBreakdown,
  getReferrerBreakdown,
} from '../controllers/analyticsController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/workspace', protect, getWorkspaceAnalytics);
router.get('/workspace/trends', protect, getWorkspaceTrends);
router.get('/workspace/countries', protect, getCountryBreakdown);
router.get('/workspace/referrers', protect, getReferrerBreakdown);
router.get('/:id', protect, getAnalytics);
router.get('/:id/visits', protect, getVisits);
router.get('/:id/trends', protect, getTrends);
router.get('/:id/countries', protect, getCountryBreakdown);
router.get('/:id/referrers', protect, getReferrerBreakdown);

export default router;
