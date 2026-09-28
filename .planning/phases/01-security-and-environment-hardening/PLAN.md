# Phase 1: Security & Environment Hardening — Execution Plan

## Goal
Harden authentication security, eliminate hardcoded secrets, enforce startup environment validation, and implement route-level brute-force rate limiting.

- **Phase**: 01
- **Requirements Covered**: `SEC-01`, `SEC-02`, `SEC-03`, `SEC-04`
- **Estimated Wave Count**: 1 Wave (Sequential or focused tasks)

---

## Tasks

### Task 1 (Tracer): Strict Environment Validation & JWT Secret Enforcement
- **Objective**: Fail-fast on server boot if essential security credentials (`JWT_SECRET`, `MONGO_URI`) are absent, and eliminate all fallback secret strings in `jwt.js`.
- **Files to Modify/Create**:
  - Create: `backend/config/env.js` (validates required environment variables and exports clean config)
  - Modify: `backend/config/jwt.js` (remove static `'supersecretjwtkey12345!@#'` fallbacks)
  - Modify: `backend/server.js` (load and validate env at entry, make DNS override conditional via `ENABLE_CUSTOM_DNS`)
- **Verification**:
  - Run node script without `JWT_SECRET` -> must throw descriptive error and exit.
  - Run node script with `JWT_SECRET` present -> boots normally.

---

### Task 2: Dedicated Authentication Rate Limiting
- **Objective**: Protect `/api/auth/login` and `/api/auth/signup` against brute force and automated credential stuffing.
- **Files to Modify/Create**:
  - Create: `backend/middleware/rateLimiter.js` (configurable limiters: `authLimiter` allowing 10 attempts per 15 minutes per IP)
  - Modify: `backend/routes/authRoutes.js` (apply `authLimiter` to `/login` and `/signup`)
- **Verification**:
  - Triggering >10 POST requests to `/api/auth/login` returns HTTP 429 `{ success: false, message: 'Too many login attempts. Please try again in 15 minutes.' }`.

---

### Task 3: Upload Middleware Error Standardization & Sanitization
- **Objective**: Standardize Multer error responses and ensure invalid file uploads or oversized payloads return proper JSON error responses.
- **Files to Modify/Create**:
  - Modify: `backend/middleware/upload.js` (clean error handling with explicit status codes)
  - Modify: `backend/middleware/error.js` (ensure `MulterError` is mapped to 400 Bad Request with user-friendly messages)
- **Verification**:
  - Submitting invalid MIME type or extension returns HTTP 400 Bad Request.

---

### Task 4: Phase Verification & Regression Check
- **Objective**: Verify that all Phase 1 changes integrate seamlessly without breaking existing API routes or startup flows.
- **Commands**:
  - Boot server and verify healthy `/health` response.
  - Run test curls against `/api/auth/login` (validation & rate limiting).
- **Deliverables**:
  - `VERIFICATION.md` summary for Phase 1.
