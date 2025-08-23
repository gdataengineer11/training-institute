// src/routes/students.routes.js (ESM example)
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// ensure uploads dir
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.resolve(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_')
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}-${safe}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
})

// POST /api/students/:id/documents  (form-data: file=<file>, title=<optional>)
router.post('/students/:id/documents', upload.single('file'), async (req, res) => {
  try {
    const studentId = Number(req.params.id)
    if (!req.file) return res.status(400).json({ error: 'file is required' })

    const title = req.body.title || req.file.originalname
    const doc = await prisma.studentDocument.create({
      data: {
        studentId,
        title,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`, // served statically below
      },
    })
    res.json(doc)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'upload failed' })
  }
})

export default router
