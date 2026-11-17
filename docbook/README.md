# MediSlot - Clinic Appointment Booking System

##  Project Structure

```
MediSlot/
├── client/                     # Frontend Application (React + Vite)
│   ├── index.html              # HTML entry point with fonts & metadata
│   ├── package.json            # Client dependencies & scripts
│   ├── vite.config.js          # Vite config & API reverse proxy
│   ├── .env.example            # Environment template for frontend
│   └── src/
│       ├── main.jsx            # React root mount with BrowserRouter & AuthProvider
│       ├── App.jsx             # Application router & protected route layout
│       ├── index.css           # Modern design system & responsive styling
│       ├── context/
│       │   └── AuthContext.jsx # Global JWT session state (React Context)
│       ├── services/
│       │   └── api.js          # Axios client with JWT request interceptor
│       ├── components/
│       │   ├── Navbar.jsx      # Role-adaptive top navigation bar
│       │   └── ProtectedRoute.jsx # Role-based route guard
│       └── pages/
│           ├── Login.jsx       # User authentication + 1-click demo logins
│           ├── Register.jsx    # Patient registration with validation
│           ├── patient/
│           │   ├── DoctorsList.jsx      # Doctor directory & search
│           │   ├── BookAppointment.jsx # Slot picker & transaction booking
│           │   └── MyAppointments.jsx   # Patient history, cancellation, prescriptions
│           ├── doctor/
│           │   ├── ManageSlots.jsx      # Create & remove availability slots
│           │   └── DoctorAppointments.jsx # View bookings, complete & issue Rx
│           └── admin/
│               ├── ManageDoctors.jsx    # Add/delete doctor credentials & profiles
│               └── AdminAppointments.jsx # Clinic-wide appointment monitoring
│
├── server/                     # Backend Application (Node.js + Express)
│   ├── server.js               # Express application entry point
│   ├── package.json            # Server dependencies & scripts
│   ├── .env.example            # Backend environment template
│   ├── db/
│   │   ├── index.js            # PostgreSQL connection pool (`pg`)
│   │   ├── schema.sql          # Relational DDL tables, foreign keys & indexes
│   │   ├── seed.sql            # Sample data (admin, 2 doctors, 1 patient, slots)
│   │   └── seedRunner.js       # Node automation to run schema + seed
│   ├── middleware/
│   │   ├── auth.js             # JWT verification & `requireRole` RBAC guards
│   │   └── errorHandler.js     # Centralized error handler with SQL error mapping
│   ├── controllers/
│   │   ├── authController.js   # Register, Login (bcrypt + JWT), Profile
│   │   ├── doctorController.js # Doctor listings & available slots
│   │   ├── slotController.js   # Doctor slot creation & deletion
│   │   ├── appointmentController.js # Transactional booking, cancellation, completion
│   │   └── adminController.js  # Admin doctor management & appointment audit
│   └── routes/
│       ├── authRoutes.js       # /api/auth
│       ├── doctorRoutes.js     # /api/doctors
│       ├── slotRoutes.js       # /api/slots
│       ├── appointmentRoutes.js # /api/appointments
│       └── adminRoutes.js      # /api/admin
│
└── README.md                   # Full documentation & setup guide
```

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18 (Vite) | Functional components, Hooks, React Router DOM v6 |
| **State Management** | React Context API | `AuthContext` managing user authentication & token persistence |
| **HTTP Client** | Axios | Request interceptor attaching `Authorization: Bearer <JWT>` |
| **Styling** | Modern CSS | Clean responsive UI, custom components, status badges, modal dialogs |
| **Backend** | Node.js + Express | MVC architecture (Routes, Controllers, Middleware, DB) |
| **Database** | PostgreSQL | Handled using `pg` (node-postgres) with pure SQL queries (No ORM) |
| **Security** | bcryptjs & JWT | Bcrypt salt rounds (10), JWT bearer token validation, RBAC middleware |


---

##  Database Schema & Relational Design

The database schema (`server/db/schema.sql`) implements 5 relational tables:

1. **`users`**: Base authentication table storing `name`, `email` (UNIQUE), `password_hash`, and `role` (`patient`, `doctor`, `admin`).
2. **`doctors`**: Extends `users` with doctor-specific fields: `user_id` (FK to `users.id` with `ON DELETE CASCADE`), `specialization`, and `experience_years`.
3. **`slots`**: Doctor availability slots with `doctor_id` (FK), `slot_date`, `start_time`, `end_time`, and `is_booked` (BOOLEAN).
4. **`appointments`**: Central transaction entity linking `patient_id` (FK), `doctor_id` (FK), and `slot_id` (FK, UNIQUE to enforce 1-to-1 slot reservation). Status enum: `booked`, `cancelled`, `completed`.
5. **`prescriptions`**: Medical consultation record linking `appointment_id` (FK, UNIQUE), `notes`, and `medicines`.

### Key SQL Constraints & Transactions
- **Atomicity via SQL Transactions (`BEGIN ... COMMIT / ROLLBACK`)**:
  - **Booking**: Uses `SELECT ... FOR UPDATE` to lock the slot row, verifies it is unbooked, flags `is_booked = true`, and creates the `appointments` row. If another user attempts to book concurrently, the row lock prevents race conditions.
  - **Cancelling**: Updates appointment status to `cancelled` and atomically frees the slot (`is_booked = false`).
  - **Completing**: Atomically updates appointment status to `completed` and writes doctor clinical notes & medicines into `prescriptions`.

---

## Quick Setup Guide

### Prerequisites
- Node.js (v18 or higher) & npm
- PostgreSQL database server running locally

### Step 1: Create the Database
In your PostgreSQL terminal (`psql`) or pgAdmin:
```sql
CREATE DATABASE medislot_db;
```

### Step 2: Configure & Initialize Server
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to match your local PostgreSQL credentials (`DB_USER`, `DB_PASSWORD`, `DB_NAME`).*

3. Install server dependencies:
   ```bash
   npm install
   ```

4. Run the automated database schema & seed runner:
   ```bash
   npm run seed
   ```
   *(Alternatively, execute `psql -d medislot_db -f db/schema.sql` followed by `psql -d medislot_db -f db/seed.sql`)*

5. Start the backend server:
   ```bash
   npm start
   # Server runs at http://localhost:5000
   # Health check at http://localhost:5000/api/health
   ```

### Step 3: Configure & Start Frontend
1. Open a new terminal and navigate to `client/`:
   ```bash
   cd client
   ```
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install frontend dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   # App runs at http://localhost:3000
   ```

---

## Demo Login Credentials

All seed accounts use the default password: **`password123`**

| Role | Name | Email | Password | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Rohan Verma | `rohan.admin@gmail.com` | `password123` | Can add/remove doctors & audit all appointments |
| **Doctor** | Dr. Dishti Kaushik | `dishti7@gmail.com` | `password123` | Cardiologist, can manage slots & complete visits |
| **Doctor** | Dr. Gunjan Sharma | `gunjan8@gmail.com` | `password123` | Dermatologist, can manage slots & complete visits |
| **Patient** | Rahul Verma | `rahul.patient@gmail.com` | `password123` | Can browse doctors, book slots, view & cancel visits |

> **Presentation Tip:** The login page includes convenient **1-Click Demo Buttons** so you can switch between Admin, Doctor, and Patient roles instantly without typing credentials!

---

## REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new patient account (`name`, `email`, `password`)
- `POST /api/auth/login` - Authenticate user; returns JWT token + user profile & role
- `GET /api/auth/me` - Retrieve authenticated user session info *(Protected)*

### Doctors & Availability (`/api/doctors`)
- `GET /api/doctors` - Retrieve list of all doctors with their specialization & experience
- `GET /api/doctors/:id/slots` - Retrieve slots for a doctor (`?only_available=true` filters for unbooked slots)

### Slots Management (`/api/slots`)
- `POST /api/slots` - Doctor publishes new availability slot (`slot_date`, `start_time`, `end_time`) *(Doctor only)*
- `DELETE /api/slots/:id` - Doctor removes an unbooked slot *(Doctor only)*

### Appointments & Prescriptions (`/api/appointments`)
- `POST /api/appointments` - Patient books an open slot using a SQL transaction *(Patient only)*
- `PATCH /api/appointments/:id/cancel` - Patient cancels their appointment & frees slot in a transaction *(Patient only)*
- `GET /api/appointments/my` - View appointment history & prescriptions for current patient or doctor *(Patient/Doctor)*
- `PATCH /api/appointments/:id/complete` - Doctor completes visit and records prescription notes & medicines *(Doctor only)*

### Admin Administration (`/api/admin`)
- `GET /api/admin/appointments` - Full clinic audit of all appointments across all users *(Admin only)*
- `POST /api/admin/doctors` - Create a new doctor profile and system login account *(Admin only)*
- `DELETE /api/admin/doctors/:id` - Remove doctor account and cascade deletion *(Admin only)*