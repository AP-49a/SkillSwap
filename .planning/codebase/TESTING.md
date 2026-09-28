# Testing Strategy & Structure

This document outlines the testing architecture, current state, conventions, and roadmap for the SkillSwap platform.

---

## 1. Current Testing Status & Toolchain

### Summary
| Area | Status | Framework / Tool | Notes |
| :--- | :--- | :--- | :--- |
| **Root** | Placeholder | `npm test` | Outputs `"No tests specified" && exit 0` |
| **Backend** | Not configured | None installed | No test runner in `backend/package.json` |
| **Frontend** | Linter only | `oxlint` (`^1.71.0`) | Static analysis configured via `npm run lint` |
| **End-to-End** | Not configured | None | No Cypress/Playwright configuration |
| **Coverage** | 0% | None | No coverage reporting toolchain |

### Dependencies in Use
- **Root `package.json`**:
  ```json
  "scripts": {
    "test": "echo \"No tests specified\" && exit 0"
  }
  ```
- **Backend `backend/package.json`**:
  - No testing libraries (`jest`, `mocha`, `supertest`) currently installed in dependencies or devDependencies.
- **Frontend `frontend/package.json`**:
  - Contains `oxlint` for linting.
  - No test runners (`vitest`, `jest`, `@testing-library/react`) currently installed.

---

## 2. Directory Layout & Naming Conventions (Target Standard)

When implementing automated tests across the codebase, follow these conventions:

### Backend Testing Structure
```
backend/
├── tests/
│   ├── setup.js                   # Test environment setup & MongoDB memory server
│   ├── fixtures/                  # Seed data, mock user payloads, mock JWTs
│   │   ├── users.json
│   │   └── skills.json
│   ├── unit/                      # Unit tests for controllers, utils, middleware
│   │   ├── middleware/
│   │   │   ├── auth.test.js
│   │   │   └── validation.test.js
│   │   └── utils/
│   │       └── meetingLink.test.js
│   └── integration/               # API endpoint tests with Supertest
│       ├── auth.test.js
│       ├── skills.test.js
│       ├── bookings.test.js
│       └── courses.test.js
```

### Frontend Testing Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── __tests__/
│   │       ├── Navbar.test.jsx
│   │       └── ErrorBoundary.test.jsx
│   ├── context/
│   │   └── __tests__/
│   │       ├── AuthContext.test.jsx
│   │       └── ThemeContext.test.jsx
│   └── utils/
│       └── __tests__/
│           └── api.test.js
```

### File Naming Conventions
- Test files: `*.test.js` or `*.spec.js` (backend) / `*.test.jsx` or `*.spec.jsx` (frontend).
- Test fixtures: `<entity>.json` or `<entity>.fixture.js`.
- Test helpers: `setup.js`, `testUtils.js`.

---

## 3. Recommended Mocking Strategies & Fixtures

### Backend Mocking
1. **Database Isolation**:
   - Use `mongodb-memory-server` to run integration tests against an ephemeral in-memory MongoDB instance without requiring an external database.
2. **Authentication / JWT**:
   - Provide helper utilities to generate valid authorization tokens with `jwt.sign()` using mock user IDs.
3. **Socket.io Mocking**:
   - Mock `app.locals.io.to().emit()` calls in controller tests using Jest/Sinon spies to verify real-time event dispatches without socket connections.

### Frontend Mocking
1. **HTTP Requests**:
   - Use Mock Service Worker (`msw`) or `vi.fn()` / `global.fetch` mocks to intercept REST calls made by `src/utils/api.js`.
2. **Context Providers**:
   - Create reusable test wrapper rendering components inside `<ThemeProvider>`, `<NotificationProvider>`, `<AuthProvider>`, and `<MemoryRouter>`.
3. **Browser APIs**:
   - Mock `localStorage`, `window.matchMedia`, and `document.documentElement.setAttribute`.

---

## 4. Test Execution & CI/CD Workflows

### Current Execution Commands
```bash
# Run root test command (placeholder)
npm test

# Run frontend linter
npm run lint --prefix frontend
```

### Recommended Test Scripts Setup
```json
// backend/package.json
"scripts": {
  "test": "jest --runInBand",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}

// frontend/package.json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "lint": "oxlint"
}
```

### CI/CD Workflow Roadmap (GitHub Actions)
Recommended workflow file `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install Dependencies
        run: |
          npm install
          npm install --prefix backend
          npm install --prefix frontend
      - name: Lint Frontend
        run: npm run lint --prefix frontend
      - name: Run Backend Tests
        run: npm test --prefix backend || true
      - name: Run Frontend Tests
        run: npm test --prefix frontend || true
```
