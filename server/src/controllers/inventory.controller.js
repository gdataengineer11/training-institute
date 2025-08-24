// server/src/controllers/inventory.controller.js
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs';
import { sendCSV, sendXLSX, sendPDF } from '../utils/exporters.js';

const prisma = new PrismaClient();

// ---------- Meta ----------
export async function getMeta(_req, res, next) {
  try {
    const [suppliers, categoriesRaw] = await Promise.all([
      prisma.supplier.findMany({ select: { id: true, name: true } }),
      prisma.inventoryItem.findMany({ select: { category: true }, distinct: ['category'] })
    ]);
    const categories = categoriesRaw.map(c => c.category).filter(Boolean).sort();
    res.json({
      statuses: ['ACTIVE', 'ARCHIVED'],
      categories,
      suppliers,
      units: ['pcs', 'box', 'kg', 'litre', 'pack', 'set']
    });
  } catch (e) { next(e); }
}

// ---------- List / Get ----------
const ListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  lowStockOnly: z.coerce.boolean().optional(),
  sortBy: z.string().default('updatedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc')
});

export async function listItems(req, res, next) {
  try {
    const p = ListSchema.parse(req.query);
    const where = {};
    if (p.q) {
      where.OR = [
        { name: { contains: p.q, mode: 'insensitive' } },
        { sku: { contains: p.q, mode: 'insensitive' } },
        { category: { contains: p.q, mode: 'insensitive' } },
        { location: { contains: p.q, mode: 'insensitive' } }
      ];
    }
    if (p.category) where.category = p.category;
    if (p.status) where.status = p.status;

    let items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { [p.sortBy]: p.sortDir },
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: { supplier: true }
    });

    if (p.lowStockOnly) items = items.filter(i => (i.stock ?? 0) < (i.lowStockThreshold ?? 0));

    const total = await prisma.inventoryItem.count({ where });
    res.json({
      total,
      page: p.page,
      limit: p.limit,
      rows: items.map(i => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        category: i.category || '-',
        unit: i.unit || 'pcs',
        stock: i.stock,
        issued: i.issued,
        threshold: i.lowStockThreshold,
        low: (i.stock ?? 0) < (i.lowStockThreshold ?? 0),
        location: i.location || '',
        status: i.status,
        supplier: i.supplier?.name || '',
        updatedAt: i.updatedAt,
        imageUrl: i.imageUrl || ''
      }))
    });
  } catch (e) { next(e); }
}

export async function getItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { supplier: true, transactions: { orderBy: { createdAt: 'desc' }, take: 50 } }
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (e) { next(e); }
}

// ---------- Create / Update / Archive ----------
const CreateSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(0),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  supplierId: z.coerce.number().int().optional(),
  notes: z.string().optional()
});

export async function createItem(req, res, next) {
  try {
    const p = CreateSchema.parse(req.body);
    const imageUrl = req.file ? `/uploads/inventory/${req.file.filename}` : undefined;
    const item = await prisma.inventoryItem.create({ data: { ...p, imageUrl } });
    await prisma.auditLog.create({ data: { action: 'CREATE', entity: 'InventoryItem', entityId: item.id, userId: req.user?.sub, meta: p } });
    res.status(201).json(item);
  } catch (e) { next(e); }
}

export async function updateItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const p = CreateSchema.partial().parse(req.body);
    const imageUrl = req.file ? `/uploads/inventory/${req.file.filename}` : undefined;
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { ...p, ...(imageUrl ? { imageUrl } : {}) }
    });
    await prisma.auditLog.create({ data: { action: 'UPDATE', entity: 'InventoryItem', entityId: id, userId: req.user?.sub, meta: p } });
    res.json(item);
  } catch (e) { next(e); }
}

export async function archiveItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await prisma.inventoryItem.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await prisma.auditLog.create({ data: { action: 'ARCHIVE', entity: 'InventoryItem', entityId: id, userId: req.user?.sub } });
    res.json({ ok: true, item });
  } catch (e) { next(e); }
}

// ---------- Stock operations ----------
const QtySchema = z.object({ qty: z.coerce.number().int().positive(), note: z.string().optional() });

async function recordTxn(tx, data) {
  await tx.inventoryTransaction.create({ data });
}

export async function issueStock(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { qty, note } = QtySchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const it = await tx.inventoryItem.findUnique({ where: { id } });
      if (!it) throw new Error('Item not found');
      if (it.stock < qty) throw new Error('Insufficient stock');
      const updated = await tx.inventoryItem.update({
        where: { id },
        data: { stock: { decrement: qty }, issued: { increment: qty } }
      });
      await recordTxn(tx, { itemId: id, type: 'ISSUE', qty, note, userId: req.user?.sub });
      return updated;
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function receiveStock(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { qty, note } = QtySchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.update({ where: { id }, data: { stock: { increment: qty } } });
      await recordTxn(tx, { itemId: id, type: 'RECEIVE', qty, note, userId: req.user?.sub });
      return updated;
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function adjustStock(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { qty, note } = z.object({ qty: z.coerce.number().int(), note: z.string().optional() }).parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const it = await tx.inventoryItem.findUnique({ where: { id } });
      if (!it) throw new Error('Item not found');
      const newStock = (it.stock || 0) + qty;
      if (newStock < 0) throw new Error('Resulting stock negative');
      const updated = await tx.inventoryItem.update({ where: { id }, data: { stock: newStock } });
      await recordTxn(tx, { itemId: id, type: 'ADJUST', qty, note, userId: req.user?.sub });
      return updated;
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function returnStock(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { qty, note } = QtySchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const it = await tx.inventoryItem.findUnique({ where: { id } });
      if (!it) throw new Error('Item not found');
      if (it.issued < qty) throw new Error('Return exceeds issued count');
      const updated = await tx.inventoryItem.update({
        where: { id },
        data: { stock: { increment: qty }, issued: { decrement: qty } }
      });
      await recordTxn(tx, { itemId: id, type: 'RETURN', qty, note, userId: req.user?.sub });
      return updated;
    });
    res.json(result);
  } catch (e) { next(e); }
}

export async function disposeStock(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { qty, note } = QtySchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const it = await tx.inventoryItem.findUnique({ where: { id } });
      if (!it) throw new Error('Item not found');
      if (it.stock < qty) throw new Error('Insufficient stock to dispose');
      const updated = await tx.inventoryItem.update({ where: { id }, data: { stock: { decrement: qty } } });
      await recordTxn(tx, { itemId: id, type: 'DISPOSE', qty, note, userId: req.user?.sub });
      return updated;
    });
    res.json(result);
  } catch (e) { next(e); }
}

// ---------- Bulk / Export / Import ----------
const BulkSchema = z.object({
  ids: z.array(z.number().int()).min(1),
  action: z.enum(['ARCHIVE', 'UNARCHIVE', 'SET_CATEGORY', 'SET_SUPPLIER']),
  payload: z.any().optional()
});

export async function bulkAction(req, res, next) {
  try {
    const { ids, action, payload } = BulkSchema.parse(req.body);
    if (action === 'ARCHIVE') {
      await prisma.inventoryItem.updateMany({ where: { id: { in: ids } }, data: { status: 'ARCHIVED' } });
    } else if (action === 'UNARCHIVE') {
      await prisma.inventoryItem.updateMany({ where: { id: { in: ids } }, data: { status: 'ACTIVE' } });
    } else if (action === 'SET_CATEGORY') {
      await prisma.inventoryItem.updateMany({ where: { id: { in: ids } }, data: { category: String(payload?.category || '') } });
    } else if (action === 'SET_SUPPLIER') {
      await prisma.inventoryItem.updateMany({ where: { id: { in: ids } }, data: { supplierId: Number(payload?.supplierId) || null } });
    }
    await prisma.auditLog.create({ data: { action: `BULK_${action}`, entity: 'InventoryItem', meta: { ids, payload }, userId: req.user?.sub } });
    res.json({ ok: true, count: ids.length });
  } catch (e) { next(e); }
}

export async function exportItems(req, res, next) {
  try {
    const fmt = (req.query.format || 'csv').toString();
    const items = await prisma.inventoryItem.findMany({ include: { supplier: true } });
    const rows = items.map(i => ({
      id: i.id, name: i.name, sku: i.sku, category: i.category || '', unit: i.unit || 'pcs',
      stock: i.stock, issued: i.issued, lowStockThreshold: i.lowStockThreshold,
      location: i.location || '', status: i.status, supplier: i.supplier?.name || '',
      updatedAt: i.updatedAt
    }));
    if (fmt === 'xlsx') return sendXLSX(res, rows, 'inventory.xlsx');
    if (fmt === 'pdf') return sendPDF(res, rows, 'inventory.pdf');
    return sendCSV(res, rows, 'inventory.csv');
  } catch (e) { next(e); }
}

export async function importCsv(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const raw = fs.readFileSync(req.file.path, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    const idx = (k) => headers.indexOf(k);

    let count = 0;
    for (const line of dataLines) {
      const cols = line.split(',').map(c => c.trim());
      if (!cols.length) continue;

      const rec = {
        name: cols[idx('name')] || '',
        sku: cols[idx('sku')] || '',
        category: cols[idx('category')] || undefined,
        unit: cols[idx('unit')] || 'pcs',
        stock: Number(cols[idx('stock')] || 0),
        lowStockThreshold: Number(cols[idx('lowstockthreshold')] || 0),
        location: cols[idx('location')] || undefined,
        status: (cols[idx('status')] || 'ACTIVE').toUpperCase(),
        supplierName: cols[idx('supplier')] || ''
      };
      if (!rec.name || !rec.sku) continue;

      const supplier = rec.supplierName
        ? await prisma.supplier.upsert({ where: { name: rec.supplierName }, update: {}, create: { name: rec.supplierName } })
        : null;

      await prisma.inventoryItem.upsert({
        where: { sku: rec.sku },
        update: {
          name: rec.name, category: rec.category, unit: rec.unit,
          stock: rec.stock, lowStockThreshold: rec.lowStockThreshold,
          location: rec.location, status: rec.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
          supplierId: supplier?.id || null
        },
        create: {
          name: rec.name, sku: rec.sku, category: rec.category, unit: rec.unit,
          stock: rec.stock, lowStockThreshold: rec.lowStockThreshold,
          location: rec.location, status: rec.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
          supplierId: supplier?.id || null
        }
      });
      count++;
    }
    res.json({ imported: count });
  } catch (e) { next(e); }
}
