/*
  # Sample Data for ExcelMind AI

  This migration adds sample data for development and testing:
  - Sample users (admin, lecturers, students)
  - Sample courses
  - Sample enrollments
  - Sample assignments and submissions
*/

-- Insert sample users (these will be created when they sign up)
-- The trigger will handle profile creation

-- Insert sample courses
INSERT INTO courses (id, title, description, credits, syllabus, lecturer_id) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Introduction to Computer Science',
    'Fundamental concepts of computer science including programming, algorithms, and data structures.',
    3,
    'This course introduces students to the exciting world of computer science. Topics include programming fundamentals, problem-solving techniques, basic algorithms, and data structures. Students will learn to think computationally and develop skills in programming using Python.',
    NULL -- Will be set when lecturer signs up
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Advanced Mathematics',
    'Advanced mathematical concepts including calculus, linear algebra, and discrete mathematics.',
    4,
    'This course covers advanced mathematical topics essential for computer science and engineering. Students will study differential and integral calculus, linear algebra, discrete mathematics, and their applications in technology and science.',
    NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Database Systems',
    'Introduction to database design, SQL, and database management systems.',
    3,
    'Students will learn the fundamentals of database systems, including relational database design, SQL programming, normalization, and database administration. The course includes hands-on experience with popular database management systems.',
    NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Machine Learning Fundamentals',
    'Introduction to machine learning algorithms and applications.',
    4,
    'This course provides an introduction to machine learning concepts, algorithms, and applications. Topics include supervised and unsupervised learning, neural networks, deep learning basics, and practical implementation using Python and popular ML libraries.',
    NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005',
    'Web Development',
    'Modern web development using HTML, CSS, JavaScript, and frameworks.',
    3,
    'Students will learn to build modern, responsive web applications using HTML5, CSS3, JavaScript, and popular frameworks. The course covers both frontend and backend development, including database integration and deployment strategies.',
    NULL
  );

-- Insert sample assignments
INSERT INTO assignments (id, course_id, title, description, due_date, weight, max_points, status) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Programming Assignment 1: Basic Algorithms',
    'Implement sorting algorithms (bubble sort, merge sort) and analyze their time complexity.',
    NOW() + INTERVAL '2 weeks',
    20.00,
    100.00,
    'published'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Midterm Project: Data Structures',
    'Build a simple data structure library implementing stacks, queues, and linked lists.',
    NOW() + INTERVAL '6 weeks',
    30.00,
    100.00,
    'published'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'Final Project: Complete Application',
    'Develop a complete software application demonstrating all course concepts.',
    NOW() + INTERVAL '12 weeks',
    50.00,
    100.00,
    'published'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'Calculus Problem Set 1',
    'Solve advanced calculus problems involving derivatives and integrals.',
    NOW() + INTERVAL '3 weeks',
    25.00,
    100.00,
    'published'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440002',
    'Linear Algebra Quiz',
    'Online quiz covering matrix operations and vector spaces.',
    NOW() + INTERVAL '5 weeks',
    25.00,
    100.00,
    'published'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440002',
    'Final Examination',
    'Comprehensive final exam covering all course material.',
    NOW() + INTERVAL '14 weeks',
    50.00,
    100.00,
    'published'
  );

-- Function to create sample enrollments and submissions when users sign up
CREATE OR REPLACE FUNCTION create_sample_data_for_user()
RETURNS TRIGGER AS $$
DECLARE
  course_ids UUID[] := ARRAY[
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005'
  ];
  assignment_ids UUID[] := ARRAY[
    '660e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440004',
    '660e8400-e29b-41d4-a716-446655440005'
  ];
  random_course UUID;
  random_assignment UUID;
  i INTEGER;
BEGIN
  -- Only create sample data for students
  IF NEW.role = 'student' THEN
    -- Enroll student in 2-3 random courses
    FOR i IN 1..2 + (RANDOM() * 2)::INTEGER LOOP
      random_course := course_ids[1 + (RANDOM() * (array_length(course_ids, 1) - 1))::INTEGER];
      
      INSERT INTO enrollments (student_id, course_id)
      VALUES (NEW.id, random_course)
      ON CONFLICT (student_id, course_id) DO NOTHING;
    END LOOP;
    
    -- Create some sample submissions with grades
    FOR i IN 1..2 + (RANDOM() * 3)::INTEGER LOOP
      random_assignment := assignment_ids[1 + (RANDOM() * (array_length(assignment_ids, 1) - 1))::INTEGER];
      
      -- Only create submission if student is enrolled in the course
      IF EXISTS (
        SELECT 1 FROM enrollments e
        JOIN assignments a ON e.course_id = a.course_id
        WHERE e.student_id = NEW.id AND a.id = random_assignment
      ) THEN
        INSERT INTO assignment_submissions (
          assignment_id, 
          student_id, 
          submission_text, 
          grade, 
          status,
          submitted_at,
          graded_at
        )
        VALUES (
          random_assignment,
          NEW.id,
          'Sample submission text for assignment',
          70 + (RANDOM() * 30)::DECIMAL(5,2), -- Random grade between 70-100
          'graded',
          NOW() - INTERVAL '1 week',
          NOW() - INTERVAL '3 days'
        )
        ON CONFLICT (assignment_id, student_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  -- Set lecturer for courses if this is a lecturer
  IF NEW.role = 'lecturer' THEN
    -- Assign 1-2 courses to this lecturer
    UPDATE courses 
    SET lecturer_id = NEW.id 
    WHERE lecturer_id IS NULL 
    AND id = ANY(course_ids[1:2]);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create sample data for new users
CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_sample_data_for_user();