const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authMiddleware } = require('./auth');

// GET /api/services - List all hotel services
router.get('/', (req, res) => {
  let services = db.getCollection('services');
  const { category, popular } = req.query;

  if (category && category !== 'all') {
    services = services.filter(s => s.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (popular === 'true') {
    services = services.filter(s => s.popular);
  }

  res.json({ success: true, count: services.length, services });
});


// POST /api/services/order - Order a service to an active booking or guest
router.post('/order', (req, res) => {
  const { serviceId, bookingRef, roomNumber, guestName, guestEmail, quantity, specialNotes } = req.body;

  if (!serviceId) {
    return res.status(400).json({ success: false, message: 'Service ID is required' });
  }

  const service = db.findById('services', serviceId);
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  const qty = Math.max(1, Math.min(Number(quantity) || 1, 50));
  const totalCharge = service.price * qty;

  // If a bookingRef is provided, append this service to the booking and update invoice
  if (bookingRef) {
    const bookings = db.getCollection('bookings');
    const booking = bookings.find(b => b.bookingRef === bookingRef);
    if (booking) {
      if (!booking.selectedServices) booking.selectedServices = [];
      booking.selectedServices.push({
        id: service.id,
        name: service.name,
        price: service.price,
        quantity: qty,
        subtotal: totalCharge,
        orderedAt: new Date().toISOString()
      });
      booking.servicesSubtotal = (booking.servicesSubtotal || 0) + totalCharge;
      booking.grandTotal = booking.roomSubtotal + booking.servicesSubtotal + booking.taxAmount - (booking.discountAmount || 0);

      // Also update linked invoice if exists
      if (booking.invoiceId) {
        const invoice = db.findById('invoices', booking.invoiceId);
        if (invoice) {
          invoice.lineItems.push({
            description: `${service.name} (${qty}x)`,
            amount: totalCharge
          });
          invoice.subtotal += totalCharge;
          invoice.totalAmount += totalCharge;
          invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
          if (invoice.balanceDue > 0) {
            invoice.paymentStatus = 'Pending';
          }
        }
      }

      db.save();
    }
  }

  if (db.logActivity) {
    db.logActivity('SERVICE_ORDERED', `Ordered: ${service.name} (${qty}x) for ${guestName || 'Guest'} (Room ${roomNumber || 'Folio'}) - $${totalCharge}`, guestName || 'Guest');
  }

  res.json({
    success: true,
    message: `Order confirmed for ${service.name} (${qty}x) - $${totalCharge}`,
    order: {
      orderId: `SRV-${uuidv4().slice(0, 6).toUpperCase()}`,
      serviceName: service.name,
      quantity: qty,
      totalCharge,
      roomNumber: roomNumber || 'On Folio',
      guestName: guestName || 'Hotel Guest',
      status: 'Confirmed & Dispatched to Service Department'
    }
  });
});

// POST /api/services - Admin add service
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const { name, category, description, price, unit, duration, image, icon } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }

  const newService = {
    id: `srv_${uuidv4().slice(0, 8)}`,
    code: `SRV-${name.slice(0, 4).toUpperCase()}`,
    name,
    category: category || 'Wellness & Spa',
    description: description || 'Premium hotel service experience.',
    price: Number(price),
    unit: unit || 'per session',
    duration: duration || '60 mins',
    image: image || '/assets/images/luxury_spa.jpg',
    icon: icon || 'stars',
    popular: false
  };

  db.insert('services', newService);
  res.status(201).json({ success: true, message: 'Service added successfully', service: newService });
});

// PUT /api/services/:id - Admin update service
router.put('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const updated = db.update('services', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, message: 'Service updated successfully', service: updated });
});

// DELETE /api/services/:id - Admin delete service
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin authority required' });
  }

  const deleted = db.delete('services', req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, message: 'Service removed successfully' });
});

// POST /api/services/ai-concierge - 24/7 Virtual Luxury Butler & AI Concierge
router.post('/ai-concierge', (req, res) => {
  const { query, customerName } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Inquiry query is required' });
  }

  const q = query.toLowerCase();
  const guest = customerName || 'Esteemed Guest';

  let reply = '';
  let suggestion = null;

  if (q.includes('champagne') || q.includes('caviar') || q.includes('dinner') || q.includes('food') || q.includes('dining') || q.includes('michelin') || q.includes('eat') || q.includes('room service')) {
    reply = `Good evening, ${guest}. Our culinary brigade, led by Chef Laurent Beaulieu, would be honored to prepare an exceptional dining experience. We currently recommend our signature 'Michelin In-Suite Private Dining' or the 'Royal Imperial Ossetra Caviar Tasting' paired with chilled Dom Pérignon. Shall I dispatch this order to your suite?`;
    suggestion = {
      action: 'order_service',
      serviceId: 'srv_caviar',
      title: 'Royal Imperial Caviar Service',
      price: '$450'
    };
  } else if (q.includes('spa') || q.includes('massage') || q.includes('hammam') || q.includes('facial') || q.includes('wellness') || q.includes('relax')) {
    reply = `Welcome to serenity, ${guest}. The Auric Sanctuary Spa offers bespoke restorative therapies. May I recommend our acclaimed '24K Gold Rejuvenation Hammam & Body Polish' (90 mins), complete with eucalyptus steam and private thermal plunge pools.`;
    suggestion = {
      action: 'order_service',
      serviceId: 'srv_gold_spa',
      title: '24K Gold Rejuvenation Hammam',
      price: '$380'
    };
  } else if (q.includes('car') || q.includes('maybach') || q.includes('transfer') || q.includes('helicopter') || q.includes('airport') || q.includes('chauffeur') || q.includes('flight')) {
    reply = `Travel in unmatched distinction, ${guest}. Aura Grand offers complimentary Mercedes-Maybach S-Class transfers for all Penthouse bookings, as well as private twin-engine helicopter charters directly to the rooftop helipad (15-minute coastal transfer to the international terminal).`;
    suggestion = {
      action: 'order_service',
      serviceId: 'srv_heli',
      title: 'Private Helicopter Coastal Charter',
      price: '$1,200'
    };
  } else if (q.includes('checkout') || q.includes('check out') || q.includes('late checkout') || q.includes('leave') || q.includes('bill') || q.includes('folio')) {
    reply = `${guest}, you may settle your folio with contactless express checkout directly via your Guest Portal. As a valued resident, guaranteed 4:00 PM late checkout is available upon request with the Chief Butler.`;
    suggestion = {
      action: 'navigate_tab',
      tab: 'user-checkout',
      title: 'Open Express Checkout & Folio'
    };
  } else if (q.includes('suite') || q.includes('room') || q.includes('penthouse') || q.includes('ocean') || q.includes('vacant') || q.includes('upgrade') || q.includes('book')) {
    reply = `We have curated 8 bespoke residences. Our crown jewel, 'The Imperial Presidential Penthouse' (Suite 501, 1,850 sq.ft with private infinity jacuzzi and dedicated 24/7 butler), offers panoramic oceanfront vistas. You may explore real-time suite vacancies right now.`;
    suggestion = {
      action: 'navigate_tab',
      tab: 'user-rooms',
      title: 'View Exclusive Suites Collection'
    };
  } else if (q.includes('wifi') || q.includes('internet') || q.includes('pool') || q.includes('gym') || q.includes('hours') || q.includes('breakfast')) {
    reply = `Complimentary ultra-high-speed Wi-Fi (1 Gbps) is connected throughout the resort on network 'AURA-GRAND-RESIDENT'. The 50th-floor Rooftop Infinity Pool is accessible 06:00 to 23:00. In-Suite Champagne Breakfast is served around the clock at your convenience.`;
    suggestion = {
      action: 'navigate_tab',
      tab: 'user-stay',
      title: 'View In-Room Digital Keycard'
    };
  } else {
    reply = `At your service, ${guest}. As your 24/7 dedicated Virtual Luxury Concierge, I can arrange Michelin dining, book helicopter transfers, schedule wellness treatments at the Auric Spa, or tailor your reservation. How may I elevate your stay at Aura Grand today?`;
    suggestion = {
      action: 'navigate_tab',
      tab: 'user-services',
      title: 'Browse All Lavish Services'
    };
  }

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    concierge: {
      name: 'Aura AI Virtual Butler',
      title: 'Head of Resident Services & Luxury Concierge',
      reply,
      suggestion
    }
  });
});

// GET /api/services/iot-ambience - Stateroom Sensory & In-Room Atmosphere Telemetry
router.get('/iot-ambience', (req, res) => {
  let ambience = db.data.roomAmbience;
  if (!ambience) {
    ambience = {
      roomNumber: '501',
      activePreset: 'Circadian Dawn Awakening',
      temperatureC: 20.5,
      humidityPercentage: 48,
      airQualityIndex: 'AQI 002 (Pristine Alpine Grade)',
      lighting: {
        mode: 'Circadian Sunlight',
        colorTempK: 4200,
        brightnessPercentage: 75,
        rgbHex: '#ffe8a3'
      },
      aromatherapy: {
        activeOil: 'Bergamot & Sweet Orange Essential Mist',
        intensityLevel: 'Gentle (Level 2/5)',
        status: 'Diffusing'
      },
      soundscape: {
        title: 'Morning Songbirds & Aegean Shoreline',
        frequency: '432 Hz Healing Harmony',
        volumePercentage: 35,
        status: 'Playing'
      },
      updatedAt: new Date().toISOString()
    };
    db.data.roomAmbience = ambience;
    db.save();
  }

  const presets = [
    {
      id: 'preset_dawn',
      name: 'Circadian Dawn Awakening',
      icon: '🌅',
      colorTemp: '4,200K Sunrise Gold',
      lightingColor: '#ffd79d',
      aroma: 'Bergamot & Sweet Orange',
      sound: 'Morning Songbirds & Aegean Waves',
      temp: '21.0°C',
      desc: 'Mimics natural Mediterranean sunrise light to gently stimulate cortisol awakening and circadian harmony.'
    },
    {
      id: 'preset_dusk',
      name: 'Mediterranean Dusk Twilight',
      icon: '🌊',
      colorTemp: '2,700K Deep Amber',
      lightingColor: '#f59e0b',
      aroma: 'Oud & Marine Driftwood',
      sound: 'Gentle Ocean Swells & Acoustic Cello',
      temp: '20.0°C',
      desc: 'Warm golden hour ambiance designed for evening champagne cocktails and serene ocean gazing.'
    },
    {
      id: 'preset_candlelight',
      name: 'Candlelight Starlight Romance',
      icon: '🕯️',
      colorTemp: '1,800K Ultra-Warm Glow',
      lightingColor: '#f97316',
      aroma: 'Bulgarian Rose & Royal Sandalwood',
      sound: 'Bang & Olufsen Velvet Harp Ensemble',
      temp: '20.5°C',
      desc: 'Soft intimate starlight luminescence with calming floral and wood botanical infusions.'
    },
    {
      id: 'preset_sleep',
      name: 'Obsidian Deep REM Sleep',
      icon: '🌙',
      colorTemp: '0% Blue Light Infrared',
      lightingColor: '#3b0764',
      aroma: 'French Lavender & Roman Chamomile',
      sound: 'Binaural Theta Delta Sleep Waves',
      temp: '18.5°C',
      desc: 'Scientific sleep optimization chamber: zero blue light, therapeutic coolness, and delta-wave sleep induction.'
    }
  ];

  res.json({
    success: true,
    telemetry: ambience,
    presets
  });
});

// POST /api/services/iot-ambience/tune - Adjust In-Room Sensory Environment Live
router.post('/iot-ambience/tune', (req, res) => {
  const { presetName, temperatureC, colorTempK, brightnessPercentage, aroma, soundscape } = req.body;

  db.data.roomAmbience = {
    ...db.data.roomAmbience,
    activePreset: presetName || db.data.roomAmbience.activePreset,
    temperatureC: temperatureC ? Number(temperatureC) : db.data.roomAmbience.temperatureC,
    lighting: {
      ...db.data.roomAmbience.lighting,
      colorTempK: colorTempK || db.data.roomAmbience.lighting.colorTempK,
      brightnessPercentage: brightnessPercentage || db.data.roomAmbience.lighting.brightnessPercentage
    },
    aromatherapy: {
      ...db.data.roomAmbience.aromatherapy,
      activeOil: aroma || db.data.roomAmbience.aromatherapy.activeOil
    },
    soundscape: {
      ...db.data.roomAmbience.soundscape,
      title: soundscape || db.data.roomAmbience.soundscape.title
    },
    updatedAt: new Date().toISOString()
  };
  db.save();

  if (db.logActivity) {
    db.logActivity(
      'ROOM_SENSORY_IOT_TUNED',
      `Suite #501 environmental telemetry adjusted: Preset '${db.data.roomAmbience.activePreset}', ${db.data.roomAmbience.temperatureC}°C, Aroma: ${db.data.roomAmbience.aromatherapy.activeOil}`,
      req.body.guestName || 'Resident Stateroom Controller'
    );
  }

  res.json({
    success: true,
    message: `Suite #501 sensory environment calibrated to '${db.data.roomAmbience.activePreset}'`,
    telemetry: db.data.roomAmbience
  });
});

// GET /api/services/fleet-charter - Private Aviation & Superyacht Fleet
router.get('/fleet-charter', (req, res) => {
  const fleet = [
    {
      id: 'fleet_yacht',
      name: 'Sunseeker 88ft Superyacht "Aura Sovereign"',
      category: 'Private Maritime Yacht',
      hourlyRate: 4500,
      capacity: '12 Guests + 4 Crew',
      cruisingSpeed: '28 Knots',
      berthLocation: 'Aura Private Marina — Berth #4',
      image: '/assets/images/superyacht_charter.jpg',
      amenities: [
        'Upper Deck Teak Jacuzzi',
        'Dom Pérignon Champagne Bar',
        'Master Stateroom En-Suite',
        'Seabob & Snorkeling Watercraft',
        'Private Onboard Sushi Chef'
      ],
      description: 'Exclusive private nautical charter across the crystal archipelago. Includes captain, first mate, sommelier, and bespoke chef.'
    },
    {
      id: 'fleet_heli',
      name: 'Airbus ACH130 VIP Helipad Shuttle',
      category: 'Private Aviation Rotorcraft',
      hourlyRate: 1850,
      capacity: '5 VIP Guests',
      cruisingSpeed: '135 Knots',
      berthLocation: 'Rooftop Helipad — 52nd Floor',
      image: '/assets/images/helicopter_transfer.jpg',
      amenities: [
        'Bose A20 Noise-Canceling Headsets',
        'Handcrafted Hermes Leather Interior',
        'Panoramic Bubble Canopy Windows',
        'Express Airport & Yacht Landing Clearance',
        'Direct Skyscraper Rooftop Access'
      ],
      description: 'Avoid all metropolitan traffic with direct point-to-point helicopter transfers connecting international airports and coastal yacht berths.'
    },
    {
      id: 'fleet_phantom',
      name: 'Rolls-Royce Phantom VIII Bespoke Saloon',
      category: 'Ultra-Luxury Chauffeur Mobility',
      hourlyRate: 650,
      capacity: '3 VIP Guests',
      cruisingSpeed: 'City / Highway VIP Escort',
      berthLocation: 'Aura Porte-Cochère & Valet',
      image: '/assets/images/executive_suite.jpg',
      amenities: [
        'Starlight Fiber-Optic Headliner',
        'Rear Seat Refrigerated Champagne Coolbox',
        'Bespoke Silk & Lambswool Carpeting',
        'White-Glove Certified Chauffeur 24/7',
        'Diplomatic Privacy Curtains'
      ],
      description: 'The epitome of land travel. Whisper-quiet V12 engine with bespoke interior crafted exclusively for Aura Grand residents.'
    }
  ];

  res.json({
    success: true,
    fleet
  });
});

// POST /api/services/fleet-charter/book - Dispatch Fleet Mobility Charter
router.post('/fleet-charter/book', (req, res) => {
  const { fleetId, guestName, guestEmail, departureTime, departureLocation, guestCount, cateringPreference } = req.body;

  const manifestId = `MAN-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${new Date().getFullYear()}`;
  const bookingEntry = {
    manifestId,
    fleetId: fleetId || 'fleet_yacht',
    guestName: guestName || 'Eleanor Vance',
    guestEmail: guestEmail || 'guest@auragrand.com',
    departureTime: departureTime || '14:30',
    departureLocation: departureLocation || 'Aura Private Marina Berth #4',
    guestCount: Number(guestCount) || 2,
    cateringPreference: cateringPreference || 'Vintage Dom Pérignon & Oscietra Caviar Service',
    status: 'CONFIRMED & CLEARED BY PORT CAPTAIN',
    timestamp: new Date().toISOString()
  };

  if (!db.data.fleetBookings) db.data.fleetBookings = [];
  db.data.fleetBookings.push(bookingEntry);
  db.save();

  if (db.logActivity) {
    db.logActivity(
      'FLEET_CHARTER_DISPATCHED',
      `VIP Mobility Charter ${manifestId} confirmed for ${bookingEntry.guestName}: Departure ${bookingEntry.departureLocation} at ${bookingEntry.departureTime}`,
      'Aura Fleet Master'
    );
  }

  res.json({
    success: true,
    message: `VIP Mobility Charter manifest ${manifestId} successfully generated and captain dispatched!`,
    manifest: bookingEntry
  });
});

// GET /api/services/predictive-itinerary - 24-Hour AI Predictive VIP Schedule
router.get('/predictive-itinerary', (req, res) => {
  const itinerary = [
    {
      time: '07:30',
      period: 'Morning Zen',
      title: 'Sunrise Panoramic Hatha Yoga & Vitality Elixirs',
      location: '50th Floor Rooftop Sky Deck',
      instructor: 'Master Instructor Valentina Cruz',
      status: 'Included in Sovereign Stay',
      highlight: true
    },
    {
      time: '09:00',
      period: 'Breakfast Haute Cuisine',
      title: 'In-Suite Imperial Oscietra Caviar & French Brioche',
      location: 'Suite #501 Oceanfront Terrace',
      chef: 'Executive Pastry Chef Readuanul',
      status: 'Prepared by Private Butler'
    },
    {
      time: '11:45',
      period: 'Maritime Excursion',
      title: 'Sunseeker 88ft Superyacht Cruise & Secluded Cove Snorkeling',
      location: 'Departing Aura Marina Berth #4',
      captain: 'Captain James Sterling',
      status: 'Charter Priority Standby'
    },
    {
      time: '15:30',
      period: 'Restorative Wellness',
      title: 'Auric Gold Thermal Hammam & Dead Sea Salt Exfoliation',
      location: 'Auric Spa & Bathhouse Sanctuary',
      therapist: 'Lead Spa Master Elena Rostova',
      status: 'Confirmed'
    },
    {
      time: '18:15',
      period: 'Sunset Horizon',
      title: 'Helicopter Coastal Twilight Flight & Champagne Toast',
      location: '52nd Floor Rooftop Helipad',
      pilot: 'Chief Aviator Marcus Sterling',
      status: 'Pre-flight Weather Verified'
    },
    {
      time: '20:30',
      period: 'Michelin Dining',
      title: 'Table 1: 9-Course Truffle & Wagyu Omakase Experience',
      location: 'L\'Aura Michelin 3-Star Dining Room',
      sommelier: 'Head Sommelier Tamim Shadman',
      status: 'Exclusive Resident Reservation',
      highlight: true
    },
    {
      time: '23:00',
      period: 'Circadian Rest',
      title: 'Obsidian Night Chamber Turn-Down & Binaural Soundscape',
      location: 'Suite #501 Master Bedchamber',
      butler: 'Butler 24/7 Service',
      status: 'Calibrated to 18.5°C'
    }
  ];

  res.json({
    success: true,
    guestName: req.query.guest || 'Eleanor Vance',
    date: new Date().toISOString().split('T')[0],
    itinerary
  });
});

// GET /api/services/esg-ledger - Certified Carbon-Negative Luxury & ESG Offset
router.get('/esg-ledger', (req, res) => {
  res.json({
    success: true,
    certId: `ESG-${new Date().getFullYear()}-44091A`,
    sustainabilityMetrics: {
      carbonStatus: '100% Certified Carbon-Negative Stay',
      solarEnergyFraction: '100% On-Site Solar & Geothermal Power',
      co2OffsetPerNightKg: 42.5,
      mangroveTreesPlanted: 15,
      oceanPlasticsRecoveredKg: 8.4,
      waterRecyclingRate: '98.2% Closed-Loop Greywater Purification',
      foodWasteDiversion: '100% Composted to Organic Herb Sanctuaries'
    },
    verificationHash: '0x8f9c112b489a7102e3dc1800f91aa824',
    certificationStandard: 'Global Sustainable Tourism Council (GSTC) Platinum Standard'
  });
});

// GET /api/services/:id (Parameterized fallback route must come after specific routes)
router.get('/:id', (req, res) => {
  const service = db.findById('services', req.params.id) ||
                  db.getCollection('services').find(s => s.code === req.params.id);
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, service });
});

module.exports = router;

