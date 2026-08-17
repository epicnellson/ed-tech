# Ed-Tech LMS

A full-stack Learning Management System built with MERN stack (MongoDB, Express, React, Node.js).

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- npm or yarn

### Environment Setup

**Backend (.env):**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Running the App

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Seeding Demo Data

```bash
cd backend
npm run seed
```

Creates demo teacher/student accounts with seeded courses.

## Tech Stack

**Backend:**
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.io (live classes)
- Multer (file uploads)
- Google OAuth

**Frontend:**
- React 18
- React Router v6
- TanStack Query
- Tailwind CSS
- Lucide Icons
- Socket.io Client

## Project Structure

### Backend (`/backend/src`)
```
├── config/         # Configuration files
├── controllers/    # Route handlers
├── middleware/     # Auth, upload, error handling
├── models/         # Mongoose schemas
├── routes/         # API routes
├── scripts/        # Seed scripts
├── services/       # Business logic
└── server.js       # Entry point
```

### Frontend (`/frontend/src`)
```
├── api/            # API clients
├── components/     # Reusable UI components
├── context/        # React contexts
├── pages/          # Page components
│   ├── admin/
│   ├── auth/
│   ├── courses/
│   ├── dashboard/
│   ├── student/
│   └── teacher/
├── lib/            # Utilities
└── App.jsx         # Routes
```

## Key Features

- User authentication (email/password + Google)
- Role-based access (student, teacher, admin)
- Course management with modules/lessons
- File uploads for lessons and assignments
- Assignment creation and submission
- Live class sessions (Socket.io)
- Real-time chat
- AI assistant chat
- Enrollment management
- Progress tracking
- Dashboard analytics

## API Routes

| Route | Description |
|-------|-------------|
| `/api/auth` | Auth & Google OAuth |
| `/api/courses` | Course CRUD & Modules |
| `/api/assignments` | Assignment Management |
| `/api/enrollments` | Enrollment Operations |
| `/api/users` | User Profiles & Analytics |
| `/api/chat` | Real-Time & AI Chat |
| `/api/admin` | Admin Management |
| `/api/resources` | File & Resource Attachments |
| `/api/announcements` | Course Announcements |
| `/api/notifications` | In-App Notifications |
| `/api/students` | Student Profiles & Roster |
| `/api/public` | Public Catalog |

## Roles

- **Student**: Enroll in courses, submit assignments, join live classes
- **Teacher**: Create courses, manage modules, grade assignments, go live
- **Admin**: Manage users and courses globally

## Demo Accounts

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Teacher | sarah.johnson@demo.edu | password123 |
| Student | alex.thompson@demo.edu | password123 |

## Deployment Architecture

The frontend and backend are deployed separately due to their different runtime requirements.

**Frontend (Vercel):**
- Vite-built static SPA served via Vercel's edge network.
- No server-side logic — all API calls are proxied to the backend.
- Set `VITE_API_URL` to your backend's public URL (e.g. `https://your-app.onrender.com/api`).

**Backend (Render / Railway / similar):**
- Must run on persistent infrastructure (not Vercel serverless) because it uses:
  - **Socket.io** — requires a long-lived process with in-memory state for WebSocket connections.
  - **Multer disk uploads** — files are written to the local filesystem (use S3/R2 in production).
- Set `CLIENT_URL` to your Vercel frontend domain for CORS.
- Set `NODE_ENV=production` and ensure `JWT_SECRET` is at least 32 characters.

## Known Limitations

- Quiz feature is currently disabled (code preserved for future)
- Video streaming uses placeholder (integrate with provider as needed)

## License

ISC
