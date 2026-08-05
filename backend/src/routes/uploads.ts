import { Router } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createUploadController } from '../controllers/uploadsController.js';

export function createUploadRouter(io: SocketServer) {
  const router = Router();
  const controller = createUploadController(io);

  router.post('/preview', requireAuth, controller.preview);
  router.post('/', requireAuth, controller.create);
  router.patch('/:id/caption', requireAuth, requireAdmin, controller.updateCaption);
  router.post('/:id/publish-now', requireAuth, requireAdmin, controller.publishNow);

  return router;
}

export default createUploadRouter;
