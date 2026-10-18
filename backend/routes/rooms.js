const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authMiddleware } = require('./auth');

// GET /api/rooms - List all rooms with filtering
router.get('/', (req, res) => {
  let rooms = db.getCollection('rooms');
  const { type, floor, status, minPrice, maxPrice, capacity } = req.query;

  if (type && type !== 'all') {
    rooms = rooms.filter(r => r.type.toLowerCase().includes(type.toLowerCase()));
  }
  if (floor && floor !== 'all') {
    rooms = rooms.filter(r => r.floor.toString() === floor.toString());
  }
  if (status && status !== 'all') {
    rooms = rooms.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }
  if (minPrice) {
    rooms = rooms.filter(r => r.pricePerNight >= Number(minPrice));
  }
  if (maxPrice) {
    rooms = rooms.filter(r => r.pricePerNight <= Number(maxPrice));
  }
  if (capacity) {
    rooms = rooms.filter(r => r.capacity >= Number(capacity));
  }

  res.json({ success: true, count: rooms.length, rooms });
});

// GET /api/rooms/vacant - Real-time Vacancy Checker (with date overlap detection)
router.get('/vacant', (req, res) => {
  const { checkIn, checkOut, guests, floor } = req.query;
  const allRooms = db.getCollection('rooms');
  const bookings = db.getCollection('bookings');

  // If specific dates are provided, find rooms that have NO conflicting active bookings
  let vacantRooms = allRooms.filter(room => {
    // Rooms under maintenance or cleaning are not immediately bookable
    if (room.status === 'Maintenance') return false;

    if (checkIn && checkOut) {
      const targetStart = new Date(checkIn).getTime();
      const targetEnd = new Date(checkOut).getTime();

      // Check if any confirmed/checked-in booking for this room overlaps
      const hasConflict = bookings.some(b => {
        if (b.roomId !== room.id && b.roomNumber !== room.roomNumber) return false;
        if (b.bookingStatus === 'Cancelled' || b.bookingStatus === 'Checked Out') return false;

        const bookingStart = new Date(b.checkInDate).getTime();
        const bookingEnd = new Date(b.checkOutDate).getTime();

        // Overlap condition: targetStart < bookingEnd && targetEnd > bookingStart
        return targetStart < bookingEnd && targetEnd > bookingStart;
      });

      return !hasConflict;
    }

    // Default: return rooms currently marked Available
    return room.status === 'Available';
  });

  if (guests) {
    vacantRooms = vacantRooms.filter(r => r.capacity >= Number(guests));
  }
  if (floor && floor !== 'all') {
    vacantRooms = vacantRooms.filter(r => r.floor.toString() === floor.toString());
  }

  res.json({
    success: true,
    totalVacant: vacantRooms.length,
    totalRooms: allRooms.length,
    occupancyRate: Math.round(((allRooms.length - vacantRooms.length) / allRooms.length) * 100),
    vacantRooms
  });
});

// GET /api/rooms/compare - Compare multiple rooms side by side
router.get('/compare', (req, res) => {
  const { ids } = req.query;
  const allRooms = db.getCollection('rooms');
  if (!ids) {
    return res.json({ success: true, count: allRooms.length, rooms: allRooms });
  }

  const idList = ids.split(',').map(id => id.trim());
  const comparedRooms = allRooms.filter(r => idList.includes(r.id) || idList.includes(r.roomNumber));

  res.json({
    success: true,
    count: comparedRooms.length,
    rooms: comparedRooms
  });
});

// GET /api/rooms/:id - Single room details
router.get('/:id', (req, res) => {
  const room = db.findById('rooms', req.params.id) ||
               db.getCollection('rooms').find(r => r.roomNumber === req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  // Include reviews for this room type
  const reviews = db.getCollection('reviews').filter(rv => rv.room.includes(room.type) || rv.room === room.name);
  res.json({ success: true, room: { ...room, reviews } });
});

// POST /api/rooms - Admin add room
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admin authority required' });
  }

  const {
    roomNumber, floor, name, type, pricePerNight, capacity, bedType, sizeSqFt, view, image, description, amenities
  } = req.body;

  if (!roomNumber || !name || !pricePerNight) {
    return res.status(400).json({ success: false, message: 'Room number, name, and price are required' });
  }

  // Check unique room number
  const existing = db.getCollection('rooms').find(r => r.roomNumber === roomNumber);
  if (existing) {
    return res.status(409).json({ success: false, message: `Room ${roomNumber} already exists` });
  }

  const newRoom = {
    id: `rm_${uuidv4().slice(0, 8)}`,
    roomNumber,
    floor: Number(floor) || 1,
    name,
    type: type || 'Deluxe Suite',
    pricePerNight: Number(pricePerNight),
    capacity: Number(capacity) || 2,
    bedType: bedType || 'King Bed',
    sizeSqFt: Number(sizeSqFt) || 500,
    view: view || 'Garden View',
    status: 'Available',
    rating: 5.0,
    reviewCount: 0,
    image: image || '/assets/images/ocean_deluxe.jpg',
    featured: false,
    description: description || 'Luxurious accommodations tailored for pure relaxation.',
    amenities: amenities || ['High-Speed Wi-Fi', 'Smart TV', 'Rain Shower', 'Mini Bar']
  };

  db.insert('rooms', newRoom);
  res.status(201).json({ success: true, message: 'Room added successfully', room: newRoom });
});

// PUT /api/rooms/:id - Admin update room
router.put('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admin authority required' });
  }

  const room = db.findById('rooms', req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  const updated = db.update('rooms', req.params.id, req.body);
  res.json({ success: true, message: 'Room updated successfully', room: updated });
});

// DELETE /api/rooms/:id - Admin delete room
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admin authority required' });
  }

  const deleted = db.delete('rooms', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }
  res.json({ success: true, message: 'Room deleted successfully' });
});


// POST /api/rooms/bulk-status - Bulk update room operational statuses (e.g. Housekeeping Dispatch)
router.post('/bulk-status', (req, res) => {
  const { fromStatus, toStatus, floor } = req.body;
  if (!toStatus) {
    return res.status(400).json({ success: false, message: 'toStatus is required' });
  }

  const rooms = db.getCollection('rooms');
  let updatedCount = 0;

  rooms.forEach(room => {
    if (fromStatus && room.status.toLowerCase() !== fromStatus.toLowerCase()) return;
    if (floor && floor !== 'all' && room.floor.toString() !== floor.toString()) return;

    room.status = toStatus;
    updatedCount++;
  });

  db.save();
  if (db.logActivity) {
    db.logActivity('BULK_STATUS_UPDATE', `Updated ${updatedCount} rooms from '${fromStatus || 'any'}' to '${toStatus}'`, 'Admin');
  }

  res.json({
    success: true,
    message: `Updated ${updatedCount} room(s) to status '${toStatus}'`,
    updatedCount
  });
});

module.exports = router;
