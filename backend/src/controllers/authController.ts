import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../database/index.js';
import { signToken } from '../middleware/auth.js';

export function login(req: Request, res: Response) {
  const schema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid credentials payload' });
  }

  const user = db
    .prepare(`SELECT id, username, password_hash, role FROM users WHERE username = ?`)
    .get(parsed.data.username) as
    | { id: number; username: string; password_hash: string; role: 'admin' | 'submitter' }
    | undefined;

  if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const authUser = { id: user.id, username: user.username, role: user.role };
  return res.json({ token: signToken(authUser), user: authUser });
}

export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}

export function listUsers(_req: Request, res: Response) {
  const users = db
    .prepare(
      `SELECT id, username, role, created_at FROM users ORDER BY created_at DESC`
    )
    .all();
  res.json({ users });
}

export function createUser(req: Request, res: Response) {
  const schema = z.object({
    username: z.string().min(3).max(40),
    password: z.string().min(6),
    role: z.enum(['admin', 'submitter']).default('submitter'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const hash = bcrypt.hashSync(parsed.data.password, 10);
  try {
    const result = db
      .prepare(
        `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`
      )
      .run(parsed.data.username, hash, parsed.data.role);
    return res.status(201).json({
      user: {
        id: Number(result.lastInsertRowid),
        username: parsed.data.username,
        role: parsed.data.role,
      },
    });
  } catch {
    return res.status(409).json({ error: 'Username already exists' });
  }
}

export function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  res.json({ ok: true });
}
