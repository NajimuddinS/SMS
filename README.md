# Pillai Academy Portal - Student Management System

A modern, secure, and responsive web application designed for academic administrators to manage student records, audit operational activity, and view dashboard analytics.

---

## System Architecture

The application is structured as a decoupled monorepo containing a React single-page application (SPA) and an Express-based REST API backend, written in TypeScript.

```
SMS/
├── client/          # Frontend React SPA (Vite + TSX + TailwindCSS)
└── server/          # Backend REST API (Node.js + Express + TypeScript + PostgreSQL)
```

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, PG (node-postgres)
- **Database**: PostgreSQL (Supabase Serverless Database)
- **Storage**: Cloudinary API (fallback to local public directory uploads)
- **Security**: JWT-based session token authentication & bcrypt password hashing

---

## Features

- **JWT Authentication**: Secure registration (Sign Up), login, and session state loading using local storage.
- **Student Directory**: Paginated directory view with multi-key string lookup, sorting, and course/year level filters. Includes responsive card layouts for mobile displays.
- **Digital ID Cards**: Dynamic rendering of student metadata cards with clean printing styling (removes layout borders and triggers browser printer layouts).
- **Interactive Analytics**: Dashboard metrics displaying student enrollment tallies, department percentages, and gender distributions.
- **Activity Logs**: Automated database auditing of all backend actions (e.g., registrations, logins, insertions, modifications, and deletions).
- **Network Optimization**: Client uses a unified URL configuration helper and Supabase IPv4 connection poolers to minimize cross-region network latency.

---

## Database Schema

The backend automatically checks and provisions the PostgreSQL tables and sequences on startup.

### 1. User Credentials (`users`)
Stores administrative accounts.
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 2. Student Records (`students`)
Stores metadata of enrolled students.
```sql
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  course VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 4),
  date_of_birth DATE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(10) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  address TEXT NOT NULL,
  photo_url TEXT DEFAULT '',
  photo_public_id TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
```

### 3. Audit Trails (`activity_logs`)
Stores operational records.
```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
```

### 4. Admission Sequence (`admission_number_seq`)
Thread-safe PostgreSQL sequence generating unique identifiers for new students: `SMS-YYYY-[SEQ]`.
```sql
CREATE SEQUENCE IF NOT EXISTS admission_number_seq START WITH 1;
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Managed Supabase PostgreSQL Instance

### 1. Server Configuration
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
DATABASE_URL=postgresql://postgres.[YOUR_REF]:[YOUR_PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Cloudinary Storage Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Token Verification
JWT_SECRET=your_secret_key
```

Install packages and run the server in development mode:
```bash
cd server
npm install
npm run dev
```

### 2. Client Configuration
Create a `.env` file inside the `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Install packages and start the frontend application:
```bash
cd client
npm install
npm run dev
```
Navigate to `http://localhost:5173` to access the portal.
