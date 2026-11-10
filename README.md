# SkillSwap 🤝

SkillSwap is a production-ready, credit-based peer-to-peer skill exchange web application. It allows users to teach skills to earn credits and spend credits to learn skills from others. The project features a modern flat SaaS startup design (Blue & Emerald palette) and is built using Node.js, Express, MongoDB Atlas, and Mongoose with vanilla HTML/CSS/JavaScript.

## Features

- **Credit System Escrow:** Booking a session deducts credits from the learner's wallet immediately. Credits are released to the instructor when the class is completed. Cancellations trigger automatic refunds.
- **Onboarding & User Profiles:** Custom user registration, avatar uploads using Multer, biographical detail entry, and languages/skills tags.
- **Search & Advanced Filters:** Find skills by title, description keyword, category taxonomy, credit cost limits, and reviews ratings.
- **Scheduling & Manager:** Schedule dates, pick timeslots, reschedule sessions, cancel classes, and submit reviews for completed sessions.
- **Analytical Admin Panel:** View registered user tables, listed skills, system logs, categories distribution, and total circulating tokens.
- **Security & Validation:** Express Validator checks, bcrypt hashes, cookie-parser sessions, CORS, rate limiting, and Helmet protections.

---

## Folder Structure

```text
SkillSwap/
├── frontend/             # Frontend client assets
│   ├── css/              # Styling sheets
│   │   └── styles.css
│   ├── js/               # Main client scripts
│   │   └── main.js
│   ├── index.html        # Landing page
│   ├── login.html        # User login
│   ├── signup.html       # User register
│   ├── dashboard.html    # User home metrics
│   ├── browse-skills.html
│   ├── skill-details.html
│   ├── profile.html
│   ├── edit-profile.html
│   ├── create-profile.html
│   ├── wallet.html
│   ├── my-sessions.html
│   ├── notifications.html
│   ├── settings.html
│   ├── about.html
│   ├── contact.html
│   └── 404.html
├── backend/              # Node/Express API Server
│   ├── config/           # DB & JWT configurations
│   ├── controllers/      # MVC Controller files
│   ├── middleware/       # JWT auth, multer, validations
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Routing points
│   ├── uploads/          # Avatar photo files
│   ├── server.js         # API entry point
│   ├── Dockerfile        # Container compiler
│   └── .env.example      # Env vars layout
├── docker-compose.yml    # Docker Compose runner
├── package.json          # Root wrapper
└── README.md
```

---

## Setup & Running

### Prerequisites
- Node.js 20.19+ or 22.12+ (Vite 8 requirement), or Docker Desktop installed.
- A MongoDB Atlas connection string (or a local MongoDB instance).

### 1. Configuration
Navigate to the `backend` folder and copy the environment file:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and update the database credentials:
```text
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/skillswap
JWT_SECRET=
PORT=5000
NODE_ENV=development
```
Generate a strong JWT secret with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` and paste the result after `JWT_SECRET=`. The server will refuse to start with a missing or short secret.

---

### Option A: Local Development

1. **Install Dependencies and Start Server**
   From the project root directory, run:
   ```bash
   npm install
   npm start
   ```
   *This installs both applications. Starting from the project root builds the React frontend and runs the Node server on port 5000.*

   Frontend quality checks are available from the root with `npm run build` and `npm run lint`. Backend unit tests run with `npm test` and use test-only environment defaults; a database is not required for these tests.

2. **Access Application**
   Open your browser and navigate to [http://localhost:5000](http://localhost:5000).

---

### Option B: Docker Container Deployment

1. **Compile and Build Service Containers**
   From the project root directory, run:
   ```bash
   docker compose up --build
   ```
   *Docker Compose builds the React frontend and backend into one image, loads the environment variables, binds uploads, and boots the app on port 5000.*

2. **Access Application**
   Navigate to [http://localhost:5000](http://localhost:5000).
