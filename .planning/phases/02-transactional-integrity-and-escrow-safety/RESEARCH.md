# Phase 2: Transactional Integrity & Escrow Safety — Research & Architecture

## Context & Scope
Phase 2 resolves critical data integrity vulnerabilities in credit deductions, session bookings, completion payouts, and cancellation refunds across the SkillSwap backend:
- Requirements: `INT-01`, `INT-02`, `INT-03`, `INT-04`, `INT-05`

---

## Gap Analysis & Vulnerability Assessment

### 1. Non-Atomic Booking & Escrow Creation (`INT-01`, `INT-04`)
- **Current State**: In `bookingController.js`:
  ```javascript
  const learnerWallet = await Wallet.findOne({ user: learnerId });
  if (!learnerWallet || learnerWallet.balance < skill.credits) { ... }
  learnerWallet.balance -= skill.credits;
  await learnerWallet.save();
  const booking = await Booking.create({ ... });
  ```
- **Vulnerabilities**:
  1. **Race Condition / Double-Spending**: Concurrent booking requests can read the same wallet balance before either decrements it, driving the balance negative.
  2. **Orphaned Deduction**: If `Booking.create()` fails (e.g. database validation error or connection dropout), the learner's credits were already deducted with no rollback.

### 2. Double Completion & Double Refund Vulnerabilities (`INT-02`, `INT-03`, `INT-04`)
- **Current State**: In `updateBookingStatus`:
  ```javascript
  if (booking.status !== 'upcoming') return res.status(400)...;
  booking.status = 'completed';
  await booking.save();
  instructorWallet.balance += booking.credits;
  await instructorWallet.save();
  ```
- **Vulnerabilities**:
  1. **Concurrent State Transition**: Two simultaneous completion requests both read `booking.status === 'upcoming'`, then both credit the instructor wallet, paying out double the amount.
  2. **Double Refund**: Simultaneous cancellation requests can trigger multiple refund transactions back to the learner.
  3. **Partial Failure**: If `booking.save()` succeeds but `instructorWallet.save()` fails, the session is marked completed but the teacher never receives credits.

---

## Technical Solution Pattern

### Multi-Document ACID Transactions with Graceful Standalone Fallback
1. **Transaction Wrapping**: Use `mongoose.startSession()` and `session.withTransaction(async () => { ... })`.
2. **Atomic Balance Lock / Conditional Updates**:
   - Deducting credits:
     ```javascript
     const wallet = await Wallet.findOneAndUpdate(
       { user: learnerId, balance: { $gte: skill.credits } },
       {
         $inc: { balance: -skill.credits },
         $push: {
           transactions: {
             amount: skill.credits,
             type: 'debit',
             description: `Booked session: "${skill.title}"`
           }
         }
       },
       { new: true, session, runValidators: true }
     );
     ```
   - Transitioning booking status:
     ```javascript
     const updatedBooking = await Booking.findOneAndUpdate(
       { _id: bookingId, status: 'upcoming' },
       { $set: { status: targetStatus } },
       { new: true, session }
     );
     ```
     If `updatedBooking` is null, another concurrent request already updated or cancelled the booking, immediately aborting without side effects.
3. **Standalone Fallback Support**: When running in single-node MongoDB without replica sets (e.g., local dev without rs0), provide atomic single-operation safety matching `purchaseController.js`.

---

## Verification Plan
1. Test session booking creation with insufficient balance (must reject with 400).
2. Test session booking creation with sufficient balance (must deduct atomically and create booking).
3. Test concurrent status updates (only one transition allowed, subsequent calls rejected).
4. Test cancellation and refund (credits returned, status set to cancelled, idempotent).
