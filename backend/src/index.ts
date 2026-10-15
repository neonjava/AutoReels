import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Server as SocketServer } from 'socket.io';
import bcrypt from 'bcryptjs';
import { initDatabase, db } from './database/index.js';
import authRoutes from './routes/auth.js';
import platformRoutes from './routes/platforms.js';
import historyRoutes from './routes/history.js';
import settingsRoutes from './routes/settings.js';
import analyticsRoutes from './routes/analytics.js';
import { createUploadRouter } from './routes/uploads.js';
import { startScheduler } from './services/scheduler.js';
import { resolveStagingToken } from './services/staging.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initDatabase();
seedAdmin();

const app = express();
const server = http.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN ?? true;
const io = new SocketServer(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'AutoReels' });
});

/** Time-limited public video URLs for Instagram Content Publishing. */
app.get('/api/stage/:token', (req, res) => {
  const filePath = resolveStagingToken(req.params.token);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Staging link expired or missing' });
  }
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Length', String(fs.statSync(filePath).size));
  fs.createReadStream(filePath).pipe(res);
});

app.use('/api/auth', authRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/uploads', createUploadRouter(io));
app.use('/api/history', historyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

io.on('connection', (socket) => {
  socket.on('join:job', (jobId: string) => {
    socket.join(`job:${jobId}`);
  });
});

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api)(?!\/socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const port = Number(process.env.PORT ?? 4000);
server.listen(port, '0.0.0.0', () => {
  console.log(`AutoReels listening on http://0.0.0.0:${port}`);
  startScheduler(io);
});

function seedAdmin() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD is required');
  const hash = bcrypt.hashSync(password, 10);
  const existing = db
    .prepare(`SELECT id FROM users WHERE username = ?`)
    .get(username) as { id: number } | undefined;

  if (!existing) {
    db.prepare(
      `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')`
    ).run(username, hash);
    console.log(`Seeded admin user: ${username}`);
    return;
  }

  if (process.env.ADMIN_PASSWORD) {
    db.prepare(`UPDATE users SET password_hash = ? WHERE username = ?`).run(
      hash,
      username
    );
    console.log(`Updated admin password for: ${username}`);
  }
}
