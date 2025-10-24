import User from '../models/User.js'

export async function ensureAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admin'
  if (!email || !password) {
    console.warn('[seedAdmin] ADMIN_EMAIL/ADMIN_PASSWORD not set. Skipping admin seed.')
    return
  }
  const existing = await User.findOne({ email })
  if (!existing) {
    await User.create({ name, email, password, role: 'admin' })
    console.log(`[seedAdmin] Created admin user for ${email}`)
    return
  }
  // Ensure role is admin
  if (existing.role !== 'admin') {
    existing.role = 'admin'
    await existing.save()
    console.log(`[seedAdmin] Updated role to admin for ${email}`)
  } else {
    console.log('[seedAdmin] Admin user already exists')
  }
}
