import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import User from './models/User.js'

async function createTestUsers() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected!')

    // Delete existing test users if they exist
    await User.deleteMany({ email: { $in: ['test@example.com', 'admin@test.com', 'krishnahotelandrestaurants@gmail.com'] } })
    console.log('Cleaned up existing test users')

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    })
    console.log('✅ Created test user:', testUser.email, 'password: password123')

    // Create admin user from env
    const adminEmail = process.env.ADMIN_EMAIL || 'krishnahotelandrestaurants@gmail.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'hotelkrishna'
    
    const adminUser = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    })
    console.log('✅ Created admin user:', adminUser.email, 'password:', adminPassword)

    console.log('\n=== TEST CREDENTIALS ===')
    console.log('Regular User:')
    console.log('  Email: test@example.com')
    console.log('  Password: password123')
    console.log('\nAdmin User:')
    console.log('  Email:', adminEmail)
    console.log('  Password:', adminPassword)
    console.log('========================\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createTestUsers()
