# CareSync Backend

CareSync is a state-of-the-art, feature-rich healthcare management and appointment booking platform. This repository contains the backend service built with Node.js, Express, TypeScript, and Prisma (PostgreSQL), featuring robust authentication, automatic billing/payments via Stripe, secure media uploading, advanced query filtering, and role-based access control.

---

## 🚀 Teaser / Core Features

-   **Role-Based Security**: Complete access control for `SUPER_ADMIN`, `ADMIN`, `DOCTOR`, and `PATIENT`. Contains middleware for token/session guards.
-   **Robust Authentication System**: Powered by **Better Auth** and custom JWT mechanisms. Supports email verification, Google OAuth, session management, secure cookies, and OTP generation for password resets.
-   **Doctor & Schedule Management**: Doctors can declare schedules, while admins handle general schedule creation. Includes conflict-free booking rules.
-   **Secure Payments via Stripe**: Supports instant Stripe-facilitated appointment payment or pay-later scheduling, verified via secure webhook handler endpoint.
-   **Automatic Cron Jobs**: Automatically checks and cancels unpaid appointments every 25 minutes to release locked slots.
-   **Powerful Query Engine**: A custom `QueryBuilder` class built over Prisma, featuring:
    -   Multi-relation text searches (e.g. searching Doctor by Name, Specialty Title, or User Email)
    -   Dynamic range filtering (greater than, less than, in, notIn)
    -   Multi-level sorting and pagination (including relation fields)
    -   Selective field extraction and relation inclusion
-   **Email Integration**: Formatted transactional HTML emails sent via secure SMPT servers for OTP generation and confirmations.
-   **Media Storage**: Direct uploads of doctor qualifications and specialty icons to Cloudinary.

---

## 🛠 Tech Stack

-   **Runtime & Language**: Node.js & TypeScript
-   **Framework**: Express.js (v5)
-   **Database ORM**: Prisma Client & Prisma Migrations
-   **Database**: PostgreSQL
-   **Authentication**: Better Auth (with Prisma adapter and OTP plugins) + Custom JWT
-   **Payments**: Stripe SDK
-   **File Storage**: Cloudinary (via `multer` and `multer-storage-cloudinary`)
-   **Scheduler**: Node-cron
-   **Templating**: EJS

---

## 📂 Project Architecture

The codebase follows a modular clean-architecture layout under the `src/` directory.

```text
careSync-backend/
├── api/                   # Serverless function entry point for Vercel deployment
├── prisma/                # Database migrations and multi-file schema directory
│   └── schema/            # Sub-schema definitions (enums, auth, doctor, patient, etc.)
└── src/
    ├── app/
    │   ├── config/        # Multiplexed configurations (Stripe, Cloudinary, Multer, Env validation)
    │   ├── errorHelpers/  # Custom application errors and Zod error parser
    │   ├── interfaces/    # TypeScript types and interfaces
    │   ├── lib/           # Better Auth client and Prisma client initializers
    │   ├── middleware/    # Auth guards, request validations, and global error handlers
    │   ├── module/        # Domain-driven feature modules (Auth, Doctor, Patient, Stripe)
    │   ├── routes/        # Main express routing center
    │   ├── shared/        # Shared core helper functions
    │   ├── templates/     # Email notification templates (EJS format)
    │   └── utils/         # Seed execution, JWT generation, QueryBuilder class
    ├── app.ts             # Express Application initialization
    └── server.ts          # Server entry file (Bootstrap, server listener)
```

---

## 🛢 Database Schema Overview

The schema is separated into dedicated `.prisma` files under `/prisma/schema/` to prevent long-file bloat:

1.  **Auth & Session Schema** (`auth.prisma`): Manages users, credentials, social accounts, active sessions, and verification tokens.
2.  **Specialties** (`specialty.prisma`): Specialization records (e.g. Cardiology, Neurology) mapped to doctors.
3.  **Doctors** (`doctor.prisma`): Medical info, designations, rating history, qualification, fee structures, and profile images.
4.  **Patients & Health Records** (`patient.prisma`, `patientHealthData.prisma`): Health logs, blood types, allergies, smoke status, pregnancy flags, psychiatric histories.
5.  **Appointments & Schedules** (`appointment.prisma`, `schedule.prisma`): Multi-day shift scheduler, doctor-to-schedule intersection mapping tables, and booking status controls.
6.  **Payments** (`payment.prisma`): Transaction IDs, Stripe Webhook references, validation stats, paid status logs.
7.  **Prescriptions & Medical Reports** (`prescription.prisma`, `medicalReport.prisma`): Doctor notes, follow-up instructions, PDF storage references.
8.  **Reviews** (`review.prisma`): Booking rating scores and patient critiques.

---

## 🧭 API Endpoints

All base routes are prefixed with `/api/v1`.

### 🔐 Authentication (`/auth`)
-   `POST /auth/register` - Create patient profile & send email verification OTP.
-   `POST /auth/login` - Authenticate credentials and receive token.
-   `GET /auth/me` - Get profile of the currently logged-in user.
-   `POST /auth/refresh-token` - Renew expired Access Tokens.
-   `POST /auth/change-password` - Update account password.
-   `POST /auth/logout` - Clear active user sessions.
-   `POST /auth/verify-email` - Complete signup verification process.
-   `POST /auth/forget-password` - Request a password reset OTP.
-   `POST /auth/reset-password` - Update password via verified OTP.
-   `GET /auth/login/google` - Redirect to OAuth Google Provider.

### 🏥 Specialties (`/specialties`)
-   `GET /specialties` - List all available medical specialties.
-   `POST /specialties` - Add a new specialty (Admin/Super-Admin only; accepts image file uploads).
-   `DELETE /specialties/:id` - Mark specialty as deleted.

### 🩺 Doctors (`/doctors`)
-   `GET /doctors` - Query doctor listings with searchable filters (public).
-   `GET /doctors/:id` - Fetch doctor's details and active specialties.
-   `PATCH /doctors/:id` - Update billing details, designations, and availability.
-   `DELETE /doctors/:id` - Soft delete a doctor account.

### 🗓 Schedules (`/schedules` & `/doctor-schedules`)
-   `POST /schedules` - Create scheduling slots (Admin/Super-Admin only).
-   `GET /schedules` - Read schedule timelines.
-   `POST /doctor-schedules/create-my-doctor-schedule` - Associate a doctor with created slots.
-   `GET /doctor-schedules/my-doctor-schedules` - Read active schedules for the logged-in doctor.
-   `PATCH /doctor-schedules/update-my-doctor-schedule` - Modifies doctor's schedule status.
-   `DELETE /doctor-schedules/delete-my-doctor-schedule/:id` - Doctor removes schedule ownership.

### 📅 Appointments (`/appointments`)
-   `POST /appointments/book-appointment` - Book with Stripe Checkout execution.
-   `POST /appointments/book-appointment-with-pay-later` - Book now, pay before appointment starts.
-   `POST /appointments/initiate-payment/:id` - Trigger Stripe payment on a "Pay-Later" appointment.
-   `GET /appointments/my-appointments` - Read patient/doctor-specific booking logs.
-   `GET /appointments/my-single-appointment/:id` - Inspect booking and payment validation status.
-   `PATCH /appointments/change-appointment-status/:id` - Modify status (`SCHEDULED`, `INPROGRESS`, `COMPLETED`, `CANCELED`).

### 💳 Payments & Webhooks
-   `POST /webhook` - Handles raw Stripe webhook payloads to confirm payments directly from Stripe servers.

---

## ⚙️ Configuration & Setup

### Prerequisites
-   **Node.js** (v18+)
-   **PNPM** (v10+)
-   **PostgreSQL Database Instance**

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/samibyte/CareSync-backend.git
    cd CareSync-backend
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory relative to the variables below:

    ```env
    NODE_ENV=development
    PORT=5000

    # PostgreSQL Database URL
    DATABASE_URL="postgresql://username:password@localhost:5432/caresync?schema=public"

    # Better Auth Setup
    BETTER_AUTH_SECRET="your-better-auth-secret-key"
    BETTER_AUTH_URL="http://localhost:5000"

    # JWT Configs
    ACCESS_TOKEN_SECRET="your-access-token-secret"
    REFRESH_TOKEN_SECRET="your-refresh-token-secret"
    ACCESS_TOKEN_EXPIRES_IN="1d"
    REFRESH_TOKEN_EXPIRES_IN="7d"
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN="1d"
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE="1d"

    # Email Transport Configuration (SMTP)
    EMAIL_SENDER_SMTP_USER="sender@gmail.com"
    EMAIL_SENDER_SMTP_PASS="smtp-app-password"
    EMAIL_SENDER_SMTP_HOST="smtp.gmail.com"
    EMAIL_SENDER_SMTP_PORT="465"
    EMAIL_SENDER_SMTP_FROM="CareSync <sender@gmail.com>"

    # Google OAuth credentials
    GOOGLE_CLIENT_ID="google-client-id"
    GOOGLE_CLIENT_SECRET="google-client-secret"
    GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/callback/google"

    # Frontend connection path
    FRONTEND_URL="http://localhost:3000"

    # Cloudinary storage configs
    CLOUDINARY_CLOUD_NAME="your-cloud-name"
    CLOUDINARY_API_KEY="your-api-key"
    CLOUDINARY_API_SECRET="your-api-secret"

    # Stripe Payment API config
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."

    # Super Admin credentials (automatically seeded on spin up)
    SUPER_ADMIN_EMAIL="sudo@runas.com"
    SUPER_ADMIN_PASSWORD="super-secure-password"
    ```

4.  **Database Migration & Client Generation**:
    ```bash
    pnpm run migrate
    pnpm run generate
    ```

5.  **Run Dev Environment**:
    ```bash
    pnpm run dev
    ```

6.  **Run Production Build**:
    ```bash
    pnpm run build
    pnpm run start
    ```

---

## 🕵️ Technical Highlights

### ⚡ Custom QueryBuilder
The application utilizes a tailored Prisma query building helper that maps request query parameters directly to database expressions dynamically:
-   **Searching**: Searches across deeply nested relations dynamically, e.g., mapping `searchTerm` queries to relation tables like `doctor.user.name`.
-   **Range Filter Queries**: Automatically parses syntax like `/doctors?appointmentFee[lt]=100` into correct prisma number comparisons (`{ lt: 100 }`).
-   **Security**: Excludes unmapped parameters to protect database layers.

### 🛡️ Combined Session Token / Access Token Security Layer
The `checkAuth` middleware provides dual inspection validation:
1.  It verifies the session exists using Better Auth's token system directly within the Postgres session cache table.
2.  It monitors token expiry times, emitting header warnings (`X-Session-Refresh`) if the session cache has less than 20% of its validity period remaining.
3.  It validates supplementary custom authorization tokens before parsing endpoint variables.

---

## 📄 License

CareSync backend is open-sourced software licensed under the [ISC license](LICENSE).
