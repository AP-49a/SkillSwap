# Phase 2: Course Marketplace Transactional Integrity — Execution Plan

## Goal
Verify and guarantee the transactional integrity, concurrency resilience, rollback behavior, and idempotency of the Course Marketplace (`purchaseController.js`, `Purchase.js`, `Wallet.js`) with automated integration tests without altering core business semantics.

- **Phase**: 02
- **Target Architecture**: Course Marketplace (MVP)
- **Files Under Scope**:
  - `backend/controllers/purchaseController.js`
  - `backend/models/Purchase.js`
  - `backend/models/Wallet.js`
  - `backend/models/Course.js`
  - `backend/tests/coursePurchase.test.js` (or test verification scripts)

---

## Explicit Boundaries & Non-Goals
- ❌ Do NOT add course refunds or invent a refund system.
- ❌ Do NOT modify legacy Booking cancellation/refund escrow flows.
- ❌ Do NOT change existing Course purchase semantics.
- ❌ Do NOT introduce new product features.
- ✅ Prefer rigorous test verification and targeted audits over unnecessary code rewrites.

---

## Tasks

### Task 1: Course Transaction Audit & Precondition Verification
- **Objective**: Audit `purchaseController.js` and `Purchase.js` to ensure compound unique indexes (`{ student: 1, course: 1 }`) are reliably registered, session transactions are cleanly managed across MongoDB environments, and error mappings (400, 404, 409, 503) are consistent.
- **Verification**:
  - Verify `PurchaseSchema.index({ student: 1, course: 1 }, { unique: true })` is indexed on the collection.
  - Verify error handling for unsupported standalone transactions (`503 Service Unavailable`) vs replica-set transactions.

---

### Task 2: Automated Transaction & Concurrency Test Suite for Course Purchases
- **Objective**: Implement automated tests verifying all transactional guarantees of `purchaseCourse`.
- **Test Cases**:
  1. **Atomic Purchase Success**: Student wallet decremented by `credits`, Teacher wallet incremented by `credits`, `Purchase` document created with status `completed`, and transaction ledger entries appended to both wallets.
  2. **Insufficient Balance Guard**: Student with fewer credits than `course.credits` is rejected with HTTP 400; student balance remains completely untouched.
  3. **Self-Purchase Prevention**: Teacher attempting to buy their own course is rejected with HTTP 400.
  4. **Duplicate Purchase Prevention**: Second purchase attempt by the same student for the same course returns HTTP 409 and does not debit student or credit teacher.
  5. **Rollback on Error**: If teacher wallet is missing or an unexpected database error occurs mid-transaction, student wallet debit is completely rolled back (zero balance discrepancy).
  6. **Concurrent Purchase Race Protection**: Simultaneous parallel purchase requests for the same course resolve cleanly (at most 1 succeeds, other rejected with 409, wallet debited exactly once).

---

### Task 3: Course Completion Idempotency & Zero-Credit Verification
- **Objective**: Implement automated tests verifying that `completeCourse` is strictly idempotent and transfers zero credits.
- **Test Cases**:
  1. **Initial Completion**: Sets `completedAt` timestamp and returns `{ completed: true }`.
  2. **Subsequent Completion**: Returns identical `completedAt` timestamp without mutation or error.
  3. **Zero Credit Movement**: Verify that student and teacher wallet balances remain unchanged during course completion.
  4. **Ownership Verification**: Non-purchasers or teachers attempting to complete receive appropriate 403/400 errors.

---

### Task 4: Phase Verification & Test Execution
- **Objective**: Execute the entire Course transaction test suite, verify 100% pass rate, and generate `VERIFICATION.md`.
- **Deliverables**:
  - `VERIFICATION.md` report documenting test results and transactional guarantees.
