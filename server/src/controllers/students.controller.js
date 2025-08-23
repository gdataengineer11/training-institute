import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendCSV, sendXLSX, sendPDF } from '../utils/exporters.js';

const prisma = new PrismaClient();

const ListSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortDir: z.enum(['asc','desc']).default('desc'),
  sessionId: z.string().optional(),
  paymentStatus: z.enum(['PENDING','PARTIAL','PAID','REFUNDED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

export async function listStudents(req, res, next) {
  try {
    const p = ListSchema.parse(req.query);
    const where = {};

    // search
    if (p.q) {
      where.OR = [
        { firstName: { contains: p.q, mode: 'insensitive' } },
        { lastName:  { contains: p.q, mode: 'insensitive' } },
        { email:     { contains: p.q, mode: 'insensitive' } },
        { phone:     { contains: p.q, mode: 'insensitive' } }
      ];
    }
    // session filter: by enrollment.sessionId
    if (p.sessionId) {
      where.enrollments = { some: { sessionId: Number(p.sessionId) } };
    }
    // date range (createdAt)
    if (p.dateFrom || p.dateTo) {
      where.createdAt = {};
      if (p.dateFrom) where.createdAt.gte = new Date(p.dateFrom);
      if (p.dateTo)   where.createdAt.lte = new Date(p.dateTo);
    }
    // payment status via installments aggregate
    let havingPaymentStatus = undefined;
    if (p.paymentStatus) havingPaymentStatus = p.paymentStatus;

    const total = await prisma.student.count({ where });
    const rows = await prisma.student.findMany({
      where,
      orderBy: { [p.sortBy]: p.sortDir },
      skip: (p.page-1)*p.limit,
      take: p.limit,
      include: {
        enrollments: { include: { session: true, feePlan: { include: { installments: true } } } },
        tags: { include: { tag: true } }
      }
    });

    const shaped = rows.map(s => {
      const enr = s.enrollments[0];
      const installments = enr?.feePlan?.installments || [];
      const due = installments.reduce((acc,i)=> acc + (i.status==='PENDING' ? i.amount : 0), 0);
      const ps = installments.every(i=>i.status==='PAID') ? 'PAID' :
                 installments.some(i=>i.status==='PARTIAL') ? 'PARTIAL' :
                 installments.some(i=>i.status==='REFUNDED') ? 'REFUNDED' : 'PENDING';

      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email,
        phone: s.phone || '',
        status: s.status,
        session: enr?.session?.name || '-',
        paymentStatus: ps,
        outstanding: Number(due.toFixed(2)),
        createdAt: s.createdAt,
        tags: s.tags.map(t => t.tag.name)
      };
    });

    // optional paymentStatus filter after shaping
    const filtered = havingPaymentStatus ? shaped.filter(r=>r.paymentStatus===havingPaymentStatus) : shaped;

    res.json({ total, page: p.page, limit: p.limit, rows: filtered });
  } catch (err) { next(err); }
}

// ----- Create/Update -----
const GuardianSchema = z.object({ relation: z.string(), name: z.string(), phone: z.string().optional(), email: z.string().optional() });
const StudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  status: z.enum(['LEAD','APPLICANT','ENROLLED','ACTIVE','COMPLETED','ALUMNI','CANCELED']).default('APPLICANT'),
  sessionId: z.number(),
  programId: z.number().optional(),
  batchId: z.number().optional(),
  guardians: z.array(GuardianSchema).optional(),
  feePlan: z.object({
    listPrice: z.number(),
    discount: z.number().default(0),
    installments: z.array(z.object({ amount: z.number(), dueDate: z.string() }))
  }).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export async function createStudent(req, res, next) {
  try {
    const p = StudentSchema.parse(req.body);
    const created = await prisma.$transaction(async(tx)=>{
      const student = await tx.student.create({
        data: {
          firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone,
          dob: p.dob ? new Date(p.dob) : null, address: p.address, city: p.city, state: p.state, zip: p.zip,
          status: p.status, notes: p.notes
        }
      });
      // Enrollment
      const enrollment = await tx.enrollment.create({ data: { studentId: student.id, sessionId: p.sessionId } });

      // Guardians
      if (p.guardians?.length) {
        await tx.guardian.createMany({ data: p.guardians.map(g=>({ ...g, studentId: student.id })) });
      }
      // Fee plan
      if (p.feePlan) {
        const net = p.feePlan.listPrice - (p.feePlan.discount||0);
        const plan = await tx.feePlan.create({ data: { enrollmentId: enrollment.id, currency: 'USD', listPrice: p.feePlan.listPrice, discount: p.feePlan.discount||0, netPayable: net } });
        for (const inst of p.feePlan.installments) {
          await tx.installment.create({ data: { feePlanId: plan.id, amount: inst.amount, dueDate: new Date(inst.dueDate) } });
        }
      }
      // Tags
      if (p.tags?.length) {
        for (const name of p.tags) {
          const tag = await tx.tag.upsert({ where: { name }, update: {}, create: { name } });
          await tx.studentTag.create({ data: { studentId: student.id, tagId: tag.id } });
        }
      }
      // Audit
      await tx.auditLog.create({ data: { action: 'CREATE', entity: 'Student', entityId: student.id, userId: req.user?.sub, meta: p } });
      return student;
    });
    res.status(201).json({ id: created.id });
  } catch (err) { next(err); }
}

export async function updateStudent(req, res, next) {
  try {
    const id = Number(req.params.id);
    const p = StudentSchema.partial().parse(req.body);
    const student = await prisma.student.update({ where: { id }, data: {
      firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone,
      dob: p.dob ? new Date(p.dob) : undefined, address: p.address, city: p.city, state: p.state, zip: p.zip,
      status: p.status, notes: p.notes
    }});
    if (p.guardians) {
      await prisma.guardian.deleteMany({ where: { studentId: id } });
      await prisma.guardian.createMany({ data: p.guardians.map(g=>({ ...g, studentId: id })) });
    }
    if (p.tags) {
      await prisma.studentTag.deleteMany({ where: { studentId: id } });
      for (const name of p.tags) {
        const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
        await prisma.studentTag.create({ data: { studentId: id, tagId: tag.id } });
      }
    }
    await prisma.auditLog.create({ data: { action: 'UPDATE', entity: 'Student', entityId: id, userId: req.user?.sub, meta: p } });
    res.json({ ok: true, student });
  } catch (err) { next(err); }
}

// ----- Bulk actions -----
const BulkSchema = z.object({
  ids: z.array(z.number().int()).min(1),
  action: z.enum(['ASSIGN_BATCH','UPDATE_STATUS','SEND_REMINDER']),
  payload: z.any().optional()
});

export async function bulkAction(req, res, next) {
  try {
    const { ids, action, payload } = BulkSchema.parse(req.body);
    if (action === 'ASSIGN_BATCH') {
      const batchId = Number(payload?.batchId);
      await prisma.session.updateMany({ data: { batchId }, where: { enrollments: { some: { studentId: { in: ids } } } } });
    }
    if (action === 'UPDATE_STATUS') {
      const to = payload?.status;
      await prisma.$transaction(async(tx)=>{
        const students = await tx.student.findMany({ where: { id: { in: ids } }, select: { id: true, status: true } });
        for (const s of students) {
          await tx.student.update({ where: { id: s.id }, data: { status: to } });
          await tx.enrollmentStatusHistory.create({ data: { studentId: s.id, from: s.status, to, userId: req.user?.sub } });
        }
      });
    }
    if (action === 'SEND_REMINDER') {
      // Here you'd integrate email/SMS provider. We'll just log an audit.
      await prisma.auditLog.create({ data: { action: 'SEND_REMINDER', entity: 'Student', meta: { ids }, userId: req.user?.sub } });
    }
    res.json({ ok: true, count: ids.length });
  } catch (err) { next(err); }
}

// ----- Export -----
export async function exportStudents(req, res, next) {
  try {
    const fmt = (req.query.format || 'csv').toString();
    const { rows } = await (async ()=>{
      // reuse listStudents logic minimally
      const r = await prisma.student.findMany({ include: { enrollments: { include: { session: true, feePlan: { include: { installments: true } } } } } });
      const rows = r.map(s => {
        const enr = s.enrollments[0];
        const due = (enr?.feePlan?.installments || []).reduce((acc,i)=> acc + (i.status==='PENDING' ? i.amount : 0), 0);
        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          phone: s.phone || '',
          status: s.status,
          session: enr?.session?.name || '-',
          outstanding: due
        };
      });
      return { rows };
    })();
    if (fmt === 'xlsx') return sendXLSX(res, rows);
    if (fmt === 'pdf')  return sendPDF(res, rows);
    return sendCSV(res, rows);
  } catch (err) { next(err); }
}

// ----- Meta + documents -----
export async function getMeta(_req, res, next) {
  try {
    const [sessions, programs, batches, tags] = await Promise.all([
      prisma.session.findMany({ orderBy: { startDate: 'desc' }, select: { id:true, name:true } }),
      prisma.program.findMany({ select: { id:true, name:true } }),
      prisma.batch.findMany({ select: { id:true, name:true, programId:true } }),
      prisma.tag.findMany({ select: { id:true, name:true, color:true } })
    ]);
    res.json({ sessions, programs, batches, tags, statuses: ['LEAD','APPLICANT','ENROLLED','ACTIVE','COMPLETED','ALUMNI','CANCELED'],
               paymentStatuses: ['PENDING','PARTIAL','PAID','REFUNDED'] });
  } catch (err) { next(err); }
}

export async function uploadDocument(req, res, next) {
  try {
    const studentId = Number(req.params.id);
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const doc = await prisma.studentDocument.create({
      data: { studentId, title: req.body.title || req.file.originalname, filename: req.file.filename, url: `/uploads/${req.file.filename}` }
    });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}
