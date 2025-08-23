import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function loginHandler(req, res) {
  try {
    const username = (req.body.username || '').trim()
    const password = req.body.password || ''
    if (!username || !password) return res.status(400).json({ error: 'username and password required' })

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ error: 'Server error' })
  }
}

export async function meHandler(req, res) {
  try {
    const userId = req.jwt?.sub
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, fullName: true, role: true, createdAt: true }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user })
  } catch (e) {
    console.error('Me error:', e)
    res.status(500).json({ error: 'Server error' })
  }
}
