const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authMiddleware } = require('./auth');

// Helper to calculate nights between two dates
function calculateNights(checkIn, checkOut) {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 <= d1) {
    return 1;
  }
  const diffDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1);
}

// GET /api/bookings - List all bookings
router.get('/', (req, res) => {
  let bookings = db.getCollection('bookings');
  const { status, email, search } = req.query;

  if (status && status !== 'all') {
    bookings = bookings.filter(b => b.bookingStatus.toLowerCase() === status.toLowerCase());
  }

  if (email) {
    bookings = bookings.filter(b => b.customerEmail.toLowerCase() === email.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    bookings = bookings.filter(b =>
      b.bookingRef.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerEmail.toLowerCase().includes(q) ||
      b.roomNumber.includes(q)
    );
  }

  // Sort descending by date
  bookings = [...bookings].reverse();
  res.json({ success: true, count: bookings.length, bookings });
});

// GET /api/bookings/:idOrRef - Get single booking details
router.get('/:idOrRef', (req, res) => {
  const param = req.params.idOrRef;
  const booking = db.findById('bookings', param) ||
                  db.getCollection('bookings').find(b => b.bookingRef === param);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const room = db.findById('rooms', booking.roomId) ||
               db.getCollection('rooms').find(r => r.roomNumber === booking.roomNumber);
  const invoice = db.findById('invoices', booking.invoiceId) ||
                  db.getCollection('invoices').find(i => i.bookingRef === booking.bookingRef);

  res.json({ success: true, booking, room, invoice });
});

// POST /api/bookings - Create new reservation
router.post('/', (req, res) => {
  const {
    roomId,
    checkInDate,
    checkOutDate,
    guests,
    guestName,
    guestEmail,
    guestPhone,
    selectedServices, // Array of { id, name, price, quantity }
    specialRequests,
    promoCode,
    paymentMethod,
    autoCheckIn
  } = req.body;

  if (!roomId || !checkInDate || !checkOutDate || !guestName || !guestEmail) {
    return res.status(400).json({
      success: false,
      message: 'Room, dates, guest name, and guest email are required'
    });
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid check-in or check-out date format' });
  }
  if (end <= start) {
    return res.status(400).json({ success: false, message: 'Check-out date must be strictly after check-in date' });
  }

  const room = db.findById('rooms', roomId) ||
               db.getCollection('rooms').find(r => r.roomNumber === roomId);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Selected room not found' });
  }

  // Double-booking collision detection across active reservations
  const targetStart = start.getTime();
  const targetEnd = end.getTime();
  const existingBookings = db.getCollection('bookings');
  const hasConflict = existingBookings.some(b => {
    if (b.roomId !== room.id && b.roomNumber !== room.roomNumber) return false;
    if (b.bookingStatus === 'Cancelled' || b.bookingStatus === 'Checked Out') return false;

    const bStart = new Date(b.checkInDate).getTime();
    const bEnd = new Date(b.checkOutDate).getTime();
    return targetStart < bEnd && targetEnd > bStart;
  });

  if (hasConflict) {
    return res.status(409).json({
      success: false,
      message: `Suite ${room.roomNumber} (${room.name}) is already reserved for the selected dates. Please choose an alternative suite or date range.`
    });
  }

  const nights = calculateNights(checkInDate, checkOutDate);
  const roomSubtotal = room.pricePerNight * nights;

  // Process services with sanitized positive quantities
  let servicesSubtotal = 0;
  const processedServices = [];
  if (Array.isArray(selectedServices)) {
    selectedServices.forEach(item => {
      const srv = db.findById('services', item.id) || item;
      const qty = Math.max(1, Math.min(Number(item.quantity) || 1, 20));
      const sub = (Number(srv.price) || 0) * qty;
      servicesSubtotal += sub;
      processedServices.push({
        id: srv.id,
        name: srv.name,
        price: Number(srv.price) || 0,
        quantity: qty,
        subtotal: sub
      });
    });
  }

  // Calculate discount
  let discountAmount = 0;
  if (promoCode) {
    const code = promoCode.toUpperCase().trim();
    if (code === 'ROYAL10') {
      discountAmount = Math.round((roomSubtotal + servicesSubtotal) * 0.10);
    } else if (code === 'WELCOME15') {
      discountAmount = Math.round((roomSubtotal + servicesSubtotal) * 0.15);
    } else if (code === 'VIP20') {
      discountAmount = Math.round((roomSubtotal + servicesSubtotal) * 0.20);
    }
  }

  // Tax calculation (10% hospitality & city tourism tax)
  const taxable = Math.max(0, roomSubtotal + servicesSubtotal - discountAmount);
  const taxAmount = Math.round(taxable * 0.10 * 100) / 100;
  const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;

  // Generate Booking Reference & Invoice ID
  const bookingId = `bk_${uuidv4().slice(0, 8)}`;
  const bookingRef = `AGH-${Math.floor(10000 + Math.random() * 90000)}`;
  const invoiceId = `inv_${uuidv4().slice(0, 8)}`;
  const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const bookingStatus = autoCheckIn ? 'Checked In' : 'Confirmed';

  const newBooking = {
    id: bookingId,
    bookingRef,
    customerId: req.body.customerId || `cust_${uuidv4().slice(0, 6)}`,
    customerName: guestName,
    customerEmail: guestEmail.toLowerCase(),
    customerPhone: guestPhone || '',
    roomId: room.id,
    roomNumber: room.roomNumber,
    roomName: room.name,
    roomType: room.type,
    pricePerNight: room.pricePerNight,
    checkInDate,
    checkOutDate,
    nights,
    guests: Number(guests) || 1,
    selectedServices: processedServices,
    roomSubtotal,
    servicesSubtotal,
    taxAmount,
    discountAmount,
    grandTotal,
    paymentStatus: 'Paid',
    bookingStatus,
    specialRequests: specialRequests || '',
    createdAt: new Date().toISOString(),
    invoiceId
  };

  db.insert('bookings', newBooking);

  // Generate itemized invoice
  const lineItems = [
    {
      description: `${room.name} (${nights} night${nights > 1 ? 's' : ''} @ $${room.pricePerNight}/night)`,
      amount: roomSubtotal
    }
  ];

  processedServices.forEach(s => {
    lineItems.push({
      description: `${s.name} (${s.quantity}x)`,
      amount: s.subtotal
    });
  });

  if (discountAmount > 0) {
    lineItems.push({
      description: `Promotional Privilege Discount (${promoCode || 'PROMO'})`,
      amount: -discountAmount
    });
  }

  lineItems.push({
    description: 'Luxury Hospitality Tax & City Tourism Fee (10%)',
    amount: taxAmount
  });

  const newInvoice = {
    id: invoiceId,
    invoiceNumber,
    bookingId,
    bookingRef,
    customerName: guestName,
    customerEmail: guestEmail.toLowerCase(),
    roomNumber: room.roomNumber,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: checkOutDate,
    lineItems,
    subtotal: roomSubtotal + servicesSubtotal,
    tax: taxAmount,
    discount: discountAmount,
    totalAmount: grandTotal,
    amountPaid: grandTotal,
    balanceDue: 0,
    paymentMethod: paymentMethod || 'Credit Card (Instant Online Guarantee)',
    paymentStatus: 'Paid',
    transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`
  };

  db.insert('invoices', newInvoice);

  // Update room status
  db.update('rooms', room.id, {
    status: autoCheckIn ? 'Occupied' : 'Reserved'
  });

  // Sync or create customer record
  const customers = db.getCollection('customers');
  let customer = customers.find(c => c.email.toLowerCase() === guestEmail.toLowerCase());
  if (customer) {
    customer.totalStays = (customer.totalStays || 0) + 1;
    customer.totalSpent = (customer.totalSpent || 0) + grandTotal;
    customer.loyaltyPoints = (customer.loyaltyPoints || 0) + Math.round(grandTotal * 0.1);
    customer.currentStatus = autoCheckIn ? 'Checked In' : 'Reserved';
    customer.activeRoom = room.roomNumber;
    db.save();
  } else {
    db.insert('customers', {
      id: `cust_${uuidv4().slice(0, 8)}`,
      name: guestName,
      email: guestEmail.toLowerCase(),
      phone: guestPhone || '',
      vipTier: grandTotal > 3000 ? 'Platinum' : grandTotal > 1000 ? 'Gold' : 'Silver',
      loyaltyPoints: Math.round(grandTotal * 0.1),
      totalStays: 1,
      totalSpent: grandTotal,
      currentStatus: autoCheckIn ? 'Checked In' : 'Reserved',
      activeRoom: room.roomNumber,
      country: 'International',
      notes: specialRequests || 'Recent online reservation'
    });
  }

  if (db.logActivity) {
    db.logActivity('BOOKING_CREATED', `Reservation confirmed for ${guestName} (${room.name}, Rm ${room.roomNumber}) - Total: $${grandTotal}`, guestName);
  }

  res.status(201).json({
    success: true,
    message: `Reservation confirmed! Booking Reference: ${bookingRef}`,
    booking: newBooking,
    invoice: newInvoice
  });
});

// POST /api/bookings/:idOrRef/checkout - Express Checkout Handler
router.post('/:idOrRef/checkout', (req, res) => {
  const param = req.params.idOrRef;
  const booking = db.findById('bookings', param) ||
                  db.getCollection('bookings').find(b => b.bookingRef === param);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (booking.bookingStatus === 'Checked Out') {
    return res.status(400).json({ success: false, message: 'This guest has already checked out' });
  }

  const { paymentMethod, rating, comment } = req.body;

  // Update booking status
  booking.bookingStatus = 'Checked Out';
  booking.checkedOutAt = new Date().toISOString();

  // Mark room as "Cleaning" so housekeeping can inspect and prepare
  const rooms = db.getCollection('rooms');
  const room = rooms.find(r => r.id === booking.roomId || r.roomNumber === booking.roomNumber);
  if (room) {
    room.status = 'Cleaning';
  }

  // Update invoice
  let invoice = db.findById('invoices', booking.invoiceId) ||
                db.getCollection('invoices').find(i => i.bookingRef === booking.bookingRef);
  if (invoice) {
    invoice.balanceDue = 0;
    invoice.amountPaid = invoice.totalAmount;
    invoice.paymentStatus = 'Paid';
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
  }

  // Update customer record
  const customers = db.getCollection('customers');
  const customer = customers.find(c => c.email.toLowerCase() === booking.customerEmail.toLowerCase());
  if (customer) {
    customer.currentStatus = 'Checked Out';
    customer.activeRoom = null;
  }

  // Add review if provided
  if (rating) {
    const reviews = db.getCollection('reviews');
    reviews.push({
      id: `rev_${uuidv4().slice(0, 8)}`,
      customerName: booking.customerName,
      rating: Number(rating) || 5,
      date: new Date().toISOString().split('T')[0],
      room: booking.roomName,
      comment: comment || 'Smooth and delightful stay at Aura Grand!'
    });
  }

  db.save();

  if (db.logActivity) {
    db.logActivity('CHECKOUT_COMPLETED', `Express checkout completed for ${booking.customerName} (Room ${booking.roomNumber}). Room dispatched to Housekeeping.`, booking.customerName);
  }

  res.json({
    success: true,
    message: `Check-out completed for ${booking.customerName}. Room ${booking.roomNumber} dispatched to Housekeeping.`,
    booking,
    invoice,
    roomStatus: room ? room.status : 'Cleaning'
  });
});

// PUT /api/bookings/:idOrRef/status - Admin status update (Check In / Cancel / etc.)
router.put('/:idOrRef/status', authMiddleware, (req, res) => {
  const param = req.params.idOrRef;
  const { status } = req.body;
  const booking = db.findById('bookings', param) ||
                  db.getCollection('bookings').find(b => b.bookingRef === param);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  booking.bookingStatus = status;

  const room = db.findById('rooms', booking.roomId) ||
               db.getCollection('rooms').find(r => r.roomNumber === booking.roomNumber);

  if (room) {
    if (status === 'Checked In') {
      room.status = 'Occupied';
    } else if (status === 'Checked Out') {
      room.status = 'Cleaning';
    } else if (status === 'Cancelled') {
      room.status = 'Available';
    }
  }

  db.save();
  res.json({ success: true, message: `Booking status changed to ${status}`, booking });
});

module.exports = router;
