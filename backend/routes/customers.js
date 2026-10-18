const express = require('express');
const router = express.Router();
const { randomUUID: uuidv4 } = require('crypto');
const db = require('../db/database');
const { authMiddleware } = require('./auth');

// GET /api/customers - List all customers with search & filter
router.get('/', (req, res) => {
  let customers = db.getCollection('customers');
  const { search, vipTier, status } = req.query;

  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.activeRoom && c.activeRoom.includes(q))
    );
  }

  if (vipTier && vipTier !== 'all') {
    customers = customers.filter(c => c.vipTier.toLowerCase() === vipTier.toLowerCase());
  }

  if (status && status !== 'all') {
    customers = customers.filter(c => c.currentStatus.toLowerCase() === status.toLowerCase());
  }

  res.json({ success: true, count: customers.length, customers });
});

// GET /api/customers/:id - Detailed customer profile with booking & billing history
router.get('/:id', (req, res) => {
  const customer = db.findById('customers', req.params.id) ||
                   db.getCollection('customers').find(c => c.email === req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  // Get customer's bookings & invoices
  const bookings = db.getCollection('bookings').filter(b =>
    b.customerId === customer.id || b.customerEmail.toLowerCase() === customer.email.toLowerCase()
  );
  const invoices = db.getCollection('invoices').filter(i =>
    i.customerEmail.toLowerCase() === customer.email.toLowerCase()
  );

  res.json({
    success: true,
    customer: {
      ...customer,
      bookings,
      invoices
    }
  });
});

// POST /api/customers - Admin create customer
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const { name, email, phone, vipTier, notes, country } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  const customers = db.getCollection('customers');
  const existing = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'Customer with this email already exists' });
  }

  const newCust = {
    id: `cust_${uuidv4().slice(0, 8)}`,
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    vipTier: vipTier || 'Silver',
    loyaltyPoints: 500,
    totalStays: 0,
    totalSpent: 0,
    currentStatus: 'Inactive',
    activeRoom: null,
    country: country || 'International',
    notes: notes || 'Valued hotel patron'
  };

  db.insert('customers', newCust);
  res.status(201).json({ success: true, message: 'Customer record created', customer: newCust });
});

// PUT /api/customers/:id - Admin update customer
router.put('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const customer = db.findById('customers', req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  const updated = db.update('customers', req.params.id, req.body);
  res.json({ success: true, message: 'Customer details updated', customer: updated });
});

// DELETE /api/customers/:id - Admin delete customer
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const deleted = db.delete('customers', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  res.json({ success: true, message: 'Customer removed successfully' });
});

module.exports = router;
