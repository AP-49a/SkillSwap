# Phase 2: Course Marketplace Transactional Integrity — Research & Audit

## Context & Scope
The active SkillSwap MVP architecture is the **Course Marketplace** (powered by `Course`, `Purchase`, and `Wallet` models).

This audit evaluates the transactional safety, concurrency resilience, rollback behavior, and idempotency of the Course marketplace implementation in `backend/controllers/purchaseController.js`.

---

## Current Architecture & Implementation Audit

### 1. Course Purchase Transaction Lifecycle (`purchaseCourse`)
The purchase flow is implemented in `backend/controllers/purchaseController.js` lines 29–142:

- **ACID Transaction Session**: Initiated via `mongoose.startSession()` and executed inside `session.withTransaction(async () => { ... })`.
- **Pre-Conditions & Authorization**:
  - Validates that the target course exists and is `published`.
  - Blocks self-purchasing (`teacherId === studentId` -> HTTP 400).
  - Checks for existing ownership within the transaction session (`hasCoursePurchase` -> HTTP 409).
- **Atomic Student Debit**:
  - Uses `Wallet.findOneAndUpdate` with an atomic balance predicate:
    ```javascript
    { user: studentId, balance: { $gte: course.credits } }
    ```
  - Decrements balance atomically with `$inc: { balance: -course.credits }` and pushes a debit transaction record.
  - If balance is insufficient or wallet does not exist, returns `null` -> throws HTTP 400 -> automatically aborts the transaction session.
- **Atomic Teacher Credit**:
  - Uses `Wallet.findOneAndUpdate` with `{ user: course.teacher }`.
  - Increments balance atomically with `$inc: { balance: course.credits }` and pushes a credit transaction record.
  - If teacher wallet is missing -> throws HTTP 500 -> aborts the entire transaction session.
- **Purchase Record Creation**:
  - Creates the `Purchase` document with `{ status: 'completed' }` within the transaction session.
- **Unique Compound Index Protection**:
  - `Purchase.js` enforces `PurchaseSchema.index({ student: 1, course: 1 }, { unique: true })`.
  - In the event of parallel race conditions bypassing the initial check, MongoDB rejects the duplicate insertion with code `11000`, causing the transaction to abort and roll back all wallet balance mutations.
  - Controller catches error code `11000` and maps it cleanly to HTTP 409 `{ success: false, message: 'You already own this course' }`.
- **Session Lifecycle Management**:
  - Guaranteed cleanup via `finally { await session.endSession(); }`.

### 2. Course Completion Idempotency (`completeCourse`)
Implemented in `backend/controllers/purchaseController.js` lines 192–232:
- Verifies published course existence and ownership.
- Verifies authenticated student has a completed purchase for the course.
- Idempotently sets `purchase.completedAt = new Date()` only if `!purchase.completedAt`.
- Subsequent completion calls return existing `completedAt` timestamp without mutation.
- **Credit Movement**: By design, Course completion transfers **zero credits** (credits are transferred immediately at purchase time).

### 3. Course Doubt Sessions (`courseDoubtSessionController.js`)
- Requires completed purchase verification before requesting doubt sessions.
- Enforces single pending session constraint per student per course.
- Doubt sessions coordinate 1-on-1 sessions and transfer **zero credits**.

### 4. Non-Goals & Out-of-Scope Items
- **Course Refunds**: Not part of the Course MVP specification (no refund flow exists or should be added).
- **Legacy Booking Escrow**: The legacy Booking marketplace (`bookingController.js` / `Booking.js`) is deprecated and out of scope for the Course MVP.

---

## Findings Summary

| Dimension | Implementation Status | Assessment |
| :--- | :--- | :--- |
| **Atomic Debit/Credit** | Implemented via `session.withTransaction` + `$inc` | ✅ Robust |
| **Double-Spending Prevention** | Implemented via atomic `{ balance: { $gte: credits } }` | ✅ Robust |
| **Duplicate Purchase Race Guard** | Implemented via compound unique index + rollback | ✅ Robust |
| **All-or-Nothing Rollback** | Verified on student failure, teacher failure, or collision | ✅ Robust |
| **Completion Idempotency** | Implemented via `!purchase.completedAt` guard | ✅ Robust |
| **Automated Verification Suite** | No automated tests currently exercising these guarantees | ⚠️ Gap to address |

---

## Action Plan
Because the core Course transaction logic is already sound and correctly implemented, Phase 2 will focus on:
1. Auditing and confirming transaction guarantees across edge cases.
2. Building automated integration verification tests covering:
   - Successful atomic purchase (student debit + teacher credit + purchase creation).
   - Insufficient balance rejection without balance mutation.
   - Concurrent duplicate purchase race protection (unique index enforcement & rollback).
   - Partial failure rollback (ensuring student wallet is unchanged if teacher credit fails).
   - Course completion idempotency and zero-credit transfer verification.
