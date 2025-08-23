import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function summaryHandler(_req, res, next) {
  try {
    const [totalStudents, pendingSum, upcomingSessions] = await Promise.all([
      prisma.student.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' }
      }),
      prisma.session.count({
        where: { startDate: { gte: new Date() } }
      })
    ]);

    // Enrollments this month by day
    const start = new Date();
    start.setDate(1);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const enrollments = await prisma.enrollment.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { createdAt: true }
    });

    const daysInMonth = new Date(start.getFullYear(), start.getMonth()+1, 0).getDate();
    const series = Array.from({ length: daysInMonth }, (_, i) => ({ day: i+1, count: 0 }));
    for (const e of enrollments) {
      const d = new Date(e.createdAt).getDate();
      series[d-1].count++;
    }

    // Recent activities (last 10 enrollments)
    const recent = await prisma.enrollment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true } },
        session: { select: { name: true } }
      }
    });

    const recentActivities = recent.map(r => ({
      type: 'ENROLLMENT',
      student: `${r.student.firstName} ${r.student.lastName}`,
      session: r.session.name,
      date: r.createdAt
    }));

    res.json({
      kpis: {
        totalStudents,
        outstandingDues: pendingSum._sum.amount || 0,
        upcomingSessions
      },
      enrollmentsThisMonth: series,
      recentActivities
    });
  } catch (err) {
    next(err);
  }
}
