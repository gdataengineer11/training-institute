import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

const LoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

export async function loginHandler(req, res, next) {
  try {
    const { username, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role, name: user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, fullName: user.fullName, username: user.username, role: user.role }
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    next(err);
  }
}

export async function meHandler(req, res) {
  // req.user is set by requireAuth
  res.json({ user: req.user });
}
