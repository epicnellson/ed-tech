# Ed-Tech LMS - Full System Test Guide

## Demo Accounts

### Teacher Accounts (with seeded courses)

| Name | Email | Password | Institution |
|------|-------|----------|-------------|
| Dr. Sarah Johnson | sarah.johnson@demo.edu | password123 | Tech University |
| Prof. Michael Chen | michael.chen@demo.edu | password123 | Tech University |
| Dr. Emily Williams | emily.williams@demo.edu | password123 | Tech University |

### Student Accounts

| Name | Email | Password |
|------|-------|----------|
| Alex Thompson | alex.thompson@demo.edu | password123 |
| Jessica Martinez | jessica.martinez@demo.edu | password123 |
| David Lee | david.lee@demo.edu | password123 |
| Sophia Brown | sophia.brown@demo.edu | password123 |
| James Wilson | james.wilson@demo.edu | password123 |
| Olivia Davis | olivia.davis@demo.edu | password123 |
| William Taylor | william.taylor@demo.edu | password123 |
| Emma Anderson | emma.anderson@demo.edu | password123 |

### Newly Created Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Teacher | newteacher@teach.com | test123 |
| Student | newstudent@stud.com | test123 |

### Admin Account

> Note: Create manually via MongoDB or register with role "admin". No admin account is seeded by default.

---

## How to Run the App

### Prerequisites

- Node.js installed
- MongoDB running locally or MongoDB Atlas URI

### Environment Variables

**Backend (`backend/.env`):**

```
MONGODB_URI=mongodb://localhost:27017/edtech
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=81139651400-r143lm2r6h3gerdr1bop0ev4ho3h1ouf.apps.googleusercontent.com
PORT=5000
```

**Frontend (`frontend/.env`):**

```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=81139651400-r143lm2r6h3gerdr1bop0ev4ho3h1ouf.apps.googleusercontent.com
```

### Start Commands

1. **Start Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   - Backend runs at: http://localhost:5000

2. **Start Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

   - Frontend runs at: http://localhost:5173

3. **Seed Demo Data (if not already seeded):**

   ```bash
   cd backend
   npm run seed:demo
   ```

---

## Teacher Test Flow

### 1. Login

- Navigate to: http://localhost:5173/login
- Enter teacher credentials:
  - Email: `sarah.johnson@demo.edu`
  - Password: `password123`
- Click "Sign In"
- Should redirect to Dashboard

### 2. Explore Dashboard & Courses

- After login, you land on `/dashboard`
- Click **"My Courses"** in the sidebar navigation
- Or navigate directly to: `/teacher/courses`
- **Verify seeded courses** appear:
  - Introduction to Computer Science (CS101)
  - Data Structures and Algorithms (CS201)
- Each course shows: title, course code, category, student count

### 3. View Course Detail

- Click on any course card (e.g., "Introduction to Computer Science")
- Navigate to: `/courses/[COURSE_ID]`
- **Verify:**
  - Course title, description, course code
  - Institution: "Tech University"
  - Program: "Computer Science"
  - Modules and Lessons are listed
  - Assignments section visible

### 4. Go Live (Host a Live Class)

**Option A: Quick Live (from dashboard)**

- Navigate to: `/teacher/live`
- Select a course from dropdown
- Click **"Start Live Session"**
- **Verify:** Live session starts, shows "LIVE" badge

**Option B: From Course**

- Open course detail: `/courses/[COURSE_ID]`
- Look for **"Go Live"** button in course header
- Click to start live session
- **Verify:**
  - Route changes to: `/teacher/courses/[COURSE_ID]/live`
  - "LIVE" badge appears
  - Video placeholder shown
  - Chat panel available

**End Live Session:**

- Click **"End Live"** button
- Confirm to end session
- Returns to course detail

### 5. Assignments (Teacher View)

**View Assignments:**

- Navigate to: `/teacher/courses/[COURSE_ID]/assignments`
- Or from course detail, click "Assignments" tab

**Create Assignment:**

- Click **"Add Assignment"** or **"New Assignment"** button
- Fill in:
  - Title: "Weekly Quiz"
  - Description: "Complete all questions"
  - Due Date: Select a future date
  - Max Score: 100
- **Add attachment:** Click upload icon, attach a file (pdf/doc/ppt/png/jpg)
- Click "Create" or "Save"
- **Verify:** Assignment appears in list with attachment indicator

### 6. Student Insights / Roster

**View Enrolled Students:**

- Navigate to: `/teacher/courses/[COURSE_ID]/students`
- Or from course detail, click "Students" tab
- **Verify:**
  - List of enrolled students (names, emails)
  - Progress percentage for each student
  - Enrollment date
  - Filter/search functionality

---

## Student Test Flow

### 1. Login

- Navigate to: http://localhost:5173/login
- Enter student credentials:
  - Email: `alex.thompson@demo.edu`
  - Password: `password123`
- Click "Sign In"
- Should redirect to Dashboard

### 2. Browse Available Courses

**View Public Courses:**

- Navigate to: `/courses/public`
- **Verify:** Shows courses with privacy "public" (e.g., Introduction to Computer Science, Business Management Essentials)

**View All Courses:**

- Navigate to: `/courses`
- Browse available courses

**Enroll in a Course:**

- Click on any course card
- Click **"Enroll"** or **"Join Course"** button
- **Verify:** Success message, course added to "My Courses"

**Join by Code (if applicable):**

- Navigate to: `/join`
- Enter course code (provided by teacher)
- Click "Join"

### 3. My Courses & Dashboard

- Navigate to: `/courses/my` (student view)
- **Verify:** Enrolled courses appear with:
  - Course title and thumbnail
  - Progress bar (e.g., "45% complete")
  - Last accessed date

- Dashboard: `/dashboard`
- Shows enrolled courses, upcoming tasks, live classes

### 4. Learning & Progress

**Open Course Player:**

- Click on an enrolled course
- Navigate to: `/courses/[COURSE_ID]/learn`
- **Verify:**
  - Course outline on left (modules/lessons)
  - Lesson content on right
  - Progress bar at top

**Mark Lesson Complete:**

- Read through lesson content
- Click **"Mark as Complete"** button at bottom
- **Verify:**
  - Progress percentage updates
  - Next lesson becomes available

### 5. Assignments (Student View)

**View Assignments:**

- Dashboard shows "Upcoming Tasks" widget
- Or navigate to: `/tasks`
- **Verify:** List of assignments with:
  - Course name
  - Due date
  - Status (Pending/Submitted/Graded)

**Submit Assignment:**

- Click on an assignment
- Navigate to: `/assignments/[ASSIGNMENT_ID]`
- **Verify:**
  - Assignment details (title, description, due date)
  - Teacher's attached files (if any) - can download
- **Submit answer:**
  - Type text answer in submission box, OR
  - Click upload to attach file (pdf/doc/ppt/png/jpg)
  - Click "Submit" button
- **Verify:** Status changes to "Submitted"

**View Grade/Status:**

- After teacher grades, navigate to same assignment
- **Verify:** Shows grade/score and feedback

### 6. Live Class (Student View)

**Join Live Session:**

- On Dashboard, look for **"LIVE"** badge on courses
- Or navigate to: `/courses/[COURSE_ID]/live`
- **Verify:**
  - "LIVE NOW" indicator visible
  - Video placeholder / stream area
  - Chat panel to send messages
  - Teacher's name displayed

**Interact in Live:**

- Type message in chat
- See messages appear in real-time

---

## Admin Test Flow

> Note: If no admin account exists, manually create one in MongoDB with `role: "admin"`

### 1. Login

- Navigate to: http://localhost:5173/login
- Enter admin credentials
- Click "Sign In"

### 2. Admin Dashboard

- After login, navigate to: `/admin`
- **Verify:**
  - Overview statistics (total users, courses, enrollments)
  - Quick actions

### 3. View All Users

- Navigate to: `/admin/users`
- **Verify:**
  - List of all users (teachers, students)
  - Filter by role (Student/Teacher/Admin)
  - Search functionality
  - See demo users:
    - sarah.johnson@demo.edu (teacher)
    - alex.thompson@demo.edu (student)

### 4. View All Courses

- Navigate to: `/admin/courses`
- **Verify:**
  - List of all courses
  - Course details (title, teacher, category)
  - Seeded courses appear:
    - Introduction to Computer Science
    - Data Structures and Algorithms
    - Web Development Fundamentals
    - Database Management Systems
    - Machine Learning Basics
    - Business Management Essentials

---

## Google Sign-In Test Steps

### Prerequisites

- `GOOGLE_CLIENT_ID` set in both backend and frontend .env
- Google OAuth consent screen configured

### Test as New User (Google Login)

1. Navigate to: http://localhost:5173/login
2. Click **"Continue with Google"** button
3. Google popup appears - select a Google account (use one NOT registered in the system)
4. Complete Google sign-in
5. **Expected:**
   - Popup closes
   - Redirects to Dashboard at `/dashboard`
   - New user account created automatically

### Test as Existing User (Google Login)

1. Log out if currently logged in
2. Navigate to: http://localhost:5173/login
3. Click **"Continue with Google"** button
4. Select the same Google account used by a demo user (e.g., sarah.johnson@demo.edu)
5. **Expected:**
   - Popup closes
   - Redirects to Dashboard
   - User logged in with existing account

### Verify Google Sign-In Button

- On Login page: `/login`
- Button labeled "Continue with Google" with Google logo
- If `VITE_GOOGLE_CLIENT_ID` is not set, button shows as disabled

---

## Quick Reference: Routes

### Public Routes

| Page | Route |
|------|-------|
| Landing | `/` |
| Login | `/login` |
| Register | `/register` |
| Public Courses | `/courses/public` |
| Join by Code | `/join` |

### Protected Routes (All Users)

| Page | Route |
|------|-------|
| Dashboard | `/dashboard` |
| All Courses | `/courses` |
| My Courses | `/courses/my` |
| Course Detail | `/courses/:id` |
| Course Player | `/courses/:id/learn` |
| Course Live (Student) | `/courses/:id/live` |
| Assignment Detail | `/assignments/:id` |
| Tasks | `/tasks` |

### Teacher Routes

| Page | Route |
|------|-------|
| My Courses (Teacher) | `/teacher/courses` |
| Create Course | `/teacher/courses/new` |
| Edit Course | `/teacher/courses/:id/edit` |
| Course Modules | `/teacher/courses/:id/modules` |
| Course Students | `/teacher/courses/:id/students` |
| Course Assignments | `/teacher/courses/:id/assignments` |
| Assignment Grading | `/teacher/courses/:id/assignments/:assignmentId` |
| Course Live (Host) | `/teacher/courses/:id/live` |
| Quick Live | `/teacher/live` |

### Admin Routes

| Page | Route |
|------|-------|
| Admin Dashboard | `/admin` |
| Manage Users | `/admin/users` |
| Manage Courses | `/admin/courses` |

---

## Seeded Course Details

| Course Code | Title | Instructor | Category | Privacy |
|-------------|-------|------------|----------|---------|
| CS101 | Introduction to Computer Science | Dr. Sarah Johnson | Computer Science | Public |
| CS201 | Data Structures and Algorithms | Dr. Sarah Johnson | Computer Science | Institution |
| CS301 | Web Development Fundamentals | Prof. Michael Chen | Computer Science | Institution |
| CS350 | Database Management Systems | Prof. Michael Chen | Computer Science | Institution |
| CS401 | Machine Learning Basics | Dr. Emily Williams | Computer Science | Institution |
| BUS101 | Business Management Essentials | Dr. Emily Williams | Business | Public |

Each course has modules with lessons and 2-4 assignments. Students are enrolled with varying progress (0-100%).

---

## Test Checklist

- [ ] Backend starts on port 5000
- [ ] Frontend starts on port 5173
- [ ] Teacher login works
- [ ] Student login works
- [ ] Dashboard shows correct role-based content
- [ ] Course list shows seeded courses
- [ ] Course enrollment works
- [ ] Course player shows lessons
- [ ] Lesson completion updates progress
- [ ] Teacher can create assignments with attachments
- [ ] Student can view and submit assignments
- [ ] Live class can be started by teacher
- [ ] Student can join live class
- [ ] Admin can view all users and courses
- [ ] Google Sign-In works for new users
- [ ] Google Sign-In works for existing users
