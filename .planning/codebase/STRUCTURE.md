# SkillSwap Directory & Module Structure

## 1. Complete Directory Tree Layout

```
c:\codes\SkillSwap\
├── .planning\
│   └── codebase\
│       ├── ARCHITECTURE.md          # High-level architecture & data flows
│       └── STRUCTURE.md             # Directory structure & module layout
├── backend\
│   ├── config\
│   │   ├── db.js                    # MongoDB connection via Mongoose
│   │   └── jwt.js                   # JWT signing, cookie creation & verification
│   ├── controllers\
│   │   ├── adminController.js       # Admin panel stats & user/skill management
│   │   ├── authController.js        # Signup, login, logout, password updates
│   │   ├── bookingController.js     # 1-on-1 session bookings, credit escrow, reschedule
│   │   ├── conversationController.js# Conversation rosters & thread messages
│   │   ├── courseController.js      # Video course creation, updates, publishing
│   │   ├── courseDoubtSessionController.js # Course doubt 1-on-1 session management
│   │   ├── courseReviewController.js# Course ratings & reviews
│   │   ├── courseVideoController.js # Video uploads & HTTP byte-range video streaming
│   │   ├── messageController.js     # Direct messages, emoji reactions, chat lists
│   │   ├── notificationController.js# User notifications & read markers
│   │   ├── purchaseController.js    # Course purchase & completion verification
│   │   ├── reviewController.js      # Skill ratings & reviews calculation
│   │   ├── skillController.js       # Skill listings CRUD & search filtering
│   │   ├── userController.js        # User profile retrieval, updates, dashboard metrics
│   │   └── walletController.js      # Wallet balance & transaction history
│   ├── middleware\
│   │   ├── auth.js                  # Protect routes & role authorization (RBAC)
│   │   ├── error.js                 # Global error handling middleware
│   │   ├── upload.js                # Multer configuration for avatar images
│   │   ├── validation.js            # express-validator schemas for all inputs
│   │   └── videoUpload.js           # Multer configuration for course video files
│   ├── models\
│   │   ├── Booking.js               # 1-on-1 mentorship session booking schema
│   │   ├── Conversation.js          # Direct chat thread metadata schema
│   │   ├── Course.js                # Video course listing schema
│   │   ├── CourseCompletion.js      # Course completion certificate/progress schema
│   │   ├── CourseDoubtSession.js    # Course doubt 1-on-1 session schema
│   │   ├── CoursePurchase.js        # User course ownership & purchase records
│   │   ├── CourseReview.js          # Course student reviews & star ratings
│   │   ├── CourseVideo.js           # Course video lesson / curriculum items
│   │   ├── Message.js               # Chat message schema (reactions, voice notes, attachments)
│   │   ├── Notification.js          # In-app notifications schema
│   │   ├── Review.js                # Skill session ratings & auto-aggregate hooks
│   │   ├── Session.js               # Legacy/auxiliary session schema
│   │   ├── Skill.js                 # Peer skill swap listing schema
│   │   ├── User.js                  # User schema with bcrypt password hashing & profile
│   │   └── Wallet.js                # User credit wallet & ledger transactions
│   ├── routes\
│   │   ├── adminRoutes.js           # /api/admin
│   │   ├── aiRoutes.js              # /api/ai (Skill recommendations & profile tips)
│   │   ├── authRoutes.js            # /api/auth
│   │   ├── bookingRoutes.js         # /api/bookings
│   │   ├── conversationRoutes.js    # /api/conversations
│   │   ├── courseRoutes.js          # /api/courses
│   │   ├── messageRoutes.js         # /api/messages
│   │   ├── notificationRoutes.js    # /api/notifications
│   │   ├── profileRoutes.js         # /api/profile
│   │   ├── reviewRoutes.js          # /api/reviews
│   │   ├── sessionRoutes.js         # /api/sessions
│   │   ├── skillRoutes.js           # /api/skills
│   │   ├── userRoutes.js            # /api/users
│   │   └── walletRoutes.js          # /api/wallet
│   ├── utils\
│   │   └── meetingLink.js           # Google Meet URL format validator
│   ├── uploads\                     # Statically served user avatars & media
│   ├── package.json                 # Backend dependencies & npm scripts
│   └── server.js                    # Backend HTTP & Socket.IO server entrypoint
├── frontend\
│   ├── public\                      # Static assets & public files
│   ├── src\
│   │   ├── components\
│   │   │   ├── BookingModal.jsx     # Booking modal for scheduling 1-on-1 swaps
│   │   │   ├── ErrorBoundary.jsx    # React error boundary component
│   │   │   ├── Footer.jsx           # Platform footer
│   │   │   ├── GlassCard.jsx        # Glassmorphic card container component
│   │   │   ├── Loader.jsx           # Loading spinner & skeleton placeholders
│   │   │   ├── Navbar.jsx           # Global navigation header with user status
│   │   │   ├── ProtectedRoute.jsx   # Route guard checking authentication
│   │   │   ├── ReviewModal.jsx      # Modal for rating & reviewing completed sessions
│   │   │   ├── Sidebar.jsx          # Dashboard / app navigation sidebar
│   │   │   └── SkillCard.jsx        # Skill listing card with booking trigger
│   │   ├── context\
│   │   │   ├── AuthContext.jsx      # User session, login, signup, profile sync
│   │   │   ├── NotificationContext.jsx # Toast notification alert manager
│   │   │   └── ThemeContext.jsx     # Dark/light theme state & persistence
│   │   ├── pages\
│   │   │   ├── static\
│   │   │   │   ├── About.jsx        # Platform about page
│   │   │   │   ├── Contact.jsx      # Support contact form
│   │   │   │   ├── FAQ.jsx          # Frequently asked questions
│   │   │   │   ├── NotFound.jsx     # 404 error page
│   │   │   │   ├── Privacy.jsx      # Privacy policy
│   │   │   │   └── Terms.jsx        # Terms of service
│   │   │   ├── Achievements.jsx     # Badges, XP points, and streak tracker
│   │   │   ├── AdminPanel.jsx       # Admin management & system metrics
│   │   │   ├── Bookings.jsx         # User session bookings, reschedule, meet join
│   │   │   ├── CourseDetails.jsx    # Course curriculum, overview, purchase CTA
│   │   │   ├── CoursePlayer.jsx     # Video streaming player & doubt session trigger
│   │   │   ├── Credits.jsx          # Credit balance, transaction ledger, rewards
│   │   │   ├── Home.jsx             # Main dashboard (stats, recommendations, bookings)
│   │   │   ├── LandingPage.jsx      # Public product landing page
│   │   │   ├── Login.jsx            # User sign in page
│   │   │   ├── Messages.jsx         # Direct messaging & chat conversation page
│   │   │   ├── MyCourses.jsx        # Enrolled/purchased courses student hub
│   │   │   ├── ProfileSetup.jsx     # Profile editor (skills, bio, avatar upload)
│   │   │   ├── Search.jsx           # Skill catalog & filterable search page
│   │   │   ├── Signup.jsx           # New user registration page
│   │   │   ├── TeacherStudio.jsx    # Teacher studio (course creator & video manager)
│   │   │   └── UserProfile.jsx      # Public profile view (/u/:username)
│   │   ├── utils\
│   │   │   └── api.js               # Centralized Fetch client with credentials
│   │   ├── App.css                  # Core application styling & utility classes
│   │   ├── App.jsx                  # Main router configuration & layout definitions
│   │   ├── index.css                # Base CSS rules & theme custom properties
│   │   └── main.jsx                 # React root entrypoint mounting providers
│   ├── index.html                   # Vite HTML entrypoint
│   ├── package.json                 # Frontend dependencies & npm scripts
│   └── vite.config.js               # Vite build and proxy configuration
├── package.json                     # Root orchestrator package.json
└── README.md                        # Project documentation
```

---

## 2. Entry Points

| Side | File | Role |
| :--- | :--- | :--- |
| **Backend** | [backend/server.js](file:///c:/codes/SkillSwap/backend/server.js) | Bootstraps Express app, attaches HTTP server, binds Socket.io server with JWT handshake auth, connects MongoDB, configures Helmet/CORS/RateLimiter, mounts `/api/*` routes, serves static uploads & React production build fallback, and starts listening on `PORT` (default: 5000). |
| **Frontend** | [frontend/src/main.jsx](file:///c:/codes/SkillSwap/frontend/src/main.jsx) | Initializes React 19 root DOM node, wraps application in `ErrorBoundary`, `BrowserRouter`, `ThemeProvider`, `NotificationProvider`, and `AuthProvider`, rendering [App.jsx](file:///c:/codes/SkillSwap/frontend/src/App.jsx). |

---

## 3. Key Configuration Files

- **`backend/.env`**: Defines runtime environment variables including `PORT`, `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, and `FRONTEND_ORIGINS`.
- **`backend/config/db.js`**: Connects Mongoose to the MongoDB database instance with fallback to `mongodb://localhost:27017/skillswap`.
- **`backend/config/jwt.js`**: Generates and verifies JWT tokens, setting standardized cross-origin cookie attributes (`httpOnly`, `sameSite`, `secure`, `maxAge`).
- **`frontend/vite.config.js`**: Configures Vite build settings, React plugin, and local development proxy rules.
- **`frontend/package.json`**: Declares dependencies (`react`, `react-router-dom`, `framer-motion`, `lucide-react`, `oxlint`).
- **`backend/package.json`**: Declares dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `socket.io`, `multer`, `helmet`, `cors`, `express-rate-limit`, `express-validator`).
- **`package.json` (Root)**: Convenience runner allowing single commands (`npm run dev`, `npm start`) to manage backend processes.

---

## 4. Organization Principles & Module Boundaries

1. **Strict Separation of Concerns**:
   - Routes only define HTTP verbs and URL paths, delegating input validation to `middleware/validation.js` and execution to `controllers/`.
   - Business models encapsulate data schemas, indexing, and internal lifecycle triggers (e.g. automatic average rating calculation via Mongoose aggregation).
2. **Double-Entry Escrow Model**:
   - The credit economy is strictly controlled through [Wallet.js](file:///c:/codes/SkillSwap/backend/models/Wallet.js). Credits are deducted upon booking creation, held in escrow during the session, and released to the instructor only upon confirmed completion (or refunded upon cancellation).
3. **Unified Client Communication**:
   - All client-to-server requests use [api.js](file:///c:/codes/SkillSwap/frontend/src/utils/api.js) to ensure credentials, base URL prefixes, and error handling remain consistent.
4. **Resilient Real-Time Strategy**:
   - The backend exposes WebSocket endpoints via Socket.io for instantaneous bidirectional messaging, while also maintaining standard REST routes for conversations and messages to guarantee complete functionality even if WebSockets are temporarily unavailable.
