import { Router } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createUploadController } from '../controllers/uploadsController.js';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, _file, callback) => callback(null, `${crypto.randomUUID()}.mp4`),
  }),
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype === 'video/mp4'),
});

export function createUploadRouter(io: SocketServer) {
  const router = Router();
  const controller = createUploadController(io);

  router.post('/', requireAuth, videoUpload.single('video'), controller.create);
  router.patch('/:id/caption', requireAuth, requireAdmin, controller.updateCaption);
  router.post('/:id/publish-now', requireAuth, requireAdmin, controller.publishNow);

  return router;
}

export default createUploadRouter;
