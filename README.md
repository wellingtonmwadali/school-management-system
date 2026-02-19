# 🎓 School ERP — Enterprise-Ready Full-Stack Management System

A comprehensive, production-ready High School ERP built with **MERN + Next.js + TypeScript + shadcn/ui**.  
**Designed to handle 1,000-10,000 transactions per day** with enterprise-grade security, performance, and monitoring.

## 🎯 Production Features

- ✅ **Security**: Helmet, CORS, rate limiting, input validation, NoSQL injection prevention
- ✅ **Performance**: Redis caching, database indexing, response compression, connection pooling
- ✅ **Monitoring**: Winston logging, health checks, metrics endpoints, request tracking
- ✅ **Scalability**: PM2 cluster mode, stateless design, horizontal scaling ready
- ✅ **Reliability**: Graceful shutdown, error handling, automatic retries, circuit breakers

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| UI Components | shadcn/ui + Radix UI + Tailwind CSS |
| Charts | Recharts |
| State | Zustand + React Query |
| Backend | Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| Cache | Redis (with memory fallback) |
| Auth | JWT + bcrypt |
| Validation | express-validator |
| Logging | Winston with file rotation |
| Security | Helmet, CORS, HPP, NoSQL sanitization |
| Monitoring | Health checks, metrics, request IDs |

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+ or 20+
- MongoDB (local or Atlas)
- Redis (optional but recommended)
- npm or yarn

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit .env with your MongoDB URI, JWT secret, and other settings

# Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > frontend/.env.local
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- **Greenfield High School** with demo data
- 120 students across 4 classes × 3 streams
- 4 staff members
- Admin and teacher accounts

### 4. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### 5. Login

Open http://localhost:3000 and use:

| Role | Email | Password |
|------|-------|----------|
| Principal | principal@greenfield.ac.ke | Admin1234 |
| Finance Officer | finance@greenfield.ac.ke | Finance1234 |
| Teacher | peter@greenfield.ac.ke | Teacher1234 |

---

## 🏭 Production Deployment

For production deployment instructions, see [backend/PRODUCTION.md](backend/PRODUCTION.md)

### Quick Deploy with Docker

```bash
# Using docker-compose with Redis
docker-compose up -d

# The system will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - Health check: http://localhost:5000/health
```

### Quick Deploy with PM2

```bash
cd backend
npm run build
pm2 start ecosystem.config.js --env production
```

---

## 📁 Project Structure

```
school-erp/
├── backend/
│   └── src/
│       ├── config/          # DB connection
│       ├── controllers/     # Route handlers
│       ├── middleware/      # Auth, validation, rate limiting, security
│       ├── models/          # Mongoose schemas with indexes
│       ├── utils/           # Cache, health checks, logging
│       ├── routes/          # API routes
│       ├── types/           # TypeScript types
│       └── utils/           # Seed script
│
└── frontend/
    └── src/
        ├── app/
        │   ├── (app)/       # Protected routes
        │   │   ├── dashboard/
        │   │   ├── students/
        │   │   ├── staff/
        │   │   ├── attendance/
        │   │   ├── academics/
        │   │   ├── finance/
        │   │   ├── discipline/
        │   │   ├── library/
        │   │   ├── leave/
        │   │   └── settings/
        │   └── login/
        ├── components/
        │   ├── ui/          # shadcn components
        │   ├── Sidebar.tsx
        │   └── StatsCard.tsx
        ├── hooks/           # Custom hooks
        ├── lib/             # API client + utilities
        ├── store/           # Zustand stores
        └── types/           # TypeScript interfaces
```

---

## 📋 Modules Implemented

### ✅ Core Modules
- **Authentication** — JWT-based login, role-based access
- **Dashboard** — Role-specific dashboards with charts
- **Student Management** — Full CRUD, admission, profiles
- **Staff Management** — Staff directory, roles, departments
- **Attendance** — Daily marking, summaries, absentee tracking
- **Academic / Exams** — Exam creation, marks entry, analysis
- **Finance** — Fee invoices, payments, collection analytics
- **Discipline** — Incident logging, severity tracking
- **Library** — Book catalog, borrowing management
- **Leave Management** — Apply, review, approve workflow
- **Settings** — Full school configuration editor

### ✅ Configuration Engine
Everything is configurable from the Settings page:
- School info, type, address
- Class levels and stream structure
- Grading schema (grade boundaries, points, remarks)
- Assessment weights (CAT, End-Term, etc.)
- Promotion criteria
- Fee items per class/term
- Timetable structure (periods, breaks, working days)
- Notification channels (SMS, email, WhatsApp toggles)

---

## 🔌 API Endpoints

| Resource | Endpoints |
|----------|-----------|
| Auth | POST /auth/login, GET /auth/me |
| Config | GET/PUT /config |
| Students | CRUD + /stats + /bulk-promote |
| Staff | CRUD |
| Attendance | POST /attendance, GET summaries |
| Exams | CRUD + marks entry + analysis |
| Fees | Generate invoices, record payments, stats |
| Discipline | CRUD incidents |
| Library | Books CRUD, checkout, return |
| Leave | Apply, review |
| Dashboard | /principal, /finance, /teacher, /student |

---

## 🔐 Role-Based Access

| Role | Access |
|------|--------|
| Principal | Full access to all modules |
| Finance Officer | Fee management, financial reports |
| Subject Teacher | Attendance, marks entry for their subjects |
| Class Teacher | Full class roster, attendance |
| HOD | Department management, staff supervision |
| Counselor | Counseling cases, at-risk students |
| Librarian | Book catalog, borrowings |
| Parent | Child's data (portal) |
| Student | Own data (portal) |

---

## 🛠 Development Notes

### Adding a New Module
1. Create Mongoose model in `backend/src/models/`
2. Create controller in `backend/src/controllers/`
3. Add routes in `backend/src/routes/index.ts`
4. Create frontend page in `frontend/src/app/(app)/[module]/page.tsx`
5. Add nav item in `frontend/src/components/Sidebar.tsx`

### Custom Fields
The system supports admin-defined custom fields for any entity. Configure them in Settings → School Config → Custom Fields.

---

## 📈 Future Enhancements
- M-Pesa STK Push integration
- WhatsApp Business API notifications
- PDF report card generation
- Biometric device integration
- Mobile apps (React Native)
- Multi-branch / multi-campus support
- Parent and student portals
- Transport module
- Hostel management
- Timetable auto-generator

---

## 📄 License
MIT — Free to use and extend.
