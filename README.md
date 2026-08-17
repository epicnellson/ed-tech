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

### 1. Deploy Backend (Render / Railway / Fly.io)

Deploy the `/backend` folder to a persistent host (e.g., Render Web Service or Railway App).

Configure these Environment Variables on your backend host:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_64_char_jwt_secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLIENT_URL=https://your-frontend-app.vercel.app
```

> **Note:** The backend must run on persistent infrastructure (not Vercel serverless) because it uses:
> - **Socket.io** — requires a long-lived process with in-memory state for WebSocket connections.
> - **Multer disk uploads** — files are written to the local filesystem (use S3/R2 in production).

### 2. Deploy Frontend (Vercel)

1. Import your GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. **Framework Preset** will auto-detect as Vite.

Configure these Environment Variables in Vercel:

```env
VITE_API_URL=https://your-backend-app.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Click **Deploy**.

## Known Limitations

- Quiz feature is currently disabled (code preserved for future)
- Video streaming uses placeholder (integrate with provider as needed)

## License

ISC
