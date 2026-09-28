# SkillSwap — Project Specification

## Executive Summary
**SkillSwap** is a credit-based peer-to-peer (P2P) skill exchange web application. Users teach skills to earn platform credits and spend credits to book 1-on-1 sessions and courses from other community members.

- **Stack**: Node.js (v20+ LTS), Express 4.19, MongoDB Atlas / Mongoose 8.3, Socket.IO 4.8, React 19 / Vite 8, Framer Motion, Vanilla HTML/CSS assets.
- **Current Lifecycle**: Brownfield project onboarding.
- **Active Milestone**: **v1.0 — Core Integrity, Security & Architecture Consolidation**

---

## Architecture Overview

### Backend Architecture
- **Runtime & Framework**: Node.js (CommonJS), Express 4.19 REST API.
- **Database & ODM**: MongoDB / Mongoose 8.3 with models: `User`, `Wallet`, `Skill`, `Course`, `Booking`, `Review`, `Notification`, `Conversation`, `Message`.
- **Real-Time Communication**: Socket.IO 4.8 for online presence, messaging rooms, and read receipts.
- **Security & Middleware**: Helmet, CORS, express-validator, cookie-parser, express-rate-limit, Multer local file uploads.

### Frontend Architecture
- **Dual-State Frontend**:
  - Legacy multi-page static HTML/CSS/JS frontend located in `frontend/`.
  - Modern React 19 + Vite SPA under `frontend/src/` and `frontend/react/`.

---

## Milestone 1.0 Objective & Scope

The primary objective of Milestone 1.0 is to eliminate critical runtime, security, and concurrency vulnerabilities while standardizing the codebase architecture and establishing automated regression testing:

1. **Transactional Integrity (P0)**: Refactor credit escrow, wallet operations, booking completions, and cancellations to use atomic MongoDB sessions/transactions to prevent double-spending and race conditions.
2. **Security Hardening (P1)**: Remove hardcoded JWT fallback secrets, enforce strict boot-time environment validation, and apply dedicated rate limiting to authentication endpoints.
3. **Architecture Consolidation (P1)**: Prune orphaned ES module controllers and redundant models that create schema conflicts and maintenance hazards.
4. **Test Suite Foundation (P2)**: Set up backend test infrastructure (Jest, Supertest, in-memory MongoDB) and build automated test suites for Auth, Wallet, and Booking flows.

---

## Core Domain Models

- **User**: Authentication, bio, skills taught/wanted, roles (`user`, `admin`), avatar.
- **Wallet**: User balance, pending escrow balance, transaction history (`earned`, `spent`, `escrow`, `refund`).
- **Skill / Course**: Offerings, categories, credit cost, descriptions, ratings.
- **Booking**: Session scheduling, learner/instructor references, credit amount, escrow status (`pending`, `confirmed`, `completed`, `cancelled`).
- **Review**: Star ratings and feedback linked to completed bookings.
- **Notification & Message**: Real-time events, system alerts, direct messages.
