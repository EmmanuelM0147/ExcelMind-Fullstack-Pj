/*
  # Initial Database Schema for ExcelMind AI

  1. New Tables
    - `profiles` - User profiles extending auth.users
    - `courses` - Course information
    - `enrollments` - Student course enrollments
    - `assignments` - Course assignments
    - `assignment_submissions` - Student assignment submissions
    - `ai_interactions` - Track AI recommendation/syllabus requests

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Create custom roles and permissions

  3. Functions
    - User role management
    - Grade calculation functions
    - Enrollment management
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'lecturer', 'admin');
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'returned');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  credits INTEGER DEFAULT 3,
  syllabus TEXT,
  lecturer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  UNIQUE(student_id, course_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  weight DECIMAL(5,2) DEFAULT 0.00,
  max_points DECIMAL(8,2) DEFAULT 100.00,
  status assignment_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_url TEXT,
  grade DECIMAL(5,2),
  feedback TEXT,
  status submission_status DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- AI interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'recommendation', 'syllabus'
  request_data JSONB,
  response_data JSONB,
  processing_time INTEGER, -- milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Courses policies
CREATE POLICY "Anyone can view courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Lecturers can create courses" ON courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('lecturer', 'admin')
    )
  );

CREATE POLICY "Lecturers can update own courses" ON courses
  FOR UPDATE USING (
    lecturer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enrollments policies
CREATE POLICY "Students can view own enrollments" ON enrollments
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = course_id AND c.lecturer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can enroll in courses" ON enrollments
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Assignments policies
CREATE POLICY "Students can view course assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e 
      WHERE e.course_id = course_id AND e.student_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = course_id AND c.lecturer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Lecturers can manage course assignments" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = course_id AND c.lecturer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assignment submissions policies
CREATE POLICY "Students can view own submissions" ON assignment_submissions
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = assignment_id AND c.lecturer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can submit assignments" ON assignment_submissions
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN enrollments e ON a.course_id = e.course_id
      WHERE a.id = assignment_id AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own submissions" ON assignment_submissions
  FOR UPDATE USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = assignment_id AND c.lecturer_id = auth.uid()
    )
  );

-- AI interactions policies
CREATE POLICY "Users can view own AI interactions" ON ai_interactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create AI interactions" ON ai_interactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate student grade
CREATE OR REPLACE FUNCTION calculate_student_grade(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS TABLE (
  assignment_id UUID,
  assignment_title TEXT,
  weight DECIMAL,
  grade DECIMAL,
  max_points DECIMAL,
  final_grade DECIMAL
) AS $$
DECLARE
  total_weight DECIMAL := 0;
  weighted_score DECIMAL := 0;
  graded_weight DECIMAL := 0;
BEGIN
  RETURN QUERY
  WITH assignment_grades AS (
    SELECT 
      a.id as assignment_id,
      a.title as assignment_title,
      a.weight,
      COALESCE(s.grade, 0) as grade,
      a.max_points,
      CASE 
        WHEN s.grade IS NOT NULL THEN (s.grade / a.max_points) * a.weight
        ELSE 0
      END as weighted_points
    FROM assignments a
    LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = p_student_id
    WHERE a.course_id = p_course_id
  )
  SELECT 
    ag.assignment_id,
    ag.assignment_title,
    ag.weight,
    ag.grade,
    ag.max_points,
    CASE 
      WHEN SUM(ag.weight) OVER() > 0 THEN 
        (SUM(ag.weighted_points) OVER() / SUM(ag.weight) OVER()) * 100
      ELSE 0
    END as final_grade
  FROM assignment_grades ag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (p_user_id, p_title, p_message, p_type, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);