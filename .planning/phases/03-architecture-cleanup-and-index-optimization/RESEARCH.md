# Phase 3: Architecture Cleanup & Index Optimization — Research & Inventory

## Objective
Audit the SkillSwap backend codebase to safely clean verified orphaned files, optimize database query indexes for high-frequency access patterns, and optimize unbounded admin queries without altering existing API contracts, runtime semantics, or active legacy compatibility layers.

---

## 1. Dead Code vs. Retained Compatibility Audit

A complete import and reference trace was conducted across all backend routes, controllers, middleware, and models.

### Verified Orphaned / Unused Files (Targeted for Safe Removal)
The following 7 files use ES Module syntax (`import`/`export`), contain broken dependencies (e.g. uninstalled `@google/generative-ai`), or define duplicate schemas that are **zero-referenced** by the active CommonJS runtime (`server.js`, `routes/*`):

| File | Syntax / Type | Analysis & Import Trace |
| :--- | :--- | :--- |
| `backend/controllers/aiController.js` | ESM Controller | Unused. `aiRoutes.js` handles AI suggestions inline with CommonJS models. References uninstalled package. |
| `backend/controllers/profileController.js` | ESM Controller | Unused. `profileRoutes.js` routes directly to `userController.js` (`getProfile`, `updateProfile`). |
| `backend/controllers/sessionController.js` | ESM Controller | Unused. `sessionRoutes.js` queries `Booking` model directly with CommonJS. |
| `backend/controllers/messageController.js` | ESM Controller | Unused. `messageRoutes.js` and Socket.IO in `server.js` handle messages directly. |
| `backend/middleware/errorMiddleware.js` | ESM Middleware | Unused. Canonical error middleware is `backend/middleware/error.js`. |
| `backend/models/Profile.js` | ESM/CJS Model | Unused. Only imported by the 4 orphaned ESM controllers above. Active user profiles use embedded subdocuments in `User.js`. |
| `backend/models/Session.js` | ESM/CJS Model | Unused. Only imported by the orphaned ESM controllers above. Active scheduling uses `Booking.js`. |

### Intentionally Retained Active / Compatibility Modules (Do NOT Remove)
- **`backend/middleware/authMiddleware.js`**: Re-exports `backend/middleware/auth.js` for legacy import compatibility.
- **`backend/models/Booking.js` & `backend/controllers/bookingController.js`**: Active Booking/Session endpoints (`/api/bookings`, `/api/sessions`).
- **`backend/models/Skill.js` & `backend/controllers/skillController.js`**: Active Skill listing endpoints (`/api/skills`).
- **`backend/models/Review.js` & `backend/controllers/reviewController.js`**: Active Booking reviews endpoints (`/api/reviews`).
- **`backend/routes/sessionRoutes.js`**: Active alias routes mapping to `Booking` model.
- **`backend/routes/profileRoutes.js`**: Active alias routes mapping to `userController.js`.

---

## 2. Database Index Optimization Audit

Only indexes with a demonstrated query/access-pattern benefit are proposed:

### 1. `Course` Model (`backend/models/Course.js`)
- **Query 1**: `getPublishedCourses` (`Course.find({ status: 'published' }).sort({ createdAt: -1 })`)
  - **Proposed Index**: `{ status: 1, createdAt: -1 }`
- **Query 2**: `getPublishedCourses` with Category Filter (`Course.find({ status: 'published', category: ... }).sort({ createdAt: -1 })`)
  - **Proposed Index**: `{ status: 1, category: 1, createdAt: -1 }`
- **Query 3**: `getMyCourses` (`Course.find({ teacher: req.user.id }).sort({ createdAt: -1 })`)
  - **Proposed Index**: `{ teacher: 1, createdAt: -1 }`

### 2. `CourseReview` Model (`backend/models/CourseReview.js`)
- **Query**: `getCourseReviews` (`CourseReview.find({ course: req.params.id }).sort({ createdAt: -1 })`)
  - **Existing Index**: `{ student: 1, course: 1 }` (unique compound index — does not index queries where `course` is the sole lookup key).
  - **Proposed Index**: `{ course: 1, createdAt: -1 }`

### 3. `Booking` Model (`backend/models/Booking.js`)
- **Query**: `getBookings` (`Booking.find({ $or: [{ instructor: userId }, { learner: userId }], status: ... }).sort({ date: 1, timeSlot: 1 })`)
  - **Proposed Indexes**:
    - `{ learner: 1, status: 1, date: 1 }`
    - `{ instructor: 1, status: 1, date: 1 }`

### 4. `Skill` Model (`backend/models/Skill.js`)
- **Query**: `getSkills` (`Skill.find({ category: ... }).sort({ averageRating: -1 })`) and `Skill.find({ creator: ... })`
  - **Proposed Indexes**:
    - `{ category: 1, averageRating: -1 }`
    - `{ creator: 1 }`

---

## 3. Query Optimization in Admin Controller

In `backend/controllers/adminController.js` (`getUsers`):
- **Current Pattern**: `Wallet.find()` loads every wallet in the entire database into memory without filtering.
- **Optimized Pattern**: `Wallet.find({ user: { $in: userIds } }, 'user balance')` to project only necessary fields for the returned batch of users.

---

## 4. Safety & Non-Regressions Strategy
- Verify that running `npm test` continues to pass with 100% success rate after file removals and index additions.
- Ensure all route endpoints mount cleanly in `backend/server.js`.
