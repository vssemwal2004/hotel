import fs from 'fs'
import path from 'path'
import multer from 'multer'

export function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export function roomPhotosUpload() {
  const uploadDir = path.join(process.cwd(), 'uploads', 'rooms')
  ensureDirSync(uploadDir)
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname)
      const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase()
      cb(null, `${Date.now()}-${base}${ext}`)
    }
  })
  return multer({ storage, limits: { files: 5, fileSize: 5 * 1024 * 1024 } })
}

export function roomTypePhotosUpload() {
  const uploadDir = path.join(process.cwd(), 'uploads', 'roomtypes')
  ensureDirSync(uploadDir)
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname)
      const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase()
      cb(null, `${Date.now()}-${base}${ext}`)
    }
  })
  return multer({ storage, limits: { files: 5, fileSize: 5 * 1024 * 1024 } })
}
