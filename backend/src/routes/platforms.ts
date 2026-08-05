import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  listPlatforms,
  connectPlatform,
  disconnectPlatform,
} from '../controllers/platformsController.js';

const router = Router();

router.get('/', requireAuth, listPlatforms);
router.post('/:platform/connect', requireAuth, requireAdmin, connectPlatform);
router.post('/:platform/disconnect', requireAuth, requireAdmin, disconnectPlatform);

export default router;
