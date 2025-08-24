import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// ---------- helpers ----------
const sum = (rows, key = 'amount') => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0)
const ym = (d) => {
  const dt = new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
const clampDate = (v, fallback) => {
  const d = v ? new Date(v) : null
  return isNaN(d?.getTime?.()) ? fallback : d
}

// Keep the old "/" summary for compatibility
router.get('/', async (_req, res) => {
  try {
    const [students, enrollments, pending] = await Promise.all([
      prisma.student.count(),
      prisma.enrollment.count(),
      prisma.installment.count({ where: { status: 'PENDING' } }),
    ])
    res.json({ students, enrollments, pendingInstallments: pending })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load dashboard' })
  }
})

/**
 * GET /api/dashboard/summary
 * Matches client/src/lib/dashboardApi.js -> getSummary()
 */
router.get('/summary', async (_req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalEnrollments,
      paidInstallments,
      outstandingInstallments,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({
        where: { status: { in: ['ENROLLED', 'ACTIVE'] } },
      }),
      prisma.enrollment.count(),
      prisma.installment.findMany({
        where: { status: 'PAID' },
        select: { amount: true },
      }),
      prisma.installment.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        select: { amount: true },
      }),
    ])

    const collected = sum(paidInstallments)
    const outstanding = sum(outstandingInstallments)

    res.json({
      totals: {
        students: totalStudents,
        activeStudents,
        enrollments: totalEnrollments,
      },
      finance: {
        collected,
        outstanding,
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load summary' })
  }
})

/**
 * GET /api/dashboard/kpis?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Matches client/src/lib/dashboardApi.js -> getKpis(params)
 */
router.get('/kpis', async (req, res) => {
  try {
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1) // last ~3 months
    const from = clampDate(req.query.from, defaultFrom)
    const to = clampDate(req.query.to, now)

    const [enrollsInRange, paid, allDue] = await Promise.all([
      prisma.enrollment.findMany({
        where: { joinedAt: { gte: from, lte: to } },
        select: { id: true },
      }),
      prisma.installment.findMany({
        where: { status: 'PAID' },
        select: { amount: true, paidOn: true, dueDate: true },
      }),
      prisma.installment.findMany({
        select: { amount: true, status: true },
      }),
    ])

    const totalCollected = sum(paid)
    const totalDue = sum(allDue)
    const totalOutstanding = sum(allDue.filter(i => ['PENDING', 'PARTIAL'].includes(i.status)))
    const collectionRate = totalDue > 0 ? Number((totalCollected / totalDue).toFixed(3)) : null

    const onTimePaidCount = paid.filter(i => i.paidOn && i.paidOn <= i.dueDate).length
    const onTimeRate = paid.length > 0 ? Number((onTimePaidCount / paid.length).toFixed(3)) : null

    res.json({
      range: { from, to },
      kpis: {
        enrollmentsInRange: enrollsInRange.length,
        totalCollected,
        totalOutstanding,
        collectionRate, // 0..1
        onTimePaymentRate: onTimeRate, // 0..1
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load KPIs' })
  }
})

/**
 * GET /api/dashboard/enrollments-trend?from=YYYY-MM-DD&to=YYYY-MM-DD&interval=month|week|day
 * Matches client/src/lib/dashboardApi.js -> getTrend(params)
 * (Implements month by default; simple client-friendly shape)
 */
router.get('/enrollments-trend', async (req, res) => {
  try {
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1) // last 6 months
    const from = clampDate(req.query.from, defaultFrom)
    const to = clampDate(req.query.to, now)
    const interval = (req.query.interval || 'month').toString().toLowerCase()

    const items = await prisma.enrollment.findMany({
      where: { joinedAt: { gte: from, lte: to } },
      select: { joinedAt: true },
      orderBy: { joinedAt: 'asc' },
    })

    let buckets = {}
    if (interval === 'day') {
      items.forEach(e => {
        const d = new Date(e.joinedAt)
        const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
        buckets[key] = (buckets[key] || 0) + 1
      })
    } else if (interval === 'week') {
      // Week key as YYYY-WW (very simple week-of-year calculation)
      items.forEach(e => {
        const d = new Date(e.joinedAt)
        const firstJan = new Date(d.getFullYear(), 0, 1)
        const days = Math.floor((d - firstJan) / (24 * 60 * 60 * 1000))
        const week = String(Math.floor((days + firstJan.getDay()) / 7) + 1).padStart(2, '0')
        const key = `${d.getFullYear()}-W${week}`
        buckets[key] = (buckets[key] || 0) + 1
      })
    } else {
      // month (default): YYYY-MM
      items.forEach(e => {
        const key = ym(e.joinedAt)
        buckets[key] = (buckets[key] || 0) + 1
      })
    }

    const trend = Object.entries(buckets)
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period))

    res.json({ from, to, interval, trend })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load trend' })
  }
})

/**
 * GET /api/dashboard/recent-enrollments?take=10
 * Matches client/src/lib/dashboardApi.js -> getRecent(params)
 */
router.get('/recent-enrollments', async (req, res) => {
  try {
    const take = Math.min(Math.max(parseInt(req.query.take || '10', 10), 1), 50)

    const rows = await prisma.enrollment.findMany({
      take,
      orderBy: { joinedAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        session: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
    })

    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load recent enrollments' })
  }
})

export default router
