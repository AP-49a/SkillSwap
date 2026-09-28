# SkillSwap — Milestone 1.0 Requirements

## 1. Security & Configuration (SEC)

- [ ] **SEC-01**: Enforce strict JWT secret validation. Remove insecure fallback string in `backend/config/jwt.js`; fail fast at startup if `JWT_SECRET` is missing in production/development.
- [ ] **SEC-02**: Implement dedicated rate limiting on authentication routes (`/api/auth/login`, `/api/auth/signup`) to mitigate brute-force and credential stuffing attacks.
- [ ] **SEC-03**: Secure DNS resolution and environment loading in `backend/server.js` (remove hardcoded override workarounds or guard them conditionally for specific environments).
- [ ] **SEC-04**: Validate file upload extensions and MIME types strictly in `backend/middleware/uploadMiddleware.js` to prevent arbitrary file upload vulnerabilities.

---

## 2. Financial & Transactional Integrity (INT)

- [ ] **INT-01**: Atomic booking escrow creation: When a session is booked, deduct user wallet credits and place them in escrow within a single MongoDB session transaction (`withTransaction`).
- [ ] **INT-02**: Atomic booking completion: Releasing escrow credits to the instructor's wallet and marking booking `completed` must execute within a transactional session with optimistic/pessimistic lock safeguards.
- [ ] **INT-03**: Atomic booking cancellation & refunds: Refunding escrow credits back to the learner upon cancellation must be strictly transactional and idempotent.
- [ ] **INT-04**: Prevent double-spending and race conditions: Ensure negative balance checks and balance updates cannot collide during concurrent requests.
- [ ] **INT-05**: Audit logging: Record immutable ledger transactions for every credit movement (credit debit, credit credit, escrow hold, escrow release, refund).

---

## 3. Architecture & Cleanup (ARCH)

- [ ] **ARCH-01**: Remove orphaned ES module files in `backend/controllers/` (`aiController.js`, `profileController.js`, `sessionController.js`, `messageController.js`) and `backend/middleware/errorMiddleware.js` that conflict with the CommonJS server runtime.
- [ ] **ARCH-02**: Reconcile redundant models (`backend/models/Profile.js`, `backend/models/Session.js` vs active `User.js`, `Booking.js`).
- [ ] **ARCH-03**: Add compound database indexes on frequently queried fields in `Booking` (`learner`, `instructor`, `status`, `sessionDate`) and `Skill` (`category`, `price`, `rating`).
- [ ] **ARCH-04**: Optimize admin aggregation queries in `adminController.js` to use bounded pagination and index-supported projections.

---

## 4. Automated Testing & Verification (TEST)

- [ ] **TEST-01**: Setup Jest + Supertest test infrastructure with `mongodb-memory-server` for isolated, fast integration testing.
- [ ] **TEST-02**: Implement integration test suite for Auth flow (registration, login, invalid credentials, token verification, route protection).
- [ ] **TEST-03**: Implement integration test suite for Wallet & Transaction lifecycle (deposit, balance retrieval, concurrent balance deductions).
- [ ] **TEST-04**: Implement integration test suite for Booking lifecycle & Escrow (booking creation, instructor completion payout, learner cancellation refund).
- [ ] **TEST-05**: Configure `npm test` script in `backend/package.json` and root `package.json` to run automated test suites cleanly.
