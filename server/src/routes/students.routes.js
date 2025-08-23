import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// ensure uploads dir
const uploadsDir = path.resolve('uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_')
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}-${safe}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

// list students (light)
router.get('/', async (_req, res) => {
  const students = await prisma.student.findMany({ take: 50, orderBy: { id: 'desc' } })
  res.json(students)
})

// upload document
router.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    const studentId = Number(req.params.id)
    if (!req.file) return res.status(400).json({ error: 'file is required' })
    const title = req.body.title || req.file.originalname

    const doc = await prisma.studentDocument.create({
      data: {
        studentId,
        title,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
      },
    })
    res.json(doc)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'upload failed' })
  }
})

export default router
