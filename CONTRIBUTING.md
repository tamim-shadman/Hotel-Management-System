# Contributing to Aura Grand PMS

Thank you for your interest in contributing to **Aura Grand Hotel & Residences Management System**.

This platform adheres to enterprise standards in performance, security, and aesthetics.

---

## Code of Conduct

All contributors are expected to uphold a welcoming, respectful, and professional environment.

---

## Development Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/tamim-shadman/Hotel-Management-System.git
cd Hotel-Management-System
```

### 2. Environment Setup
```bash
cp .env.example .env
npm install
npm run dev
```

### 3. Branch Naming
- Features: `feature/short-description`
- Bugfixes: `fix/short-description`
- Documentation: `docs/short-description`

### 4. Running Verification Tests
Before submitting any pull request, ensure the automated verification test suite passes with 100% success:
```bash
npm test
```

### 5. Architectural Standards
- **Zero Framework Dependency**: Frontend styles are written in pure Vanilla CSS3 custom properties (`public/css/style.css`).
- **Hardware Acceleration**: 3D WebGL features must run locked at 60 FPS using local vendor assets in `public/js/vendor/`.
- **API Consistency**: All backend routes must return standard `{ success: true|false, ... }` payloads.
- **Attribution Policy**: Core architecture is credited to **Tamim Shadman** and **Readuanul Farid Fahim**.
