# Codebase Concerns, Technical Debt, & Architectural Risks

## 1. Executive Summary & Risk Overview

SkillSwap is an interactive skill-exchange and course-sharing platform with an Express/MongoDB backend and a modern React 19/Vite frontend. While core features (course streaming, doubt sessions, reviews, and bookings) function well in development, the codebase carries significant architectural debt, security vulnerabilities, concurrency risks, and scaling bottlenecks.

| Risk Category | Severity | Primary Areas Affected | Impact Summary |
| :--- | :--- | :--- | :--- |
| **Financial & Transaction Integrity** | **CRITICAL (P0)** | `bookingController.js`, `purchaseController.js`, `Wallet.js` | Lack of MongoDB transactions allows race conditions, double-spending of credits, and out-of-sync wallet balances. |
| **Authentication & Secrets** | **HIGH (P1)** | `config/jwt.js`, `server.js`, `authController.js` | Hardcoded JWT fallback secret, lack of dedicated auth rate-limiting (brute-force exposure), DNS hardcoding. |
| **Dead Code & Dual Architecture** | **HIGH (P1)** | `controllers/aiController.js`, `controllers/profileController.js`, `controllers/sessionController.js`, `middleware/errorMiddleware.js`, `models/Profile.js`, `models/Session.js` | Entire suite of ES module controllers exists orphaned and disconnected from routes, with conflicting schemas and runtime syntax incompatibility. |
| **Database Performance & Indexing** | **HIGH (P1)** | `models/Booking.js`, `models/Skill.js`, `controllers/adminController.js` | Missing indexes on critical query paths; admin endpoints execute unbounded queries loading all records into server memory. |
| **File Storage & Multi-Instance Scaling** | **MEDIUM (P2)** | `videoUpload.js`, `upload.js`, `server.js` | Uploads and private video files stored on local filesystem; Socket.IO state stored in in-memory Map. Cannot scale horizontally. |
| **Test Coverage Deficits** | **MEDIUM (P2)** | Backend Auth, Wallet, Bookings, Chat, and all Frontend UI | Zero automated test coverage for critical business flows (Auth, Wallet, Bookings, Socket.IO) and zero frontend tests. |

---

## 2. Technical Debt & Architectural Drift

### 2.1 Dual Architecture & Orphaned ES Module Controllers
The backend contains two divergent, conflicting subsystems:
1. **Active CommonJS System (`server.js`)**: Uses `require()`, models `User`, `Wallet`, `Skill`, `Booking`, `Course`, `CourseVideo`, `Purchase`, `CourseReview`, `CourseDoubtSession`.
2. **Orphaned ES Module Subsystem**: Written with `import`/`export` syntax that would throw `SyntaxError` if required directly under Node CommonJS mode:
   - [`backend/controllers/profileController.js`](file:///c:/codes/SkillSwap/backend/controllers/profileController.js): References `Profile` model with gamification fields (`level`, `xp`, `streak`) not present in `User`.
   - [`backend/controllers/aiController.js`](file:///c:/codes/SkillSwap/backend/controllers/aiController.js): Implements Google Gemini generative AI features, but is bypassed by inline route handlers in [`backend/routes/aiRoutes.js`](file:///c:/codes/SkillSwap/backend/routes/aiRoutes.js).
   - [`backend/controllers/sessionController.js`](file:///c:/codes/SkillSwap/backend/controllers/sessionController.js): Mutates non-existent fields like `user.credits` instead of using the `Wallet` model.
   - [`backend/controllers/messageController.js`](file:///c:/codes/SkillSwap/backend/controllers/messageController.js): Bypassed by inline route handlers in [`backend/routes/messageRoutes.js`](file:///c:/codes/SkillSwap/backend/routes/messageRoutes.js).
   - [`backend/middleware/errorMiddleware.js`](file:///c:/codes/SkillSwap/backend/middleware/errorMiddleware.js): Unused, uses `export const`.
   - [`backend/models/Profile.js`](file:///c:/codes/SkillSwap/backend/models/Profile.js) and [`backend/models/Session.js`](file:///c:/codes/SkillSwap/backend/models/Session.js): Redundant collections that diverge from `User.profile` and `Booking`.

### 2.2 Schema & Model Inconsistencies
- **Message Field Aliasing**: [`backend/models/Message.js`](file:///c:/codes/SkillSwap/backend/models/Message.js) maintains duplicate fields (`sender`/`senderId`, `recipient`/`receiverId`, `content`/`text`, `read`/`isRead`) bridged by `pre('save')` hooks to support two conflicting client/controller schemas.
- **Notification Enums**: [`backend/models/Notification.js`](file:///c:/codes/SkillSwap/backend/models/Notification.js) enforces `enum: ['booking_update', 'message', 'credit_earned', 'session_reminder']`. The orphaned controllers attempt to emit notification types like `booking_request`, `booking_accepted`, `credits_spent`, and `achievement_unlocked` which fail Mongoose validation.
- **User vs Profile Split**: [`backend/models/User.js`](file:///c:/codes/SkillSwap/backend/models/User.js) embeds profile information as strings/arrays, whereas [`backend/models/Profile.js`](file:///c:/codes/SkillSwap/backend/models/Profile.js) defines a complex relational document structure.

### 2.3 Legacy Static Frontend vs React 19 SPA
- The repository retains legacy static HTML pages at [`frontend/`](file:///c:/codes/SkillSwap/frontend/) (`index.html`, `login.html`, `dashboard.html`, `browse-skills.html`, `wallet.html`, etc.) and a duplicate directory [`frontend/react/`](file:///c:/codes/SkillSwap/frontend/react/).
- [`backend/server.js`](file:///c:/codes/SkillSwap/backend/server.js#L221-L225) serves `frontend/dist` first, falling back to `frontend/` static HTML, creating route ambiguity for assets and legacy scripts.

### 2.4 Hardcoded Networking Workarounds
- [`backend/server.js`](file:///c:/codes/SkillSwap/backend/server.js#L1-L2) forces Google Public DNS (`dns.setServers(["8.8.8.8", "8.8.4.4"])`) at startup to bypass local SRV lookup issues on MongoDB Atlas. This causes unpredictable network behavior in restricted enterprise VPCs or offline dev environments.
- Utility diagnostic files like [`backend/dnstest.js`](file:///c:/codes/SkillSwap/backend/dnstest.js) and `backend/ipconfig` remain committed in the application root.

---

## 3. Security Considerations

### 3.1 Secrets Management & Defaults
- **Insecure JWT Fallback Secret**: [`backend/config/jwt.js`](file:///c:/codes/SkillSwap/backend/config/jwt.js#L18-L29) uses `'supersecretjwtkey12345!@#'` if `JWT_SECRET` is unset. In production, this allows attackers to forge valid admin/user tokens if the environment variable fails to load.
- **Sensitive Configuration In Repo**: Ensure `.env` is never committed to version control. The `.gitignore` properly excludes `.env`, but test files referencing external databases should be sanitized.

### 3.2 Concurrency & Credit Race Conditions (Double Spend)
- In [`backend/controllers/bookingController.js`](file:///c:/codes/SkillSwap/backend/controllers/bookingController.js#L33-L48) and [`backend/controllers/purchaseController.js`](file:///c:/codes/SkillSwap/backend/controllers/purchaseController.js):
  ```javascript
  // Race condition: Balance checked, then modified without atomic operator or transaction
  const learnerWallet = await Wallet.findOne({ user: learnerId });
  if (!learnerWallet || learnerWallet.balance < skill.credits) { ... }
  learnerWallet.balance -= skill.credits;
  await learnerWallet.save();
  ```
- Concurrent HTTP requests from the same user can pass the balance check simultaneously, resulting in a negative credit balance or double booking with a single credit pool.
- If `Booking.create()` fails after `learnerWallet.save()`, credits are lost without automatic rollback.

### 3.3 Authorization & Session Lifecycle Gaps
- **Unilateral Booking State Transitions**: In [`bookingController.js`](file:///c:/codes/SkillSwap/backend/controllers/bookingController.js#L148-L231), either the instructor OR the learner can unilaterally trigger `status = 'completed'` or `status = 'cancelled'`. A learner can cancel right after a session starts to reclaim credits, or an instructor can mark complete without student confirmation.
- **Cascading Account Deletion Gaps**: In [`userController.js`](file:///c:/codes/SkillSwap/backend/controllers/userController.js#L179-L205), `deleteAccount` deletes bookings, skills, and wallets, but leaves orphaned courses (`Course`), private videos (`CourseVideo`), purchases (`Purchase`), doubt sessions (`CourseDoubtSession`), and actual files on disk.

### 3.4 Rate Limiting & Brute Force
- Global API rate limiting is set to 1000 requests per 15 minutes across all `/api/` endpoints.
- There is **no strict rate limiting** on sensitive authentication endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/auth/updatepassword`), exposing password hashing (`bcrypt`) to CPU exhaustion and credential-stuffing attacks.

### 3.5 Regular Expression Injection (ReDoS)
- In [`courseController.js`](file:///c:/codes/SkillSwap/backend/controllers/courseController.js#L47-L52) and [`profileController.js`](file:///c:/codes/SkillSwap/backend/controllers/profileController.js#L123-L140):
  ```javascript
  query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
  ];
  ```
  User search queries are directly passed into regex filters without escaping special characters (`.*+?^${}()|[]\`), enabling ReDoS performance degradation or regex injection.

---

## 4. Performance Bottlenecks & Scaling Limitations

### 4.1 Missing MongoDB Indexes
Queries across the system perform table scans on unindexed fields:
- **`Booking`**: Frequent queries filter on `{ instructor: 1, learner: 1, status: 1 }` and sort by `{ date: 1, timeSlot: 1 }`. Schema has zero custom indexes.
- **`Skill`**: Queries filter by `category`, `creator`, and sort by `averageRating`, with no compound index.
- **`Purchase`**: Queries lookup `student` and `course` (though unique compound exists on some models, verify coverage across all lookup paths).
- **`Wallet`**: Transactions array inside wallet document grows unbounded; heavy transaction users will suffer document bloat (MongoDB 16MB document limit).

### 4.2 Unbounded Admin Queries & In-Memory Pagination
- In [`backend/controllers/adminController.js`](file:///c:/codes/SkillSwap/backend/controllers/adminController.js#L54-L67):
  ```javascript
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  const wallets = await Wallet.find();
  ```
  This loads all user and wallet records into Node.js heap memory simultaneously. As the user base grows, this will cause memory pressure, event loop blocking, and server crashes.

### 4.3 Local File Storage for Videos & Media
- Course videos (`private/course-videos/`) and avatars (`uploads/`) are written to local disk storage.
- **Stateless/Container Incompatibility**: In containerized or serverless hosting environments (e.g., Docker Swarm, Kubernetes, Render, AWS ECS), instances cannot share disk storage without distributed volumes. Video streaming also loads file I/O on the application server.

### 4.4 Socket.IO Multi-Instance Limitation
- Online users are tracked via `const onlineUsers = new Map()` in [`server.js`](file:///c:/codes/SkillSwap/backend/server.js#L44).
- Without a Redis adapter (`@socket.io/redis-adapter`), real-time messages and status broadcasts only work within a single Node.js process.

---

## 5. Error Handling & Edge Cases

### 5.1 Video Streaming Range Requests
- In [`backend/controllers/courseVideoController.js`](file:///c:/codes/SkillSwap/backend/controllers/courseVideoController.js#L252-L277), video chunk byte streaming handles standard range requests, but abrupt client disconnects during active stream piping can trigger unhandled stream error events if socket resets occur before stream end.

### 5.2 Global Process Error Handling
- [`backend/server.js`](file:///c:/codes/SkillSwap/backend/server.js#L252-L255) catches `unhandledRejection` and calls `process.exit(1)`. While standard for fatal errors, any unhandled asynchronous promise anywhere in the app terminates the entire server instance for all connected users without cluster worker restart management.

### 5.3 Error Response Structure Discrepancy
- [`backend/middleware/error.js`](file:///c:/codes/SkillSwap/backend/middleware/error.js) formats errors as `{ success: false, message: ... }`.
- [`backend/middleware/validation.js`](file:///c:/codes/SkillSwap/backend/middleware/validation.js) formats validation errors as `{ success: false, errors: [...] }`.
- Frontend API client must handle multiple inconsistent error response envelopes.

---

## 6. Testing & Coverage Deficits

### 6.1 Backend Test Coverage Gaps
Current tests (`backend/tests/`) cover course videos, doubt sessions, reviews, and Google Meet URL validation. Major untested areas include:
- **Authentication**: Zero automated tests for login, signup, password hashing, JWT expiration, cookie generation.
- **Financial/Wallet Logic**: No tests for debit, credit, refund, or concurrent transaction safety.
- **Bookings Lifecycle**: No integration tests for booking creation, rescheduling, cancellation, and completion flows.
- **Admin Endpoints**: No tests for role-based authorization guards (`authorize('admin')`) and statistics calculation.
- **Real-Time Messaging**: No automated tests for Socket.IO event lifecycles.

### 6.2 Tooling & CI Automation
- `backend/package.json` does not declare a `"test"` script (only root has a dummy test echo script).
- No frontend test runner (e.g., Vitest, Jest, React Testing Library) or end-to-end framework (Playwright, Cypress) is installed.

---

## 7. Dependency & Maintenance Risks

| Package | Context | Risk / Recommendation |
| :--- | :--- | :--- |
| `react` & `react-dom` `^19.2.7` | Frontend | React 19 is newly released; ensure third-party ecosystem libraries (`framer-motion`, routing plugins) maintain strict compatibility. |
| `mongodb` `^7.5.0` & `mongoose` `^8.3.1` | Backend | Both official driver and ODM are declared as direct dependencies in `backend/package.json`. Mongoose already bundles its driver; ensure version alignment. |
| `@google/generative-ai` | Backend | Referenced in orphaned `aiController.js` but missing from `backend/package.json` dependencies. If invoked, will throw `MODULE_NOT_FOUND`. |
| `oxlint` | Frontend | Configured with `.oxlintrc.json` as a fast linter, but lacks ESLint plugin integrations for React hooks exhaustive-deps validation. |

---

## 8. Prioritized Remediation Roadmap

```
+-----------------------------------------------------------------------+
| P0 - CRITICAL (Immediate Fixes)                                       |
|  - Implement MongoDB Client Sessions / ACID transactions for Wallets  |
|  - Eliminate hardcoded JWT fallback secret in config/jwt.js           |
|  - Add dedicated rate-limiting middleware to /api/auth routes         |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| P1 - HIGH PRIORITY (Architecture & Stability)                         |
|  - Remove orphaned ESM files (aiController, sessionController, etc.)  |
|    or unify the backend to consistent ES Modules                      |
|  - Add indexes to Booking, Skill, Course, and Purchase models         |
|  - Paginate admin API queries (cursor/limit-based pagination)         |
|  - Escape regex inputs in course and skill search endpoints           |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| P2 - MEDIUM PRIORITY (Scalability & Cleanup)                          |
|  - Migrate media & video file storage to S3/Cloud Storage             |
|  - Configure Redis adapter for Socket.IO horizontal clustering        |
|  - Clean up legacy static HTML files from frontend root               |
|  - Remove DNS hardcoding (dns.setServers) from server.js              |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
| P3 - LOW PRIORITY (Quality & Testing)                                 |
|  - Add comprehensive integration test suite for Auth, Wallet, Booking |
|  - Install Vitest + React Testing Library for frontend components     |
|  - Unify API error response formatting across validation & errors     |
+-----------------------------------------------------------------------+
```
