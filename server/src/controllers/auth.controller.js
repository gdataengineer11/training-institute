// server/src/controllers/auth.controller.js
import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// server/src/controllers/auth.controller.js
import bcrypt from 'bcryptjs'


const prisma = new PrismaClient();

const LoginSchema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});

function logDebug(...args) {
  if (process.env.AUTH_DEBUG === 'true') console.debug('[AUTH]', ...args);
}

export async function loginHandler(req, res) {
  try {
    const { username, password } = LoginSchema.parse(req.body);

    const uname = String(username || '').trim().toLowerCase();
    logDebug('login attempt', { uname });

    // 1) find user by normalized username
    const user = await prisma.user.findUnique({ where: { username: uname } });
    if (!user) {
      logDebug('user NOT FOUND', { uname });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    logDebug('user FOUND', { id: user.id, role: user.role });

    // 2) bcrypt compare
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) {
      logDebug('PASSWORD MISMATCH', { uname });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3) issue JWT
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET missing in .env');
      return res.status(500).json({ message: 'Server misconfigured' });
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role, name: user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role }
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Invalid input' });
    console.error(err);
    res.status(500).json({ message: 'Unexpected error' });
  }
}

export async function meHandler(req, res) {
  res.json({ user: req.user });
}
