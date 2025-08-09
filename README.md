# ExcelMind AI

A cutting-edge Learning Management System powered by AI and built with PostgreSQL, providing personalized educational experiences through intelligent course recommendations and automated syllabus generation.

## 🚀 Project Overview

ExcelMind AI leverages Supabase for backend services, providing scalable, real-time educational platform capabilities. The system provides personalized learning paths, real-time collaboration, and intelligent content generation.

### Key Features

- **🤖 AI-Powered Recommendations**: Intelligent course suggestions using Google Gemini AI
- **📚 Automated Syllabus Generation**: AI-driven curriculum creation with detailed weekly breakdowns
- **⚡ Real-time Notifications**: Supabase real-time subscriptions for instant updates
- **🔐 Supabase Authentication**: Secure auth with Row Level Security (RLS)
- **📱 Responsive Design**: Mobile-first approach with seamless cross-device experience
- **🎯 Interactive Dashboards**: Role-specific interfaces with relevant metrics
- **📊 Assignment Management**: Complete workflow from creation to grading
- **💬 AI Assistant Chat**: Interactive AI helper for course guidance

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling)
- React Query (State Management)
- Supabase Client (Real-time & Auth)

**Backend:**
- Supabase (Database, Auth, Real-time, Edge Functions)
- PostgreSQL (Database)
- Edge Functions (Serverless API)
- Google Gemini AI (AI Services)
- Row Level Security (Data Security)

---

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js**: Version 18.0 or higher
- **Supabase Account**: Create at [supabase.com](https://supabase.com)
- **npm**: Version 8.0 or higher
- **Git**: Latest version

### A. Supabase Project Setup

#### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project name: `excelmind-ai`
5. Enter database password (save this!)
6. Select region closest to your users
7. Click "Create new project"

#### 2. Get Supabase Credentials
1. Go to Project Settings → API
2. Copy the following:
   - Project URL
   - Project API keys (anon/public key and service_role/secret key)

#### 3. Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Update .env with your Supabase credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GOOGLE_AI_API_KEY=your-gemini-api-key-here
```

### B. Database Setup

#### 1. Run Database Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Copy and run the migration files from `supabase/migrations/` in order:
   - `20250702122413_fragrant_rain.sql` (main schema)
   - `20250702122452_crystal_dawn.sql` (sample data)

#### 2. Deploy Edge Functions
1. Go to Supabase Dashboard → Edge Functions
2. Create new functions for each file in `supabase/functions/`:
   - `auth` - Authentication endpoints
   - `courses` - Course management
   - `assignments` - Assignment handling
   - `ai-assistant` - AI recommendations and syllabus
   - `notifications` - Notification system

3. Copy the code from each function file into the Supabase editor

#### 3. Set Environment Variables for Functions
1. Go to Project Settings → Edge Functions
2. Add environment variables:
   - `GOOGLE_AI_API_KEY`: Your Google Gemini API key
   - `USE_MOCK_AI`: `false` (or `true` for development)

### C. Frontend Setup

#### 1. Install Dependencies
```bash
# Install all dependencies
npm run install:all
```

#### 2. Configure Frontend Environment
```bash
# Update frontend/.env (if needed)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=ExcelMind AI
```

### D. Start Development

#### 1. Start Frontend
```bash
# Start frontend development server
npm run dev
```

#### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Supabase Dashboard**: https://supabase.com/dashboard/project/your-project-ref

---

## 🔐 Authentication Credentials

### Development Test Accounts

Create these accounts through the application's registration form:

**Admin User:**
- **Email**: `admin@excelmind.com`
- **Password**: `admin123`
- **Role**: Select "admin" during registration

**Lecturer:**
- **Email**: `lecturer@excelmind.com`
- **Password**: `lecturer123`
- **Role**: Select "lecturer" during registration

**Student:**
- **Email**: `student@excelmind.com`
- **Password**: `student123`
- **Role**: Select "student" during registration (default)

---

## 🗄️ Database Schema

### Core Tables

**profiles** - User profiles extending auth.users
```sql
- id (UUID, PK, references auth.users)
- email (TEXT, UNIQUE)
- name (TEXT)
- role (ENUM: student, lecturer, admin)
- avatar_url (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

**courses** - Course information
```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT)
- credits (INTEGER)
- syllabus (TEXT)
- lecturer_id (UUID, FK to profiles)
- created_at, updated_at (TIMESTAMPTZ)
```

**enrollments** - Student course enrollments
```sql
- id (UUID, PK)
- student_id (UUID, FK to profiles)
- course_id (UUID, FK to courses)
- enrolled_at (TIMESTAMPTZ)
- status (TEXT)
```

**assignments** - Course assignments
```sql
- id (UUID, PK)
- course_id (UUID, FK to courses)
- title (TEXT)
- description (TEXT)
- due_date (TIMESTAMPTZ)
- weight (DECIMAL)
- max_points (DECIMAL)
- status (ENUM: draft, published, closed)
```

**assignment_submissions** - Student submissions
```sql
- id (UUID, PK)
- assignment_id (UUID, FK to assignments)
- student_id (UUID, FK to profiles)
- submission_text (TEXT)
- file_url (TEXT)
- grade (DECIMAL)
- feedback (TEXT)
- status (ENUM: submitted, graded, returned)
```

---

## 🚀 Edge Functions

### Available Functions

#### 1. Authentication (`/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - User logout

#### 2. AI Assistant (`/ai-assistant`)
- `POST /ai-assistant/recommend` - Get course recommendations
- `POST /ai-assistant/syllabus` - Generate course syllabus

#### 3. Courses (`/courses`)
- `GET /courses` - List all courses
- `GET /courses/:id` - Get specific course
- `POST /courses/enroll` - Enroll in course

#### 4. Assignments (`/assignments`)
- `GET /assignments/:id` - Get assignment details
- `POST /assignments/submit` - Submit assignment
- `PUT /assignments/grade` - Grade assignment (lecturer/admin)
- `GET /assignments/submissions` - Get submissions

#### 5. Notifications (`/notifications`)
- `GET /notifications` - Get user notifications
- `PUT /notifications/mark-read` - Mark notification as read
- `PUT /notifications/mark-all-read` - Mark all as read
- `GET /notifications/stats` - Get notification statistics

---

## 🤖 AI Integration

### Google Gemini AI Setup

#### 1. Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Sign in with Google account
3. Create API key
4. Copy the key (starts with `AIza...`)

#### 2. Configure Environment
```bash
# Set in your .env file
GOOGLE_AI_API_KEY=AIzaSyYourActualAPIKeyHere
USE_MOCK_AI=false

# Set in Supabase Edge Functions environment
# Go to Project Settings → Edge Functions → Environment Variables
GOOGLE_AI_API_KEY=AIzaSyYourActualAPIKeyHere
USE_MOCK_AI=false
```

#### 3. AI Features
- **Smart Fallback**: Automatically uses mock data if AI fails
- **Real-time Processing**: Gemini 1.5 Flash for fast responses
- **Contextual Recommendations**: Based on user preferences and history
- **Intelligent Syllabus**: Comprehensive curriculum generation

---

## 📊 Real-time Features

### Supabase Real-time

#### 1. Real-time Subscriptions
```typescript
// Subscribe to notifications
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New notification:', payload.new)
  })
  .subscribe()
```

#### 2. Live Updates
- **Grade Updates**: Instant notification when assignments are graded
- **Enrollment Changes**: Real-time enrollment confirmations
- **Course Updates**: Live course information changes
- **Assignment Submissions**: Immediate submission confirmations

---

## 🔒 Security Features

### Row Level Security (RLS)

#### 1. User Data Protection
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

#### 2. Course Access Control
```sql
-- Students can only view courses they're enrolled in
CREATE POLICY "Students can view enrolled courses" ON enrollments
  FOR SELECT USING (student_id = auth.uid());
```

#### 3. Assignment Security
```sql
-- Students can only submit to courses they're enrolled in
CREATE POLICY "Students can submit assignments" ON assignment_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN assignments a ON e.course_id = a.course_id
      WHERE e.student_id = auth.uid() AND a.id = assignment_id
    )
  );
```

---

## 🚀 Deployment

### Production Deployment

#### 1. Supabase Production Setup
1. Ensure your Supabase project is in production mode
2. Update environment variables with production values
3. Deploy edge functions through Supabase Dashboard
4. Run database migrations in production

#### 2. Frontend Deployment
```bash
# Build frontend
npm run build:frontend

# Deploy to your preferred platform (Vercel, Netlify, etc.)
```

#### 3. Environment Variables
Set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME`

---

## 🧪 Testing

### Development Testing

#### 1. Test User Registration
Use the application's registration form to create test accounts.

#### 2. Test AI Recommendations
1. Login as a student
2. Navigate to AI Assistant
3. Fill out recommendation form
4. Verify AI responses

#### 3. Test Course Enrollment
1. Login as a student
2. Go to Courses page
3. Enroll in available courses
4. Verify enrollment status

---

## 📈 Performance Features

- **Edge Functions**: Serverless scaling with global distribution
- **Real-time Subscriptions**: Efficient WebSocket connections
- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Built-in Supabase caching for API responses
- **CDN**: Global content delivery for static assets

---

## 🛠️ Development Scripts

```bash
# Development
npm run dev                 # Start frontend only
npm run dev:frontend        # Start only frontend
npm run build              # Build for production

# Setup
npm run install:all        # Install all dependencies
npm run setup              # Copy .env and install deps

# Note: Supabase CLI commands are not available in WebContainer
# Use Supabase Dashboard for database and function management
```

---

## 📞 Support

For technical support or questions:
- **Documentation**: [Supabase Docs](https://supabase.com/docs)
- **Edge Functions**: [Supabase Functions](https://supabase.com/docs/guides/functions)
- **Real-time**: [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**ExcelMind AI** - Transforming Education Through Intelligent Technology with Supabase 🚀