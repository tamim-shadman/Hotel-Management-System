const express = require('express');
const cors = require('cors');
const path = require('path');

const { router: authRouter } = require('./backend/routes/auth');
const roomsRouter = require('./backend/routes/rooms');
const employeesRouter = require('./backend/routes/employees');
const customersRouter = require('./backend/routes/customers');
const servicesRouter = require('./backend/routes/services');
const bookingsRouter = require('./backend/routes/bookings');
const billingRouter = require('./backend/routes/billing');
const statsRouter = require('./backend/routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Production Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets with production cache headers for immutable assets
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: true
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/stats', statsRouter);

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Aura Grand Hotel & Residences Management System',
    version: '2.7.0-PROD',
    authors: 'Tamim Shadman & Readuanul Farid Fahim',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for undefined API routes (ensures clean JSON 404s for API requests)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Fallback to index.html for SPA client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Hotel Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🌟 AURA GRAND LUXURY HOTEL MANAGEMENT SYSTEM IS LIVE 🌟`);
  console.log(`🚀 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`🏨 Environment: Production Ready`);
  console.log(`=======================================================`);
});
