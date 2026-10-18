/**
 * AURA GRAND LUXURY HOTEL MANAGEMENT SYSTEM
 * Senior Fullstack Architecture & UI/UX Specialist Application Logic
 */

// Global Application State
const state = {
  currentUser: null,
  token: localStorage.getItem('aura_token') || null,
  activeView: 'welcome', // 'welcome' | 'user-dashboard' | 'admin-dashboard'
  activeUserTab: 'user-rooms', // 'user-stay' | 'user-rooms' | 'user-vacant' | 'user-services' | 'user-book' | 'user-checkout'
  activeAdminTab: 'admin-overview', // 'admin-overview' | 'admin-employees' | 'admin-customers' | 'admin-billing' | 'admin-rooms' | 'admin-night-audit' | 'admin-yield' | 'admin-channels' | 'admin-audit'
  currency: localStorage.getItem('aura_currency') || 'USD',
  currencyRates: {
    USD: { symbol: '$', rate: 1.0 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    AED: { symbol: 'AED ', rate: 3.67 },
    CHF: { symbol: 'CHF ', rate: 0.89 },
    JPY: { symbol: '¥', rate: 154.50 },
    BDT: { symbol: '৳', rate: 122.50 }
  },
  activeResort: localStorage.getItem('aura_active_resort') || 'resort_dubai',
  resorts: [],
  yieldRules: null,
  channelsData: null,
  prospectusData: null,
  comparedRooms: [],
  rooms: [],
  vacantRooms: [],
  services: [],
  employees: [],
  customers: [],
  invoices: [],
  bookings: [],
  activityLogs: [],
  stats: null,
  bookingDraft: {
    roomId: null,
    checkInDate: '',
    checkOutDate: '',
    guests: 2,
    selectedServices: [],
    promoCode: ''
  }
};

// API Helper with Network Resilience & Error Recovery
const api = {
  async get(url) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
      const res = await fetch(url, { headers });
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return await res.json();
      }
      return { success: res.ok, status: res.status };
    } catch (err) {
      console.warn('API GET network anomaly:', url, err.message);
      return { success: false, message: 'Network communication interrupted' };
    }
  },
  async post(url, data) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return await res.json();
      }
      return { success: res.ok, status: res.status };
    } catch (err) {
      console.warn('API POST network anomaly:', url, err.message);
      return { success: false, message: 'Network communication interrupted' };
    }
  },
  async put(url, data) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return await res.json();
      }
      return { success: res.ok, status: res.status };
    } catch (err) {
      console.warn('API PUT network anomaly:', url, err.message);
      return { success: false, message: 'Network communication interrupted' };
    }
  },
  async delete(url) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
      const res = await fetch(url, { method: 'DELETE', headers });
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return await res.json();
      }
      return { success: res.ok, status: res.status };
    } catch (err) {
      console.warn('API DELETE network anomaly:', url, err.message);
      return { success: false, message: 'Network communication interrupted' };
    }
  }
};

// Price Formatter with Multi-Currency Support
function formatPrice(usdAmount) {
  const num = Number(usdAmount) || 0;
  const curr = state.currencyRates[state.currency] || state.currencyRates['USD'];
  const converted = Math.round(num * curr.rate);
  return `${curr.symbol}${converted.toLocaleString()}`;
}

function changeCurrency(currCode) {
  if (state.currencyRates[currCode]) {
    state.currency = currCode;
    localStorage.setItem('aura_currency', currCode);
    const sel = document.getElementById('currencySelector');
    if (sel) sel.value = currCode;
    showToast(`Currency converted to ${currCode} (${state.currencyRates[currCode].symbol})`, 'gold');
    renderApp();
  }
}

async function switchResort(resortId) {
  state.activeResort = resortId;
  localStorage.setItem('aura_active_resort', resortId);
  const sel = document.getElementById('resortSelector');
  if (sel) sel.value = resortId;

  try {
    if (!state.resorts || state.resorts.length === 0) {
      const res = await api.get('/api/stats/resorts');
      if (res.success && res.portfolio) {
        state.resorts = res.portfolio.resorts;
      }
    }
  } catch (e) {
    console.warn('Resort portfolio fetch error:', e);
  }

  const resort = (state.resorts || []).find(r => r.id === resortId);
  if (resort) {
    document.querySelectorAll('.brand-info span').forEach(el => {
      el.innerText = `${resort.city} • ${resort.status}`;
    });
    const heroDesc = document.querySelector('.hero-description');
    if (heroDesc) {
      heroDesc.innerText = `${resort.name} — ${resort.tagline}. Direct Concierge: ${resort.phone}.`;
    }
    const heroSec = document.querySelector('.hero-section');
    if (heroSec && resort.image) {
      heroSec.style.backgroundImage = `url('${resort.image}')`;
    }
    showToast(`Portfolio switched to ${resort.name} (${resort.flag || '🏰'} ${resort.city})`, 'emerald');
    if (resort.currency && state.currencyRates[resort.currency]) {
      changeCurrency(resort.currency);
    }
  }
}

// Toast Notifications
function showToast(message, type = 'gold') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = '✨';
  if (type === 'emerald') icon = '✓';
  if (type === 'rose') icon = '⚠';
  if (type === 'amber') icon = '⚡';

  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${icon}</span>
    <span style="font-size: 0.9rem; font-weight: 500;">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Single-Active Navigation State Controller (Fixes Multi-Underline Bug)
function updateNavActiveState(viewName, tabName) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  if (viewName === 'welcome') {
    document.getElementById('nav-welcome')?.classList.add('active');
  } else if (viewName === 'admin-dashboard') {
    document.getElementById('nav-admin')?.classList.add('active');
  } else if (viewName === 'user-dashboard') {
    const currentTab = tabName || state.activeUserTab || 'user-rooms';
    if (currentTab === 'user-rooms') {
      document.getElementById('nav-rooms')?.classList.add('active');
    } else if (currentTab === 'user-vacant') {
      document.getElementById('nav-vacant')?.classList.add('active');
    } else if (currentTab === 'user-services') {
      document.getElementById('nav-services')?.classList.add('active');
    } else {
      document.getElementById('nav-guest-portal')?.classList.add('active');
    }
  }
}

// Initial Bootstrapping
document.addEventListener('DOMContentLoaded', async () => {
  // Set default booking dates (today to +3 days)
  const today = new Date();
  const checkout = new Date(today);
  checkout.setDate(checkout.getDate() + 3);

  state.bookingDraft.checkInDate = today.toISOString().split('T')[0];
  state.bookingDraft.checkOutDate = checkout.toISOString().split('T')[0];

  // Fetch currencies
  try {
    const curRes = await api.get('/api/billing/currencies');
    if (curRes.success && curRes.rates) {
      state.currencyRates = curRes.rates;
    }
  } catch (e) {
    console.warn('Currency fetch fallback:', e);
  }

  // Restore white-label brand customization
  applyStoredWhitelabel();

  // Restore session or load demo
  await initSession();
  await loadInitialData();
  setupEventListeners();
  renderApp();
});

async function initSession() {
  if (state.token) {
    try {
      const res = await api.get('/api/auth/me');
      if (res.success && res.user) {
        state.currentUser = res.user;
        return;
      }
    } catch (e) {
      console.warn('Session verification fallback:', e);
    }
  }

  // Default guest session without forcing navigation change
  await switchPersona('customer', 'welcome');
}

async function loadInitialData() {
  try {
    const [roomsRes, vacantRes, servicesRes, statsRes] = await Promise.all([
      api.get('/api/rooms'),
      api.get('/api/rooms/vacant'),
      api.get('/api/services'),
      api.get('/api/stats/dashboard')
    ]);

    if (roomsRes.success) state.rooms = roomsRes.rooms;
    if (vacantRes.success) state.vacantRooms = vacantRes.vacantRooms;
    if (servicesRes.success) state.services = servicesRes.services;
    if (statsRes.success) {
      state.stats = statsRes.data;
      if (statsRes.data.activityLogs) state.activityLogs = statsRes.data.activityLogs;
    }

    if (state.currentUser && state.currentUser.role === 'admin') {
      await loadAdminData();
    }

    if (state.currentUser) {
      const bookingsRes = await api.get(`/api/bookings?email=${encodeURIComponent(state.currentUser.email)}`);
      if (bookingsRes.success) state.bookings = bookingsRes.bookings;
    }
  } catch (err) {
    console.error('Failed to load initial data:', err);
  }
}

async function loadAdminData() {
  try {
    const [empRes, custRes, invRes, allBkRes, logRes] = await Promise.all([
      api.get('/api/employees'),
      api.get('/api/customers'),
      api.get('/api/billing/invoices'),
      api.get('/api/bookings'),
      api.get('/api/stats/activity-log')
    ]);

    if (empRes.success) state.employees = empRes.employees;
    if (custRes.success) state.customers = custRes.customers;
    if (invRes.success) state.invoices = invRes.invoices;
    if (allBkRes.success) state.bookings = allBkRes.bookings;
    if (logRes.success) state.activityLogs = logRes.logs;
  } catch (err) {
    console.warn('Error loading admin data:', err);
  }
}

// Mobile Navigation Drawer Controller
function toggleMobileNav() {
  const navLinks = document.getElementById('navLinksList');
  const toggleBtn = document.getElementById('mobileNavToggle');
  const backdrop = document.getElementById('mobileNavBackdrop');
  if (!navLinks) return;
  
  const isOpen = navLinks.classList.contains('mobile-open');
  if (isOpen) {
    closeMobileNav();
  } else {
    navLinks.classList.add('mobile-open');
    toggleBtn?.classList.add('active');
    backdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileNav() {
  const navLinks = document.getElementById('navLinksList');
  const toggleBtn = document.getElementById('mobileNavToggle');
  const backdrop = document.getElementById('mobileNavBackdrop');
  navLinks?.classList.remove('mobile-open');
  toggleBtn?.classList.remove('active');
  backdrop?.classList.remove('active');
  document.body.style.overflow = '';
}

// Switching View
function switchView(viewName, tabName = null) {
  closeMobileNav();
  closePersonaDropdown();
  state.activeView = viewName;
  document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
  
  const targetView = document.getElementById(`${viewName}-view`);
  if (targetView) targetView.classList.add('active');

  if (viewName === 'user-dashboard' && tabName) {
    switchUserTab(tabName);
  } else {
    updateNavActiveState(viewName, state.activeUserTab);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'admin-dashboard') {
    loadAdminData().then(() => renderAdminDashboard());
  } else if (viewName === 'user-dashboard') {
    renderUserDashboard();
  }
}

// Switching Sub-tabs (User Dashboard)
function switchUserTab(tabName) {
  closeMobileNav();
  state.activeUserTab = tabName;
  document.querySelectorAll('#user-dashboard-view .subnav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  document.querySelectorAll('#user-dashboard-view .tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `${tabName}-pane`);
  });

  updateNavActiveState('user-dashboard', tabName);

  if (tabName === 'user-vacant') {
    setTimeout(() => {
      if (typeof Aura3D !== 'undefined') Aura3D.initResortTower('threeTowerContainer');
    }, 80);
  }
}

// Toggle between 3D Architectural Twin and 2D Grid
function toggleVacancyViewMode(mode) {
  const container3d = document.getElementById('vacant3dSection');
  const container2d = document.getElementById('vacantRoomsMatrix');
  const btn3d = document.getElementById('btnToggle3D');
  const btn2d = document.getElementById('btnToggle2D');

  if (mode === '3d') {
    if (container3d) container3d.style.display = 'block';
    if (container2d) container2d.style.display = 'none';
    btn3d?.classList.add('active');
    btn2d?.classList.remove('active');
    setTimeout(() => {
      if (typeof Aura3D !== 'undefined') Aura3D.initResortTower('threeTowerContainer');
    }, 50);
  } else {
    if (container3d) container3d.style.display = 'none';
    if (container2d) container2d.style.display = 'grid';
    btn2d?.classList.add('active');
    btn3d?.classList.remove('active');
  }
}

// Switching Sub-tabs (Admin Dashboard)
function switchAdminTab(tabName) {
  state.activeAdminTab = tabName;
  document.querySelectorAll('#admin-dashboard-view .subnav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  document.querySelectorAll('#admin-dashboard-view .tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `${tabName}-pane`);
  });
  if (tabName === 'admin-night-audit') {
    renderNightAuditPane();
  } else if (tabName === 'admin-yield') {
    renderYieldPane();
  } else if (tabName === 'admin-channels') {
    renderChannelsPane();
  } else if (tabName === 'admin-audit') {
    renderAuditPane();
  }
}

// Persona Dropdown Controller
function togglePersonaDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('personaDropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

function closePersonaDropdown() {
  document.getElementById('personaDropdown')?.classList.remove('show');
}

// Switch Persona (1-Click instant switch between Admin and Guests)
async function switchPersona(roleKey, targetView = null) {
  let role = 'customer';
  let email = null;

  if (roleKey === 'admin') {
    role = 'admin';
  } else if (roleKey === 'customer_fahim') {
    email = 'fahim@auragrand.com';
  } else {
    email = 'guest@auragrand.com';
  }

  try {
    let res;
    if (email) {
      res = await api.post('/api/auth/login', { email, password: 'guest123' });
    } else {
      res = await api.post('/api/auth/demo', { role });
    }

    if (res.success) {
      state.token = res.token;
      state.currentUser = res.user;
      localStorage.setItem('aura_token', res.token);
      showToast(`Logged in as ${res.user.name} (${res.user.role === 'admin' ? 'Hotel Director' : res.user.vipTier + ' VIP'})`, 'gold');
      
      await loadInitialData();
      renderApp();

      if (targetView) {
        switchView(targetView);
      } else if (res.user.role === 'admin') {
        switchView('admin-dashboard');
      } else {
        switchView('user-dashboard', 'user-stay');
      }
    }
  } catch (err) {
    showToast('Failed to switch persona', 'rose');
  }
}

// Manual Credentials Login Handler
async function handleManualLogin(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('authEmail');
  const passwordInput = document.getElementById('authPassword');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    showToast('Please provide both email and password', 'rose');
    return;
  }

  try {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.success) {
      state.token = res.token;
      state.currentUser = res.user;
      localStorage.setItem('aura_token', res.token);
      showToast(res.message || `Welcome, ${res.user.name}!`, 'emerald');
      closeModal('authModal');
      await loadInitialData();
      renderApp();

      if (res.user.role === 'admin') {
        switchView('admin-dashboard');
      } else {
        switchView('user-dashboard', 'user-stay');
      }
    } else {
      showToast(res.message || 'Login failed', 'rose');
    }
  } catch (err) {
    showToast('Error during sign in', 'rose');
  }
}

// Main Render Function
function renderApp() {
  renderNavbar();
  renderWelcomePage();
  renderUserDashboard();
  renderAdminDashboard();
}

// Render Navbar & Persona Dropdown
function renderNavbar() {
  const personaBadge = document.getElementById('personaBadge');
  if (personaBadge && state.currentUser) {
    const isVIP = state.currentUser.vipTier ? `(${state.currentUser.vipTier} VIP)` : '';
    personaBadge.innerHTML = `
      <img src="${state.currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" class="persona-avatar" alt="User">
      <div class="persona-text">
        <span class="persona-name">${state.currentUser.name} ${isVIP}</span>
        <span class="persona-role">${state.currentUser.role === 'admin' ? 'Hotel Authority (Admin)' : 'Verified Resident'} ▾</span>
      </div>
    `;

    // Dropdown details
    const dropName = document.getElementById('dropdownUserName');
    const dropRole = document.getElementById('dropdownUserRole');
    const dropPts = document.getElementById('dropdownLoyaltyPoints');
    if (dropName) dropName.innerText = state.currentUser.name;
    if (dropRole) dropRole.innerText = state.currentUser.role === 'admin' ? 'Hotel General Manager' : `${state.currentUser.vipTier || 'Silver'} VIP Patron`;
    if (dropPts) dropPts.innerText = `${(state.currentUser.loyaltyPoints || 500).toLocaleString()} pts`;
  }
}

// Render Welcome Page
function renderWelcomePage() {
  const featuredRoomsContainer = document.getElementById('featuredRoomsList');
  if (featuredRoomsContainer) {
    const featured = state.rooms.slice(0, 3);
    featuredRoomsContainer.innerHTML = featured.map(room => createRoomCardHtml(room)).join('');
  }

  const servicesListContainer = document.getElementById('welcomeServicesList');
  if (servicesListContainer) {
    const previewServices = state.services.slice(0, 3);
    servicesListContainer.innerHTML = previewServices.map(srv => createServiceCardHtml(srv)).join('');
  }

  if (state.stats) {
    const statOcc = document.getElementById('heroOccupancyRate');
    if (statOcc) statOcc.innerText = `${state.stats.occupancyRate}%`;

    const statAvailable = document.getElementById('heroAvailableRooms');
    if (statAvailable) statAvailable.innerText = `${state.stats.roomStatus.available}`;
  }
}

// Helper: Room Card HTML with Compare Button
function createRoomCardHtml(room) {
  const isAvailable = room.status === 'Available';
  const badgeClass = isAvailable ? 'badge-emerald' : room.status === 'Occupied' ? 'badge-rose' : 'badge-amber';
  const isCompared = state.comparedRooms.includes(room.id);

  return `
    <div class="room-card" data-room-id="${room.id}">
      <div class="room-thumb-wrapper">
        <img src="${room.image}" alt="${room.name}" class="room-thumb" loading="lazy">
        <span class="badge ${badgeClass} room-status-badge">
          <span class="status-dot ${room.status.toLowerCase()}"></span>
          ${room.status}
        </span>
        <span class="room-type-tag">${room.type}</span>
      </div>
      <div class="room-details">
        <div class="room-title-row">
          <h3 class="room-name">${room.name}</h3>
          <div class="room-price-box">
            <div class="room-price">${formatPrice(room.pricePerNight)}</div>
            <div class="room-price-sub">per night</div>
          </div>
        </div>
        <div class="room-features-strip">
          <span class="room-feature-item">🛏️ ${room.bedType}</span>
          <span class="room-feature-item">👥 Up to ${room.capacity} Guests</span>
          <span class="room-feature-item">📐 ${room.sizeSqFt} sq.ft</span>
        </div>
        <p class="room-desc">${room.description}</p>
        <div class="room-actions">
          <button class="btn ${isCompared ? 'btn-primary' : 'btn-subtle'} btn-sm" onclick="toggleRoomCompare('${room.id}')" title="Compare side-by-side">
            ${isCompared ? '✓ Added' : '+ Compare'}
          </button>
          <button class="btn btn-outline btn-sm" onclick="Aura3D.openSpatialTour('${room.type === 'Presidential' ? 'penthouse' : 'circadian'}')" title="Launch 3D 360° Spatial Tour">
            ✦ 3D VR Tour
          </button>
          <button class="btn btn-outline btn-sm" onclick="openRoomDetailsModal('${room.id}')">Details</button>
          <button class="btn btn-primary btn-sm" onclick="startBookingRoom('${room.id}')">Reserve</button>
        </div>
      </div>
    </div>
  `;
}

// Helper: Service Card HTML with Quantity Steppers
function createServiceCardHtml(srv) {
  return `
    <div class="service-card" data-service-id="${srv.id}">
      <div class="service-thumb-wrapper">
        <img src="${srv.image}" alt="${srv.name}" class="service-thumb" loading="lazy">
        ${srv.popular ? '<span class="badge badge-gold" style="position: absolute; top: 1rem; right: 1rem;">Signature Experience</span>' : ''}
      </div>
      <div class="service-body">
        <span class="service-cat">${srv.category}</span>
        <h4 class="service-title">${srv.name}</h4>
        <p class="room-desc">${srv.description}</p>
        <div class="service-price-tag">
          ${formatPrice(srv.price)}
          <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-dim); font-family: var(--font-sans);">${srv.unit}</span>
        </div>
        
        <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
          <!-- Quantity Stepper -->
          <div class="stepper-control">
            <button class="stepper-btn" onclick="adjustServiceQty('${srv.id}', -1)">−</button>
            <span class="stepper-val" id="srvQty_${srv.id}">1</span>
            <button class="stepper-btn" onclick="adjustServiceQty('${srv.id}', 1)">+</button>
          </div>
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="quickOrderService('${srv.id}')">
            Add to Stay Folio
          </button>
        </div>
      </div>
    </div>
  `;
}

function adjustServiceQty(srvId, delta) {
  const el = document.getElementById(`srvQty_${srvId}`);
  if (!el) return;
  let val = Number(el.innerText) + delta;
  if (val < 1) val = 1;
  if (val > 10) val = 10;
  el.innerText = val;
}

async function quickOrderService(srvId) {
  const qtyEl = document.getElementById(`srvQty_${srvId}`);
  const qty = qtyEl ? Number(qtyEl.innerText) : 1;
  const srv = state.services.find(s => s.id === srvId);
  if (!srv) return;

  const activeBooking = state.bookings.find(b => b.bookingStatus === 'Checked In' || b.bookingStatus === 'Confirmed');

  try {
    const res = await api.post('/api/services/order', {
      serviceId: srv.id,
      quantity: qty,
      roomNumber: activeBooking ? activeBooking.roomNumber : 'Suite 401',
      bookingRef: activeBooking ? activeBooking.bookingRef : null,
      guestName: state.currentUser ? state.currentUser.name : 'Resident Guest',
      specialNotes: 'On-demand order from Lavish Services menu'
    });

    if (res.success) {
      showToast(`${srv.name} (${qty}x) charged to stay folio!`, 'emerald');
      await loadInitialData();
      renderApp();
    }
  } catch (err) {
    showToast('Failed to place service order', 'rose');
  }
}

// Suite Comparison Logic
function toggleRoomCompare(roomId) {
  const index = state.comparedRooms.indexOf(roomId);
  if (index > -1) {
    state.comparedRooms.splice(index, 1);
  } else {
    if (state.comparedRooms.length >= 3) {
      showToast('You can compare up to 3 suites simultaneously.', 'amber');
      return;
    }
    state.comparedRooms.push(roomId);
  }
  updateComparisonFloatingBar();
  renderUserRoomsList();
}

function updateComparisonFloatingBar() {
  const bar = document.getElementById('comparisonFloatingBar');
  if (!bar) return;

  if (state.comparedRooms.length === 0) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  const badge = document.getElementById('comparisonCountBadge');
  const thumbs = document.getElementById('comparisonThumbs');
  
  if (badge) badge.innerText = `${state.comparedRooms.length} Suite${state.comparedRooms.length > 1 ? 's' : ''} Selected`;
  if (thumbs) {
    thumbs.innerHTML = state.comparedRooms.map(id => {
      const room = state.rooms.find(r => r.id === id);
      return room ? `<img src="${room.image}" class="comparison-mini-thumb" alt="${room.name}">` : '';
    }).join('');
  }
}

function clearComparison() {
  state.comparedRooms = [];
  updateComparisonFloatingBar();
  renderUserRoomsList();
}

function openComparisonModal() {
  if (state.comparedRooms.length === 0) return;
  const content = document.getElementById('comparisonModalContent');
  if (!content) return;

  const compared = state.rooms.filter(r => state.comparedRooms.includes(r.id));

  content.innerHTML = `
    <div style="overflow-x: auto;">
      <table class="comparison-matrix-table">
        <thead>
          <tr>
            <th style="width: 220px;">Specification</th>
            ${compared.map(r => `
              <th>
                <div style="font-size: 1.15rem; font-weight: 700; color: #fff;">${r.name}</div>
                <div style="font-size: 0.8rem; color: var(--gold-primary); text-transform: uppercase;">${r.type} • Floor ${r.floor}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 700; color: var(--gold-light);">Suite Photography</td>
            ${compared.map(r => `
              <td>
                <img src="${r.image}" style="width: 100%; height: 160px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-gold);" alt="${r.name}">
              </td>
            `).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; color: var(--gold-light);">Nightly Rate</td>
            ${compared.map(r => `
              <td style="font-size: 1.4rem; font-weight: 800; color: var(--gold-primary); font-family: var(--font-serif);">
                ${formatPrice(r.pricePerNight)} <span style="font-size: 0.8rem; color: var(--text-dim); font-family: var(--font-sans);">/ night</span>
              </td>
            `).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; color: var(--gold-light);">Room Dimensions</td>
            ${compared.map(r => `<td><strong>${r.sizeSqFt} sq. ft</strong> (${Math.round(r.sizeSqFt * 0.0929)} m²)</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; color: var(--gold-light);">Bedding & Capacity</td>
            ${compared.map(r => `<td>${r.bedType} • Up to ${r.capacity} Guests</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; color: var(--gold-light);">Panoramic View</td>
            ${compared.map(r => `<td>${r.view}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; color: var(--gold-light);">Signature Amenities</td>
            ${compared.map(r => `
              <td>
                <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem;">
                  ${r.amenities.map(a => `<li style="color: var(--text-muted);"><span style="color: var(--gold-primary);">✓</span> ${a}</li>`).join('')}
                </ul>
              </td>
            `).join('')}
          </tr>
          <tr>
            <td></td>
            ${compared.map(r => `
              <td>
                <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="closeModal('comparisonModal'); startBookingRoom('${r.id}')">
                  Reserve ${r.name}
                </button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;

  openModal('comparisonModal');
}

// ==========================================================================
// USER DASHBOARD RENDERING
// ==========================================================================
function renderUserDashboard() {
  renderUserStay();
  renderUserRoomsList();
  renderVacantRoomsMatrix();
  renderUserServicesList();
  renderBookingCenter();
  renderCheckoutTab();
}

// 1. My Stay & 3D Digital Room Key
function renderUserStay() {
  const stayContainer = document.getElementById('userStayDetails');
  if (!stayContainer) return;

  const activeBooking = state.bookings.find(b => b.bookingStatus === 'Checked In' || b.bookingStatus === 'Confirmed');

  if (!activeBooking) {
    stayContainer.innerHTML = `
      <div style="background: var(--bg-card); border: 1.5px dashed var(--border-gold); border-radius: var(--radius-md); padding: 3.5rem 2rem; text-align: center;">
        <span style="font-size: 3.5rem;">🛎️</span>
        <h3 style="margin: 1.25rem 0 0.5rem; font-size: 1.6rem; color: var(--gold-light);">No Active Resident Keycard</h3>
        <p style="color: var(--text-muted); max-width: 540px; margin: 0 auto 1.75rem; line-height: 1.7;">
          You do not currently have a checked-in suite. Explore our vacant luxury penthouses or reserve a room to activate your contactless digital RFID room key.
        </p>
        <button class="btn btn-primary btn-lg" onclick="switchUserTab('user-rooms')">Browse Available Suites</button>
      </div>
    `;
    return;
  }

  stayContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 2.5rem; align-items: start;">
      
      <!-- 3D Luxury Digital RFID Keycard (Three.js WebGL Interactive Titanium Card) -->
      <div class="three-keycard-wrap">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge badge-gold">✦ 3D Titanium RFID Key</span>
            <span class="badge badge-emerald">Verified Active</span>
          </div>
          <button class="btn btn-outline btn-xs" onclick="Aura3D.flip3DKeycard()">
            🔄 Flip 3D Key
          </button>
        </div>

        <div id="threeKeycardContainer" style="width: 100%; height: 230px; position: relative; cursor: grab;" onclick="simulateDoorUnlock('${activeBooking.roomNumber}')">
          <!-- Three.js 3D Keycard Rendered Here -->
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
          <div>
            <div style="font-size: 0.72rem; color: var(--gold-light); text-transform: uppercase;">Resident Folio</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: #fff;">${activeBooking.customerName} (${activeBooking.bookingRef})</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="simulateDoorUnlock('${activeBooking.roomNumber}')">
            📶 Tap to Unlock Suite
          </button>
        </div>
      </div>

      <!-- Live Stay Folio Breakdown -->
      <div style="background: var(--bg-card); border: 1px solid var(--border-gold); border-radius: var(--radius-lg); padding: 2.2rem; box-shadow: var(--shadow-luxury);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
          <div>
            <span class="badge badge-gold">Folio Accounting</span>
            <h3 style="font-size: 1.4rem; margin-top: 0.35rem;">In-House Folio Statement</h3>
          </div>
          <span class="badge ${activeBooking.paymentStatus === 'Paid' ? 'badge-emerald' : 'badge-amber'}">
            ${activeBooking.paymentStatus}
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.92rem;">
            <span style="color: var(--text-muted);">${activeBooking.roomName} (${activeBooking.nights} nights):</span>
            <span style="font-weight: 600;">${formatPrice(activeBooking.roomSubtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.92rem;">
            <span style="color: var(--text-muted);">Lavish Amenities & Orders (${activeBooking.selectedServices.length} items):</span>
            <span style="font-weight: 600;">${formatPrice(activeBooking.servicesSubtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.92rem;">
            <span style="color: var(--text-muted);">Hospitality Tax & Tourism Fee (10%):</span>
            <span style="font-weight: 600;">${formatPrice(activeBooking.taxAmount)}</span>
          </div>
          ${activeBooking.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.92rem; color: #34d399;">
              <span>VIP Privilege Discount:</span>
              <span>-${formatPrice(activeBooking.discountAmount)}</span>
            </div>
          ` : ''}
          <div style="border-top: 1.5px solid var(--border-gold); padding-top: 0.85rem; display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: 800; color: var(--gold-light);">
            <span>Total Folio Surcharge:</span>
            <span>${formatPrice(activeBooking.grandTotal)}</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.85rem;">
          <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="viewBookingInvoice('${activeBooking.id}')">
            🖨️ View Official Folio
          </button>
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="switchUserTab('user-checkout')">
            Express Checkout →
          </button>
        </div>
      </div>

      <!-- VIP Loyalty Tier Progression & Privileges Card -->
      <div class="vip-loyalty-card" style="grid-column: 1 / -1;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span class="badge badge-gold">Forbes Tier Status</span>
              <span style="color: var(--emerald); font-size: 0.82rem; font-weight: 700;">● Active Resident Benefits</span>
            </div>
            <h3 style="font-size: 1.5rem; margin-top: 0.35rem; color: #fff;">
              👑 Gold VIP Resident Status
            </h3>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">
              Earn 10 Aura Points for every $1 spent across accommodations, Michelin dining, and Auric Spa experiences.
            </p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--gold-light); font-family: var(--font-serif);">
              4,850 <span style="font-size: 0.95rem; font-family: var(--font-sans); color: var(--text-muted);">Points</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--gold-primary);">150 pts until Platinum Sovereign Tier</div>
          </div>
        </div>

        <div class="vip-progress-bar-wrap">
          <div class="vip-progress-bar" style="width: 97%;"></div>
        </div>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
          <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--gold-light); font-weight: 700; letter-spacing: 0.08em; margin-bottom: 0.75rem;">
            Unlocked Resident Privileges:
          </div>
          <div class="vip-perks-grid">
            <div class="vip-perk-item">✓ <strong>4:00 PM</strong> Guaranteed Late Checkout</div>
            <div class="vip-perk-item">✓ <strong>Maybach S-Class</strong> Complimentary Transfers</div>
            <div class="vip-perk-item">✓ <strong>Vintage Champagne</strong> Welcome Service</div>
            <div class="vip-perk-item">✓ <strong>24/7 Dedicated</strong> Chief Butler Direct Hotline</div>
            <div class="vip-perk-item">✓ <strong>15% Off</strong> Auric Sanctuary Spa & Salon Treatments</div>
            <div class="vip-perk-item">✓ <strong>VIP Priority</strong> Rooftop Infinity Pool Cabana Access</div>
          </div>
        </div>
      </div>

      <!-- Novel Feature 1: Sensory Stateroom & IoT Telemetry Console -->
      <div class="iot-telemetry-card" style="grid-column: 1 / -1;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span class="badge badge-gold">✦ Novel In-Room IoT Stateroom</span>
              <span class="badge badge-emerald">Suite #${activeBooking.roomNumber} Telemetry Connected</span>
            </div>
            <h3 style="font-size: 1.5rem; margin-top: 0.35rem; color: #fff;">
              Sensory Stateroom Atmosphere & Biometric Controller
            </h3>
            <p style="color: var(--text-dim); font-size: 0.88rem; margin: 0;">
              Calibrate circadian luminescence, organic aromatherapy diffusion, and binaural soundscapes before or during your stay.
            </p>
          </div>
          <button class="btn btn-primary" onclick="deployRoomAmbience('${activeBooking.roomNumber}')">
            ⚡ Push Ambience to Suite #${activeBooking.roomNumber}
          </button>
        </div>

        <!-- Ambience Presets -->
        <div class="iot-preset-grid">
          <div class="iot-preset-btn active" id="btnPresetDawn" onclick="tuneRoomAmbience('dawn')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 1.4rem;">🌅</span>
              <span class="badge badge-gold" style="font-size: 0.68rem;">4,200K Sunrise</span>
            </div>
            <strong style="color: #fff; font-size: 0.95rem;">Circadian Dawn</strong>
            <div style="font-size: 0.76rem; color: var(--text-dim);">Bergamot mist & morning waves at 21.0°C</div>
          </div>

          <div class="iot-preset-btn" id="btnPresetDusk" onclick="tuneRoomAmbience('dusk')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 1.4rem;">🌊</span>
              <span class="badge badge-subtle" style="font-size: 0.68rem;">2,700K Amber</span>
            </div>
            <strong style="color: #fff; font-size: 0.95rem;">Mediterranean Dusk</strong>
            <div style="font-size: 0.76rem; color: var(--text-dim);">Oud & ocean swells at 20.0°C</div>
          </div>

          <div class="iot-preset-btn" id="btnPresetCandlelight" onclick="tuneRoomAmbience('candlelight')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 1.4rem;">🕯️</span>
              <span class="badge badge-subtle" style="font-size: 0.68rem;">1,800K Glow</span>
            </div>
            <strong style="color: #fff; font-size: 0.95rem;">Starlight Romance</strong>
            <div style="font-size: 0.76rem; color: var(--text-dim);">Rose sandalwood & B&O harp at 20.5°C</div>
          </div>

          <div class="iot-preset-btn" id="btnPresetSleep" onclick="tuneRoomAmbience('sleep')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 1.4rem;">🌙</span>
              <span class="badge badge-indigo" style="font-size: 0.68rem;">0% Blue Light</span>
            </div>
            <strong style="color: #fff; font-size: 0.95rem;">Obsidian Deep REM</strong>
            <div style="font-size: 0.76rem; color: var(--text-dim);">Lavender infusion & delta waves at 18.5°C</div>
          </div>
        </div>

        <!-- Telemetry Meters -->
        <div class="iot-metric-tiles">
          <div class="iot-metric-tile">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Stateroom Temp</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.35rem;">
              <button class="btn btn-subtle btn-sm" style="padding: 0 0.5rem; font-size: 1rem;" onclick="adjustRoomTemp(-0.5)">-</button>
              <span style="font-size: 1.25rem; font-weight: 800; color: #fff;" id="roomLiveTemp">20.5°C</span>
              <button class="btn btn-subtle btn-sm" style="padding: 0 0.5rem; font-size: 1rem;" onclick="adjustRoomTemp(0.5)">+</button>
            </div>
          </div>

          <div class="iot-metric-tile">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Air Purity Rating</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #34d399; margin-top: 0.35rem;">AQI 002</div>
            <div style="font-size: 0.72rem; color: var(--text-dim);">Pristine Alpine Grade</div>
          </div>

          <div class="iot-metric-tile">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Aromatherapy Diffuser</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: var(--gold-light); margin-top: 0.35rem;" id="roomLiveAroma">Bergamot & Sweet Orange</div>
            <div style="font-size: 0.72rem; color: var(--emerald);">● Active Vaporization</div>
          </div>

          <div class="iot-metric-tile">
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Acoustic Ambiance</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.35rem;">
              <div class="sound-wave-bars">
                <div class="sound-wave-bar"></div>
                <div class="sound-wave-bar"></div>
                <div class="sound-wave-bar"></div>
                <div class="sound-wave-bar"></div>
                <div class="sound-wave-bar"></div>
              </div>
              <span style="font-size: 0.88rem; font-weight: 700; color: #38bdf8;" id="roomLiveSound">Aegean Waves (432Hz)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Novel Feature 2: 24-Hour AI Predictive VIP Itinerary Curator -->
      <div style="grid-column: 1 / -1; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
          <div>
            <span class="badge badge-gold">✦ Autonomous Concierge AI</span>
            <h3 style="font-size: 1.4rem; color: #fff; margin-top: 0.25rem;">
              24-Hour Predictive VIP Stay Itinerary
            </h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">
              Hyper-personalized schedule curated by our AI Butler based on your suite tier and stay history.
            </p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="showToast('Itinerary synced with your digital keycard and 24/7 butler desk!', 'emerald')">
            📅 Sync with Digital Keycard
          </button>
        </div>

        <div class="itinerary-timeline" id="vipItineraryTimeline">
          <!-- Rendered dynamically via JS -->
        </div>
      </div>

      <!-- Novel Feature 3: Carbon-Negative Luxury & ESG Sustainability Offset Ledger -->
      <div style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 14, 23, 0.8) 100%); border: 1.5px solid var(--emerald); border-radius: var(--radius-lg); padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="badge badge-emerald">Verified Eco-Luxury Certified</span>
            <h3 style="font-size: 1.4rem; color: #fff; margin-top: 0.25rem;">
              100% Certified Carbon-Negative Stay
            </h3>
            <p style="color: var(--text-dim); font-size: 0.85rem; margin: 0;">
              Every night at Aura Grand is 100% solar and geothermal powered, actively offsetting 42.5kg of atmospheric CO2.
            </p>
          </div>
          <button class="btn btn-outline btn-sm" style="border-color: var(--emerald); color: var(--emerald);" onclick="openEsgCertificateModal()">
            🌿 View Official ESG Green Certificate
          </button>
        </div>

        <div class="esg-stat-grid">
          <div class="esg-stat-card">
            <div style="font-size: 1.8rem;">🌳</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #34d399; margin: 0.25rem 0;">15 Trees</div>
            <div style="font-size: 0.74rem; color: var(--text-dim);">Mangroves planted per guest stay</div>
          </div>
          <div class="esg-stat-card">
            <div style="font-size: 1.8rem;">🌊</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #38bdf8; margin: 0.25rem 0;">8.4 kg</div>
            <div style="font-size: 0.74rem; color: var(--text-dim);">Ocean-bound plastics recovered</div>
          </div>
          <div class="esg-stat-card">
            <div style="font-size: 1.8rem;">☀️</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #ffd700; margin: 0.25rem 0;">100% Solar</div>
            <div style="font-size: 0.74rem; color: var(--text-dim);">Zero-emission microgrid power</div>
          </div>
          <div class="esg-stat-card">
            <div style="font-size: 1.8rem;">♻️</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #a78bfa; margin: 0.25rem 0;">98.2%</div>
            <div style="font-size: 0.74rem; color: var(--text-dim);">Closed-loop greywater purification</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render the itinerary timeline asynchronously
  renderItineraryTimeline();

  // Initialize Interactive 3D WebGL Titanium Keycard
  setTimeout(() => {
    if (typeof Aura3D !== 'undefined') {
      Aura3D.init3DKeycard('threeKeycardContainer', {
        roomNumber: activeBooking.roomNumber,
        guestName: activeBooking.customerName
      });
    }
  }, 80);
}

function simulateDoorUnlock(roomNum) {
  showToast(`📶 NFC Handshake Verified: Suite ${roomNum} door unlocked!`, 'emerald');
}

// 2. User Rooms List with Filter Controls
function renderUserRoomsList() {
  const container = document.getElementById('userRoomsGrid');
  if (!container) return;

  const typeFilter = document.getElementById('userRoomTypeFilter')?.value || 'all';
  const priceFilter = Number(document.getElementById('userRoomPriceFilter')?.value) || 2000;
  const capacityFilter = Number(document.getElementById('userRoomCapacityFilter')?.value) || 1;

  let filtered = state.rooms.filter(room => {
    if (typeFilter !== 'all' && !room.type.toLowerCase().includes(typeFilter.toLowerCase())) return false;
    if (room.pricePerNight > priceFilter) return false;
    if (room.capacity < capacityFilter) return false;
    return true;
  });

  const priceLabel = document.getElementById('userPriceFilterLabel');
  if (priceLabel) priceLabel.innerText = formatPrice(priceFilter);

  const countBadge = document.getElementById('userRoomCountBadge');
  if (countBadge) countBadge.innerText = `${filtered.length} Luxury Suites Available`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 4rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
        <h3>No Suites Match Current Filters</h3>
        <p style="margin-top: 0.5rem;">Try raising the price ceiling or clearing specific category restrictions.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(room => createRoomCardHtml(room)).join('');
}

// 3. Vacant Rooms Matrix & Floor Plan 2.0
async function renderVacantRoomsMatrix() {
  const container = document.getElementById('vacantRoomsMatrix');
  if (!container) return;

  const checkIn = document.getElementById('vacantCheckIn')?.value || state.bookingDraft.checkInDate;
  const checkOut = document.getElementById('vacantCheckOut')?.value || state.bookingDraft.checkOutDate;
  const guests = document.getElementById('vacantGuests')?.value || 1;

  try {
    const res = await api.get(`/api/rooms/vacant?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
    if (res.success) {
      state.vacantRooms = res.vacantRooms;

      const vacantCountEl = document.getElementById('vacantCountBadge');
      if (vacantCountEl) vacantCountEl.innerText = `${res.totalVacant} Suites Vacant for Selected Dates`;

      const floors = [5, 4, 3, 2, 1];
      container.innerHTML = floors.map(floorNum => {
        const floorRooms = state.rooms.filter(r => r.floor === floorNum);
        if (floorRooms.length === 0) return '';

        const vacantOnFloor = floorRooms.filter(r => state.vacantRooms.some(vr => vr.id === r.id)).length;
        const vacantPct = Math.round((vacantOnFloor / floorRooms.length) * 100);

        return `
          <div class="floor-row">
            <div class="floor-header">
              <div>
                <span class="floor-title">
                  <span>🏢</span> Floor ${floorNum} Suites & Accommodations
                </span>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                  ${vacantOnFloor} of ${floorRooms.length} Available (${vacantPct}% Vacant)
                </div>
              </div>
              <div style="width: 140px;">
                <div class="floor-progress-track">
                  <div class="floor-progress-bar" style="width: ${vacantPct}%;"></div>
                </div>
              </div>
            </div>

            <div class="rooms-matrix">
              ${floorRooms.map(room => {
                const isVacant = state.vacantRooms.some(vr => vr.id === room.id);
                const statusClass = isVacant ? 'vacant' : room.status.toLowerCase();
                const statusText = isVacant ? 'Vacant & Ready' : room.status;

                return `
                  <div class="room-slot ${statusClass}" onclick="handleRoomSlotClick('${room.id}', ${isVacant})">
                    <div class="room-slot-header">
                      <span class="room-num">#${room.roomNumber}</span>
                      <span class="badge ${isVacant ? 'badge-emerald' : 'badge-amber'}">${statusText}</span>
                    </div>
                    <div style="font-size: 0.84rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.35rem;">
                      ${room.name}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted);">
                      <span style="color: var(--gold-light); font-weight: 700;">${formatPrice(room.pricePerNight)}/night</span>
                      <span>${room.capacity} Guests</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error fetching vacancy data:', err);
  }
}

function handleRoomSlotClick(roomId, isVacant) {
  if (!isVacant) {
    showToast('This room is currently occupied or under maintenance for the selected dates.', 'amber');
    return;
  }
  startBookingRoom(roomId);
}

function setDatePreset(preset) {
  const today = new Date();
  let inDate = new Date(today);
  let outDate = new Date(today);

  if (preset === 'tonight') {
    outDate.setDate(outDate.getDate() + 1);
  } else if (preset === 'weekend') {
    inDate.setDate(inDate.getDate() + (5 - inDate.getDay() + 7) % 7);
    outDate = new Date(inDate);
    outDate.setDate(outDate.getDate() + 2);
  } else if (preset === 'week') {
    outDate.setDate(outDate.getDate() + 5);
  }

  const inStr = inDate.toISOString().split('T')[0];
  const outStr = outDate.toISOString().split('T')[0];

  const vIn = document.getElementById('vacantCheckIn');
  const vOut = document.getElementById('vacantCheckOut');
  if (vIn) vIn.value = inStr;
  if (vOut) vOut.value = outStr;

  state.bookingDraft.checkInDate = inStr;
  state.bookingDraft.checkOutDate = outStr;

  renderVacantRoomsMatrix();
}

// 4. Other Services List
function renderUserServicesList() {
  const container = document.getElementById('userServicesGrid');
  if (!container) return;

  const catFilter = document.getElementById('userServicesCategoryFilter')?.value || 'all';
  let filtered = state.services;
  if (catFilter !== 'all') {
    filtered = filtered.filter(s => s.category.toLowerCase().includes(catFilter.toLowerCase()));
  }

  container.innerHTML = filtered.map(srv => createServiceCardHtml(srv)).join('');
}

// Hero Section Vacancy Search Handler (P0 Fix)
function handleHeroSearch() {
  const checkIn = document.getElementById('heroCheckIn')?.value;
  const checkOut = document.getElementById('heroCheckOut')?.value;
  const guests = document.getElementById('heroGuests')?.value || '2';
  const suiteType = document.getElementById('heroSuiteType')?.value || 'all';

  if (checkIn && checkOut) {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    if (d2 <= d1) {
      showToast('Check-out date must be strictly after check-in date', 'rose');
      return;
    }
    state.bookingDraft.checkInDate = checkIn;
    state.bookingDraft.checkOutDate = checkOut;
  }
  state.bookingDraft.guests = guests;

  showToast(`Searching available suites for ${guests} guest${Number(guests) > 1 ? 's' : ''}...`, 'gold');
  switchView('user-dashboard', 'user-vacant');

  // Populate vacancy filter fields
  const vIn = document.getElementById('vacantCheckIn');
  const vOut = document.getElementById('vacantCheckOut');
  const vG = document.getElementById('vacantGuests');
  if (vIn && checkIn) vIn.value = checkIn;
  if (vOut && checkOut) vOut.value = checkOut;
  if (vG) vG.value = guests;

  renderVacantRooms();
}

// 5. Booking Center & Interactive Price Calculator
function renderBookingCenter() {
  const roomSelect = document.getElementById('bookingRoomSelect');
  if (roomSelect) {
    const currentVal = state.bookingDraft.roomId || roomSelect.value;
    roomSelect.innerHTML = '<option value="">-- Choose a Suite --</option>' +
      state.rooms.map(r => `<option value="${r.id}" ${r.id === currentVal ? 'selected' : ''}>#${r.roomNumber} - ${r.name} (${formatPrice(r.pricePerNight)}/night)</option>`).join('');
    
    if (currentVal) {
      roomSelect.value = currentVal;
    }
  }

  const checkInInput = document.getElementById('bookCheckIn');
  const checkOutInput = document.getElementById('bookCheckOut');
  if (checkInInput && !checkInInput.value) checkInInput.value = state.bookingDraft.checkInDate;
  if (checkOutInput && !checkOutInput.value) checkOutInput.value = state.bookingDraft.checkOutDate;

  if (state.currentUser) {
    const nameInput = document.getElementById('bookGuestName');
    const emailInput = document.getElementById('bookGuestEmail');
    const phoneInput = document.getElementById('bookGuestPhone');
    if (nameInput && !nameInput.value) nameInput.value = state.currentUser.name;
    if (emailInput && !emailInput.value) emailInput.value = state.currentUser.email;
    if (phoneInput && !phoneInput.value) phoneInput.value = state.currentUser.phone || '';
  }

  const addonsContainer = document.getElementById('bookingAddonServices');
  if (addonsContainer && addonsContainer.children.length === 0) {
    addonsContainer.innerHTML = state.services.map(srv => `
      <label style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 0.85rem 1rem; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <input type="checkbox" class="booking-service-check" data-id="${srv.id}" data-price="${srv.price}" data-name="${srv.name}" onchange="recalculateBookingTotal()">
          <div>
            <div style="font-size: 0.88rem; font-weight: 600;">${srv.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">${srv.category} • ${srv.duration || ''}</div>
          </div>
        </div>
        <div style="font-size: 0.95rem; font-weight: 700; color: var(--gold-primary);">${formatPrice(srv.price)}</div>
      </label>
    `).join('');
  }

  recalculateBookingTotal();
}

function recalculateBookingTotal() {
  const roomId = document.getElementById('bookingRoomSelect')?.value;
  const checkIn = document.getElementById('bookCheckIn')?.value;
  const checkOut = document.getElementById('bookCheckOut')?.value;
  const promoCode = document.getElementById('bookPromoCode')?.value.trim().toUpperCase();
  const submitBtn = document.querySelector('#bookingForm button[type="submit"]');

  const room = state.rooms.find(r => r.id === roomId);

  let nights = 1;
  let dateError = null;
  if (checkIn && checkOut) {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    if (d2 <= d1) {
      dateError = 'Check-out date must be strictly after check-in date.';
    } else {
      const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      nights = Math.max(diff, 1);
    }
  }

  if (submitBtn) {
    submitBtn.disabled = Boolean(dateError);
  }

  const roomSub = room ? room.pricePerNight * nights : 0;

  let servicesSub = 0;
  document.querySelectorAll('.booking-service-check:checked').forEach(chk => {
    servicesSub += Number(chk.dataset.price) || 0;
  });

  let discount = 0;
  let promoApplied = false;
  if (promoCode === 'ROYAL10') {
    discount = Math.round((roomSub + servicesSub) * 0.10);
    promoApplied = true;
  } else if (promoCode === 'WELCOME15') {
    discount = Math.round((roomSub + servicesSub) * 0.15);
    promoApplied = true;
  } else if (promoCode === 'VIP20') {
    discount = Math.round((roomSub + servicesSub) * 0.20);
    promoApplied = true;
  } else if (promoCode === 'AURA50') {
    discount = Math.min(50, roomSub + servicesSub);
    promoApplied = true;
  }

  const taxable = Math.max(0, roomSub + servicesSub - discount);
  const tax = Math.round(taxable * 0.10 * 100) / 100;
  const total = Math.round((taxable + tax) * 100) / 100;

  const summaryEl = document.getElementById('bookingCostSummary');
  if (summaryEl) {
    if (dateError) {
      summaryEl.innerHTML = `
        <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid var(--rose); padding: 0.85rem 1rem; border-radius: var(--radius-sm); color: #fb7185; font-size: 0.88rem;">
          ⚠️ ${dateError}
        </div>
      `;
      return;
    }

    summaryEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.4rem;">
        <span style="color: var(--text-muted);">${room ? room.name : 'Suite'} (${nights} night${nights > 1 ? 's' : ''}):</span>
        <span>${formatPrice(roomSub)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.4rem;">
        <span style="color: var(--text-muted);">Lavish Add-on Services:</span>
        <span>${formatPrice(servicesSub)}</span>
      </div>
      ${promoApplied ? `
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.4rem; color: #34d399;">
          <span>Privilege Code (${promoCode}):</span>
          <span>-${formatPrice(discount)}</span>
        </div>
      ` : promoCode ? `
        <div style="font-size: 0.75rem; color: var(--amber); margin-bottom: 0.4rem;">
          ⚡ Valid privilege codes: ROYAL10 (10% off), WELCOME15 (15% off), VIP20 (20% off)
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.4rem;">
        <span style="color: var(--text-muted);">Hospitality Tax (10%):</span>
        <span>${formatPrice(tax)}</span>
      </div>
      <div style="border-top: 1.5px solid var(--border-gold); padding-top: 0.75rem; margin-top: 0.5rem; display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: 800; color: var(--gold-light);">
        <span>Estimated Folio Total:</span>
        <span>${formatPrice(total)}</span>
      </div>
    `;
  }
}

function startBookingRoom(roomId) {
  state.bookingDraft.roomId = roomId;
  switchView('user-dashboard', 'user-book');

  const select = document.getElementById('bookingRoomSelect');
  if (select) {
    select.value = roomId;
    recalculateBookingTotal();
  }
}

async function submitReservation(e) {
  if (e) e.preventDefault();

  if (state.isBookingSubmitting) return;

  const roomId = document.getElementById('bookingRoomSelect').value;
  const checkInDate = document.getElementById('bookCheckIn').value;
  const checkOutDate = document.getElementById('bookCheckOut').value;
  const guests = document.getElementById('bookGuests').value;
  const guestName = document.getElementById('bookGuestName').value;
  const guestEmail = document.getElementById('bookGuestEmail').value;
  const guestPhone = document.getElementById('bookGuestPhone').value;
  const promoCode = document.getElementById('bookPromoCode').value;
  const specialRequests = document.getElementById('bookSpecialRequests').value;
  const paymentMethod = document.getElementById('bookPaymentMethod').value;
  const autoCheckIn = document.getElementById('bookAutoCheckIn')?.checked || false;

  if (!roomId || !checkInDate || !checkOutDate || !guestName || !guestEmail) {
    showToast('Please fill in all required reservation fields', 'rose');
    return;
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    showToast('Check-out date must be strictly after check-in date', 'rose');
    return;
  }

  const selectedServices = [];
  document.querySelectorAll('.booking-service-check:checked').forEach(chk => {
    selectedServices.push({
      id: chk.dataset.id,
      name: chk.dataset.name,
      price: Number(chk.dataset.price),
      quantity: 1
    });
  });

  const payload = {
    roomId,
    checkInDate,
    checkOutDate,
    guests,
    guestName,
    guestEmail,
    guestPhone,
    selectedServices,
    specialRequests,
    promoCode,
    paymentMethod,
    autoCheckIn
  };

  const submitBtn = document.querySelector('#bookingForm button[type="submit"]');
  state.isBookingSubmitting = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Securing Suite...';
  }

  try {
    const res = await api.post('/api/bookings', payload);
    if (res.success) {
      showToast(res.message, 'emerald');
      await loadInitialData();
      renderApp();

      if (res.invoice) {
        renderInvoiceModal(res.invoice);
      }

      switchUserTab('user-stay');
    } else {
      showToast(res.message || 'Booking failed', 'rose');
    }
  } catch (err) {
    showToast(err.message || 'Error processing reservation', 'rose');
  } finally {
    state.isBookingSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Confirm Reservation & Guarantee';
    }
  }
}

// 6. Checkout Tab (Express Checkout)
function renderCheckoutTab() {
  const container = document.getElementById('checkoutContainer');
  if (!container) return;

  const activeBooking = state.bookings.find(b => b.bookingStatus === 'Checked In' || b.bookingStatus === 'Confirmed');

  if (!activeBooking) {
    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1.5px dashed var(--border-gold); border-radius: var(--radius-md); padding: 3.5rem 2rem; text-align: center;">
        <span style="font-size: 3.5rem;">💳</span>
        <h3 style="margin: 1rem 0 0.5rem; font-size: 1.5rem;">No Active Stay Requiring Settlement</h3>
        <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto;">
          All current folios under your account are clear or already completed.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="max-width: 820px; margin: 0 auto; background: var(--bg-card); border: 1.5px solid var(--border-gold); border-radius: var(--radius-lg); padding: 2.5rem; box-shadow: var(--shadow-luxury);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
        <div>
          <span class="badge badge-gold">Express Departure</span>
          <h2 style="font-size: 1.9rem; margin-top: 0.35rem;">Express Checkout & Folio Settlement</h2>
          <div style="color: var(--text-muted); font-size: 0.95rem;">
            Suite ${activeBooking.roomNumber} • ${activeBooking.roomName}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase;">Booking Reference</div>
          <div style="font-family: monospace; font-size: 1.2rem; color: var(--gold-light); font-weight: 700;">${activeBooking.bookingRef}</div>
        </div>
      </div>

      <!-- Itemized Breakdown -->
      <h4 style="font-size: 1rem; color: var(--gold-light); margin-bottom: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em;">Final Stay Itemization</h4>
      <div style="background: rgba(15, 23, 42, 0.65); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 1.35rem; margin-bottom: 1.75rem;">
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.92rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <span>${activeBooking.roomName} (${activeBooking.nights} nights @ ${formatPrice(activeBooking.pricePerNight)})</span>
          <span style="font-weight: 600;">${formatPrice(activeBooking.roomSubtotal)}</span>
        </div>
        ${activeBooking.selectedServices.map(s => `
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.92rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span>${s.name} (${s.quantity}x)</span>
            <span style="font-weight: 600;">${formatPrice(s.subtotal)}</span>
          </div>
        `).join('')}
        ${activeBooking.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.92rem; color: #34d399; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span>VIP Loyalty Privileges Applied</span>
            <span>-${formatPrice(activeBooking.discountAmount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 0.92rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <span>Hospitality Tax & Tourism Levy (10%)</span>
          <span style="font-weight: 600;">${formatPrice(activeBooking.taxAmount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.85rem 0 0.25rem; font-size: 1.3rem; font-weight: 800; color: var(--gold-light);">
          <span>Total Settled in Folio</span>
          <span>${formatPrice(activeBooking.grandTotal)}</span>
        </div>
      </div>

      <!-- Rating & Review -->
      <div style="margin-bottom: 2rem;">
        <label style="font-size: 0.82rem; text-transform: uppercase; color: var(--gold-light); font-weight: 700; display: block; margin-bottom: 0.5rem;">
          Rate Your 5-Star Stay Experience: <span id="ratingDescriptor" style="color: #fff; font-weight: normal; text-transform: none;">Flawless 5-Star Experience</span>
        </label>
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;" id="checkoutStarRating">
          <span style="font-size: 2rem; cursor: pointer; color: var(--gold-primary);" onclick="setCheckoutRating(1)">★</span>
          <span style="font-size: 2rem; cursor: pointer; color: var(--gold-primary);" onclick="setCheckoutRating(2)">★</span>
          <span style="font-size: 2rem; cursor: pointer; color: var(--gold-primary);" onclick="setCheckoutRating(3)">★</span>
          <span style="font-size: 2rem; cursor: pointer; color: var(--gold-primary);" onclick="setCheckoutRating(4)">★</span>
          <span style="font-size: 2rem; cursor: pointer; color: var(--gold-primary);" onclick="setCheckoutRating(5)">★</span>
        </div>
        <input type="hidden" id="checkoutRatingVal" value="5">
        <textarea id="checkoutReviewComment" class="form-control" rows="3" placeholder="Share your experience with our general manager & concierge desk..."></textarea>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button class="btn btn-outline" onclick="viewBookingInvoice('${activeBooking.id}')">View Invoice</button>
        <button class="btn btn-primary btn-lg" onclick="executeCheckout('${activeBooking.id}')">
          Confirm Check-out & Settle Folio
        </button>
      </div>
    </div>
  `;
}

function setCheckoutRating(star) {
  document.getElementById('checkoutRatingVal').value = star;
  const stars = document.querySelectorAll('#checkoutStarRating span');
  stars.forEach((s, idx) => {
    s.style.color = idx < star ? 'var(--gold-primary)' : 'var(--text-dim)';
  });

  const desc = document.getElementById('ratingDescriptor');
  if (desc) {
    const labels = ['', 'Poor', 'Fair', 'Pleasant', 'Superb', 'Flawless 5-Star Experience'];
    desc.innerText = labels[star] || '';
  }
}

async function executeCheckout(bookingId) {
  const rating = Number(document.getElementById('checkoutRatingVal')?.value) || 5;
  const comment = document.getElementById('checkoutReviewComment')?.value || '';

  try {
    const res = await api.post(`/api/bookings/${bookingId}/checkout`, {
      paymentMethod: 'Credit Card (Instant Settlement)',
      rating,
      comment
    });

    if (res.success) {
      showToast(res.message, 'emerald');
      await loadInitialData();
      renderApp();

      if (res.invoice) {
        renderInvoiceModal(res.invoice);
      }
      switchUserTab('user-stay');
    } else {
      showToast(res.message || 'Checkout failed', 'rose');
    }
  } catch (err) {
    showToast('Error processing checkout', 'rose');
  }
}

// ==========================================================================
// ADMIN DASHBOARD RENDERING & EXECUTIVE CONTROLS
// ==========================================================================
function renderAdminDashboard() {
  renderAdminOverview();
  renderAdminEmployees();
  renderAdminCustomers();
  renderAdminBilling();
  renderAdminRooms();
}

function renderAdminOverview() {
  if (!state.stats) return;

  const kpiRev = document.getElementById('adminKpiRevenue');
  const kpiOcc = document.getElementById('adminKpiOccupancy');
  const kpiStaff = document.getElementById('adminKpiStaff');
  const kpiBookings = document.getElementById('adminKpiBookings');

  if (kpiRev) kpiRev.innerText = formatPrice(state.stats.financials.totalRevenue);
  if (kpiOcc) kpiOcc.innerText = `${state.stats.occupancyRate}%`;
  if (kpiStaff) kpiStaff.innerText = `${state.stats.operations.activeStaff} / ${state.stats.operations.totalEmployees}`;
  if (kpiBookings) kpiBookings.innerText = `${state.stats.operations.activeBookings}`;

  // Render Revenue Trend Chart
  const chartWrap = document.getElementById('revenueTrendChart');
  if (chartWrap && state.stats.financials.revenueTrends) {
    const maxRev = Math.max(...state.stats.financials.revenueTrends.map(t => t.revenue), 100000);
    chartWrap.innerHTML = state.stats.financials.revenueTrends.map(t => {
      const heightPct = Math.round((t.revenue / maxRev) * 100);
      return `
        <div class="chart-bar-group">
          <div class="chart-bar" style="height: ${Math.max(heightPct, 15)}%;">
            <div class="chart-bar-tooltip">
              ${formatPrice(t.revenue)} (${t.occupancy}% Occupancy)
            </div>
          </div>
          <span class="chart-label">${t.month}</span>
        </div>
      `;
    }).join('');
  }

  // Room Status Quick Grid
  const roomGrid = document.getElementById('adminRoomStatusGrid');
  if (roomGrid) {
    roomGrid.innerHTML = state.rooms.map(room => {
      const badgeClass = room.status === 'Available' ? 'badge-emerald' : room.status === 'Occupied' ? 'badge-rose' : 'badge-amber';
      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 1.1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span style="font-family: var(--font-serif); font-size: 1.1rem; font-weight: 800;">#${room.roomNumber}</span>
            <span class="badge ${badgeClass}">${room.status}</span>
          </div>
          <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">${room.name}</div>
          <div style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 0.65rem;">${formatPrice(room.pricePerNight)}/night • Floor ${room.floor}</div>
          <select class="form-control" style="font-size: 0.75rem; padding: 0.3rem 0.5rem;" onchange="changeRoomStatus('${room.id}', this.value)">
            <option value="Available" ${room.status === 'Available' ? 'selected' : ''}>Available</option>
            <option value="Occupied" ${room.status === 'Occupied' ? 'selected' : ''}>Occupied</option>
            <option value="Cleaning" ${room.status === 'Cleaning' ? 'selected' : ''}>Cleaning</option>
            <option value="Maintenance" ${room.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
          </select>
        </div>
      `;
    }).join('');
  }

  // Recent Bookings Feed
  const recentFeed = document.getElementById('adminRecentBookings');
  if (recentFeed && state.stats.recentBookings) {
    recentFeed.innerHTML = state.stats.recentBookings.map(b => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
        <div>
          <div style="font-size: 0.9rem; font-weight: 600;">${b.customerName} (Room ${b.roomNumber})</div>
          <div style="font-size: 0.76rem; color: var(--text-dim);">${b.bookingRef} • ${b.checkInDate} to ${b.checkOutDate}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--gold-light);">${formatPrice(b.grandTotal)}</div>
          <span class="badge ${b.bookingStatus === 'Checked In' ? 'badge-emerald' : 'badge-gold'}" style="font-size: 0.65rem;">${b.bookingStatus}</span>
        </div>
      </div>
    `).join('');
  }

  // Activity Audit Logs
  const logFeed = document.getElementById('adminActivityLogFeed');
  if (logFeed) {
    if (state.activityLogs.length === 0) {
      logFeed.innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem;">All systems operational. No audit flags.</div>';
    } else {
      logFeed.innerHTML = state.activityLogs.slice(0, 5).map(log => {
        let dotColor = '#10b981';
        if (log.action.includes('CHECKOUT')) dotColor = '#f59e0b';
        if (log.action.includes('BULK')) dotColor = '#6366f1';
        return `
          <div class="activity-log-item">
            <span class="activity-log-dot" style="background: ${dotColor};"></span>
            <div>
              <div style="font-size: 0.82rem; font-weight: 600; color: #fff;">${log.details}</div>
              <div class="activity-log-time">By ${log.actor || 'System'} • ${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

async function changeRoomStatus(roomId, newStatus) {
  try {
    const res = await api.put(`/api/rooms/${roomId}`, { status: newStatus });
    if (res.success) {
      showToast(`Room status updated to ${newStatus}`, 'emerald');
      await loadInitialData();
      renderApp();
    }
  } catch (err) {
    showToast('Failed to update room status', 'rose');
  }
}

async function dispatchAllHousekeeping() {
  try {
    const res = await api.post('/api/rooms/bulk-status', { fromStatus: 'Cleaning', toStatus: 'Available' });
    if (res.success) {
      showToast(res.message, 'emerald');
      await loadInitialData();
      renderApp();
    }
  } catch (err) {
    showToast('Failed to dispatch housekeeping', 'rose');
  }
}

function exportFinancialAudit(format = 'csv') {
  window.open(`/api/billing/export?format=${format}`, '_blank');
}

// Employee Management (PDF Feature 1)
function renderAdminEmployees() {
  const tableBody = document.getElementById('adminEmployeeTableBody');
  if (!tableBody) return;

  const search = document.getElementById('adminEmployeeSearch')?.value.toLowerCase() || '';
  const deptFilter = document.getElementById('adminEmployeeDeptFilter')?.value || 'all';
  const shiftFilter = document.getElementById('adminEmployeeShiftFilter')?.value || 'all';

  let filtered = state.employees.filter(emp => {
    if (search && !emp.name.toLowerCase().includes(search) && !emp.staffId.toLowerCase().includes(search) && !emp.role.toLowerCase().includes(search)) return false;
    if (deptFilter !== 'all' && emp.department.toLowerCase() !== deptFilter.toLowerCase()) return false;
    if (shiftFilter !== 'all' && !emp.shift.toLowerCase().includes(shiftFilter.toLowerCase())) return false;
    return true;
  });

  tableBody.innerHTML = filtered.map(emp => `
    <tr>
      <td><span style="font-family: monospace; font-weight: 700; color: var(--gold-light);">${emp.staffId}</span></td>
      <td>
        <div style="font-weight: 600;">${emp.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${emp.email}</div>
      </td>
      <td>${emp.role}</td>
      <td><span class="badge badge-gold">${emp.department}</span></td>
      <td>${emp.shift}</td>
      <td style="font-weight: 700;">${formatPrice(emp.salary)}/mo</td>
      <td>
        <span class="badge ${emp.status === 'Active' ? 'badge-emerald' : 'badge-amber'}">
          ${emp.status}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn btn-outline btn-sm" onclick="openEditEmployeeModal('${emp.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${emp.id}')">Remove</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Customer Management (PDF Feature 2)
function renderAdminCustomers() {
  const tableBody = document.getElementById('adminCustomerTableBody');
  if (!tableBody) return;

  const search = document.getElementById('adminCustomerSearch')?.value.toLowerCase() || '';
  const tierFilter = document.getElementById('adminCustomerTierFilter')?.value || 'all';

  let filtered = state.customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search) && !c.email.toLowerCase().includes(search) && (!c.phone || !c.phone.includes(search))) return false;
    if (tierFilter !== 'all' && c.vipTier.toLowerCase() !== tierFilter.toLowerCase()) return false;
    return true;
  });

  tableBody.innerHTML = filtered.map(c => `
    <tr>
      <td>
        <div style="font-weight: 600;">${c.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${c.email} • ${c.phone || 'No phone'}</div>
      </td>
      <td>
        <span class="badge ${c.vipTier === 'Platinum' ? 'badge-indigo' : c.vipTier === 'Gold' ? 'badge-gold' : 'badge-emerald'}">
          ${c.vipTier} VIP
        </span>
      </td>
      <td>${c.totalStays} Stays</td>
      <td style="font-weight: 700; color: var(--gold-light);">${formatPrice(c.totalSpent)}</td>
      <td>
        <span class="badge ${c.currentStatus === 'Checked In' ? 'badge-emerald' : c.currentStatus === 'Reserved' ? 'badge-gold' : 'badge-subtle'}">
          ${c.currentStatus} ${c.activeRoom ? `(Rm ${c.activeRoom})` : ''}
        </span>
      </td>
      <td>
        <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
          ${c.notes || 'None'}
        </div>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openCustomerDetailsModal('${c.id}')">View Folio</button>
      </td>
    </tr>
  `).join('');
}

// Billing & Transactions (PDF Feature 3)
function renderAdminBilling() {
  const tableBody = document.getElementById('adminBillingTableBody');
  if (!tableBody) return;

  const search = document.getElementById('adminBillingSearch')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('adminBillingStatusFilter')?.value || 'all';

  let filtered = state.invoices.filter(inv => {
    if (search && !inv.invoiceNumber.toLowerCase().includes(search) && !inv.customerName.toLowerCase().includes(search) && !inv.roomNumber.includes(search)) return false;
    if (statusFilter !== 'all' && inv.paymentStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  tableBody.innerHTML = filtered.map(inv => `
    <tr>
      <td><span style="font-family: monospace; font-weight: 700; color: var(--gold-light);">${inv.invoiceNumber}</span></td>
      <td>
        <div style="font-weight: 600;">${inv.customerName}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${inv.customerEmail}</div>
      </td>
      <td>Room ${inv.roomNumber}</td>
      <td>${inv.issueDate}</td>
      <td style="font-weight: 700;">${formatPrice(inv.totalAmount)}</td>
      <td>
        <span class="badge ${inv.paymentStatus === 'Paid' ? 'badge-emerald' : 'badge-amber'}">
          ${inv.paymentStatus}
        </span>
      </td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="renderInvoiceModalById('${inv.id}')">Folio Receipt</button>
      </td>
    </tr>
  `).join('');
}

// Admin Rooms Management
function renderAdminRooms() {
  const container = document.getElementById('adminRoomsTableBody');
  if (!container) return;

  container.innerHTML = state.rooms.map(room => `
    <tr>
      <td><span style="font-family: var(--font-serif); font-weight: 800; font-size: 1.1rem;">#${room.roomNumber}</span></td>
      <td>
        <div style="font-weight: 600;">${room.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">${room.type} • Floor ${room.floor}</div>
      </td>
      <td style="font-weight: 700; color: var(--gold-light);">${formatPrice(room.pricePerNight)}</td>
      <td>${room.capacity} Guests</td>
      <td>
        <select class="form-control" style="font-size: 0.8rem; padding: 0.35rem 0.65rem;" onchange="changeRoomStatus('${room.id}', this.value)">
          <option value="Available" ${room.status === 'Available' ? 'selected' : ''}>Available</option>
          <option value="Occupied" ${room.status === 'Occupied' ? 'selected' : ''}>Occupied</option>
          <option value="Cleaning" ${room.status === 'Cleaning' ? 'selected' : ''}>Cleaning</option>
          <option value="Maintenance" ${room.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
        </select>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openEditRoomRateModal('${room.id}')">Update Rate</button>
      </td>
    </tr>
  `).join('');
}

// ==========================================================================
// MODAL CONTROLS & FOLIO PRINTING
// ==========================================================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  if (modalId === 'spatialTourModal' && window.Aura3D && typeof Aura3D.closeSpatialTour === 'function') {
    Aura3D.closeSpatialTour();
  }
}

function openRoomDetailsModal(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;

  const content = document.getElementById('roomDetailsModalContent');
  if (!content) return;

  content.innerHTML = `
    <div style="margin-bottom: 1.5rem; border-radius: var(--radius-md); overflow: hidden; height: 320px;">
      <img src="${room.image}" alt="${room.name}" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
      <div>
        <span class="badge badge-gold">${room.type} • Floor ${room.floor}</span>
        <h2 style="font-size: 1.8rem; margin-top: 0.4rem;">${room.name}</h2>
        <div style="color: var(--text-muted); font-size: 0.9rem;">${room.view} • ${room.sizeSqFt} sq. ft</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 2rem; font-weight: 800; font-family: var(--font-serif); color: var(--gold-primary);">${formatPrice(room.pricePerNight)}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">PER NIGHT</div>
      </div>
    </div>
    <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 1.5rem;">${room.description}</p>
    <h4 style="font-size: 1rem; color: var(--gold-light); margin-bottom: 0.75rem; text-transform: uppercase;">Lavish Suite Amenities</h4>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.65rem; margin-bottom: 2rem;">
      ${room.amenities.map(a => `
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: var(--text-main);">
          <span style="color: var(--gold-primary);">✓</span> ${a}
        </div>
      `).join('')}
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 1rem; flex-wrap: wrap;">
      <button class="btn btn-outline" onclick="closeModal('roomDetailsModal')">Close</button>
      <button class="btn btn-outline" onclick="closeModal('roomDetailsModal'); Aura3D.openSpatialTour('${room.type === 'Presidential' ? 'penthouse' : 'circadian'}')">
        ✦ Launch 3D Spatial Walkthrough
      </button>
      <button class="btn btn-primary" onclick="closeModal('roomDetailsModal'); startBookingRoom('${room.id}')">Reserve This Suite</button>
    </div>
  `;

  openModal('roomDetailsModal');
}

function renderInvoiceModalById(invoiceId) {
  const inv = state.invoices.find(i => i.id === invoiceId);
  if (inv) renderInvoiceModal(inv);
}

function viewBookingInvoice(bookingId) {
  const bk = state.bookings.find(b => b.id === bookingId);
  if (bk) {
    let inv = state.invoices.find(i => i.id === bk.invoiceId || i.bookingRef === bk.bookingRef);
    if (!inv) {
      inv = {
        invoiceNumber: `INV-${bk.bookingRef}`,
        customerName: bk.customerName,
        customerEmail: bk.customerEmail,
        roomNumber: bk.roomNumber,
        issueDate: bk.createdAt ? bk.createdAt.split('T')[0] : '2026-10-18',
        dueDate: bk.checkOutDate,
        lineItems: [
          { description: `${bk.roomName} (${bk.nights} nights @ ${formatPrice(bk.pricePerNight)})`, amount: bk.roomSubtotal },
          ...bk.selectedServices.map(s => ({ description: `${s.name} (${s.quantity}x)`, amount: s.subtotal })),
          ...(bk.discountAmount > 0 ? [{ description: 'VIP Privilege Credit', amount: -bk.discountAmount }] : []),
          { description: 'Luxury Hospitality Tax (10%)', amount: bk.taxAmount }
        ],
        subtotal: bk.roomSubtotal + bk.servicesSubtotal,
        tax: bk.taxAmount,
        discount: bk.discountAmount || 0,
        totalAmount: bk.grandTotal,
        amountPaid: bk.grandTotal,
        balanceDue: 0,
        paymentMethod: 'Credit Card Guarantee',
        paymentStatus: bk.paymentStatus || 'Paid',
        transactionId: `TXN-${bk.bookingRef}`
      };
    }
    renderInvoiceModal(inv);
  }
}

function renderInvoiceModal(invoice) {
  const printArea = document.getElementById('printableInvoiceArea');
  if (!printArea) return;

  printArea.innerHTML = `
    <div class="invoice-folio">
      <div class="invoice-header">
        <div>
          <div class="invoice-logo-title">AURA GRAND</div>
          <div style="font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; color: #64748b; margin-top: 0.25rem;">
            HOTEL & LUXURY RESIDENCES
          </div>
          <div style="font-size: 0.85rem; color: #475569; margin-top: 0.5rem;">
            100 Ocean Crest Boulevard, Suite 1000<br>
            Direct: +1 (555) 019-2800 • Concierge: vip@auragrand.com
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.6rem; font-weight: 800; color: #0f172a;">GUEST FOLIO</div>
          <div style="font-family: monospace; font-size: 1.1rem; font-weight: 700; color: #aa820a; margin: 0.25rem 0;">
            ${invoice.invoiceNumber}
          </div>
          <div style="font-size: 0.85rem; color: #64748b;">Issue Date: ${invoice.issueDate}</div>
          <div style="font-size: 0.85rem; color: #64748b;">Settlement: <span style="font-weight: 700; color: #10b981;">${invoice.paymentStatus.toUpperCase()}</span></div>
        </div>
      </div>

      <div class="invoice-meta-grid">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 0.25rem;">Billed Resident</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">${invoice.customerName}</div>
          <div style="font-size: 0.88rem; color: #475569;">${invoice.customerEmail}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 0.25rem;">Stay Details</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">Suite #${invoice.roomNumber}</div>
          <div style="font-size: 0.88rem; color: #475569;">Payment: ${invoice.paymentMethod || 'Credit Card'}</div>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Item / Service Description</th>
            <th style="text-align: right;">Amount (${state.currency})</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineItems.map(item => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: right; font-weight: 600;">${formatPrice(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="invoice-totals">
        <div class="invoice-total-row">
          <span>Subtotal:</span>
          <span>${formatPrice(invoice.subtotal)}</span>
        </div>
        ${invoice.discount > 0 ? `
          <div class="invoice-total-row" style="color: #059669;">
            <span>Privilege Discount:</span>
            <span>-${formatPrice(invoice.discount)}</span>
          </div>
        ` : ''}
        <div class="invoice-total-row">
          <span>Hospitality Tax & Tourism Levy (10%):</span>
          <span>${formatPrice(invoice.tax)}</span>
        </div>
        <div class="invoice-total-row grand">
          <span>Total Folio Amount:</span>
          <span>${formatPrice(invoice.totalAmount)}</span>
        </div>
        <div class="invoice-total-row" style="font-size: 0.95rem; font-weight: 700; color: #059669; margin-top: 0.5rem;">
          <span>Paid in Full:</span>
          <span>${formatPrice(invoice.amountPaid)}</span>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; margin-top: 3rem; padding-top: 1.5rem; text-align: center; font-size: 0.85rem; color: #64748b;">
        Thank you for choosing Aura Grand Hotel & Residences. We hope to welcome you back soon.
      </div>
    </div>
  `;

  openModal('invoiceModal');
}

function printInvoice() {
  window.print();
}

// Employee Form Modals
function openAddEmployeeModal() {
  const form = document.getElementById('employeeForm');
  if (form) form.reset();
  document.getElementById('empFormId').value = '';
  document.getElementById('empModalTitle').innerText = 'Add New Hotel Staff Record';
  openModal('employeeModal');
}

function openEditEmployeeModal(empId) {
  const emp = state.employees.find(e => e.id === empId);
  if (!emp) return;

  document.getElementById('empFormId').value = emp.id;
  document.getElementById('empName').value = emp.name;
  document.getElementById('empRole').value = emp.role;
  document.getElementById('empDept').value = emp.department;
  document.getElementById('empShift').value = emp.shift;
  document.getElementById('empSalary').value = emp.salary;
  document.getElementById('empContact').value = emp.contact || '';
  document.getElementById('empEmail').value = emp.email || '';
  document.getElementById('empNotes').value = emp.notes || '';
  document.getElementById('empModalTitle').innerText = `Edit Staff: ${emp.name} (${emp.staffId})`;

  openModal('employeeModal');
}

async function saveEmployee(e) {
  e.preventDefault();
  const empId = document.getElementById('empFormId').value;
  const payload = {
    name: document.getElementById('empName').value,
    role: document.getElementById('empRole').value,
    department: document.getElementById('empDept').value,
    shift: document.getElementById('empShift').value,
    salary: Number(document.getElementById('empSalary').value),
    contact: document.getElementById('empContact').value,
    email: document.getElementById('empEmail').value,
    notes: document.getElementById('empNotes').value
  };

  try {
    let res;
    if (empId) {
      res = await api.put(`/api/employees/${empId}`, payload);
    } else {
      res = await api.post('/api/employees', payload);
    }

    if (res.success) {
      showToast(res.message, 'emerald');
      closeModal('employeeModal');
      await loadAdminData();
      renderAdminDashboard();
    } else {
      showToast(res.message || 'Error saving staff record', 'rose');
    }
  } catch (err) {
    showToast('Error saving staff record', 'rose');
  }
}

async function deleteEmployee(empId) {
  if (!confirm('Are you sure you wish to remove this staff record?')) return;

  try {
    const res = await api.delete(`/api/employees/${empId}`);
    if (res.success) {
      showToast(res.message, 'emerald');
      await loadAdminData();
      renderAdminDashboard();
    }
  } catch (err) {
    showToast('Failed to delete staff member', 'rose');
  }
}

// Customer Details Modal
function openCustomerDetailsModal(custId) {
  const cust = state.customers.find(c => c.id === custId);
  if (!cust) return;

  const content = document.getElementById('customerDetailsContent');
  if (!content) return;

  content.innerHTML = `
    <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
      <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--gold-gradient); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800; color: #0b0f19;">
        ${cust.name.charAt(0)}
      </div>
      <div>
        <span class="badge ${cust.vipTier === 'Platinum' ? 'badge-indigo' : cust.vipTier === 'Gold' ? 'badge-gold' : 'badge-emerald'}">${cust.vipTier} VIP Patron</span>
        <h3 style="font-size: 1.5rem; margin-top: 0.25rem;">${cust.name}</h3>
        <div style="color: var(--text-muted); font-size: 0.88rem;">${cust.email} • ${cust.phone || 'No phone'}</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--gold-light);">Total Stays</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">${cust.totalStays}</div>
      </div>
      <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--gold-light);">Lifetime Spend</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold-primary);">${formatPrice(cust.totalSpent)}</div>
      </div>
      <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--gold-light);">Loyalty Points</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--emerald);">${cust.loyaltyPoints}</div>
      </div>
    </div>

    <div style="margin-bottom: 1.5rem;">
      <label style="font-size: 0.75rem; text-transform: uppercase; color: var(--gold-light); font-weight: 700; display: block; margin-bottom: 0.4rem;">Hospitality Notes & Preferences</label>
      <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.9rem; color: var(--text-muted);">
        ${cust.notes || 'No specific preferences recorded.'}
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 1rem;">
      <button class="btn btn-primary" onclick="closeModal('customerDetailsModal')">Close</button>
    </div>
  `;

  openModal('customerDetailsModal');
}

// Room Rate Modal
function openEditRoomRateModal(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;

  const content = document.getElementById('editRoomRateContent');
  if (!content) return;

  content.innerHTML = `
    <h3 style="margin-bottom: 1rem;">Adjust Nightly Rate for Suite #${room.roomNumber}</h3>
    <div style="margin-bottom: 1.25rem;">${room.name}</div>
    <div class="form-group">
      <label>Nightly Price ($ USD)</label>
      <input type="number" id="newRoomPrice" class="form-control" value="${room.pricePerNight}">
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
      <button class="btn btn-outline" onclick="closeModal('editRoomRateModal')">Cancel</button>
      <button class="btn btn-primary" onclick="saveRoomRate('${room.id}')">Update Rate</button>
    </div>
  `;

  openModal('editRoomRateModal');
}

async function saveRoomRate(roomId) {
  const newPrice = Number(document.getElementById('newRoomPrice').value);
  try {
    const res = await api.put(`/api/rooms/${roomId}`, { pricePerNight: newPrice });
    if (res.success) {
      showToast('Room rate updated successfully', 'emerald');
      closeModal('editRoomRateModal');
      await loadInitialData();
      renderApp();
    }
  } catch (err) {
    showToast('Failed to update rate', 'rose');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Links - Exact Single-Active Selection
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      const tab = link.dataset.tab;

      if (view === 'user-dashboard' && tab) {
        switchView('user-dashboard', tab);
      } else if (view) {
        switchView(view);
      }
    });
  });

  // User Dashboard Tabs
  document.querySelectorAll('#user-dashboard-view .subnav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabId = e.target.dataset.tab;
      if (tabId) switchUserTab(tabId);
    });
  });

  // Admin Dashboard Tabs
  document.querySelectorAll('#admin-dashboard-view .subnav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabId = e.target.dataset.tab;
      if (tabId) switchAdminTab(tabId);
    });
  });

  // Close persona dropdown when clicking anywhere outside
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.persona-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      closePersonaDropdown();
    }
  });

  // Filter Listeners
  document.getElementById('userRoomTypeFilter')?.addEventListener('change', renderUserRoomsList);
  document.getElementById('userRoomPriceFilter')?.addEventListener('input', renderUserRoomsList);
  document.getElementById('userRoomCapacityFilter')?.addEventListener('change', renderUserRoomsList);

  document.getElementById('vacantCheckIn')?.addEventListener('change', renderVacantRoomsMatrix);
  document.getElementById('vacantCheckOut')?.addEventListener('change', renderVacantRoomsMatrix);
  document.getElementById('vacantGuests')?.addEventListener('change', renderVacantRoomsMatrix);

  document.getElementById('bookingRoomSelect')?.addEventListener('change', recalculateBookingTotal);
  document.getElementById('bookCheckIn')?.addEventListener('change', recalculateBookingTotal);
  document.getElementById('bookCheckOut')?.addEventListener('change', recalculateBookingTotal);
  document.getElementById('bookPromoCode')?.addEventListener('input', recalculateBookingTotal);

  document.getElementById('bookingForm')?.addEventListener('submit', submitReservation);

  document.getElementById('adminEmployeeSearch')?.addEventListener('input', renderAdminEmployees);
  document.getElementById('adminEmployeeDeptFilter')?.addEventListener('change', renderAdminEmployees);
  document.getElementById('adminEmployeeShiftFilter')?.addEventListener('change', renderAdminEmployees);

  document.getElementById('adminCustomerSearch')?.addEventListener('input', renderAdminCustomers);
  document.getElementById('adminCustomerTierFilter')?.addEventListener('change', renderAdminCustomers);

  document.getElementById('adminBillingSearch')?.addEventListener('input', renderAdminBilling);
  document.getElementById('adminBillingStatusFilter')?.addEventListener('change', renderAdminBilling);

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
}

// ==========================================================================
// 8. UPSCALE MODULES (AURA AI CONCIERGE, WHITELABEL, NIGHT AUDIT & PRINT)
// ==========================================================================

// Helper: Open official folio from stay details
function viewBookingInvoice(bookingId) {
  const invoice = state.invoices.find(i => i.bookingId === bookingId) ||
                  state.invoices[0];
  if (invoice) {
    renderInvoiceModalById(invoice.id);
  } else {
    showToast('Folio is being generated. Accessing latest statement...', 'gold');
    if (state.invoices.length > 0) renderInvoiceModalById(state.invoices[0].id);
  }
}

// AI Luxury Concierge Controller
function toggleAiConcierge() {
  const modal = document.getElementById('aiConciergeModal');
  if (modal) {
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
      setTimeout(() => document.getElementById('aiChatInput')?.focus(), 200);
    }
  }
}

function closeAiConcierge() {
  document.getElementById('aiConciergeModal')?.classList.remove('active');
}

// HTML Sanitizer to prevent XSS across chat and user inputs
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('aiChatInput');
  if (input) {
    input.value = promptText;
    handleAiChatSubmit(new Event('submit'));
  }
}

async function handleAiChatSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('aiChatInput');
  const chatMessages = document.getElementById('aiChatMessages');
  if (!input || !chatMessages) return;

  const query = input.value.trim();
  if (!query) return;

  // Append User message
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'ai-msg user';
  userMsgEl.innerHTML = `
    <div class="ai-msg-avatar" style="background: var(--gold-primary); color: #000; font-weight: 700;">
      ${(state.currentUser?.name || 'G')[0]}
    </div>
    <div class="ai-msg-bubble">${escapeHtml(query)}</div>
  `;
  chatMessages.appendChild(userMsgEl);
  input.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-msg bot';
  typingEl.id = 'aiTypingIndicator';
  typingEl.innerHTML = `
    <div class="ai-msg-avatar">🛎️</div>
    <div class="ai-msg-bubble" style="font-style: italic; color: var(--gold-light);">
      Aura Butler is consulting resort reservations & culinary brigade...
    </div>
  `;
  chatMessages.appendChild(typingEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await api.post('/api/services/ai-concierge', {
      query,
      customerName: state.currentUser?.name || 'Esteemed Guest'
    });

    typingEl.remove();

    if (res.success && res.concierge) {
      const botMsgEl = document.createElement('div');
      botMsgEl.className = 'ai-msg bot';

      let actionHtml = '';
      if (res.concierge.suggestion) {
        const sug = res.concierge.suggestion;
        if (sug.action === 'order_service') {
          actionHtml = `
            <div class="ai-action-card">
              <div>
                <div style="font-size: 0.82rem; font-weight: 700; color: #fff;">${sug.title}</div>
                <div style="font-size: 0.74rem; color: var(--gold-primary);">${sug.price} • In-Suite Delivery</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="dispatchAiServiceOrder('${sug.serviceId}')">
                Dispatch Order ✦
              </button>
            </div>
          `;
        } else if (sug.action === 'navigate_tab') {
          actionHtml = `
            <div class="ai-action-card">
              <div style="font-size: 0.82rem; font-weight: 600; color: #fff;">${sug.title}</div>
              <button class="btn btn-outline btn-sm" onclick="navigateAiTab('${sug.tab}')">
                Open Portal →
              </button>
            </div>
          `;
        }
      }

      botMsgEl.innerHTML = `
        <div class="ai-msg-avatar">🛎️</div>
        <div class="ai-msg-bubble">
          ${res.concierge.reply}
          ${actionHtml}
        </div>
      `;
      chatMessages.appendChild(botMsgEl);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  } catch (err) {
    typingEl.remove();
    showToast('Concierge is temporarily engaged. Please call butler desk.', 'rose');
  }
}

function dispatchAiServiceOrder(serviceId) {
  closeAiConcierge();
  openServiceOrderModal(serviceId);
}

function navigateAiTab(tabName) {
  closeAiConcierge();
  switchView('user-dashboard', tabName);
}

// White-Label Brand Studio Controller
let activeSelectedTheme = 'gold';

function openWhitelabelModal() {
  const modal = document.getElementById('whitelabelModal');
  if (!modal) return;

  const stored = JSON.parse(localStorage.getItem('aura_whitelabel') || '{}');
  if (stored.hotelName) document.getElementById('wlHotelName').value = stored.hotelName;
  if (stored.tagline) document.getElementById('wlTagline').value = stored.tagline;
  if (stored.currency) document.getElementById('wlCurrency').value = stored.currency;
  if (stored.address) document.getElementById('wlAddress').value = stored.address;

  modal.classList.add('active');
}

function selectThemeSwatch(themeKey, el) {
  activeSelectedTheme = themeKey;
  document.querySelectorAll('.theme-swatch').forEach(sw => sw.classList.remove('active'));
  el?.classList.add('active');
}

function handleWhitelabelSubmit(e) {
  e.preventDefault();
  const hotelName = document.getElementById('wlHotelName').value.trim() || 'AURA GRAND';
  const tagline = document.getElementById('wlTagline').value.trim() || 'Hotel & Residences';
  const currency = document.getElementById('wlCurrency').value || 'USD';
  const address = document.getElementById('wlAddress').value.trim() || '100 Ocean Crest Boulevard';

  const config = {
    hotelName,
    tagline,
    theme: activeSelectedTheme,
    currency,
    address
  };

  localStorage.setItem('aura_whitelabel', JSON.stringify(config));
  applyWhitelabelConfig(config);
  closeModal('whitelabelModal');
  showToast(`Brand Studio: Successfully rebranded to '${hotelName}'!`, 'emerald');
}

function resetWhitelabelDefaults() {
  localStorage.removeItem('aura_whitelabel');
  applyWhitelabelConfig({
    hotelName: 'AURA GRAND',
    tagline: 'Hotel & Residences',
    theme: 'gold',
    currency: 'USD',
    address: '100 Ocean Crest Boulevard'
  });
  closeModal('whitelabelModal');
  showToast('Reset to default Haute Obsidian & Gold brand identity', 'gold');
}

function applyStoredWhitelabel() {
  const stored = localStorage.getItem('aura_whitelabel');
  if (stored) {
    try {
      applyWhitelabelConfig(JSON.parse(stored));
    } catch (e) {
      console.warn('Whitelabel load error:', e);
    }
  }
}

function applyWhitelabelConfig(cfg) {
  const root = document.documentElement;

  // Apply Theme CSS Custom Properties
  if (cfg.theme === 'emerald') {
    root.style.setProperty('--gold-primary', '#10b981');
    root.style.setProperty('--gold-light', '#6ee7b7');
    root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #10b981 0%, #059669 100%)');
    root.style.setProperty('--gold-glow', '0 0 25px rgba(16, 185, 129, 0.4)');
    root.style.setProperty('--border-gold', 'rgba(16, 185, 129, 0.45)');
  } else if (cfg.theme === 'sapphire') {
    root.style.setProperty('--gold-primary', '#38bdf8');
    root.style.setProperty('--gold-light', '#bae6fd');
    root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)');
    root.style.setProperty('--gold-glow', '0 0 25px rgba(56, 189, 248, 0.4)');
    root.style.setProperty('--border-gold', 'rgba(56, 189, 248, 0.45)');
  } else if (cfg.theme === 'rosegold') {
    root.style.setProperty('--gold-primary', '#fb7185');
    root.style.setProperty('--gold-light', '#fecdd3');
    root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)');
    root.style.setProperty('--gold-glow', '0 0 25px rgba(251, 113, 133, 0.4)');
    root.style.setProperty('--border-gold', 'rgba(251, 113, 133, 0.45)');
  } else {
    // Default Gold
    root.style.setProperty('--gold-primary', '#d4af37');
    root.style.setProperty('--gold-light', '#f9e8a2');
    root.style.setProperty('--gold-gradient', 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)');
    root.style.setProperty('--gold-glow', '0 0 25px rgba(212, 175, 55, 0.4)');
    root.style.setProperty('--border-gold', 'rgba(212, 175, 55, 0.45)');
  }

  // Update Brand Text Elements across Navbar & Footer
  document.querySelectorAll('.brand-info h1, .luxury-footer h3').forEach(el => {
    el.innerText = cfg.hotelName;
  });
  document.querySelectorAll('.brand-info span').forEach(el => {
    el.innerText = cfg.tagline;
  });

  if (cfg.currency && cfg.currency !== state.currency) {
    changeCurrency(cfg.currency);
  }
}

// Night Audit & Yield Optimization Controller
function renderNightAuditPane() {
  const rooms = state.rooms || [];
  const bookings = state.bookings || [];
  const invoices = state.invoices || [];

  const totalRooms = rooms.length || 8;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const activeStays = bookings.filter(b => b.bookingStatus === 'Checked In');

  const totalRoomRevenue = activeStays.reduce((sum, b) => sum + (Number(b.roomSubtotal) || 0), 0);
  const totalAncillaryRevenue = activeStays.reduce((sum, b) => sum + (Number(b.servicesSubtotal) || 0), 0);

  const adr = occupiedRooms > 0 ? Math.round(totalRoomRevenue / occupiedRooms) : 490;
  const revpar = Math.round(totalRoomRevenue / (totalRooms || 1)) || 180;
  const alos = activeStays.length > 0 ? (activeStays.reduce((sum, b) => sum + (Number(b.nights) || 1), 0) / activeStays.length).toFixed(1) : '2.5';
  const gopForecast = Math.round((revpar || 250) * totalRooms * 30);

  const kpiRevPar = document.getElementById('auditKpiRevPar');
  const kpiAdr = document.getElementById('auditKpiAdr');
  const kpiAlos = document.getElementById('auditKpiAlos');
  const kpiGop = document.getElementById('auditKpiGop');

  if (kpiRevPar) kpiRevPar.innerText = formatPrice(revpar);
  if (kpiAdr) kpiAdr.innerText = formatPrice(adr);
  if (kpiAlos) kpiAlos.innerText = `${alos} Nts`;
  if (kpiGop) kpiGop.innerText = formatPrice(gopForecast);

  const ledgerBody = document.getElementById('nightAuditLedgerBody');
  if (ledgerBody) {
    const taxTotal = Math.round((totalRoomRevenue + totalAncillaryRevenue) * 0.10);
    const totalSettled = invoices.reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);
    const totalDue = invoices.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);

    ledgerBody.innerHTML = `
      <tr>
        <td><strong>Room Charge Daily Postings</strong></td>
        <td>${activeStays.length} Suites In-House</td>
        <td>${formatPrice(totalRoomRevenue)}</td>
        <td>${formatPrice(Math.round(totalRoomRevenue * 0.10))}</td>
        <td style="font-weight: 700; color: var(--gold-light);">${formatPrice(Math.round(totalRoomRevenue * 1.10))}</td>
        <td><span class="badge badge-emerald">Audited & Posted</span></td>
      </tr>
      <tr>
        <td><strong>Lavish Ancillary Services & Dining</strong></td>
        <td>Food, Beverage, Spa, Chauffeur</td>
        <td>${formatPrice(totalAncillaryRevenue)}</td>
        <td>${formatPrice(Math.round(totalAncillaryRevenue * 0.10))}</td>
        <td style="font-weight: 700; color: var(--gold-light);">${formatPrice(Math.round(totalAncillaryRevenue * 1.10))}</td>
        <td><span class="badge badge-emerald">Audited & Dispatched</span></td>
      </tr>
      <tr>
        <td><strong>Luxury City Tourism & Hospitality Tax</strong></td>
        <td>Standard 10% Statutory Levy</td>
        <td>-</td>
        <td>-</td>
        <td style="font-weight: 700; color: #38bdf8;">${formatPrice(taxTotal)}</td>
        <td><span class="badge badge-indigo">Remitted</span></td>
      </tr>
      <tr style="background: rgba(212, 175, 55, 0.08); font-weight: 800;">
        <td><strong>Total Settled Revenue to Date</strong></td>
        <td>${invoices.length} Folios Processed</td>
        <td colspan="2">-</td>
        <td style="font-size: 1.15rem; color: var(--gold-light);">${formatPrice(totalSettled)}</td>
        <td><span class="badge badge-emerald">Balanced</span></td>
      </tr>
    `;
  }
}

async function executeNightAudit() {
  showToast('Initiating automated Night Audit & RevPAR reconciliation...', 'gold');
  try {
    const res = await api.post('/api/stats/night-audit', {
      auditorName: state.currentUser?.name || 'Chief Financial Officer'
    });

    if (res.success && res.audit) {
      showToast(res.message, 'emerald');
      renderNightAuditCertificate(res.audit);
      openModal('nightAuditCertificateModal');
      await loadInitialData();
      renderApp();
    }
  } catch (err) {
    showToast('Failed to execute Night Audit', 'rose');
  }
}

function renderNightAuditCertificate(audit) {
  const container = document.getElementById('printableNightAuditArea');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: 2.5rem; background: #ffffff; color: #0f172a; border-radius: 8px; border: 2px solid #d4af37; box-shadow: 0 10px 30px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Letterhead -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 1.5rem; margin-bottom: 1.75rem;">
        <div>
          <div style="font-size: 2.2rem; font-weight: 900; letter-spacing: 0.1em; color: #0f172a; font-family: serif;">
            ⚜ AURA GRAND
          </div>
          <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.18em; color: #aa820a; font-weight: 700;">
            Haute Hospitality & Residences Management System
          </div>
          <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;">
            100 Ocean Crest Boulevard • Tel: +1 (555) 019-2800 • Tax ID: AGH-882910-US
          </div>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #16a34a; color: #16a34a; font-weight: 800; font-size: 0.8rem; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.1em;">
            ✓ ${audit.status}
          </div>
          <div style="font-size: 0.95rem; font-weight: 700; margin-top: 6px; color: #0f172a;">
            Certificate Ref: ${audit.auditId}
          </div>
          <div style="font-size: 0.78rem; color: #64748b;">
            Date: ${audit.businessDate} • Time: ${new Date(audit.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <!-- Headline -->
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-size: 1.4rem; color: #0f172a; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.25rem;">
          Official Executive Night Audit Statement
        </h2>
        <div style="font-size: 0.82rem; color: #64748b;">
          Certified RevPAR reconciliation, room occupancy ledger, and tax balance sheet for hotel ownership.
        </div>
      </div>

      <!-- KPI Matrix -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 1.25rem;">
        <div style="text-align: center;">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700;">RevPAR</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #0f172a;">$${audit.kpis.revpar}</div>
        </div>
        <div style="text-align: center; border-left: 1px solid #cbd5e1;">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700;">ADR</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #0f172a;">$${audit.kpis.adr}</div>
        </div>
        <div style="text-align: center; border-left: 1px solid #cbd5e1;">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Occupancy</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #16a34a;">${audit.kpis.occupancyRate}%</div>
        </div>
        <div style="text-align: center; border-left: 1px solid #cbd5e1;">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700;">30-Day Proj. GOP</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #0f172a;">$${audit.kpis.projectedMonthlyRevenue.toLocaleString()}</div>
        </div>
      </div>

      <!-- Ledger Summary -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-size: 0.88rem;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px; text-align: left; color: #334155;">Financial Accounting Ledger</th>
            <th style="padding: 10px; text-align: right; color: #334155;">Audited Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Gross Room Charges Posted to Stays</td>
            <td style="padding: 10px; text-align: right; font-weight: 600;">$${audit.ledger.roomChargesPosted.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Ancillary Lavish Services (Dining, Spa, Chauffeur)</td>
            <td style="padding: 10px; text-align: right; font-weight: 600;">$${audit.ledger.ancillaryServicesPosted.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Statutory Tourism & Hospitality Tax (10%)</td>
            <td style="padding: 10px; text-align: right; font-weight: 600;">$${audit.ledger.taxesCollected.toLocaleString()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Total Cumulative Settled Invoices</td>
            <td style="padding: 10px; text-align: right; font-weight: 700; color: #16a34a;">$${audit.ledger.totalSettledRevenue.toLocaleString()}</td>
          </tr>
          <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a;">
            <td style="padding: 12px; font-size: 1rem;">Total Active Folio Turnover (Daily Balanced)</td>
            <td style="padding: 12px; text-align: right; font-size: 1.15rem; color: #0f172a;">$${audit.ledger.totalFolioTurnover.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <!-- Signatures & Verification -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.5rem; border-top: 1px dashed #cbd5e1;">
        <div>
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Auditing Official</div>
          <div style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-top: 4px;">${audit.auditor}</div>
          <div style="font-size: 0.78rem; color: #64748b;">Aura Grand Executive Board</div>
        </div>
        <div style="text-align: right;">
          <div style="font-family: monospace; font-size: 0.75rem; color: #64748b;">
            CRYPTOGRAPHIC AUDIT HASH:<br>
            SHA-256: 7f89b14e9124a87c908d132b
          </div>
          <div style="font-size: 0.75rem; color: #16a34a; font-weight: 700; margin-top: 4px;">
            ● Certified Bank-Grade Audit Record
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 10. ENTERPRISE REVENUE YIELD & DYNAMIC PRICING ENGINE
// ==========================================================================

async function renderYieldPane() {
  try {
    const res = await api.get('/api/stats/yield-engine');
    if (!res.success) return;

    state.yieldRules = res.rules;
    const rules = res.rules;

    const multEl = document.getElementById('yieldCurrentMultiplier');
    const liftEl = document.getElementById('yieldAnnualLift');
    const autoEl = document.getElementById('yieldAutoTriggerStatus');
    const eventEl = document.getElementById('yieldEventStatus');
    const sliderInput = document.getElementById('yieldMultiplierInput');
    const sliderVal = document.getElementById('sliderMultiplierVal');
    const eventSel = document.getElementById('yieldEventSelect');
    const wkToggle = document.getElementById('yieldWeekendToggle');
    const occToggle = document.getElementById('yieldOccupancyToggle');
    const aiToggle = document.getElementById('yieldAiAutoToggle');

    if (multEl) multEl.innerText = `${rules.surgeMultiplier.toFixed(2)}x`;
    if (liftEl) liftEl.innerText = `+${formatPrice(res.estimatedAnnualLift)}`;
    if (autoEl) autoEl.innerText = rules.occupancyAutoSurge ? 'ACTIVE (>75%)' : 'STANDBY';
    if (eventEl) eventEl.innerText = rules.peakEventMode !== 'None' ? rules.peakEventMode : 'Standard Season';

    if (sliderInput) sliderInput.value = rules.surgeMultiplier;
    if (sliderVal) sliderVal.innerText = `${rules.surgeMultiplier.toFixed(2)}x`;
    if (eventSel) eventSel.value = rules.peakEventMode;
    if (wkToggle) wkToggle.checked = rules.weekendSurge;
    if (occToggle) occToggle.checked = rules.occupancyAutoSurge;
    if (aiToggle) aiToggle.checked = rules.aiAutoYieldEnabled;

    renderYieldTable(res.dynamicRates);
  } catch (err) {
    console.error('Error loading yield engine:', err);
  }
}

function updateYieldSliderDisplay(val) {
  const display = document.getElementById('sliderMultiplierVal');
  if (display) display.innerText = `${Number(val).toFixed(2)}x`;
  previewYieldRates();
}

function previewYieldRates() {
  const mult = parseFloat(document.getElementById('yieldMultiplierInput')?.value || 1.15);
  const eventMode = document.getElementById('yieldEventSelect')?.value || 'None';
  let eventMultiplier = 1.0;
  if (eventMode === 'Monaco Grand Prix Weekend') eventMultiplier = 1.35;
  if (eventMode === 'Paris Haute Couture Gala') eventMultiplier = 1.40;
  if (eventMode === 'Art Basel & Yacht Show') eventMultiplier = 1.30;
  if (eventMode === 'New Year Private Countdown') eventMultiplier = 1.50;

  const effectiveMult = mult * eventMultiplier;

  const dynamicRates = (state.rooms || []).map(room => {
    const dynamicPrice = Math.round(room.pricePerNight * effectiveMult);
    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomName: room.name,
      basePrice: room.pricePerNight,
      dynamicPrice,
      liftPercentage: Math.round(((dynamicPrice - room.pricePerNight) / room.pricePerNight) * 100)
    };
  });

  const totalExtraDaily = dynamicRates.reduce((sum, r) => sum + (r.dynamicPrice - r.basePrice), 0);
  const estLift = Math.round(totalExtraDaily * 365 * 0.75);

  const multEl = document.getElementById('yieldCurrentMultiplier');
  const liftEl = document.getElementById('yieldAnnualLift');
  const eventEl = document.getElementById('yieldEventStatus');
  if (multEl) multEl.innerText = `${effectiveMult.toFixed(2)}x`;
  if (liftEl) liftEl.innerText = `+${formatPrice(estLift)}`;
  if (eventEl) eventEl.innerText = eventMode !== 'None' ? eventMode : 'Standard Season';

  renderYieldTable(dynamicRates);
}

function renderYieldTable(dynamicRates) {
  const tbody = document.getElementById('yieldRatesTableBody');
  if (!tbody || !dynamicRates) return;

  tbody.innerHTML = dynamicRates.map(r => `
    <tr>
      <td style="font-weight: 700; color: var(--gold-light);">#${r.roomNumber}</td>
      <td style="font-weight: 600;">${r.roomName}</td>
      <td style="color: var(--text-dim); text-decoration: line-through;">${formatPrice(r.basePrice)} / nt</td>
      <td style="font-weight: 800; font-size: 1.05rem; color: #34d399;">${formatPrice(r.dynamicPrice)} / nt</td>
      <td>
        <span class="badge badge-emerald">+${r.liftPercentage}% Yield Lift</span>
      </td>
      <td><span class="badge badge-gold">Active In-Market</span></td>
    </tr>
  `).join('');
}

async function saveYieldConfiguration() {
  const mult = parseFloat(document.getElementById('yieldMultiplierInput')?.value || 1.15);
  const eventMode = document.getElementById('yieldEventSelect')?.value || 'None';
  const weekendSurge = document.getElementById('yieldWeekendToggle')?.checked || false;
  const occupancyAutoSurge = document.getElementById('yieldOccupancyToggle')?.checked || false;
  const aiAutoYieldEnabled = document.getElementById('yieldAiAutoToggle')?.checked || false;

  try {
    const res = await api.post('/api/stats/yield-engine', {
      surgeMultiplier: mult,
      weekendSurge,
      occupancyAutoSurge,
      occupancyThreshold: 75,
      peakEventMode: eventMode,
      aiAutoYieldEnabled
    });

    if (res.success) {
      showToast('Dynamic Yield multipliers successfully deployed across all property suites!', 'emerald');
      await renderYieldPane();
    }
  } catch (err) {
    showToast('Failed to deploy yield rules', 'rose');
  }
}

// ==========================================================================
// 11. GDS & DIRECT CHANNEL DISTRIBUTION CONTROLLER
// ==========================================================================

async function renderChannelsPane() {
  try {
    const res = await api.get('/api/stats/channels');
    if (!res.success) return;

    state.channelsData = res.data;
    const data = res.data;

    const timeEl = document.getElementById('gdsSyncTimestamp');
    if (timeEl && data.lastSyncTimestamp) {
      timeEl.innerText = `Last Global Handshake: ${new Date(data.lastSyncTimestamp).toLocaleTimeString()}`;
    }

    // Render Cards Grid
    const grid = document.getElementById('channelDistributionGrid');
    if (grid) {
      grid.innerHTML = data.activeChannels.map(ch => `
        <div class="channel-card ${ch.id === 'ch_direct' ? 'direct-engine' : ''}">
          <div class="channel-card-header">
            <div>
              <div class="channel-card-title">${ch.name}</div>
              <div class="channel-card-type">${ch.type}</div>
            </div>
            <span class="badge ${ch.commissionRate === 0 ? 'badge-emerald' : 'badge-gold'}">
              ${ch.commissionRate === 0 ? '0% Commission' : `${ch.commissionRate}% Fee`}
            </span>
          </div>
          <div style="font-size: 0.84rem; color: var(--text-dim); margin-top: 0.4rem;">
            Allocation: <strong>${ch.inventoryAllocated}</strong>
          </div>
          <div class="channel-metrics">
            <div>
              <div class="channel-metric-label">Monthly Gross</div>
              <div class="channel-metric-val">${formatPrice(ch.monthlyRevenue)}</div>
            </div>
            <div>
              <div class="channel-metric-label">Channel Volume</div>
              <div class="channel-metric-val" style="color: #38bdf8;">${ch.sharePercentage}%</div>
            </div>
          </div>
          <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem;">
            <span style="color: #34d399;">● ${ch.status}</span>
            <span style="color: var(--text-dim); font-family: monospace;">${ch.latencyMs}ms API</span>
          </div>
        </div>
      `).join('');
    }

    // Render Table
    const tbody = document.getElementById('channelsTableBody');
    if (tbody) {
      tbody.innerHTML = data.activeChannels.map(ch => `
        <tr>
          <td style="font-weight: 700; color: #fff;">${ch.name}</td>
          <td><span class="badge badge-subtle">${ch.type}</span></td>
          <td style="font-weight: 600; color: ${ch.commissionRate === 0 ? '#10b981' : 'var(--text-main)'};">
            ${ch.commissionRate === 0 ? '0% (Direct Sovereign)' : `${ch.commissionRate}%`}
          </td>
          <td style="font-weight: 700; color: var(--gold-light);">${formatPrice(ch.monthlyRevenue)}</td>
          <td style="font-weight: 600;">${ch.sharePercentage}% of stays</td>
          <td style="font-family: monospace; color: #38bdf8;">XML 2-Way (${ch.latencyMs}ms)</td>
          <td><span class="badge badge-emerald">Synced</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error rendering channels pane:', err);
  }
}

async function forceChannelPushSync() {
  const btn = document.getElementById('btnForceChannelSync');
  if (btn) {
    btn.disabled = true;
    btn.innerText = '⏳ Syncing GDS & OTAs...';
  }

  try {
    const res = await api.post('/api/stats/channels/sync', {
      operatorName: state.currentUser?.name || 'Chief Revenue Officer'
    });

    if (res.success) {
      showToast('All 5 Global Distribution Systems & OTAs synchronized with 100% rate parity!', 'emerald');
      await renderChannelsPane();
    }
  } catch (err) {
    showToast('Failed to synchronize channels', 'rose');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = '🔄 Force Push 2-Way GDS Sync';
    }
  }
}

// ==========================================================================
// 12. SOC-2 TYPE II & PCI-DSS IMMUTABLE AUDIT TRAIL
// ==========================================================================

async function renderAuditPane() {
  try {
    const res = await api.get('/api/stats/activity-log');
    if (!res.success) return;

    state.activityLogs = res.logs || [];
    renderAuditTable(state.activityLogs);
  } catch (err) {
    console.error('Error loading audit log:', err);
  }
}

function renderAuditTable(logs) {
  const tbody = document.getElementById('auditTrailTableBody');
  if (!tbody) return;

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 2rem;">No audit logs recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const hash = log.id ? log.id.replace('log_', '').substr(0, 16) : Math.random().toString(36).substr(2, 10);
    return `
      <tr>
        <td style="font-size: 0.8rem; color: var(--text-dim); white-space: nowrap;">
          ${new Date(log.timestamp).toLocaleString()}
        </td>
        <td>
          <span class="badge badge-gold" style="font-family: monospace;">${log.action}</span>
        </td>
        <td style="font-weight: 700; color: #fff;">${log.actor || 'Tamim Shadman [Admin]'}</td>
        <td style="max-width: 320px; font-size: 0.86rem; color: var(--text-main);">${log.details}</td>
        <td>
          <span class="audit-hash-code">sha256:${hash}</span>
        </td>
        <td><span class="badge badge-emerald">SOC-2 VERIFIED</span></td>
      </tr>
    `;
  }).join('');
}

function filterAuditTrail(q) {
  const query = (q || '').toLowerCase();
  const filtered = (state.activityLogs || []).filter(l =>
    (l.action && l.action.toLowerCase().includes(query)) ||
    (l.actor && l.actor.toLowerCase().includes(query)) ||
    (l.details && l.details.toLowerCase().includes(query))
  );
  renderAuditTable(filtered);
}

function exportAuditTrail(format = 'json') {
  const logs = state.activityLogs || [];
  if (format === 'csv') {
    const header = 'Timestamp,Action,Actor,Details,AuditID\n';
    const rows = logs.map(l =>
      `"${l.timestamp}","${l.action}","${l.actor || 'System'}","${(l.details || '').replace(/"/g, '""')}","${l.id}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_grand_soc2_audit_${Date.now()}.csv`;
    a.click();
    showToast('Exported SOC-2 Immutable Audit Log (CSV)', 'emerald');
  } else {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `aura_grand_soc2_audit_${Date.now()}.json`;
    a.click();
    showToast('Exported SOC-2 Immutable Audit Log (JSON)', 'emerald');
  }
}

// ==========================================================================
// 13. COMMERCIAL ACQUISITION & VALUATION PROSPECTUS
// ==========================================================================

async function openCommercialProspectusModal() {
  openModal('commercialProspectusModal');
  const container = document.getElementById('printableProspectusArea');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--text-dim);">
      ⏳ Compiling comprehensive software appraisal & asset prospectus...
    </div>
  `;

  try {
    const res = await api.get('/api/stats/commercial-prospectus');
    if (!res.success) return;
    state.prospectusData = res.prospectus;
    renderCommercialProspectus(res.prospectus);
  } catch (err) {
    container.innerHTML = `<div style="color: var(--rose); text-align: center; padding: 2rem;">Failed to load prospectus.</div>`;
  }
}

function renderCommercialProspectus(p) {
  const container = document.getElementById('printableProspectusArea');
  if (!container || !p) return;

  container.innerHTML = `
    <div>
      <!-- Prospectus Hero -->
      <div class="prospectus-hero">
        <div class="prospectus-valuation-badge">
          ✦ COMMERCIAL ENTERPRISE SOFTWARE VALUATION: $${p.appraisedAssetValuationUSD.toLocaleString()} USD
        </div>
        <h2 style="font-size: 1.8rem; color: #ffffff; letter-spacing: 0.06em; margin-bottom: 0.5rem; font-family: var(--font-serif);">
          ${p.softwareName}
        </h2>
        <div style="font-size: 0.95rem; color: var(--gold-light); font-weight: 600;">
          Turnkey Ultra-Luxury Hospitality & Residences Property Management System
        </div>
        <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1.25rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-dim);">
          <div>Intellectual Property Owners: <strong style="color: #fff;">${p.legalIPHolders}</strong></div>
          <div>Asset Valuation Multiple: <strong style="color: #34d399;">${p.valuationMultiple}</strong></div>
          <div>Deployment: <strong style="color: var(--gold-primary);">Turnkey Docker / Cloud Ready</strong></div>
        </div>
      </div>

      <!-- Core Modules Breakdown -->
      <h3 style="font-size: 1.15rem; color: var(--gold-light); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.08em;">
        Proprietary Software Assets & Enterprise Modules
      </h3>
      <div class="prospectus-grid">
        ${p.coreModules.map(m => `
          <div class="prospectus-feature-card">
            <div style="font-weight: 700; color: #ffffff; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
              <span style="color: var(--gold-primary);">⚜</span> ${m.name}
            </div>
            <div style="font-size: 0.82rem; color: var(--text-dim); margin-top: 0.4rem; line-height: 1.5;">
              ${m.value}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Tech Architecture Appraisal -->
      <div style="background: rgba(10, 14, 23, 0.7); border: 1px solid var(--border-gold); border-radius: var(--radius-sm); padding: 1.5rem; margin-bottom: 1.5rem;">
        <h4 style="color: var(--gold-light); font-size: 1rem; margin-bottom: 0.75rem;">Technical Architecture & Zero-Debt Engineering</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; font-size: 0.84rem;">
          <div>
            <div style="color: var(--text-muted); text-transform: uppercase; font-size: 0.72rem;">Styling Engine</div>
            <strong style="color: #fff;">100% Vanilla CSS (Zero Framework Bloat)</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); text-transform: uppercase; font-size: 0.72rem;">Backend Engine</div>
            <strong style="color: #fff;">Node.js REST Services + JSON Persistence</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); text-transform: uppercase; font-size: 0.72rem;">Security & Audit</div>
            <strong style="color: #34d399;">SOC-2 Type II & PCI-DSS Level 1 Ready</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); text-transform: uppercase; font-size: 0.72rem;">Containerization</div>
            <strong style="color: var(--gold-primary);">Multi-stage Docker + Docker Compose</strong>
          </div>
        </div>
      </div>

      <!-- Acquisition Terms -->
      <div style="border-top: 1px dashed var(--border-subtle); padding-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.85rem;">
        <div>
          <span style="color: var(--text-muted);">Commercial License Type:</span>
          <strong style="color: #ffffff; margin-left: 4px;">${p.licenseType}</strong>
        </div>
        <div style="text-align: right;">
          <span style="color: var(--text-muted);">Executive Directors:</span>
          <strong style="color: var(--gold-light); margin-left: 4px;">${p.contactSales.directors}</strong>
        </div>
      </div>
    </div>
  `;
}

function downloadProspectusJson() {
  if (!state.prospectusData) return;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.prospectusData, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = 'aura_grand_commercial_prospectus.json';
  a.click();
  showToast('Downloaded Complete Commercial Software Prospectus (JSON)', 'emerald');
}

// ==========================================================================
// 15. NOVEL FEATURES CONTROLLERS: SENSORY IOT, FLEET MANIFEST & ESG CERTIFICATE
// ==========================================================================

async function renderItineraryTimeline() {
  const container = document.getElementById('vipItineraryTimeline');
  if (!container) return;

  try {
    const res = await api.get('/api/services/predictive-itinerary');
    if (!res.success || !res.itinerary) return;

    container.innerHTML = res.itinerary.map(item => `
      <div class="itinerary-card ${item.highlight ? 'highlight' : ''}">
        <div class="itinerary-time-wrap">
          <div class="itinerary-time">${item.time}</div>
          <div class="itinerary-period">${item.period}</div>
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; flex-wrap: wrap;">
            <h4 style="font-size: 1rem; color: #fff; margin: 0;">${item.title}</h4>
            <span class="badge ${item.highlight ? 'badge-gold' : 'badge-subtle'}">${item.status}</span>
          </div>
          <div style="font-size: 0.82rem; color: var(--gold-light); margin-top: 0.25rem;">
            📍 ${item.location} ${item.instructor ? `• Lead: ${item.instructor}` : ''} ${item.chef ? `• Chef: ${item.chef}` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Error loading itinerary:', err);
  }
}

let activeAmbienceState = {
  preset: 'Circadian Dawn Awakening',
  temp: 20.5,
  aroma: 'Bergamot & Sweet Orange',
  sound: 'Morning Songbirds & Aegean Waves'
};

function tuneRoomAmbience(key) {
  document.querySelectorAll('.iot-preset-btn').forEach(btn => btn.classList.remove('active'));

  const tempEl = document.getElementById('roomLiveTemp');
  const aromaEl = document.getElementById('roomLiveAroma');
  const soundEl = document.getElementById('roomLiveSound');

  if (key === 'dawn') {
    document.getElementById('btnPresetDawn')?.classList.add('active');
    activeAmbienceState = { preset: 'Circadian Dawn Awakening', temp: 21.0, aroma: 'Bergamot & Sweet Orange', sound: 'Morning Songbirds (432Hz)' };
  } else if (key === 'dusk') {
    document.getElementById('btnPresetDusk')?.classList.add('active');
    activeAmbienceState = { preset: 'Mediterranean Dusk Twilight', temp: 20.0, aroma: 'Oud & Marine Driftwood', sound: 'Ocean Swells (528Hz)' };
  } else if (key === 'candlelight') {
    document.getElementById('btnPresetCandlelight')?.classList.add('active');
    activeAmbienceState = { preset: 'Candlelight Starlight Romance', temp: 20.5, aroma: 'Bulgarian Rose & Sandalwood', sound: 'Velvet Harp Ensemble' };
  } else if (key === 'sleep') {
    document.getElementById('btnPresetSleep')?.classList.add('active');
    activeAmbienceState = { preset: 'Obsidian Deep REM Sleep', temp: 18.5, aroma: 'French Lavender & Roman Chamomile', sound: 'Binaural Delta Waves' };
  }

  if (tempEl) tempEl.innerText = `${activeAmbienceState.temp.toFixed(1)}°C`;
  if (aromaEl) aromaEl.innerText = activeAmbienceState.aroma;
  if (soundEl) soundEl.innerText = activeAmbienceState.sound;

  showToast(`Stateroom sensory profile tuned to '${activeAmbienceState.preset}'`, 'gold');
}

function adjustRoomTemp(delta) {
  activeAmbienceState.temp = Math.max(16, Math.min(28, activeAmbienceState.temp + delta));
  const tempEl = document.getElementById('roomLiveTemp');
  if (tempEl) tempEl.innerText = `${activeAmbienceState.temp.toFixed(1)}°C`;
}

async function deployRoomAmbience(roomNum) {
  try {
    const res = await api.post('/api/services/iot-ambience/tune', {
      presetName: activeAmbienceState.preset,
      temperatureC: activeAmbienceState.temp,
      aroma: activeAmbienceState.aroma,
      soundscape: activeAmbienceState.sound,
      guestName: state.currentUser?.name || 'Resident #501'
    });

    if (res.success) {
      showToast(`Suite #${roomNum} IoT environmental telemetry actively calibrated and deployed!`, 'emerald');
    }
  } catch (err) {
    showToast('Failed to deploy IoT ambience', 'rose');
  }
}

async function openFleetManifestModal(fleetId) {
  openModal('fleetManifestModal');
  const heroContainer = document.getElementById('fleetModalHero');
  const titleEl = document.getElementById('fleetModalTitle');
  const idInput = document.getElementById('fleetCharterId');
  if (idInput) idInput.value = fleetId;

  try {
    const res = await api.get('/api/services/fleet-charter');
    if (!res.success || !res.fleet) return;

    const vessel = res.fleet.find(f => f.id === fleetId) || res.fleet[0];
    if (titleEl) titleEl.innerText = `${vessel.name} • Charter Manifest`;

    if (heroContainer) {
      heroContainer.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-gold); border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column;">
          <img src="${vessel.image}" alt="${vessel.name}" style="width: 100%; height: 220px; object-fit: cover;">
          <div style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="badge badge-gold">${vessel.category}</span>
                <h3 style="font-size: 1.3rem; color: #fff; margin-top: 0.25rem;">${vessel.name}</h3>
              </div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold-primary);">
                ${formatPrice(vessel.hourlyRate)}
              </div>
            </div>
            <p style="color: var(--text-dim); font-size: 0.85rem; margin: 0.5rem 0 1rem; line-height: 1.6;">
              ${vessel.description}
            </p>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${vessel.amenities.map(a => `<span class="badge badge-subtle">✓ ${a}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching fleet data:', err);
  }
}

async function handleFleetBookingSubmit(e) {
  e.preventDefault();
  const fleetId = document.getElementById('fleetCharterId')?.value || 'fleet_yacht';
  const departureLocation = document.getElementById('fleetDepartureLoc')?.value;
  const departureTime = document.getElementById('fleetDepartureTime')?.value;
  const guestCount = document.getElementById('fleetGuestCount')?.value;
  const cateringPreference = document.getElementById('fleetCatering')?.value;
  const specialNotes = document.getElementById('fleetSpecialNotes')?.value;

  try {
    const res = await api.post('/api/services/fleet-charter/book', {
      fleetId,
      departureLocation,
      departureTime,
      guestCount,
      cateringPreference,
      specialNotes,
      guestName: state.currentUser?.name || 'Eleanor Vance',
      guestEmail: state.currentUser?.email || 'guest@auragrand.com'
    });

    if (res.success) {
      showToast(`Charter Manifest ${res.manifest.manifestId} approved by Port Captain!`, 'emerald');
      closeModal('fleetManifestModal');
      await loadInitialData();
      renderApp();
    }
  } catch (err) {
    showToast('Failed to book mobility charter', 'rose');
  }
}

async function openEsgCertificateModal() {
  openModal('esgCertificateModal');
  const container = document.getElementById('printableEsgArea');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--text-dim);">
      ⏳ Verifying real-time ESG sustainability ledger and environmental hash...
    </div>
  `;

  try {
    const res = await api.get('/api/services/esg-ledger');
    if (!res.success) return;
    renderEsgCertificate(res);
  } catch (err) {
    container.innerHTML = `<div style="color: var(--rose); text-align: center; padding: 2rem;">Failed to load ESG certificate.</div>`;
  }
}

function renderEsgCertificate(data) {
  const container = document.getElementById('printableEsgArea');
  if (!container || !data) return;

  const m = data.sustainabilityMetrics;
  container.innerHTML = `
    <div style="padding: 2.5rem; background: #ffffff; color: #0f172a; border-radius: 8px; border: 2px solid #10b981; box-shadow: 0 10px 30px rgba(0,0,0,0.12); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Letterhead -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 1.5rem; margin-bottom: 1.75rem;">
        <div>
          <div style="font-size: 2rem; font-weight: 900; letter-spacing: 0.08em; color: #0f172a; font-family: serif;">
            ⚜ AURA GRAND RESIDENCES
          </div>
          <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.16em; color: #059669; font-weight: 700;">
            Global Sustainable Hospitality Certified Green Ledger
          </div>
          <div style="font-size: 0.76rem; color: #64748b; margin-top: 3px;">
            Accreditation: ${data.certificationStandard}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; border: 2px solid #059669; color: #059669; font-weight: 800; font-size: 0.78rem; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
            ✓ ${m.carbonStatus}
          </div>
          <div style="font-size: 0.88rem; font-weight: 700; margin-top: 5px; color: #0f172a;">
            Certificate: ${data.certId}
          </div>
        </div>
      </div>

      <!-- Headline -->
      <div style="text-align: center; margin-bottom: 1.75rem;">
        <h2 style="font-size: 1.35rem; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 0.25rem;">
          Official Certificate of Certified Carbon-Negative Stay
        </h2>
        <div style="font-size: 0.84rem; color: #64748b;">
          This statement certifies that all energy consumption during this stay was generated on-site via 100% renewable solar and geothermal microgrids.
        </div>
      </div>

      <!-- Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 1.25rem; text-align: center;">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #166534; font-weight: 700;">Atmospheric CO2 Offset</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #15803d; margin: 0.25rem 0;">${m.co2OffsetPerNightKg} kg / night</div>
          <div style="font-size: 0.76rem; color: #166534;">Active carbon neutrality verified</div>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 1.25rem; text-align: center;">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #166534; font-weight: 700;">Mangrove Forest Reforestation</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #15803d; margin: 0.25rem 0;">${m.mangroveTreesPlanted} Trees Planted</div>
          <div style="font-size: 0.76rem; color: #166534;">Dedicated coastal wetland sanctuary</div>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 1.25rem; text-align: center;">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #166534; font-weight: 700;">Ocean Plastic Recovery</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #15803d; margin: 0.25rem 0;">${m.oceanPlasticsRecoveredKg} kg Recovered</div>
          <div style="font-size: 0.76rem; color: #166534;">Coral reef conservation partner</div>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 1.25rem; text-align: center;">
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #166534; font-weight: 700;">Microgrid Renewable Energy</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #15803d; margin: 0.25rem 0;">${m.solarEnergyFraction}</div>
          <div style="font-size: 0.76rem; color: #166534;">Zero fossil-fuel dependency</div>
        </div>
      </div>

      <!-- Blockchain Verification Hash -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1.5rem; border-top: 1px dashed #cbd5e1;">
        <div>
          <div style="font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Environmental Directors</div>
          <div style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-top: 3px;">Tamim Shadman & Readuanul Farid Fahim</div>
          <div style="font-size: 0.78rem; color: #64748b;">Aura Grand Sustainable Hospitality Board</div>
        </div>
        <div style="text-align: right;">
          <div style="font-family: monospace; font-size: 0.75rem; color: #64748b;">
            VERIFIED LEDGER HASH:<br>
            ${data.verificationHash}
          </div>
          <div style="font-size: 0.75rem; color: #059669; font-weight: 700; margin-top: 3px;">
            ● Certified Global ESG Benchmark
          </div>
        </div>
      </div>
    </div>
  `;
}

// Luxury Document Tab Visibility & Title Reactivity
(function initTabVisibilityReactivity() {
  const originalTitle = document.title;
  let departureTimer = null;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      departureTimer = setTimeout(() => {
        document.title = '✨ Return to Your Sanctuary — Aura Grand';
      }, 1200);
    } else {
      if (departureTimer) clearTimeout(departureTimer);
      document.title = originalTitle;
    }
  });
})();


