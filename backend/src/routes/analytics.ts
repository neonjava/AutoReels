import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, getAnalytics);

export default router;
