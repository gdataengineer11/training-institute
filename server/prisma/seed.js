// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const adminPwdHash = await bcrypt.hash('Admin@123', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminPwdHash,
      fullName: 'System Admin',
      role: 'ADMIN',
    },
    create: {
      username: 'admin',
      passwordHash: adminPwdHash,
      fullName: 'System Admin',
      role: 'ADMIN',
    },
  })

  // Tags
  const [tNew, tScholar] = await Promise.all([
    prisma.tag.upsert({ where: { name: 'New' }, update: {}, create: { name: 'New', color: '#3b82f6' } }),
    prisma.tag.upsert({ where: { name: 'Scholarship' }, update: {}, create: { name: 'Scholarship', color: '#10b981' } }),
  ])

  // Program/Batch/Session
  const program = await prisma.program.upsert({
    where: { name: 'Cloud & AI Bootcamp' },
    update: {},
    create: { name: 'Cloud & AI Bootcamp' },
  })
  const batch = await prisma.batch.create({ data: { name: 'Batch A', programId: program.id } })
  const session = await prisma.session.create({
    data: { name: 'Aug 2025', startDate: new Date('2025-08-01'), endDate: new Date('2025-10-31'), batchId: batch.id },
  })

  // Student
  const student = await prisma.student.upsert({
    where: { email: 'student1@example.com' },
    update: { firstName: 'Aarav', lastName: 'Singh', status: 'LEAD' },
    create: {
      firstName: 'Aarav',
      lastName: 'Singh',
      email: 'student1@example.com',
      phone: '9999999999',
      city: 'Varanasi',
      state: 'UP',
      status: 'LEAD',
      tags: { create: [{ tag: { connect: { id: tNew.id } } }, { tag: { connect: { id: tScholar.id } } }] },
      guardians: { create: [{ relation: 'Father', name: 'R. Singh', phone: '8888888888' }] },
    },
  })

  // Enrollment + FeePlan + Installments (avoid duplicate)
  const existing = await prisma.enrollment.findFirst({ where: { studentId: student.id, sessionId: session.id } })
  if (!existing) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        feePlan: {
          create: {
            currency: 'INR',
            listPrice: 30000,
            discount: 5000,
            netPayable: 25000,
            installments: {
              create: [
                { dueDate: new Date('2025-08-15'), amount: 10000, status: 'PAID', paidOn: new Date('2025-08-16') },
                { dueDate: new Date('2025-09-15'), amount: 10000, status: 'PENDING' },
                { dueDate: new Date('2025-10-15'), amount: 5000, status: 'PENDING' },
              ],
            },
          },
        },
      },
    })
  }

  console.log('✅ Seed complete')
}

main().catch(e => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
