import express from 'express'
import User from '../models/User.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = express.Router()

// Get all users (admin only)
router.get('/', authRequired, adminRequired, async (req, res, next) => {
  try {
    const { role, status } = req.query
    const filter = {}
    if (role) filter.role = role
    if (status) filter.status = status
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
    
    res.json({ users })
  } catch (e) {
    next(e)
  }
})

// Get single user (admin only)
router.get('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (e) {
    next(e)
  }
})

// Create new user/worker (admin only)
router.post('/', authRequired, adminRequired, async (req, res, next) => {
  try {
    const { name, email, password, role, phone, department } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    
    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      phone,
      department,
      status: 'active'
    })
    
    const userResponse = newUser.toObject()
    delete userResponse.password
    
    res.status(201).json({ user: userResponse, message: 'User created successfully' })
  } catch (e) {
    next(e)
  }
})

// Update user (admin only)
router.put('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const { name, email, role, phone, department, status, password } = req.body
    
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    // Check if email is being changed and already exists
    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' })
      }
      user.email = email.toLowerCase()
    }
    
    if (name) user.name = name
    if (role) user.role = role
    if (phone !== undefined) user.phone = phone
    if (department !== undefined) user.department = department
    if (status) user.status = status
    if (password && password.length >= 6) user.password = password
    
    await user.save()
    
    const userResponse = user.toObject()
    delete userResponse.password
    
    res.json({ user: userResponse, message: 'User updated successfully' })
  } catch (e) {
    next(e)
  }
})

// Delete user (admin only)
router.delete('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    
    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' })
    }
    
    await User.deleteOne({ _id: req.params.id })
    res.json({ message: 'User deleted successfully' })
  } catch (e) {
    next(e)
  }
})

export default router
