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
  // Ensure role is admin; optionally rotate password if env changed
  let changed = false
  if (existing.role !== 'admin') {
    existing.role = 'admin'
    changed = true
  }
  if (password && (await existing.comparePassword(password)) === false) {
    existing.password = password
    changed = true
  }
  if (changed) {
    await existing.save()
    console.log(`[seedAdmin] Updated admin user for ${email}`)
  } else {
    console.log('[seedAdmin] Admin user already up to date')
  }
}
