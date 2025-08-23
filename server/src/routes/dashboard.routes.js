import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const router = Router()

router.get('/', async (_req, res) => {
  const [students, enrollments, pending] = await Promise.all([
    prisma.student.count(),
    prisma.enrollment.count(),
    prisma.installment.count({ where: { status: 'PENDING' } }),
  ])
  res.json({ students, enrollments, pendingInstallments: pending })
})

export default router
