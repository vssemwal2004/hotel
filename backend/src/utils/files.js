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

// Upload helper that supports separate cover photos and gallery photos.
export function roomTypeUploadFields() {
  const uploadDir = path.join(process.cwd(), 'uploads', 'roomtypes')
  ensureDirSync(uploadDir)
  const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir) },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname)
      const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase()
      cb(null, `${Date.now()}-${base}${ext}`)
    }
  })
  const upload = multer({ storage, limits: { files: 12, fileSize: 10 * 1024 * 1024 } })
  return upload.fields([
    { name: 'covers', maxCount: 2 },
    { name: 'subPhotos', maxCount: 10 },
    // Backward compatibility: some clients still send 'photos'
    { name: 'photos', maxCount: 10 }
  ])
}
