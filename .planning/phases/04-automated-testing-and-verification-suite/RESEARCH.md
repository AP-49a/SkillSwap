# Phase 4: Automated Testing & Verification Suite — Research & Strategy

## Context & Scope
Phase 4 consolidates and completes the automated test suite for SkillSwap, ensuring end-to-end regression protection across Authentication, Wallet mechanics, Course Marketplace lifecycles, and Security controls:
- Requirements: `TEST-01`, `TEST-02`, `TEST-03`, `TEST-04`, `TEST-05`

---

## Existing Test Suite Inventory

As of Phase 3, the following 7 test suites are active and passing (42 total tests):
1. `backend/tests/bookingMeetingLink.test.js` (Google Meet link validation)
2. `backend/tests/courseCompletion.test.js` (Course completion timestamp and credits invariance)
3. `backend/tests/courseDoubtSession.test.js` (Doubt session validation and constraints)
4. `backend/tests/coursePurchaseTransaction.test.js` (Atomic purchase, balance predicates, duplicate race protection)
5. `backend/tests/courseReview.test.js` (Rating constraints, review uniqueness)
6. `backend/tests/courseVideo.test.js` (Protected video streams and storage paths)
7. `backend/tests/schemaIndexes.test.js` (All active compound database indexes)

---

## Test Coverage Gaps to Address in Phase 4

### 1. Authentication & Security Middleware (`authSecurity.test.js`) (`TEST-02`)
- **Gaps**:
  - JWT generation and cookie options configuration (HttpOnly, SameSite, Secure flags).
  - `protect` middleware validation: rejecting requests with no token, malformed token, or expired token; resolving user payload.
  - User model password hashing with bcrypt pre-save hooks and `matchPassword` method.
  - Rate limiter behavior (429 response structure on threshold breach).

### 2. Wallet & Financial Ledger Lifecycle (`walletLedger.test.js`) (`TEST-03`)
- **Gaps**:
  - Default credit provisioning (10 credits on initial wallet creation).
  - Validation enforcement preventing negative balances.
  - Transaction ledger formatting (credit vs. debit typing, timestamps, chronological sorting).

### 3. Course Creation & Publishing Lifecycle (`courseManagement.test.js`) (`TEST-04`)
- **Gaps**:
  - Course status state transitions (`draft` -> `published`).
  - Teacher authorization guard on updating/deleting/publishing courses (preventing non-owners from modifying courses).
  - Input boundary validations (credit price min >= 1, description/title max lengths).

### 4. Central Error Handler & Format Standardization (`errorHandler.test.js`) (`TEST-05`)
- **Gaps**:
  - Mongoose `CastError` (bad ObjectId -> 404).
  - Mongoose `ValidationError` (schema violations -> 400).
  - Mongoose `11000` duplicate key (unique index collisions -> 400).
  - Multer `LIMIT_FILE_SIZE` -> 413 Payload Too Large.
  - JWT errors -> 401 Unauthorized.

---

## Toolchain & Runner
- **Runner**: Node.js built-in native test runner (`node:test` + `node:assert/strict`).
- **Execution Script**: `npm test` from project root and `backend/`.
- **Benefits**: Zero extra heavy dev-dependencies, sub-second execution, zero native binary compilation issues.
