# Phase 4: Automated Testing & Verification Suite — Execution Plan

## Goal
Implement automated test suites covering Authentication & Security, Wallet & Ledger lifecycles, Course management & authorization, and Central error handling to guarantee 100% milestone regression protection.

- **Phase**: 04
- **Requirements Covered**: `TEST-01`, `TEST-02`, `TEST-03`, `TEST-04`, `TEST-05`
- **Estimated Wave Count**: 1 Wave

---

## Tasks

### Task 1: Auth & Security Middleware Test Suite
- **Objective**: Verify password security, JWT operations, `protect` middleware guards, and rate limiter responses.
- **Files to Create**:
  - `backend/tests/authSecurity.test.js`
- **Test Cases**:
  - User password hashing before save and `matchPassword` verification.
  - JWT token generation with secure cookie configuration.
  - `protect` middleware rejects missing token (401), invalid token (401), and passes valid token with user attachment.
  - `authLimiter` headers and status code behavior.

---

### Task 2: Wallet & Financial Ledger Lifecycle Test Suite
- **Objective**: Verify wallet defaults, transaction ledger integrity, and balance constraints.
- **Files to Create**:
  - `backend/tests/walletLedger.test.js`
- **Test Cases**:
  - Default credit provisioning (10 credits on creation).
  - Negative balance rejection via schema validator.
  - Transaction ledger structure (amount, type enum, description, date).
  - `getWallet` controller sorts transactions in descending chronological order.

---

### Task 3: Course Creation & Publishing Test Suite
- **Objective**: Verify course state transitions, ownership permissions, and schema constraints.
- **Files to Create**:
  - `backend/tests/courseManagement.test.js`
- **Test Cases**:
  - Course creation defaults to `draft` status.
  - Publishing transitions status to `published`.
  - Non-owner cannot update, publish, or delete a teacher's course (403).
  - Credit price minimum (>= 1) and field length boundaries.

---

### Task 4: Central Error Handling & Status Codes Test Suite
- **Objective**: Verify standard JSON error payload formatting and correct HTTP status code mappings.
- **Files to Create**:
  - `backend/tests/errorHandler.test.js`
- **Test Cases**:
  - `CastError` -> 404 Resource not found.
  - `ValidationError` -> 400 Bad Request with comma-separated messages.
  - `11000` duplicate key -> 400 Bad Request.
  - `MulterError` `LIMIT_FILE_SIZE` -> 413 Payload Too Large.
  - `JsonWebTokenError` -> 401 Unauthorized.
  - Production mode 500 error sanitization.

---

### Task 5: Milestone 1.0 Final Verification
- **Objective**: Execute `npm test` across all suites and verify 100% pass rate.
- **Deliverables**:
  - `VERIFICATION.md` report for Phase 4.
