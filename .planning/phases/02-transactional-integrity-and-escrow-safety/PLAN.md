# Phase 2: Transactional Integrity & Escrow Safety — Execution Plan

## Goal
Implement ACID multi-document transactions and atomic balance updates for all booking, completion payout, and cancellation refund operations to eliminate double-spending, race conditions, and partial failure states.

- **Phase**: 02
- **Requirements Covered**: `INT-01`, `INT-02`, `INT-03`, `INT-04`, `INT-05`
- **Estimated Wave Count**: 1 Wave

---

## Tasks

### Task 1 (Tracer): Atomic Booking Creation with Escrow Deduction
- **Objective**: Ensure session booking deductions and booking document creation occur in an atomic transaction with balance preconditions.
- **Files to Modify**:
  - `backend/controllers/bookingController.js` (`createBooking` method)
- **Key Logic**:
  - Start MongoDB session with `mongoose.startSession()`.
  - Atomically update learner's wallet using `findOneAndUpdate({ user: learnerId, balance: { $gte: skill.credits } }, { $inc: { balance: -skill.credits }, $push: { transactions: ... } }, { session, new: true })`.
  - If balance is insufficient, abort with HTTP 400.
  - Create `Booking` within the session.
  - Dispatch notifications post-transaction commit.
- **Verification**:
  - Booking with sufficient balance creates booking and decrements credits.
  - Booking with insufficient balance fails without modifying wallet.

---

### Task 2: Atomic Booking Completion & Instructor Payout
- **Objective**: Protect booking completion and instructor credit payout from race conditions and double-credit attacks.
- **Files to Modify**:
  - `backend/controllers/bookingController.js` (`updateBookingStatus` -> `completed` branch)
- **Key Logic**:
  - Execute within MongoDB transaction session.
  - Atomically transition status using `Booking.findOneAndUpdate({ _id: bookingId, status: 'upcoming' }, { $set: { status: 'completed' } }, { session, new: true })`.
  - If null, return 400 (already completed or cancelled).
  - Atomically increment instructor wallet balance with `$inc` and append credit transaction.
- **Verification**:
  - Session completion transitions status and pays instructor credits atomically.
  - Repeated calls to complete the same session reject without paying extra credits.

---

### Task 3: Atomic Booking Cancellation & Learner Refund
- **Objective**: Guarantee that session cancellations and credit refunds are idempotent, atomic, and strictly rollback-safe.
- **Files to Modify**:
  - `backend/controllers/bookingController.js` (`updateBookingStatus` -> `cancelled` branch)
- **Key Logic**:
  - Execute within MongoDB transaction session.
  - Atomically transition status using `Booking.findOneAndUpdate({ _id: bookingId, status: 'upcoming' }, { $set: { status: 'cancelled' } }, { session, new: true })`.
  - If null, return 400 (already completed or cancelled).
  - Atomically refund credits to learner wallet with `$inc` and append refund transaction.
- **Verification**:
  - Session cancellation transitions status and returns credits to learner.
  - Repeated cancellation attempts reject without duplicate refunds.

---

### Task 4: Phase Verification & Concurrency Smoke Test
- **Objective**: Verify that all transaction paths in `bookingController.js` and `purchaseController.js` execute cleanly.
- **Deliverables**:
  - `VERIFICATION.md` summary for Phase 2.
