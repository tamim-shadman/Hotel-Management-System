/**
 * AURA GRAND PMS - PRODUCTION AUTOMATED TEST SUITE
 * Authors: Tamim Shadman & Readuanul Farid Fahim
 * Self-Booting & IPv4-Loopback Hardened for Universal CI/CD Execution
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 5000;
// Force IPv4 loopback to avoid ::1 IPv6 DNS resolution issues in modern Node.js/CI environments
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: '127.0.0.1',
      port: PORT,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function isServerReady() {
  try {
    const res = await request('/api/health');
    return res && res.status === 200;
  } catch (e) {
    return false;
  }
}

async function ensureServer() {
  if (await isServerReady()) {
    console.log(`📡 Connected to active server instance at ${BASE_URL}\n`);
    return null;
  }

  console.log(`🚀 Starting local server process on ${BASE_URL}...`);
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'ignore',
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' }
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 15000) {
    await new Promise(r => setTimeout(r, 400));
    if (await isServerReady()) {
      console.log(`✅ Test server successfully booted and ready for assertions.\n`);
      return serverProcess;
    }
  }

  try { serverProcess.kill(); } catch (e) {}
  throw new Error(`Server failed to boot within 15 seconds on ${BASE_URL}`);
}

async function runTestSuite() {
  console.log('========================================================');
  console.log('🧪 AURA GRAND PMS - PRODUCTION VERIFICATION TEST SUITE 🧪');
  console.log('========================================================\n');

  let serverProcess = null;
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    serverProcess = await ensureServer();

    // 1. Health & Security Headers
    console.log('--- 1. System Health & Security Headers ---');
    try {
      const res = await request('/api/health');
      assert(res.status === 200, 'HTTP 200 on /api/health');
      assert(res.body.status === 'online', 'System status is online');
      assert(res.body.version === '2.7.0-PROD', 'System version is 2.7.0-PROD');
      assert(res.headers['x-content-type-options'] === 'nosniff', 'Security header X-Content-Type-Options: nosniff present');
      assert(res.headers['x-frame-options'] === 'SAMEORIGIN', 'Security header X-Frame-Options: SAMEORIGIN present');
    } catch (err) {
      assert(false, `Health check exception: ${err.message}`);
    }

    // 2. Authentication Flow
    console.log('\n--- 2. Authentication & JWT Integrity ---');
    let authToken = null;
    try {
      const loginRes = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'admin@auragrand.com', password: 'admin123' }
      });
      assert(loginRes.status === 200, 'Admin login HTTP 200');
      assert(loginRes.body.success === true, 'Admin login returns success');
      assert(typeof loginRes.body.token === 'string', 'JWT token issued');
      authToken = loginRes.body.token;

      // Test protected route with token
      const meRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert(meRes.status === 200, 'Authenticated /api/auth/me HTTP 200');
      assert(meRes.body.user.role === 'admin', 'Authenticated user has admin role');
    } catch (err) {
      assert(false, `Auth check exception: ${err.message}`);
    }

    // 3. Room Inventory & Compare
    console.log('\n--- 3. Room Inventory & Compare Architecture ---');
    try {
      const roomsRes = await request('/api/rooms');
      assert(roomsRes.status === 200, 'HTTP 200 on /api/rooms');
      assert(Array.isArray(roomsRes.body.rooms) && roomsRes.body.rooms.length > 0, 'Room catalogue populated');

      const compareRes = await request('/api/rooms/compare?ids=rm_501,rm_401');
      assert(compareRes.status === 200, 'HTTP 200 on /api/rooms/compare');
      assert(compareRes.body.success === true, 'Compare endpoint success is true');
      assert(compareRes.body.count === 2, 'Compare returns exactly 2 rooms');
    } catch (err) {
      assert(false, `Rooms check exception: ${err.message}`);
    }

    // 4. Financial Analytics & Multi-Currency
    console.log('\n--- 4. Billing & Financial Valuation ---');
    try {
      const currRes = await request('/api/billing/currencies');
      assert(currRes.status === 200, 'HTTP 200 on /api/billing/currencies');
      assert(currRes.body.rates.USD && currRes.body.rates.EUR && currRes.body.rates.AED, 'Multi-currency rates populated');

      const statsRes = await request('/api/billing/stats');
      assert(statsRes.status === 200, 'HTTP 200 on /api/billing/stats');
      assert(typeof statsRes.body.stats.totalRevenue === 'number', 'Total revenue metric is numeric');
    } catch (err) {
      assert(false, `Billing check exception: ${err.message}`);
    }

    // 5. Executive Dashboard & Night Audit
    console.log('\n--- 5. Executive Dashboard & Night Audit ---');
    try {
      const dashRes = await request('/api/stats/dashboard');
      assert(dashRes.status === 200, 'HTTP 200 on /api/stats/dashboard');
      assert(typeof dashRes.body.data.occupancyRate === 'number', 'Occupancy rate calculated');

      const yieldRes = await request('/api/stats/yield-engine');
      assert(yieldRes.status === 200, 'HTTP 200 on /api/stats/yield-engine');
      assert(yieldRes.body.rules && yieldRes.body.rules.surgeMultiplier, 'Dynamic yield rules active');
    } catch (err) {
      assert(false, `Stats check exception: ${err.message}`);
    }

    // 6. Static 3D Asset Files
    console.log('\n--- 6. 3D WebGL Vendor Files & Offline Readiness ---');
    const threePath = path.join(__dirname, '../public/js/vendor/three.min.js');
    const orbitPath = path.join(__dirname, '../public/js/vendor/OrbitControls.js');
    const threeCompPath = path.join(__dirname, '../public/js/three-components.js');
    assert(fs.existsSync(threePath) && fs.statSync(threePath).size > 500000, 'three.min.js present (>500KB local)');
    assert(fs.existsSync(orbitPath) && fs.statSync(orbitPath).size > 20000, 'OrbitControls.js present (>20KB local)');
    assert(fs.existsSync(threeCompPath), 'three-components.js present');

    // 7. Strict Attribution Verification
    console.log('\n--- 7. Attribution & Compliance Verification ---');
    const rootFiles = ['README.md', 'package.json', 'public/index.html', 'server.js'];
    let cleanAttribution = true;
    rootFiles.forEach(f => {
      const content = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
      if (content.includes('Group 5') || content.includes('Group-5') || content.includes('Group5')) {
        cleanAttribution = false;
        console.error(`  ❌ Forbidden token found in ${f}`);
      }
    });
    assert(cleanAttribution, 'Zero occurrences of forbidden Group 5 tokens');

  } catch (fatalErr) {
    console.error(`\n❌ Fatal test suite execution error: ${fatalErr.message}`);
    failed++;
  } finally {
    if (serverProcess) {
      console.log('\n🛑 Shutting down spawned test server...');
      try {
        serverProcess.kill('SIGTERM');
      } catch (e) {}
    }
  }

  console.log('\n========================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
