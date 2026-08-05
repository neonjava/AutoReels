import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
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

initDatabase();
seedAdmin();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'AutoReels' });
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

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  console.log(`AutoReels API listening on http://localhost:${port}`);
  startScheduler(io);
});

function seedAdmin() {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'REDACTED_PASSWORD';
  const existing = db
    .prepare(`SELECT id FROM users WHERE username = ?`)
    .get(username);
  if (existing) return;
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')`
  ).run(username, hash);
  console.log(`Seeded admin user: ${username}`);
}
