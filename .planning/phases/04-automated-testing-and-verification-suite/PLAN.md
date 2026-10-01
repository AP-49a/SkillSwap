# Phase 4: Automated Testing & Verification Suite — Execution Plan

## Context & Invariants
Phase 4 is strictly an automated testing and verification phase to establish regression coverage for Milestone 1.0.
- **Invariants**:
  - Do NOT add new product features.
  - Do NOT redesign the UI or modify React routing.
  - Do NOT modify Course marketplace behavior or transaction semantics.
  - Do NOT rewrite existing transactional logic verified in Phase 2.
  - Do NOT remove existing tests.
  - Do NOT modify legacy Booking/Skill functionality unless required for testing active compatibility contracts.
- **Phase**: 04
- **Requirements**: `TEST-01`, `TEST-02`, `TEST-03`, `TEST-04`, `TEST-05`

---

## 1. Existing Test Coverage Inventory (42 Passing Tests)

The backend currently has 42 passing tests across 7 test files executing via native `node:test` + `node:assert/strict`:

| Existing Test Suite | Test Count | Verified Contracts & Invariants |
| :--- | :---: | :--- |
| [`coursePurchaseTransaction.test.js`](file:///c:/codes/SkillSwap/backend/tests/coursePurchaseTransaction.test.js) | 8 | • Atomic student debit + teacher credit inside `session.withTransaction()`<br>• Balance predicate (`$gte`) preventing negative balances<br>• Duplicate purchase race condition handling (`E11000` -> 409)<br>• Insufficient credit handling (400)<br>• Self-purchase prevention (400)<br>• Non-transactional fallback on standalone MongoDB (503)<br>• Compound unique index `{ student: 1, course: 1 }` on `Purchase` |
| [`courseCompletion.test.js`](file:///c:/codes/SkillSwap/backend/tests/courseCompletion.test.js) | 2 | • Course completion `completedAt` timestamp initialization<br>• Zero credit transfer invariant on completion |
| [`courseVideo.test.js`](file:///c:/codes/SkillSwap/backend/tests/courseVideo.test.js) | 3 | • Required fields and order non-negativity<br>• Path traversal defense on video file paths<br>• Protected streaming URL transformation |
| [`courseReview.test.js`](file:///c:/codes/SkillSwap/backend/tests/courseReview.test.js) | 10 | • Rating range 1–5 validation and integer constraint<br>• Required fields (`student`, `course`, `rating`)<br>• Compound unique index `{ student: 1, course: 1 }`<br>• Course average rating & review count aggregate updates |
| [`courseDoubtSession.test.js`](file:///c:/codes/SkillSwap/backend/tests/courseDoubtSession.test.js) | 12 | • Schema validation and status enums (`open`, `in-progress`, `resolved`)<br>• 500-character message length constraint<br>• Query indexes for teacher/student lookups<br>• Invariant: zero credit fields |
| [`bookingMeetingLink.test.js`](file:///c:/codes/SkillSwap/backend/tests/bookingMeetingLink.test.js) | 2 | • Google Meet link format validation (alphanumeric pattern check) |
| [`schemaIndexes.test.js`](file:///c:/codes/SkillSwap/backend/tests/schemaIndexes.test.js) | 5 | • Compound query indexes for `Course`, `CourseReview`, `Booking`, `Skill`, `Purchase`, `CourseDoubtSession`, `CourseVideo` |

---

## 2. Missing Coverage & Gap Analysis

The audit identifies 4 critical gap areas in the current backend testing suite:

### A. Authentication & Security Middleware (`TEST-02`)
- **Missing Coverage**:
  - `User` model password hashing: `pre('save')` hook hashes password with bcrypt; password modification detection (`isModified`).
  - `User.prototype.matchPassword`: accurate true/false verification with hashed salt.
  - JWT utilities: token signing with expiration; secure cookie options (`httpOnly: true`, `sameSite`, `secure`).
  - `protect` middleware guards:
    - Rejects request with 401 when token is missing from headers and cookies.
    - Rejects request with 401 when token is invalid, expired, or malformed.
    - Rejects request with 401 when decoded token user ID no longer exists in DB.
    - Attaches `req.user` and invokes `next()` when token and user are valid.
  - `authLimiter`: rate limiter rejects excessive attempts with 429 status code.

### B. Wallet & Financial Ledger Lifecycle (`TEST-03`)
- **Missing Coverage**:
  - `Wallet` provisioning defaults: new wallets initialize with default 10 credits balance.
  - Balance constraints: schema enforces `min: [0, 'Balance cannot be negative']`.
  - Transaction ledger structure: validation of `amount`, `type` enum (`['credit', 'debit']`), `description`, and `date`.
  - `getWallet` controller logic: fetches wallet for `req.user.id` and sorts `transactions` in descending chronological order (`sort((a, b) => b.date - a.date)`).

### C. Course Management & Publishing Authorization (`TEST-04`)
- **Missing Coverage**:
  - Course status defaults: initial creation defaults to `status: 'draft'`.
  - Publishing lifecycle: publishing transition sets `status: 'published'`.
  - Teacher ownership authorization guards:
    - Updating a course (`updateCourse`): non-owner teacher or student receives 403 `Not authorized to update this course`.
    - Publishing a course (`publishCourse`): non-owner receives 403 `Not authorized to publish this course`.
    - Deleting a course (`deleteCourse`): non-owner receives 403 `Not authorized to delete this course`.
  - Field boundaries: title length <= 150 chars, description length <= 5000 chars, category <= 100 chars, credits minimum >= 1.

### D. Central Error Handler Formatting & Status Codes (`TEST-05`)
- **Missing Coverage**:
  - Mongoose `CastError` (invalid ObjectId) -> mapped to HTTP 404 with standardized `{ success: false, message: 'Resource not found with id of ...' }`.
  - Mongoose `ValidationError` -> mapped to HTTP 400 with joined field error messages.
  - Mongoose `11000` duplicate key error -> mapped to HTTP 400 with duplicate field name extraction.
  - Multer errors (`LIMIT_FILE_SIZE`) -> mapped to HTTP 413 `File size exceeds the allowed limit.`.
  - `JsonWebTokenError` / `TokenExpiredError` -> mapped to HTTP 401.
  - Production mode 500 error sanitization: masks raw stack traces, returning sanitized message.

---

## 3. Scope Organization: Tests to Extend vs. Genuinely New Test Files

### Tests to Extend
- **Analysis**: We evaluated existing files (`schemaIndexes.test.js`, `courseReview.test.js`, `courseVideo.test.js`, `coursePurchaseTransaction.test.js`).
- **Decision**: Existing test files are highly focused on specific, working domain slices (e.g. course video streams, review aggregates, purchase ACID transactions). Rather than overloading existing files and risking regressions in already passing suites, existing test files will remain **untouched and preserved**.
- Minor extension: `bookingMeetingLink.test.js` can be verified to ensure all Google Meet URL patterns are covered without modifying its core assertions.

### Tests that Genuinely Need New Files
Creating 4 dedicated, modular test files is required to cover the missing functional boundaries cleanly:

1. **`backend/tests/authSecurity.test.js`** *(New File)*
   - **Why New File**: Isolates authentication, password hashing, JWT cookies, `protect` middleware, and rate limiter testing from marketplace logic.
2. **`backend/tests/walletLedger.test.js`** *(New File)*
   - **Why New File**: Isolates financial ledger schema constraints, credit defaults, and `getWallet` controller ledger sorting.
3. **`backend/tests/courseManagement.test.js`** *(New File)*
   - **Why New File**: Isolates Course creation/publishing lifecycle, validation boundaries, and teacher ownership authorization guards on Course CRUD.
4. **`backend/tests/errorHandler.test.js`** *(New File)*
   - **Why New File**: Isolates centralized Express error middleware (`backend/middleware/error.js`) behavior across all Mongoose, Multer, and JWT error classes.

---

## 4. Integration Tests Blocked by MongoDB Atlas / Network Limitations

### Constraints Identified:
1. **Remote MongoDB Atlas Dependencies**:
   - Multi-document transactions (`session.withTransaction()`) against MongoDB Atlas require active internet connectivity, valid DNS resolution (SRV records), and connection pooling.
   - If tests run in offline or firewalled CI environments, direct connection to Atlas causes a 10,000ms Mongoose connection buffering timeout.
2. **Standalone MongoDB Engines**:
   - Local standalone MongoDB instances without replica sets reject `session.startTransaction()` with `Transaction numbers are only allowed on a replica set member or mongos`.

### Isolation & Mocking Strategy:
- All new test suites will follow the **Phase 2 In-Memory Mocking Pattern**:
  - Pure schema validation tests instantiate Mongoose models in-memory (`new Model(...)`) and call `validateSync()`, requiring zero database connections.
  - Controller unit tests use mock `req`, `res`, `next` objects and stub Mongoose query chains using `createMockQuery` and `createMockSession`.
  - This ensures 100% deterministic, offline execution with zero flakiness and sub-second test runtimes (< 1.5s total across all 42+ tests).

---

## 5. Execution Tasks & Implementation Plan

### Task 1: Auth & Security Middleware Test Suite (`authSecurity.test.js`)
- Write unit tests for:
  - `User` password hashing on save and `matchPassword` comparison.
  - JWT token generation, verification, and cookie flags.
  - `protect` middleware responses (missing token -> 401, invalid token -> 401, non-existent user -> 401, valid user -> `next()`).
  - `authLimiter` status code (429).

### Task 2: Wallet & Financial Ledger Lifecycle Test Suite (`walletLedger.test.js`)
- Write unit tests for:
  - Initial wallet balance default (10 credits).
  - Negative balance rejection (`min: 0`).
  - Transaction ledger schema validation (type enum `credit`/`debit`, positive amount, description, date).
  - `getWallet` controller sorting transactions in descending chronological order.

### Task 3: Course Management & Publishing Authorization Test Suite (`courseManagement.test.js`)
- Write unit tests for:
  - Course status lifecycle (`draft` -> `published`).
  - Schema boundaries (credits >= 1, title <= 150, description <= 5000, category <= 100).
  - Controller teacher ownership authorization guards:
    - `updateCourse` (non-owner -> 403).
    - `publishCourse` (non-owner -> 403).
    - `deleteCourse` (non-owner -> 403).

### Task 4: Central Error Handling Test Suite (`errorHandler.test.js`)
- Write unit tests for `backend/middleware/error.js`:
  - `CastError` -> 404 Resource not found.
  - `ValidationError` -> 400 Bad Request with field message formatting.
  - `11000` duplicate key -> 400 Bad Request.
  - `MulterError` (`LIMIT_FILE_SIZE`) -> 413 Payload Too Large.
  - `JsonWebTokenError` / `TokenExpiredError` -> 401 Unauthorized.
  - Production 500 error sanitization.

### Task 5: Comprehensive Suite Verification
- Execute `npm test` across all existing and newly created test files.
- Confirm 100% test pass rate with zero regressions.
- Generate `VERIFICATION.md` for Phase 4.
