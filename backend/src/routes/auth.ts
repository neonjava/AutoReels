import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  login,
  me,
  listUsers,
  createUser,
  deleteUser,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/me', requireAuth, me);
router.get('/users', requireAuth, requireAdmin, listUsers);
router.post('/users', requireAuth, requireAdmin, createUser);
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

export default router;
