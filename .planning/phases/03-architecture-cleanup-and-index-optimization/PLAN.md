# Phase 3: Architecture Cleanup & Index Optimization — Execution Plan

## Goal
Safely prune verified orphaned ESM files, add high-value database indexes for demonstrated query access patterns, and optimize unbounded admin queries without altering existing API contracts, runtime semantics, or active legacy compatibility layers.

- **Phase**: 03
- **Requirements Covered**: `ARCH-01`, `ARCH-02`, `ARCH-03`, `ARCH-04`
- **Estimated Wave Count**: 1 Wave

---

## Explicit Boundaries & Non-Goals
- ❌ Do NOT redesign the application.
- ❌ Do NOT change the Course marketplace behavior.
- ❌ Do NOT remove active legacy Booking/Skill functionality (`Booking.js`, `Skill.js`, `Review.js`, `bookingRoutes.js`, etc.).
- ❌ Do NOT modify authentication behavior or middleware re-exports (`authMiddleware.js`).
- ❌ Do NOT modify wallet transaction semantics.
- ❌ Do NOT change API contracts or response structures.
- ❌ Do NOT change the React UI or add new features.
- ❌ Do NOT blindly index every field — only add indexes where there is a demonstrated query benefit.

---

## Tasks

### Task 1: Safe Removal of Verified Orphaned ESM Files & Duplicate Models
- **Objective**: Remove 7 unused files confirmed to have zero references in the active CommonJS runtime.
- **Files to Remove**:
  1. `backend/controllers/aiController.js` (orphaned ESM controller)
  2. `backend/controllers/profileController.js` (orphaned ESM controller)
  3. `backend/controllers/sessionController.js` (orphaned ESM controller)
  4. `backend/controllers/messageController.js` (orphaned ESM controller)
  5. `backend/middleware/errorMiddleware.js` (orphaned ESM middleware)
  6. `backend/models/Profile.js` (orphaned model only referenced by unused ESM controllers)
  7. `backend/models/Session.js` (orphaned model only referenced by unused ESM controllers)
- **Verification**:
  - Run server startup and test suite to confirm zero missing module errors.

---

### Task 2: High-Value Query Index Optimization
- **Objective**: Add compound and single-field indexes to active models to accelerate high-frequency queries.
- **Files to Modify**:
  - `backend/models/Course.js`:
    - Add `{ status: 1, createdAt: -1 }` (for `getPublishedCourses`)
    - Add `{ status: 1, category: 1, createdAt: -1 }` (for category-filtered course browsing)
    - Add `{ teacher: 1, createdAt: -1 }` (for `getMyCourses`)
  - `backend/models/CourseReview.js`:
    - Add `{ course: 1, createdAt: -1 }` (for `getCourseReviews`)
  - `backend/models/Booking.js`:
    - Add `{ learner: 1, status: 1, date: 1 }`
    - Add `{ instructor: 1, status: 1, date: 1 }`
  - `backend/models/Skill.js`:
    - Add `{ category: 1, averageRating: -1 }`
    - Add `{ creator: 1 }`
- **Verification**:
  - Run schema index verification tests checking that `Model.schema.indexes()` contain all declared indexes.

---

### Task 3: Admin Controller Query Optimization
- **Objective**: Prevent unbounded database scans in `getUsers` by scoping wallet lookups to the fetched user ID set.
- **Files to Modify**:
  - `backend/controllers/adminController.js`:
    - In `getUsers`, replace unconstrained `Wallet.find()` with `Wallet.find({ user: { $in: users.map(u => u._id) } }).select('user balance')`.
- **Verification**:
  - Admin endpoint `/api/admin/users` returns exact same response payload structure.

---

### Task 4: Automated Verification & Regression Testing
- **Objective**: Run the complete automated test suite and ensure zero regressions.
- **Deliverables**:
  - `backend/tests/schemaIndexes.test.js` (tests asserting all declared indexes across models)
  - `VERIFICATION.md` report for Phase 3.
