import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface EnrollmentRequest {
  studentId: string
  courseId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/courses', '')

    switch (path) {
      case '':
        if (req.method === 'GET') {
          return await handleGetCourses(supabaseClient, user.id)
        }
        break
      case '/enroll':
        if (req.method === 'POST') {
          return await handleEnrollment(req, supabaseClient, user.id)
        }
        break
      default:
        // Handle course by ID
        const courseId = path.substring(1) // Remove leading slash
        if (courseId && req.method === 'GET') {
          return await handleGetCourse(supabaseClient, courseId, user.id)
        }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Courses function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGetCourses(supabase: any, userId: string) {
  try {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    // Get courses with lecturer info and enrollment counts
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        lecturer:profiles!courses_lecturer_id_fkey(id, name, email),
        enrollments(id, student_id),
        assignments(id, title, due_date, status)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching courses:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch courses' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For students, also get their enrollment status
    let userEnrollments = []
    if (profile?.role === 'student') {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', userId)
      
      userEnrollments = enrollments?.map(e => e.course_id) || []
    }

    // Format response
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      credits: course.credits,
      syllabus: course.syllabus,
      lecturer: course.lecturer,
      enrollments: course.enrollments || [],
      assignments: course.assignments || [],
      isEnrolled: userEnrollments.includes(course.id),
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }))

    return new Response(
      JSON.stringify({ data: formattedCourses }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleGetCourses:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch courses' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleGetCourse(supabase: any, courseId: string, userId: string) {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        lecturer:profiles!courses_lecturer_id_fkey(id, name, email),
        enrollments(id, student_id, enrolled_at),
        assignments(id, title, description, due_date, weight, max_points, status)
      `)
      .eq('id', courseId)
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is enrolled
    const isEnrolled = course.enrollments?.some(e => e.student_id === userId) || false

    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      credits: course.credits,
      syllabus: course.syllabus,
      lecturer: course.lecturer,
      enrollments: course.enrollments || [],
      assignments: course.assignments || [],
      isEnrolled,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }

    return new Response(
      JSON.stringify(formattedCourse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleGetCourse:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch course' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleEnrollment(req: Request, supabase: any, userId: string) {
  try {
    const { studentId, courseId }: EnrollmentRequest = await req.json()

    // Verify user is admin/lecturer or enrolling themselves
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role === 'student' && studentId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Students can only enroll themselves' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify student exists and has student role
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (student.role !== 'student') {
      return new Response(
        JSON.stringify({ error: 'User must have student role to enroll in courses' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single()

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ error: 'Student is already enrolled in this course' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
      })
      .select()
      .single()

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError)
      return new Response(
        JSON.stringify({ error: 'Failed to enroll student' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notification
    await supabase.rpc('send_notification', {
      p_user_id: studentId,
      p_title: 'Course Enrollment',
      p_message: `You have been enrolled in "${course.title}"`,
      p_type: 'success',
      p_data: { courseId, courseName: course.title, action: 'enrolled' }
    })

    return new Response(
      JSON.stringify({
        id: enrollment.id,
        studentId: enrollment.student_id,
        courseId: enrollment.course_id,
        enrolledAt: enrollment.enrolled_at,
        message: 'Successfully enrolled in course'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleEnrollment:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process enrollment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}