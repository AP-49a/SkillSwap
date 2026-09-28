# Technology Stack & Runtime Architecture

This document provides a comprehensive breakdown of the languages, runtimes, frameworks, libraries, database systems, package tooling, and environment configurations powering the **SkillSwap** platform.

---

## 1. Languages & Runtimes

| Component | Technology | Version / Spec | Notes |
|:---|:---|:---|:---|
| **Runtime Environment** | Node.js | `>=20.x` (LTS, `node:20-alpine` in Docker) | Runs the primary backend Express & Socket.IO server |
| **Backend Language** | JavaScript (Node.js) | ES2022+ / CommonJS (`require`) | Server logic, Mongoose models, and route controllers |
| **Frontend Language** | JavaScript (React) | ES2022+ / ES Modules (`import`/`export`), JSX | Modern component-driven UI architecture |
| **Styling** | Vanilla CSS3 + Glassmorphism Variables | CSS Variables (`--bg-*`, `--glass-*`, `--primary`) | Custom responsive styling with Dark/Light theme switching |

---

## 2. Frameworks & Libraries

### 2.1 Backend Architecture

| Package | Version | Purpose |
|:---|:---|:---|
| [`express`](file:///c:/codes/SkillSwap/backend/package.json#L15) | `^4.19.2` | Core HTTP application and REST routing engine |
| [`socket.io`](file:///c:/codes/SkillSwap/backend/package.json#L23) | `^4.8.1` | Real-time bidirectional WebSocket communication for chat & presence |
| [`mongoose`](file:///c:/codes/SkillSwap/backend/package.json#L21) | `^8.3.1` | Object Data Modeling (ODM) for MongoDB |
| [`mongodb`](file:///c:/codes/SkillSwap/backend/package.json#L20) | `^7.5.0` | Official MongoDB Node.js driver |
| [`jsonwebtoken`](file:///c:/codes/SkillSwap/backend/package.json#L19) | `^9.0.2` | JWT generation, verification, and session token issuance |
| [`bcryptjs`](file:///c:/codes/SkillSwap/backend/package.json#L11) | `^2.4.3` | Password hashing with 10 salt rounds |
| [`cookie-parser`](file:///c:/codes/SkillSwap/backend/package.json#L12) | `^1.4.6` | HTTP cookie parsing for JWT token extraction |
| [`cors`](file:///c:/codes/SkillSwap/backend/package.json#L13) | `^2.8.5` | Cross-Origin Resource Sharing with dynamic origin checking |
| [`helmet`](file:///c:/codes/SkillSwap/backend/package.json#L18) | `^7.1.0` | HTTP security headers & Content Security Policy (CSP) |
| [`express-rate-limit`](file:///c:/codes/SkillSwap/backend/package.json#L16) | `^7.2.0` | Rate limiting protection for `/api/` endpoints (1000 requests per 15 min) |
| [`express-validator`](file:///c:/codes/SkillSwap/backend/package.json#L17) | `^7.0.1` | Request parameter and payload validation |
| [`multer`](file:///c:/codes/SkillSwap/backend/package.json#L22) | `^2.2.0` | Multipart/form-data middleware for image and avatar uploads |
| [`dotenv`](file:///c:/codes/SkillSwap/backend/package.json#L14) | `^16.4.5` | Environment variable management from `.env` files |
| [`nodemon`](file:///c:/codes/SkillSwap/backend/package.json#L26) *(dev)* | `^3.1.0` | Automatic backend server reloading on file changes |

### 2.2 Frontend Architecture

| Package | Version | Purpose |
|:---|:---|:---|
| [`react`](file:///c:/codes/SkillSwap/frontend/package.json#L15) | `^19.2.7` | UI library for declarative component hierarchies |
| [`react-dom`](file:///c:/codes/SkillSwap/frontend/package.json#L16) | `^19.2.7` | DOM rendering and hydration engine |
| [`react-router-dom`](file:///c:/codes/SkillSwap/frontend/package.json#L17) | `^7.18.1` | Client-side routing, route guarding, and nested layout outlets |
| [`framer-motion`](file:///c:/codes/SkillSwap/frontend/package.json#L13) | `^12.42.2` | Fluid animations, transition physics, and modal interactions |
| [`lucide-react`](file:///c:/codes/SkillSwap/frontend/package.json#L14) | `^1.23.0` | Modern SVG iconography library |
| [`vite`](file:///c:/codes/SkillSwap/frontend/package.json#L24) *(dev)* | `^8.1.1` | Next-generation frontend build tool and development server |
| [`@vitejs/plugin-react`](file:///c:/codes/SkillSwap/frontend/package.json#L22) *(dev)* | `^6.0.3` | Fast Refresh and JSX transformation plugin for Vite |
| [`oxlint`](file:///c:/codes/SkillSwap/frontend/package.json#L23) *(dev)* | `^1.71.0` | High-performance Rust-based JavaScript linter |
| [`@types/react`](file:///c:/codes/SkillSwap/frontend/package.json#L20) *(dev)* | `^19.2.17` | TypeScript definitions for React |
| [`@types/react-dom`](file:///c:/codes/SkillSwap/frontend/package.json#L21) *(dev)* | `^19.2.3` | TypeScript definitions for React DOM |

---

## 3. Database, Data Stores & ORMs

### 3.1 Primary Database
- **Engine:** MongoDB (local `mongodb://localhost:27017/skillswap` or MongoDB Atlas replica set)
- **ODM (Object Data Modeling):** Mongoose v8.3.1
- **DNS Resolution Customization:** Backend sets Google DNS servers (`8.8.8.8`, `8.8.4.4`) at launch in [`server.js`](file:///c:/codes/SkillSwap/backend/server.js#L1-L2) to prevent SRV lookup timeouts on Node.js/Windows environments connecting to MongoDB Atlas.

### 3.2 Data Models & Schemas

| Model | File | Description |
|:---|:---|:---|
| **User** | [`backend/models/User.js`](file:///c:/codes/SkillSwap/backend/models/User.js) | Authentication credentials, role (`user`/`admin`), profile details (skills, bio, links, avatar) |
| **Wallet** | [`backend/models/Wallet.js`](file:///c:/codes/SkillSwap/backend/models/Wallet.js) | Credit balance ledger and transaction histories (`credit`/`debit`) |
| **Skill** | [`backend/models/Skill.js`](file:///c:/codes/SkillSwap/backend/models/Skill.js) | Skill listings, category taxonomy, credit cost, duration, rating stats |
| **Course** | [`backend/models/Course.js`](file:///c:/codes/SkillSwap/backend/models/Course.js) | Structured courses created by teachers, status (`draft`/`published`), pricing |
| **Booking** | [`backend/models/Booking.js`](file:///c:/codes/SkillSwap/backend/models/Booking.js) | Session bookings, time slots, credit escrow, statuses (`upcoming`/`completed`/`cancelled`) |
| **Review** | [`backend/models/Review.js`](file:///c:/codes/SkillSwap/backend/models/Review.js) | Ratings (1-5) and feedback on completed swaps; auto-calculates skill average rating via post-save hooks |
| **Notification** | [`backend/models/Notification.js`](file:///c:/codes/SkillSwap/backend/models/Notification.js) | In-app alerts for bookings, messages, credit earnings, and session reminders |
| **Conversation** | [`backend/models/Conversation.js`](file:///c:/codes/SkillSwap/backend/models/Conversation.js) | Direct message threads between 2 participants and last message metadata |
| **Message** | [`backend/models/Message.js`](file:///c:/codes/SkillSwap/backend/models/Message.js) | Individual chat messages, read statuses, emoji reactions, attachments, and voice notes |

---

## 4. Package Management & Build Tooling

### 4.1 Root Workspace Management
The project root [`package.json`](file:///c:/codes/SkillSwap/package.json) orchestrates the multi-tier structure:
- `npm install`: Automatically invokes `postinstall` to install backend dependencies (`npm install --prefix backend`).
- `npm start`: Starts the backend server (`npm start --prefix backend`).
- `npm run dev`: Starts the backend in live-reload mode with Nodemon (`npm run dev --prefix backend`).

### 4.2 Frontend Build Pipeline
- **Bundler:** Vite v8.1.1
- **Root Entry Point:** Configured in [`frontend/vite.config.js`](file:///c:/codes/SkillSwap/frontend/vite.config.js) to resolve `/react` as root with output targeting `frontend/dist`.
- **Dev Server Proxy:** Vite proxies `/api` and `/socket.io` (with WebSocket upgrade `ws: true`) to `http://localhost:5000`.
- **Production Static Serving:** Express in [`server.js`](file:///c:/codes/SkillSwap/backend/server.js#L221-L238) statically serves `frontend/dist` with SPA fallback routing to `index.html`.

---

## 5. Runtime Configuration & Environment Variables

| Variable | Scope | Default / Example | Purpose |
|:---|:---|:---|:---|
| `PORT` | Backend | `5000` | HTTP port on which the Express server listens |
| `NODE_ENV` | Backend | `development` | Runtime mode (`development` vs `production`) |
| `MONGO_URI` | Backend | `mongodb://localhost:27017/skillswap` | MongoDB connection connection string (local or Atlas) |
| `JWT_SECRET` | Backend | `supersecretjwtkey12345!@#` | Secret key used to sign and verify JSON Web Tokens |
| `FRONTEND_ORIGINS` | Backend | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000` | Comma-delimited list of allowed CORS origins |
| `SOCKET_IO_CORS_ORIGIN`| Backend | `http://localhost:5173` | Allowed origin for Socket.IO handshake connections |
| `VITE_API_URL` | Frontend | `""` (defaults to relative `/api`) | Base API endpoint override for frontend fetch calls |
