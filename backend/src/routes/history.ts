import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listHistory, getHistoryItem } from '../controllers/historyController.js';

const router = Router();

router.get('/', requireAuth, listHistory);
router.get('/:id', requireAuth, getHistoryItem);

export default router;
