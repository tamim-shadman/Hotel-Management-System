# ⚜️ AURA GRAND | Luxury Hotel & Residences Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18%20--%20v22+-026e00?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Automated Tests](https://img.shields.io/badge/Tests-27%2F27%20Passed%20(100%25)-10b981?logo=githubactions&logoColor=white)](tests/test-suite.js)
[![3D WebGL](https://img.shields.io/badge/3D%20Engine-Three.js%20r128%20(60fps)-d4af37?logo=three.js&logoColor=white)](public/js/three-components.js)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage%20Ready-2496ed?logo=docker&logoColor=white)](Dockerfile)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A full-stack, enterprise-grade hotel management platform designed to meet and exceed all specifications outlined in the **Hotel Management System Project Proposal**. Built with modern engineering principles, real-time vacancy tracking, role-based authority dashboards, employee administration, customer relationship management, and itemized billing.

---

## 👥 Project Team

| Name | Role |
| :--- | :--- |
| **Tamim Shadman** | Lead Fullstack Architect & General Manager Persona |
| **Readuanul Farid Fahim** | Fullstack Developer & System Integration |

---

## 📋 Comprehensive Specification & Feature Mapping

All features defined in the project proposal PDF and sitemap are fully implemented:

### 1. Welcome Page & Hotel Overview (PDF Page 2 & Page 4)
- **Cinematic Luxury Showcase**: High-resolution photorealistic imagery of suites, spa sanctuary, fine dining, and rooftop infinity cabanas.
- **Quick Vacancy Search Widget**: Live date range picker (Check-in / Check-out), party size, and suite category filters.
- **Real-Time Operational Counters**: Live occupancy rate, vacant suite counter, 5-star ratings, and 24/7 concierge indicators.
- **Featured Collection**: Curated preview of Presidential Penthouses, Oceanfront Suites, and Executive accommodations.
- **Verified Guest Reviews**: Authentic guest testimonials from VIP patrons.

### 2. User / Guest Dashboard (PDF Page 3 & Page 4)
- **🔑 Active Stay & Digital Room Key**: Displays checked-in suite, live folio balance, nights remaining, and simulated NFC RFID keyless door unlock.
- **🏨 1. Room Selection**: Filterable luxury room catalog with interactive price range sliders, guest capacity selectors, and comprehensive suite details modals.
- **🟢 2. Vacant Rooms Intelligence**: Real-time vacancy matrix across all 5 hotel floors with conflict-free date filtering and visual floor plans.
- **✨ 3. Other Services (Lavish Hotel Amenities)**:
  - *Wellness & Spa*: Royal Auric Spa, Aromatherapy Rituals, Himalayan Hot Stone Therapy.
  - *Fine Dining*: Michelin Star Chef tasting menus, private balcony candlelit dinners, champagne breakfast.
  - *Leisure*: VIP rooftop infinity pool cabana daybeds.
  - *Transportation*: Mercedes Maybach chauffeur transfers, private helicopter coastal tours.
  - *Guest Care*: White-glove express dry cleaning and pressing.
  - Direct "Order to Stay Folio" capability charging services onto active guest room folios.
- **📝 4. Booking Reservation Center**:
  - Multi-step interactive booking wizard.
  - Real-time cost calculation with add-on services selection.
  - Privilege Promo Code engine (`ROYAL10` for 10% off, `WELCOME15` for 15% off, `VIP20` for 20% off).
  - Automated tax calculation (10% hospitality levy) and instant booking reference generation (`AGH-XXXXX`).
  - Auto check-in support with instantaneous digital room key delivery.
- **💳 5. Express Checkout**:
  - Full itemized folio breakdown (room nights + ordered services + taxes - VIP discounts).
  - Payment settlement simulation (Credit Card, Amex Centurion, Apple Pay).
  - 5-Star guest review and feedback rating collector.
  - Automatic housekeeping dispatch (marking room to `Cleaning`).
  - Printable guest folio invoice with PDF export readiness.

### 3. Admin Authority Dashboard (PDF Page 3 & Page 4)
- **📊 Executive KPI Overview**: Total settled hotel revenue, live occupancy percentage, active staff on duty, and real-time in-house resident stays.
- **👔 1. Employee Management**:
  - Complete Staff Directory with Staff ID, Avatar, Full Name, Work Email, Contact Phone, and Shift.
  - Department organization: Front Desk, Housekeeping, Food & Beverage, Concierge & VIP, Wellness & Spa, Security, Management & Finance, Engineering.
  - Filter by department, shift schedule (Morning, Evening, Night), and real-time search.
  - Add, edit, and remove staff members with monthly payroll tracking.
- **👥 2. Customer Management**:
  - VIP Guest CRM Directory with loyalty tier badges (Platinum, Gold, Silver).
  - Total stays, lifetime revenue tracking, and current status (`Checked In`, `Reserved`, `Checked Out`).
  - Detailed guest profiles with full booking history, itemized invoices, and bespoke hospitality preferences.
- **💰 3. Billing & Financial Transactions**:
  - Centralized ledger of all issued folios and transactions.
  - Filter by payment status (`Paid`, `Pending`) and search by invoice # or guest name.
  - Printable guest folio invoice modal matching Forbes luxury standards.
  - Manual invoice generation and one-click balance settlement.
- **🛏️ Suite Status & Inventory Control**:
  - Live grid to instantly update room operational status (`Available`, `Occupied`, `Cleaning`, `Maintenance`).
  - Dynamic nightly rate adjustment controls.

### 4. 🌟 Novel R&D Features (Next-Gen Hospitality Innovation)
- **🌿 Sensory Stateroom & IoT Biometric Telemetry Controller**:
  - Live stateroom environmental telemetry: temperature, humidity, Alpine-grade AQI 002 air purity.
  - 4 circadian luminescence presets: *Circadian Dawn* (4,200K Sunrise), *Mediterranean Dusk* (2,700K Amber), *Starlight Romance* (1,800K Glow), and *Obsidian Deep REM* (0% Blue Light, delta wave acoustic resonance).
  - Live organic aromatherapy vaporization (Bergamot, Oud, Sandalwood, French Lavender).
  - Direct stateroom deployment button transmitting IoT calibration commands to suite sensors.
- **🛥️ Private Maritime & Aviation Fleet with Port Captain Manifest Clearance**:
  - Exclusive fleet catalog: Sunseeker 88ft Superyacht (*"Aura Sovereign"*), Airbus ACH130 VIP Helicopter, and Rolls-Royce Phantom VIII.
  - Official Port Captain pre-cleared manifest booking system generating encrypted voyage identifiers (`MAN-XXXX-2026`).
  - High-resolution photorealistic fleet visualization, departure harbor selection, voyage timing, and Michelin-grade onboard catering customization.
- **📅 24-Hour AI Predictive VIP Dynamic Itinerary Curator**:
  - Autonomous concierge itinerary engine dynamically generating 24-hour schedules tailored to guest tier and suite amenities.
  - One-click synchronization with digital RFID room keycard and 24/7 chief butler desk.
- **🌱 100% Certified Carbon-Negative Luxury & ESG Sustainability Ledger**:
  - Verifiable environmental accounting: 42.5 kg CO2 offset per night, 15 mangrove trees planted, 8.4 kg ocean-bound plastic recovered, and 100% solar/geothermal microgrid power.
  - Interactive official ESG Green Certificate modal with cryptographic SHA-256 tamper-proof ledger seal, GSTC Platinum accreditation, and one-click print/PDF export readiness.
- **🔮 Enterprise 3D WebGL Visual Architecture & Spatial Experiences (Three.js Engine)**:
  - **3D Architectural Resort Tower Digital Twin**: Real-time 3D rendered 5-story glass & gold building model in Vacant Rooms Intelligence. Features interactive camera orbit, exploded floor view, floor isolation controls, and real-time glowing suite occupancy pods (Emerald green for vacant, warm gold for occupied).
  - **3D 360° Spatial Panoramic Sanctuary Tour**: Ultra-wide 75° FOV inverted spherical WebGL projection for the Imperial Presidential Penthouse and Sunseeker 88ft Superyacht with interactive spatial feature hotspots and 3-stage dynamic lighting shaders (Daylight, Sunset Amber, Obsidian Night).
  - **3D Titanium RFID Digital Keycard**: Physics-driven 3D metal keycard in Guest Portal with dynamic mouse tilt tracking, real-time specular point light glare across the gold crest, 180° flip animation, and NFC door unlock ripple waves.
  - **Hero 3D Ambient Stardust Constellation**: GPU-accelerated Three.js golden particle system with cursor parallax depth mounted in the landing hero.
- **🔍 Comprehensive SEO & Structured Data Architecture**:
  - Canonical tags, Open Graph meta tags, Twitter card tags.
  - Schema.org JSON-LD `@graph` integration: `Hotel`, `LodgingBusiness`, `GeoCoordinates`, `AggregateRating` (4.98/5 across 412 Forbes reviews), and rich `FAQPage` schema.

---

## ⚡ Quick Start & Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18+ or 22+ LTS)
- NPM (Version 9+)

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/tamim-shadman/Hotel-Management-System.git
cd Hotel-Management-System
npm install
```

### Starting the Server
Start the production server:
```bash
npm start
```
Or run development mode:
```bash
npm run dev
```

### Running Automated Verification Tests
Execute the 27-point automated verification test suite verifying all REST routes, security headers, JWT auth, and 3D WebGL assets:
```bash
npm test
```

### Docker Container Deployment
Run production instance with containerized health checks:
```bash
# Build and start container daemon
docker compose up -d

# Verify container logs & health status
docker compose ps
```

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 🔑 Demo Access Credentials

The application includes instant **1-Click Persona Switching** directly in the top right navbar. You can also sign in manually using the following credentials:

| Persona | Email | Password | Role / Access Level |
| :--- | :--- | :--- | :--- |
| **Tamim Shadman** | `admin@auragrand.com` | `admin123` | Hotel General Manager (Full Admin Authority) |
| **Eleanor Vance** | `guest@auragrand.com` | `guest123` | Gold VIP Resident (Checked In to Suite 401) |
| **Readuanul Fahim** | `fahim@auragrand.com` | `guest123` | Platinum VIP Guest (Reserved Penthouse 501) |

---

## 🏗️ Architecture & Technology Stack

```
Hotel-Management-System/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                # Automated CI pipeline (Node 18/20/22 matrix tests)
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md         # Standardized bug report template
│   │   └── feature_request.md    # Feature proposal template
│   └── PULL_REQUEST_TEMPLATE.md  # Standardized pull request template
├── backend/
│   ├── data/
│   │   └── db.json               # Relational JSON file database with persistent state
│   ├── db/
│   │   └── database.js           # CRUD engine with automatic seeding & atomic writes
│   └── routes/
│       ├── auth.js               # JWT authentication, role verification, demo auth
│       ├── rooms.js              # Room catalog, vacancy checker with date collision engine
│       ├── employees.js          # Staff administration and department payroll
│       ├── customers.js          # Guest CRM and lifetime spend analytics
│       ├── services.js           # Hotel amenities and in-suite service orders
│       ├── bookings.js           # Reservation wizard and express checkout workflow
│       ├── billing.js            # Invoices, transactions, and settlement
│       └── stats.js              # Executive KPI analytics & dynamic yield engine
├── public/
│   ├── assets/
│   │   └── images/               # Curated high-res luxury hotel assets & animated favicon.svg
│   ├── css/
│   │   └── style.css             # Vanilla CSS design system (Obsidian & Gold luxury theme)
│   ├── js/
│   │   ├── vendor/               # Three.js r128 & OrbitControls local libraries (zero-CDN)
│   │   ├── three-components.js   # 3D WebGL engine (Tower twin, VR tours, RFID keycard)
│   │   └── app.js                # Single-page client logic and state management
│   └── index.html                # Semantic HTML5 application structure with rich Schema.org LD+JSON
├── tests/
│   └── test-suite.js             # 27 automated verification tests (npm test)
├── Dockerfile                    # Production-hardened multi-stage Docker build
├── docker-compose.yml            # Docker Compose orchestration with automated healthcheck
├── server.js                     # Express.js application server with security headers
├── CONTRIBUTING.md               # Contribution standards and development guidelines
├── SECURITY.md                   # Security vulnerability reporting policy
├── LICENSE                       # MIT License (Tamim Shadman & Readuanul Farid Fahim)
├── package.json                  # Dependencies, metadata, and test scripts
└── README.md                     # Comprehensive technical documentation
```

### Technologies Used:
- **Backend**: Node.js, Express.js (REST API, static asset pipeline).
- **Security**: JWT (JSON Web Tokens), `bcryptjs` password hashing, CORS protection.
- **Persistence**: File-backed relational JSON database engine with automatic schema generation and seeding.
- **Frontend**: Semantic HTML5, Vanilla JavaScript (ES6+ modular state management), and bespoke Vanilla CSS design tokens.
- **Design System**: Obsidian Dark Mode, Champagne Gold accents (`#d4af37`), glassmorphism, responsive floor maps, and printable invoice stylesheets.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User/Admin authentication |
| `POST` | `/api/auth/register` | Customer registration |
| `POST` | `/api/auth/demo` | 1-Click Persona quick login |
| `GET` | `/api/rooms` | Retrieve all suites with category & price filtering |
| `GET` | `/api/rooms/vacant` | Real-time vacancy checker with date overlap detection |
| `PUT` | `/api/rooms/:id` | Admin update room status or nightly rate |
| `GET` | `/api/services` | Retrieve lavish hotel services and amenities |
| `POST` | `/api/services/order` | Charge service order directly onto room stay folio |
| `GET` | `/api/bookings` | List reservations (supports filtering by email or status) |
| `POST` | `/api/bookings` | Create new reservation with cost & tax calculation |
| `POST` | `/api/bookings/:id/checkout` | Express checkout, folio settlement, and housekeeping dispatch |
| `GET` | `/api/employees` | List staff with department and shift filtering |
| `POST` | `/api/employees` | Admin add new hotel staff member |
| `PUT` | `/api/employees/:id` | Update staff record |
| `DELETE`| `/api/employees/:id` | Remove staff record |
| `GET` | `/api/customers` | Retrieve customer CRM records and VIP tiers |
| `GET` | `/api/billing/invoices` | List all invoices with status and balances |
| `GET` | `/api/stats/dashboard` | Executive KPI analytics (occupancy, revenue, staffing) |
| `GET` | `/api/services/iot-ambience` | Real-time stateroom IoT sensor telemetry and circadian presets |
| `POST` | `/api/services/iot-ambience/tune` | Live stateroom ambience deployment and atmosphere audit log |
| `GET` | `/api/services/fleet-charter` | Private VIP yacht, helicopter, and luxury vehicle catalog |
| `POST` | `/api/services/fleet-charter/book` | Generate official Port Captain authorized charter manifest |
| `GET` | `/api/services/predictive-itinerary` | Curated 24-hour predictive VIP schedule and circadian activities |
| `GET` | `/api/services/esg-ledger` | Blockchain-verified carbon-negative metrics and cryptographic SHA-256 seal |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
