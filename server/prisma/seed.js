import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  // Admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash, fullName: 'Admin User', role: 'ADMIN' }
  });

  // Programs + Batches
  const prog = await prisma.program.upsert({
    where: { name: 'Full-Stack Web' },
    update: {},
    create: { name: 'Full-Stack Web' }
  });
  const batchA = await prisma.batch.create({ data: { name: 'FSW-A', programId: prog.id } });

  // Sessions
  const s1 = await prisma.session.create({
    data: { name: 'Spring 2025', startDate: new Date(), endDate: new Date(Date.now()+90*864e5), batchId: batchA.id }
  });

  // Tags
  const [tHot, tScholar] = await prisma.$transaction([
    prisma.tag.upsert({ where: { name: 'Hot' }, update: {}, create: { name: 'Hot', color: '#ef4444' } }),
    prisma.tag.upsert({ where: { name: 'Scholarship' }, update: {}, create: { name: 'Scholarship', color: '#22c55e' } })
  ]);

  // Students + enrollments + fee plans
  for (let i=1;i<=24;i++) {
    const st = await prisma.student.create({
      data: {
        firstName: `Student${i}`, lastName: `Last${i}`, email: `s${i}@example.com`,
        phone: `555-100${i}`, status: i%5===0 ? 'APPLICANT' : 'ACTIVE'
      }
    });
    await prisma.studentTag.create({ data: { studentId: st.id, tagId: i%4===0 ? tScholar.id : tHot.id } });
    const enr = await prisma.enrollment.create({ data: { studentId: st.id, sessionId: s1.id, joinedAt: new Date(Date.now()-i*864e5) } });
    const plan = await prisma.feePlan.create({ data: { enrollmentId: enr.id, listPrice: 1200, discount: i%3===0 ? 200:0, netPayable: i%3===0 ? 1000:1200, currency: 'USD' } });
    await prisma.installment.createMany({
      data: [
        { feePlanId: plan.id, amount: (plan.netPayable/2), dueDate: new Date(Date.now()+15*864e5), status: 'PENDING' },
        { feePlanId: plan.id, amount: (plan.netPayable/2), dueDate: new Date(Date.now()+45*864e5), status: 'PENDING' }
      ]
    });
  }

  console.log('Seeded enrollments ✔️');
}
main().finally(()=>prisma.$disconnect());
