# Codebase Conventions & Standards

This document outlines the code style, architecture, naming conventions, error handling, state management, and logging practices for the SkillSwap platform.

---

## 1. Architectural Overview & Environment

SkillSwap is structured as a full-stack JavaScript monorepo-style application:
- **Backend**: Node.js & Express application (`backend/`) using CommonJS modules (`require` / `module.exports`), Mongoose ODM, Socket.io for real-time messaging, and JWT for authentication.
- **Frontend**: React 19 application (`frontend/`) bundled with Vite 8 using ES Modules (`import` / `export`), React Router 7, Framer Motion, and custom glassmorphism CSS.
- **Root Orchestrator**: Root `package.json` providing helper scripts for installation and backend launching.

---

## 2. Code Style & Formatting

### General Conventions
- **Language**: JavaScript (ES6+ / ESNext). TypeScript is currently not used.
- **Indentation**: 2 spaces (no tabs).
- **Quotes**: Single quotes (`'`) for JavaScript strings; double quotes (`"`) for JSON / HTML attributes.
- **Semicolons**: Always included at the end of statements.
- **Line Endings**: LF / CRLF compatible.
- **Trailing Commas**: Used in multi-line objects, arrays, and parameter lists.

### Linting & Tooling
- **Frontend Linter**: `oxlint` (version `^1.71.0`) is configured in `frontend/package.json` via:
  ```bash
  npm run lint --prefix frontend
  ```
- **Configuration Files**:
  - `frontend/vite.config.js`: Vite configuration proxying `/api` and `/socket.io` to `http://localhost:5000`.
  - Backend configuration managed via `dotenv` with `.env` files.

### CSS & Styling Conventions
- **CSS Architecture**: Vanilla CSS with custom properties (CSS variables) defined in `frontend/src/index.css`.
- **Theme Variables**:
  - Primary colors: `--primary` (`#111111` in light, `#ffffff` in dark), `--secondary` (`#D4AF37`), `--accent` (`#22C55E`), `--danger` (`#ef4444`), `--warning` (`#f59e0b`).
  - Dark mode activated via `[data-theme="dark"]` on `document.documentElement`.
  - Glassmorphism tokens: `--glass-bg`, `--glass-border`, `--glass-shadow`, `--glass-blur`.
- **Typography**: Poppins (`--font-main: 'Poppins', sans-serif`).
- **Icons**: `lucide-react` icon components.
- **Animations**: `framer-motion` for transitions and micro-interactions.

---

## 3. Naming Conventions

### Files and Directories
| Entity | Pattern | Example |
| :--- | :--- | :--- |
| **Backend Models** | PascalCase `.js` | `User.js`, `Skill.js`, `Booking.js`, `Course.js` |
| **Backend Controllers** | camelCase + `Controller.js` | `authController.js`, `bookingController.js`, `courseController.js` |
| **Backend Routes** | camelCase + `Routes.js` | `authRoutes.js`, `userRoutes.js`, `bookingRoutes.js` |
| **Backend Middleware** | camelCase `.js` | `auth.js`, `error.js`, `validation.js` |
| **Backend Config / Utils** | camelCase `.js` | `db.js`, `jwt.js`, `meetingLink.js` |
| **Frontend Components** | PascalCase `.jsx` | `Navbar.jsx`, `Footer.jsx`, `GlassCard.jsx`, `ErrorBoundary.jsx` |
| **Frontend Pages** | PascalCase `.jsx` | `Home.jsx`, `CourseDetails.jsx`, `TeacherStudio.jsx` |
| **Frontend Contexts** | PascalCase + `Context.jsx` | `AuthContext.jsx`, `NotificationContext.jsx`, `ThemeContext.jsx` |
| **Frontend Utilities** | camelCase `.js` | `api.js` |
| **Directories** | kebab-case or single lowercase word | `controllers/`, `routes/`, `models/`, `components/`, `pages/`, `context/` |

### Identifiers & Symbols
- **Variables & Functions**: `camelCase` (e.g., `createBooking`, `handleResponse`, `fetchHomeData`).
- **React Components**: `PascalCase` (e.g., `ErrorBoundary`, `ProtectedRoute`, `CoursePlayer`).
- **Custom React Hooks**: `camelCase` with `use` prefix (e.g., `useAuth`, `useTheme`, `useNotification`).
- **Constants / Config**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`, `PORT`, `JWT_SECRET`).
- **Database Fields**: `camelCase` (e.g., `skillsOffered`, `lastMessageAt`, `timeSlot`, `isParticipant`).

### API Endpoints & Routes
- **Base Prefix**: `/api`
- **Resource Names**: Plural lowercase nouns (e.g., `/api/users`, `/api/skills`, `/api/courses`, `/api/bookings`).
- **Sub-resources / Actions**:
  - `/api/auth/signup`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/me`
  - `/api/courses/:id/enroll`
  - `/api/sessions/my`
  - `/api/admin/metrics`

---

## 4. Error Handling Strategies

### Backend Error Handling
1. **Centralized Error Middleware** (`backend/middleware/error.js`):
   - Catches all uncaught exceptions passed via `next(err)`.
   - Translates Mongoose-specific errors:
     - `CastError`: 404 Resource Not Found.
     - `code: 11000` (duplicate key): 400 Bad Request.
     - `ValidationError`: 400 Bad Request with comma-delimited validation messages.
   - Default response shape:
     ```json
     {
       "success": false,
       "message": "Error description"
     }
     ```
2. **Controller Pattern**:
   - All async controller methods are wrapped in `try { ... } catch (error) { next(error); }`.
3. **Request Validation** (`backend/middleware/validation.js`):
   - Uses `express-validator` chains combined with custom `validateResults` middleware.
   - Validation failure response shape:
     ```json
     {
       "success": false,
       "errors": [
         { "field": "email", "message": "Please include a valid email" }
       ]
     }
     ```
4. **Process Level Safety**:
   - `process.on('unhandledRejection')` logs the rejection error and shuts down the server cleanly with `server.close(() => process.exit(1))`.

### Frontend Error Handling
1. **API Client (`frontend/src/utils/api.js`)**:
   - Handles network and HTTP errors in `handleResponse`.
   - Parses the JSON error message from the response and throws an `Error` object annotated with `error.status`.
2. **React Error Boundary (`frontend/src/components/ErrorBoundary.jsx`)**:
   - Wraps the entire application tree at `main.jsx`.
   - Catches unhandled render errors, logs to `console.error`, and renders a user-friendly recovery UI with **Retry** and **Reload** actions.
3. **Toast Notifications (`frontend/src/context/NotificationContext.jsx`)**:
   - `showNotification(title, message, type)` presents user-facing alerts for `success`, `error`, `achievement`, and `info`.
   - Auto-dismisses toasts after 4 seconds.
4. **Form / Action Handling**:
   - Action triggers wrap asynchronous calls in `try / catch` blocks, triggering `showNotification('Action Failed', error.message, 'error')`.

---

## 5. State Management & Asynchronous Patterns

### Frontend
- **Global State**: Managed via React Context:
  - `AuthContext`: Authentication status, current user object, login/signup/logout actions.
  - `ThemeContext`: Dark/light mode theme toggling and `localStorage` synchronization.
  - `NotificationContext`: Active toast notification queue.
- **Local State**: Managed with standard React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- **HTTP Client**: Native `fetch` wrapped in `api` utility supporting `GET`, `POST`, `PUT`, `DELETE` with `credentials: 'include'`.
- **Real-time State**: Socket.io client listening to events (`receive_message`, `message_sent`, `user_online`, `user_offline`).

### Backend
- **Data Persistence**: MongoDB with Mongoose ODM models.
- **In-Memory Tracking**: Socket session tracking with `onlineUsers = new Map()` mapping `userId` to `{ socketId, lastSeen }`.
- **Security Middleware**:
  - `helmet` with custom Content Security Policy.
  - `cors` with configurable origin whitelist.
  - `express-rate-limit` restricting requests to 1000 per 15 minutes.
  - `cookie-parser` for JWT cookie verification.

---

## 6. Typing, Logging, and Documentation Standards

- **Typing**: Pure JavaScript. Object contracts and schemas are enforced at runtime via Mongoose schemas on the backend and PropTypes/JSX structure on the frontend.
- **JSDoc Route Comments**: Backend controllers use structured JSDoc headers:
  ```javascript
  // @desc    Register user
  // @route   POST /api/auth/signup
  // @access  Public
  ```
- **Logging Standards**:
  - Startup / operational logs include status emojis (`✅ Server running`, `❌ Unhandled Rejection`).
  - Errors logged to `console.error` with stack trace or context object.
  - Production deployments omit verbose debug logs.
