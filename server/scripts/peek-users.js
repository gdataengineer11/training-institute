import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

try {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true, role: true, createdAt: true }
  })
  console.table(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })))
} catch (e) {
  console.error('Peek users failed:', e)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
