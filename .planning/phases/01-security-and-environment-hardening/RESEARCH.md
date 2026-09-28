# Phase 1: Security & Environment Hardening — Research & Architecture

## Context & Scope
Phase 1 addresses critical security baselines and environment initialization rules in the SkillSwap backend:
- Requirements: `SEC-01`, `SEC-02`, `SEC-03`, `SEC-04`

---

## Findings & Gap Analysis

### 1. Hardcoded JWT Secret Fallback (`SEC-01`)
- **Current State**: `backend/config/jwt.js` uses `process.env.JWT_SECRET || 'supersecretjwtkey12345!@#'` in both `generateToken` and `verifyToken`.
- **Vulnerability**: If `JWT_SECRET` is omitted from the environment, the server silently signs and verifies tokens using a known static string published in the repository. Attackers can forge administrative tokens.
- **Remediation**:
  - Check `process.env.JWT_SECRET` on server initialization and fail-fast with a descriptive startup error if missing or under 32 characters.
  - Remove all inline fallback strings in `jwt.js`.

### 2. Authentication Route Rate Limiting (`SEC-02`)
- **Current State**: Only a permissive global rate limiter (1000 requests / 15 minutes) is mounted on `/api/`. `/api/auth/login` and `/api/auth/signup` have no specific throttling.
- **Vulnerability**: Vulnerable to brute force attacks on user passwords and spamming of account registrations.
- **Remediation**:
  - Create a dedicated `authLimiter` middleware in `backend/middleware/rateLimiter.js` (or in auth routes) restricting login attempts (e.g. 10 requests per 15 minutes per IP) with informative error messages.
  - Mount specifically on sensitive auth endpoints.

### 3. Server Startup & Environment Validation (`SEC-03`)
- **Current State**:
  - `backend/server.js` unconditionally overrides DNS servers with Google DNS (`8.8.8.8`) on lines 1-2.
  - `dotenv.config()` is called after global side-effects, and there is no unified validation of required environment variables (`JWT_SECRET`, `MONGO_URI`, `PORT`, `NODE_ENV`).
- **Remediation**:
  - Create `backend/config/env.js` (or validate during startup) to check for required keys (`JWT_SECRET`, `MONGO_URI`) before initiating database connection or starting the HTTP server.
  - Make DNS custom nameserver override opt-in via an explicit environment flag (`ENABLE_CUSTOM_DNS=true`) rather than unconditional.

### 4. File Upload Security & MIME Hardening (`SEC-04`)
- **Current State**:
  - `backend/middleware/upload.js` checks extension and MIME regex (`/jpeg|jpg|png|webp|gif/`).
  - `backend/middleware/videoUpload.js` uses `crypto.randomUUID()`.
- **Remediation**:
  - Ensure error middleware properly catches Multer errors (`MulterError`) and returns clean 400/413 JSON responses rather than leaking stack traces.
  - Verify filename sanitization and path traversal immunity for all upload destinations.

---

## Validation Strategy
- Start server without `JWT_SECRET` -> must exit with error status code.
- Start server with valid `JWT_SECRET` -> boots cleanly.
- Send >10 login attempts to `/api/auth/login` -> receives HTTP 429 Too Many Requests.
- Send non-image file upload to avatar route -> receives HTTP 400 with clean JSON error.
