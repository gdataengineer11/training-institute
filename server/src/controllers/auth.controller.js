import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

const LoginSchema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});

export async function loginHandler(req, res) {
  try {
    const { username, password } = LoginSchema.parse(req.body);

    // Normalize usernames to lowercase everywhere
    const uname = username.trim().toLowerCase();

    // Look up by normalized username
    const user = await prisma.user.findUnique({ where: { username: uname } });
    if (!user) {
      if (process.env.AUTH_DEBUG === 'true') console.debug('[LOGIN] user not found:', uname);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      if (process.env.AUTH_DEBUG === 'true') console.debug('[LOGIN] password mismatch for:', uname);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET missing');
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
