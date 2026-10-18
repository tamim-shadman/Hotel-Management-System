const express = require('express');
const router = express.Router();
const { randomUUID: uuidv4 } = require('crypto');
const db = require('../db/database');
const { authMiddleware } = require('./auth');

// GET /api/billing/invoices - List invoices with filtering
router.get('/invoices', (req, res) => {
  let invoices = db.getCollection('invoices');
  const { status, search, email } = req.query;

  if (status && status !== 'all') {
    invoices = invoices.filter(i => i.paymentStatus.toLowerCase() === status.toLowerCase());
  }

  if (email) {
    invoices = invoices.filter(i => i.customerEmail.toLowerCase() === email.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    invoices = invoices.filter(i =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.customerName.toLowerCase().includes(q) ||
      i.customerEmail.toLowerCase().includes(q) ||
      (i.bookingRef && i.bookingRef.toLowerCase().includes(q)) ||
      (i.roomNumber && i.roomNumber.includes(q))
    );
  }

  // Descending order
  invoices = [...invoices].reverse();
  res.json({ success: true, count: invoices.length, invoices });
});

// GET /api/billing/invoices/:id
router.get('/invoices/:id', (req, res) => {
  const invoice = db.findById('invoices', req.params.id) ||
                  db.getCollection('invoices').find(i => i.invoiceNumber === req.params.id);

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  res.json({ success: true, invoice });
});

// GET /api/billing/stats - Revenue & Financial analytics
router.get('/stats', (req, res) => {
  const invoices = db.getCollection('invoices');
  const totalRevenue = invoices.reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);
  const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const outstandingBalance = invoices.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);
  const paidCount = invoices.filter(i => i.paymentStatus === 'Paid').length;
  const pendingCount = invoices.filter(i => i.paymentStatus === 'Pending').length;

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalInvoiced,
      outstandingBalance,
      invoiceCount: invoices.length,
      paidCount,
      pendingCount,
      avgTransaction: invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0
    }
  });
});

// POST /api/billing/invoices - Admin generate custom invoice
router.post('/invoices', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const { customerName, customerEmail, roomNumber, lineItems, paymentMethod, paymentStatus } = req.body;
  if (!customerName || !lineItems || !lineItems.length) {
    return res.status(400).json({ success: false, message: 'Customer name and line items are required' });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const tax = Math.round(subtotal * 0.10 * 100) / 100;
  const totalAmount = Math.round((subtotal + tax) * 100) / 100;
  const isPaid = paymentStatus === 'Paid';

  const newInvoice = {
    id: `inv_${uuidv4().slice(0, 8)}`,
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    bookingId: null,
    bookingRef: `MANUAL-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName,
    customerEmail: (customerEmail || '').toLowerCase(),
    roomNumber: roomNumber || 'N/A',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lineItems: [
      ...lineItems,
      { description: 'Luxury Hospitality & Service Tax (10%)', amount: tax }
    ],
    subtotal,
    tax,
    discount: 0,
    totalAmount,
    amountPaid: isPaid ? totalAmount : 0,
    balanceDue: isPaid ? 0 : totalAmount,
    paymentMethod: paymentMethod || 'Corporate Account / Wire',
    paymentStatus: isPaid ? 'Paid' : 'Pending',
    transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`
  };

  db.insert('invoices', newInvoice);
  res.status(201).json({ success: true, message: 'Invoice created successfully', invoice: newInvoice });
});

// PUT /api/billing/invoices/:id/settle - Settle invoice
router.put('/invoices/:id/settle', authMiddleware, (req, res) => {
  const invoice = db.findById('invoices', req.params.id) ||
                  db.getCollection('invoices').find(i => i.invoiceNumber === req.params.id);

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  invoice.amountPaid = invoice.totalAmount;
  invoice.balanceDue = 0;
  invoice.paymentStatus = 'Paid';
  invoice.settledAt = new Date().toISOString();
  if (req.body.paymentMethod) invoice.paymentMethod = req.body.paymentMethod;

  db.save();
  res.json({ success: true, message: 'Invoice settled in full', invoice });
});

// GET /api/billing/currencies - Supported currencies & live exchange rates
router.get('/currencies', (req, res) => {
  res.json({
    success: true,
    base: 'USD',
    rates: {
      USD: { symbol: '$', rate: 1.0, name: 'US Dollar' },
      EUR: { symbol: '€', rate: 0.92, name: 'Euro' },
      GBP: { symbol: '£', rate: 0.79, name: 'British Pound' },
      AED: { symbol: 'AED ', rate: 3.67, name: 'UAE Dirham' },
      CHF: { symbol: 'CHF ', rate: 0.89, name: 'Swiss Franc' },
      JPY: { symbol: '¥', rate: 154.50, name: 'Japanese Yen' },
      BDT: { symbol: '৳', rate: 122.50, name: 'Bangladeshi Taka' }
    }
  });
});

// GET /api/billing/export - Export accounting folios to CSV or JSON
router.get('/export', (req, res) => {
  const invoices = db.getCollection('invoices');
  const format = req.query.format || 'json';

  if (format === 'csv') {
    const sanitize = (val) => {
      let str = String(val === undefined || val === null ? '' : val);
      str = str.replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const headers = [
      'InvoiceNumber', 'GuestName', 'Email', 'RoomNumber', 'IssueDate', 'DueDate',
      'Subtotal', 'Tax', 'Discount', 'TotalAmount', 'AmountPaid', 'BalanceDue',
      'PaymentMethod', 'PaymentStatus', 'TransactionID'
    ].join(',') + '\n';

    const rows = invoices.map(i => [
      sanitize(i.invoiceNumber),
      sanitize(i.customerName),
      sanitize(i.customerEmail),
      sanitize(i.roomNumber),
      sanitize(i.issueDate),
      sanitize(i.dueDate),
      Number(i.subtotal) || 0,
      Number(i.tax) || 0,
      Number(i.discount) || 0,
      Number(i.totalAmount) || 0,
      Number(i.amountPaid) || 0,
      Number(i.balanceDue) || 0,
      sanitize(i.paymentMethod),
      sanitize(i.paymentStatus),
      sanitize(i.transactionId)
    ].join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="aura_grand_financial_audit.csv"');
    return res.send(headers + rows);
  }

  res.json({
    success: true,
    exportDate: new Date().toISOString(),
    totalInvoices: invoices.length,
    invoices
  });
});

module.exports = router;
