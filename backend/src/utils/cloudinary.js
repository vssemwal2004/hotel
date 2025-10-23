import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'

// Configure cloudinary from env
export function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Missing Cloudinary env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  })
  return cloudinary
}

// Multer memory storage to stream to Cloudinary
export function memoryUploadFields() {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 12 } })
  return upload.fields([
    { name: 'covers', maxCount: 2 },
    { name: 'subPhotos', maxCount: 10 },
    { name: 'photos', maxCount: 10 } // legacy
  ])
}

export async function uploadBufferToCloudinary(buffer, filename, folder) {
  const cloud = configureCloudinary()
  return new Promise((resolve, reject) => {
    const stream = cloud.uploader.upload_stream({ folder, public_id: filename?.split('.')[0]?.toLowerCase()?.replace(/[^a-z0-9-_]/g,'') || undefined }, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
    stream.end(buffer)
  })
}

export async function deleteFromCloudinary(publicId) {
  const cloud = configureCloudinary()
  await cloud.uploader.destroy(publicId)
}
