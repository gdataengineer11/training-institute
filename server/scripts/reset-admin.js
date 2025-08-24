// ESM script to set/reset a user's password
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const [,, username, password] = process.argv
if (!username || !password) {
  console.error('Usage: node scripts/reset-admin.js <username> <password>')
  process.exit(1)
}

try {
  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash: hash, role: 'ADMIN' },
    create: {
      username,
      passwordHash: hash,
      fullName: 'System Admin',
      role: 'ADMIN',
    },
  })

  console.log(`✅ Password set for user="${user.username}" (id=${user.id})`)
} catch (err) {
  console.error('❌ Failed to reset password:', err)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
