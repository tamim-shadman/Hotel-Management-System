/**
 * ============================================================================
 * AURA GRAND LUXURY HOTEL & RESIDENCES - 3D WEBGL ENGINE & SPATIAL EXPERIENCES
 * Technology: Three.js (r128) + Canvas Procedural Textures + OrbitControls
 * Author: Tamim Shadman & Readuanul Farid Fahim
 * ============================================================================
 */

const Aura3D = {
  // State Containers
  hero: { scene: null, camera: null, renderer: null, particles: null, lines: null, animId: null },
  tower: { scene: null, camera: null, renderer: null, controls: null, floors: [], animId: null, exploded: false, activeFloor: null },
  keycard: { scene: null, camera: null, renderer: null, cardMesh: null, pointLight: null, animId: null, isFlipped: false, targetRotX: 0, targetRotY: 0 },
  spatial: { scene: null, camera: null, renderer: null, controls: null, sphereMesh: null, hotspots: [], animId: null, isAutoRotate: true, activeSpace: 'penthouse' },

  // Spatial Panoramas & Hotspots Data Catalog
  spaces: {
    penthouse: {
      title: 'Imperial Presidential Penthouse (Suite 501)',
      texture: '/assets/images/presidential_penthouse.jpg',
      rate: '$1,850 / night',
      hotspots: [
        { pos: [180, 20, -320], title: 'Private Teak Infinity Plunge Pool', desc: 'Heated salt-water plunge pool overlooking the coastal skyline with underwater fiber-optic constellation lighting.' },
        { pos: [-320, 10, -150], title: 'Bespoke Sommelier Wine Cellar', desc: 'Sub-Zero climate-regulated private vault curated with Grand Cru vintages and Cristal Champagne.' },
        { pos: [-120, -40, 350], title: 'Master King Chamber', desc: 'Handcrafted Swedish Hästens mattress dressed in 1,000-thread Italian sateen linen.' },
        { pos: [260, -30, 240], title: 'IoT Sensory Stateroom Hub', desc: 'Circadian luminescence calibration, organic lavender vaporization, and B&O acoustic soundscapes.' }
      ]
    },
    yacht: {
      title: 'Sunseeker 88ft Superyacht "Aura Sovereign"',
      texture: '/assets/images/superyacht_charter.jpg',
      rate: '$4,500 / day',
      hotspots: [
        { pos: [0, 40, -360], title: 'Upper Deck Jacuzzi & Sun Lounge', desc: 'Panoramic teak relaxation deck with 360-degree ocean views, Sommelier service, and Bose marine sound.' },
        { pos: [-280, -20, 180], title: 'Twin MTU 2000 M96L Engines', desc: 'State-of-the-art marine propulsion cruising at 30 knots with zero-vibration gyroscopic stabilization.' },
        { pos: [280, -10, 160], title: 'Onboard Master En-Suite Stateroom', desc: 'Full-beam master stateroom featuring Carrara marble bath and private captain intercom.' }
      ]
    },
    circadian: {
      title: 'Circadian Penthouse Wellness Suite',
      texture: '/assets/images/circadian_suite.jpg',
      rate: '$1,450 / night',
      hotspots: [
        { pos: [0, 30, -350], title: 'Dynamic Luminescence Array', desc: 'Biorhythm-aligned lighting cycling from 5,500K dawn daylight to 1,800K obsidian deep-REM glow.' },
        { pos: [280, -20, 100], title: 'Alpine Grade HEPA Purity Terminal', desc: 'Triple-stage medical grade air purification maintaining AQI 002 pristine Alpine air.' }
      ]
    }
  },

  // Hardware acceleration & WebGL support detection
  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  },

  // ==========================================================================
  // 1. HERO 3D AMBIENT GOLD STARDUST CONSTELLATION
  // ==========================================================================
  initHeroParticles() {
    const canvas = document.getElementById('hero3dCanvas');
    if (!canvas || typeof THREE === 'undefined' || !this.isWebGLAvailable()) return;

    // Dispose previous if any
    if (this.hero.animId) cancelAnimationFrame(this.hero.animId);

    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.z = 280;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL init skipped:', e.message);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Generate Procedural Golden Glow Sprite
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 32;
    spriteCanvas.height = 32;
    const ctx = spriteCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 235, 170, 1)');
    grad.addColorStop(0.3, 'rgba(212, 175, 55, 0.8)');
    grad.addColorStop(0.7, 'rgba(212, 175, 55, 0.2)');
    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(spriteCanvas);

    // Particle Geometry
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 500;
      positions[i + 1] = (Math.random() - 0.5) * 320;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      velocities.push({
        x: (Math.random() - 0.5) * 0.25,
        y: (Math.random() - 0.5) * 0.25,
        z: (Math.random() - 0.5) * 0.15
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xf5df8a,
      size: 4.5,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    this.hero = { scene, camera, renderer, particles, velocities, animId: null };

    // Mouse Parallax Physics
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    });

    // Resize Handler
    window.addEventListener('resize', () => {
      if (!canvas || !canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    const animate = () => {
      this.hero.animId = requestAnimationFrame(animate);

      // Inertia camera motion
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      camera.position.x = targetX * 0.4;
      camera.position.y = -targetY * 0.4;
      camera.lookAt(scene.position);

      // Particle subtle flow
      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        pos[idx] += velocities[i].x;
        pos[idx + 1] += velocities[i].y;
        pos[idx + 2] += velocities[i].z;

        if (pos[idx] > 250 || pos[idx] < -250) velocities[i].x *= -1;
        if (pos[idx + 1] > 160 || pos[idx + 1] < -160) velocities[i].y *= -1;
        if (pos[idx + 2] > 100 || pos[idx + 2] < -100) velocities[i].z *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.0006;

      renderer.render(scene, camera);
    };

    animate();
  },

  // ==========================================================================
  // 2. INTERACTIVE 3D ARCHITECTURAL RESORT TOWER TWIN
  // ==========================================================================
  initResortTower(containerId = 'threeTowerContainer') {
    const container = document.getElementById(containerId);
    if (!container || typeof THREE === 'undefined') return;

    if (this.tower.animId) cancelAnimationFrame(this.tower.animId);
    container.innerHTML = '';

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b14, 0.008);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
    camera.position.set(42, 34, 48);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't clip under ground
      controls.minDistance = 25;
      controls.maxDistance = 110;
      controls.target.set(0, 12, 0);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff4d6, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(30, 60, 40);
    scene.add(dirLight);

    const goldPoint = new THREE.PointLight(0xd4af37, 2.5, 60);
    goldPoint.position.set(0, 24, 0);
    scene.add(goldPoint);

    // Ground Podium Plaza (Dark Obsidian Polished Mirror)
    const groundGeo = new THREE.CylinderGeometry(28, 30, 1.2, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.15,
      metalness: 0.85
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.6;
    scene.add(ground);

    // Gold Plaza Trim Ring
    const ringGeo = new THREE.RingGeometry(27.8, 28.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4af37, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Create 5 Luxury Architectural Building Floors
    const floorData = [
      { floor: 1, name: 'Sanctuary Level & Auric Spa', height: 4.5, yBase: 0, suites: 8, vacant: 4, type: 'Wellness & Classic' },
      { floor: 2, name: 'Classic Horizon Residences', height: 4.0, yBase: 4.5, suites: 10, vacant: 6, type: 'Classic Suites' },
      { floor: 3, name: 'Deluxe Oceanfront Suites', height: 4.0, yBase: 8.5, suites: 8, vacant: 5, type: 'Deluxe Suites' },
      { floor: 4, name: 'Executive Panoramic Wing', height: 4.2, yBase: 12.5, suites: 6, vacant: 3, type: 'Executive Suites' },
      { floor: 5, name: 'Imperial Presidential Penthouses', height: 5.5, yBase: 16.7, suites: 4, vacant: 2, type: 'Presidential Penthouse & Helipad' }
    ];

    const floors = [];
    const floorGroup = new THREE.Group();

    floorData.forEach((info) => {
      const fGroup = new THREE.Group();
      fGroup.userData = info;

      // Slab Geometry (Floor Deck)
      const slabGeo = new THREE.BoxGeometry(18, 0.45, 14);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.8,
        roughness: 0.3
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.y = 0.22;
      fGroup.add(slab);

      // Gold Perimeter Edge
      const edgeGeo = new THREE.BoxGeometry(18.2, 0.15, 14.2);
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 });
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.y = 0.4;
      fGroup.add(edge);

      // Glass Outer Curtain Wall
      const glassGeo = new THREE.BoxGeometry(17.4, info.height - 0.5, 13.4);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.22,
        roughness: 0.05,
        transmission: 0.85,
        ior: 1.45,
        reflectivity: 0.6
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.y = (info.height - 0.5) / 2 + 0.45;
      fGroup.add(glass);

      // Glowing Internal Suite Pods (Vacant vs Occupied)
      const podCount = 4;
      for (let p = 0; p < podCount; p++) {
        const isVacant = p < info.vacant;
        const podGeo = new THREE.BoxGeometry(3.2, info.height - 1.2, 4.5);
        const podMat = new THREE.MeshStandardMaterial({
          color: isVacant ? 0x10b981 : 0xd4af37,
          emissive: isVacant ? 0x059669 : 0xaa820a,
          emissiveIntensity: isVacant ? 0.75 : 0.4,
          roughness: 0.4
        });
        const pod = new THREE.Mesh(podGeo, podMat);
        const xOffset = (p % 2 === 0 ? -5.5 : 5.5);
        const zOffset = (p < 2 ? -3.5 : 3.5);
        pod.position.set(xOffset, (info.height - 1.2) / 2 + 0.5, zOffset);
        fGroup.add(pod);
      }

      // Special Rooftop Details on Floor 5
      if (info.floor === 5) {
        // Helipad Ring
        const heliGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.15, 24);
        const heliMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
        const heli = new THREE.Mesh(heliGeo, heliMat);
        heli.position.set(4, info.height + 0.5, 0);
        fGroup.add(heli);

        // Helipad 'H' Marking
        const hBarGeo = new THREE.BoxGeometry(0.5, 0.05, 3);
        const hBarMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const h1 = new THREE.Mesh(hBarGeo, hBarMat);
        h1.position.set(3.2, info.height + 0.6, 0);
        const h2 = new THREE.Mesh(hBarGeo, hBarMat);
        h2.position.set(4.8, info.height + 0.6, 0);
        const hCross = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.5), hBarMat);
        hCross.position.set(4, info.height + 0.6, 0);
        fGroup.add(h1);
        fGroup.add(h2);
        fGroup.add(hCross);

        // Infinity Pool (Turquoise Glowing Water)
        const poolGeo = new THREE.BoxGeometry(7, 0.4, 4);
        const poolMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.6, roughness: 0.1 });
        const pool = new THREE.Mesh(poolGeo, poolMat);
        pool.position.set(-4.5, info.height + 0.4, 0);
        fGroup.add(pool);
      }

      fGroup.position.y = info.yBase;
      fGroup.userData.origY = info.yBase;
      floorGroup.add(fGroup);
      floors.push(fGroup);
    });

    scene.add(floorGroup);

    this.tower = {
      scene, camera, renderer, controls, floors, floorGroup,
      animId: null, exploded: false, activeFloor: null
    };

    // Render Loop
    const animate = () => {
      this.tower.animId = requestAnimationFrame(animate);
      if (controls) controls.update();
      if (!this.tower.exploded && !this.tower.activeFloor) {
        floorGroup.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  },

  // Explode or Compact Floors in 3D Space
  toggleTowerExplode() {
    if (!this.tower.floors.length) return;
    this.tower.exploded = !this.tower.exploded;

    this.tower.floors.forEach((fGroup, idx) => {
      const targetY = this.tower.exploded ? fGroup.userData.origY + (idx * 2.8) : fGroup.userData.origY;
      // Smooth Animation
      const startY = fGroup.position.y;
      const startTime = performance.now();
      const duration = 650;

      const animateStep = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        fGroup.position.y = startY + (targetY - startY) * ease;
        if (progress < 1) requestAnimationFrame(animateStep);
      };
      requestAnimationFrame(animateStep);
    });

    const btn = document.getElementById('btnExplodeTower');
    if (btn) {
      btn.innerHTML = this.tower.exploded ? '📦 Reassemble Tower' : '💥 Explode 3D Floors';
    }
  },

  // Focus Specific Floor
  focusFloor(floorNum) {
    this.tower.activeFloor = floorNum;
    const infoPanel = document.getElementById('towerFloorDetails');

    this.tower.floors.forEach((fGroup) => {
      const isMatch = fGroup.userData.floor === floorNum;
      fGroup.children.forEach(mesh => {
        if (mesh.material) {
          mesh.material.opacity = isMatch || floorNum === 'all' ? (mesh.material.transmission ? 0.35 : 1) : 0.2;
        }
      });
      if (isMatch) {
        // Highlight Elevation
        fGroup.position.y = fGroup.userData.origY + 1.2;
        if (infoPanel) {
          infoPanel.innerHTML = `
            <div style="background: rgba(14,20,32,0.9); border: 1.5px solid var(--border-gold); border-radius: var(--radius-md); padding: 1.25rem; animation: fadeIn 0.3s ease;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="badge badge-gold">Floor ${fGroup.userData.floor} Telemetry</span>
                <span class="badge badge-emerald">● ${fGroup.userData.vacant} Suites Vacant</span>
              </div>
              <h4 style="font-size: 1.2rem; color: #fff; margin: 0.5rem 0 0.25rem;">${fGroup.userData.name}</h4>
              <p style="color: var(--text-muted); font-size: 0.84rem; margin-bottom: 0.75rem;">${fGroup.userData.type} • 24/7 Butler & Dedicated High-Speed Lift</p>
              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" onclick="startBookingRoom('rm_${fGroup.userData.floor}01')">Reserve on Floor ${fGroup.userData.floor}</button>
                <button class="btn btn-outline btn-sm" onclick="Aura3D.openSpatialTour('penthouse')">Explore in 3D VR Tour</button>
              </div>
            </div>
          `;
        }
      } else {
        fGroup.position.y = fGroup.userData.origY;
      }
    });

    if (floorNum === 'all' && infoPanel) {
      this.tower.activeFloor = null;
      infoPanel.innerHTML = `
        <div style="color: var(--text-dim); font-size: 0.85rem; text-align: center; padding: 1rem;">
          Select a floor above or click the 3D model to inspect real-time suite occupancy & architectural features.
        </div>
      `;
    }
  },

  // ==========================================================================
  // 3. INTERACTIVE 3D METAL RFID KEYCARD WITH SPECULAR GLOSS
  // ==========================================================================
  init3DKeycard(containerId = 'threeKeycardContainer', options = {}) {
    const container = document.getElementById(containerId);
    if (!container || typeof THREE === 'undefined') return;

    if (this.keycard.animId) cancelAnimationFrame(this.keycard.animId);
    container.innerHTML = '';

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 100);
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Dynamic Procedural Canvas Texture for Keycard Front
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 1024;
    cardCanvas.height = 640;
    const cCtx = cardCanvas.getContext('2d');

    // Obsidian Brushed Gradient
    const bgGrad = cCtx.createLinearGradient(0, 0, 1024, 640);
    bgGrad.addColorStop(0, '#0c111c');
    bgGrad.addColorStop(0.5, '#162032');
    bgGrad.addColorStop(1, '#0c111c');
    cCtx.fillStyle = bgGrad;
    cCtx.fillRect(0, 0, 1024, 640);

    // Gold Foil Border
    cCtx.strokeStyle = '#d4af37';
    cCtx.lineWidth = 14;
    cCtx.strokeRect(28, 28, 968, 584);

    // Inner Accent Border
    cCtx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    cCtx.lineWidth = 3;
    cCtx.strokeRect(48, 48, 928, 544);

    // Gold Fleur-de-lis Crest
    cCtx.fillStyle = '#ffd700';
    cCtx.font = 'bold 84px serif';
    cCtx.fillText('⚜', 88, 140);

    // Brand Name
    cCtx.fillStyle = '#ffffff';
    cCtx.font = 'bold 42px Cinzel, serif';
    cCtx.letterSpacing = '6px';
    cCtx.fillText('AURA GRAND', 190, 115);

    cCtx.fillStyle = '#d4af37';
    cCtx.font = '22px sans-serif';
    cCtx.letterSpacing = '8px';
    cCtx.fillText('HOTEL & RESIDENCES • RFID PASS', 190, 150);

    // Suite Designation
    const suiteNum = options.roomNumber || '501';
    const guestName = options.guestName || 'Readuanul Fahim';

    cCtx.fillStyle = '#ffd700';
    cCtx.font = 'bold 96px Cinzel, serif';
    cCtx.fillText(`SUITE ${suiteNum}`, 88, 380);

    cCtx.fillStyle = '#94a3b8';
    cCtx.font = '30px sans-serif';
    cCtx.fillText('PRIMARY VERIFIED RESIDENT', 88, 435);

    cCtx.fillStyle = '#ffffff';
    cCtx.font = 'bold 36px sans-serif';
    cCtx.fillText(guestName.toUpperCase(), 88, 485);

    // RFID Wave Icon
    cCtx.fillStyle = '#10b981';
    cCtx.font = 'bold 44px sans-serif';
    cCtx.fillText('📶 CONTACTLESS RFID ACTIVE', 88, 550);

    const cardTex = new THREE.CanvasTexture(cardCanvas);

    // 3D Card Geometry
    const shape = new THREE.Shape();
    const w = 11;
    const h = 7;
    const r = 0.5;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.1, bevelThickness: 0.1 };
    const cardGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    cardGeo.center();

    // Material with Metallic Gold Gloss
    const cardMat = new THREE.MeshStandardMaterial({
      map: cardTex,
      metalness: 0.85,
      roughness: 0.25,
      color: 0xffffff
    });

    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    scene.add(cardMesh);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffe699, 2.8, 40);
    pointLight.position.set(5, 5, 12);
    scene.add(pointLight);

    this.keycard = {
      scene, camera, renderer, cardMesh, pointLight,
      animId: null, isFlipped: false, targetRotX: 0, targetRotY: 0
    };

    // Mouse Tracking Tilt
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      this.keycard.targetRotY = (this.keycard.isFlipped ? Math.PI : 0) + (x * 0.7);
      this.keycard.targetRotX = -y * 0.6;
      pointLight.position.set(x * 20, -y * 20, 12);
    });

    container.addEventListener('mouseleave', () => {
      this.keycard.targetRotX = 0;
      this.keycard.targetRotY = this.keycard.isFlipped ? Math.PI : 0;
    });

    // Animation Loop (Levitation + Physics Tilt)
    let clock = 0;
    const animate = () => {
      this.keycard.animId = requestAnimationFrame(animate);
      clock += 0.02;

      // Gentle Anti-Gravity Floating
      cardMesh.position.y = Math.sin(clock) * 0.25;

      // Smooth Rotation Lerp
      cardMesh.rotation.x += (this.keycard.targetRotX - cardMesh.rotation.x) * 0.1;
      cardMesh.rotation.y += (this.keycard.targetRotY - cardMesh.rotation.y) * 0.1;

      renderer.render(scene, camera);
    };

    animate();
  },

  flip3DKeycard() {
    if (!this.keycard.cardMesh) return;
    this.keycard.isFlipped = !this.keycard.isFlipped;
    this.keycard.targetRotY = this.keycard.isFlipped ? Math.PI : 0;
  },

  // ==========================================================================
  // 4. INTERACTIVE 3D 360° SPATIAL SANCTUARY PANORAMIC EXPLORER
  // ==========================================================================
  openSpatialTour(spaceKey = 'penthouse') {
    const modal = document.getElementById('spatialTourModal');
    const container = document.getElementById('spatial3dViewport');
    if (!modal || !container || typeof THREE === 'undefined') return;

    modal.classList.add('active');
    this.spatial.activeSpace = spaceKey;

    const data = this.spaces[spaceKey] || this.spaces.penthouse;
    document.getElementById('spatialTourTitle').innerText = data.title;

    // Dispose old if running
    if (this.spatial.animId) cancelAnimationFrame(this.spatial.animId);
    container.innerHTML = `
      <div class="spatial-instruction-hint">
        <span class="pulse-dot"></span> Click & drag to pan 360° • Scroll to zoom • Click glowing nodes to inspect luxury features
      </div>
      <div id="spatialHotspotTooltip" class="spatial-hotspot-tooltip" style="display: none;"></div>
    `;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Orbit Controls for 360 Dragging
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.enablePan = false;
    controls.rotateSpeed = -0.3; // Natural dragging direction
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;

    // Inverted 360 Spherical Mesh
    const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
    sphereGeo.scale(-1, 1, 1); // Flip normals inward

    const textureLoader = new THREE.TextureLoader();
    const sphereMat = new THREE.MeshBasicMaterial({
      map: textureLoader.load(data.texture)
    });

    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // 3D Spatial Hotspots
    const hotspots = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    data.hotspots.forEach((hs, idx) => {
      const hsGroup = new THREE.Group();
      hsGroup.position.set(hs.pos[0], hs.pos[1], hs.pos[2]);

      // Glowing Node Core
      const coreGeo = new THREE.SphereGeometry(8, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      hsGroup.add(core);

      // Pulsing Outer Ring
      const ringGeo = new THREE.RingGeometry(12, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      hsGroup.add(ring);

      hsGroup.userData = hs;
      scene.add(hsGroup);
      hotspots.push(hsGroup);
    });

    this.spatial = {
      scene, camera, renderer, controls, sphereMesh, sphereMat,
      hotspots, animId: null, isAutoRotate: true, activeSpace: spaceKey
    };

    // Hotspot Click Interaction
    const tooltip = document.getElementById('spatialHotspotTooltip');

    renderer.domElement.addEventListener('click', (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspots, true);

      if (intersects.length > 0) {
        let parentGroup = intersects[0].object.parent;
        if (!parentGroup.userData.title) parentGroup = intersects[0].object;
        const info = parentGroup.userData;

        if (tooltip && info.title) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${e.clientX - rect.left + 15}px`;
          tooltip.style.top = `${e.clientY - rect.top - 20}px`;
          tooltip.innerHTML = `
            <div style="font-size: 0.72rem; color: var(--gold-light); text-transform: uppercase; font-weight: 700;">Spatial Feature Node</div>
            <strong style="color: #fff; font-size: 0.95rem; display: block; margin: 0.2rem 0;">${info.title}</strong>
            <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0; line-height: 1.4;">${info.desc}</p>
          `;
        }
      } else {
        if (tooltip) tooltip.style.display = 'none';
      }
    });

    // Render Loop
    let pulseTime = 0;
    const animate = () => {
      this.spatial.animId = requestAnimationFrame(animate);
      pulseTime += 0.05;

      controls.update();

      // Pulse hotspot rings & billboard them toward camera
      hotspots.forEach(hs => {
        hs.lookAt(camera.position);
        const ring = hs.children[1];
        if (ring) {
          const s = 1 + Math.sin(pulseTime) * 0.25;
          ring.scale.set(s, s, s);
        }
      });

      renderer.render(scene, camera);
    };

    animate();
  },

  setSpatialLighting(mode) {
    if (!this.spatial.sphereMat) return;
    document.querySelectorAll('.spatial-mode-btn').forEach(b => b.classList.remove('active'));

    if (mode === 'day') {
      document.getElementById('btnLightDay')?.classList.add('active');
      this.spatial.sphereMat.color.setHex(0xffffff);
    } else if (mode === 'sunset') {
      document.getElementById('btnLightSunset')?.classList.add('active');
      this.spatial.sphereMat.color.setHex(0xffcb85);
    } else if (mode === 'night') {
      document.getElementById('btnLightNight')?.classList.add('active');
      this.spatial.sphereMat.color.setHex(0x7080b0);
    }
  },

  toggleSpatialAutoRotate() {
    if (!this.spatial.controls) return;
    this.spatial.controls.autoRotate = !this.spatial.controls.autoRotate;
    const btn = document.getElementById('btnSpatialDrift');
    if (btn) btn.innerText = this.spatial.controls.autoRotate ? '⏸ Pause Pan' : '🔄 Auto-Pan';
  },

  closeSpatialTour() {
    if (this.spatial.animId) {
      cancelAnimationFrame(this.spatial.animId);
      this.spatial.animId = null;
    }
    if (this.spatial.renderer) {
      try {
        this.spatial.renderer.dispose();
      } catch (e) {}
    }
    const modal = document.getElementById('spatialTourModal');
    if (modal) modal.classList.remove('active');
  }
};

// Auto-boot ambient hero particles on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    Aura3D.initHeroParticles();
  }, 300);
});
