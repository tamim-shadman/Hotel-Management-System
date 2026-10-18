const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID: uuidv4 } = require('crypto');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'aura_grand_super_luxury_secret_2026';

// Middleware to verify token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const users = db.getCollection('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userSafe } = user;
  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: userSafe
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  const users = db.getCollection('users');
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  // Security: Prevent unauthenticated privilege escalation to admin
  let userRole = 'customer';
  if (role === 'admin') {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (decoded.role === 'admin') userRole = 'admin';
      } catch (e) {
        userRole = 'customer';
      }
    }
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: `usr_${uuidv4().slice(0, 8)}`,
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: userRole,
    phone: phone || '',
    vipTier: userRole === 'customer' ? 'Silver' : undefined,
    loyaltyPoints: userRole === 'customer' ? 500 : undefined,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    createdAt: new Date().toISOString()
  };

  db.insert('users', newUser);

  // If registering as customer, also add to customers collection
  if (userRole === 'customer') {
    const customers = db.getCollection('customers');
    customers.push({
      id: `cust_${uuidv4().slice(0, 8)}`,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      vipTier: 'Silver',
      loyaltyPoints: 500,
      totalStays: 0,
      totalSpent: 0,
      currentStatus: 'Inactive',
      activeRoom: null,
      notes: 'Newly registered guest'
    });
    db.save();
  }

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userSafe } = newUser;
  res.status(201).json({
    success: true,
    message: 'Account registered successfully',
    token,
    user: userSafe
  });
});

// POST /api/auth/demo (Instant 1-click login for testing)
router.post('/demo', (req, res) => {
  const { role } = req.body;
  const users = db.getCollection('users');
  let user;

  if (role === 'admin') {
    user = users.find(u => u.role === 'admin');
  } else {
    user = users.find(u => u.role === 'customer');
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'Demo account not found' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userSafe } = user;
  res.json({
    success: true,
    message: `Logged in as demo ${user.role} (${user.name})`,
    token,
    user: userSafe
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const { password: _, ...userSafe } = user;
  res.json({ success: true, user: userSafe });
});

module.exports = { router, authMiddleware };
