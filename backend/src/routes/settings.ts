import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = Router();

router.get('/', requireAuth, getSettings);
router.put('/', requireAuth, requireAdmin, updateSettings);

export default router;
