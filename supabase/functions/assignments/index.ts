import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface GradeAssignmentRequest {
  submissionId: string
  grade: number
  feedback?: string
}

interface SubmitAssignmentRequest {
  assignmentId: string
  submissionText?: string
  fileUrl?: string
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
    const path = url.pathname.replace('/assignments', '')

    switch (path) {
      case '/grade':
        if (req.method === 'PUT') {
          return await handleGradeAssignment(req, supabaseClient, user.id)
        }
        break
      case '/submit':
        if (req.method === 'POST') {
          return await handleSubmitAssignment(req, supabaseClient, user.id)
        }
        break
      case '/submissions':
        if (req.method === 'GET') {
          return await handleGetSubmissions(req, supabaseClient, user.id)
        }
        break
      default:
        // Handle assignment by ID
        const assignmentId = path.substring(1)
        if (assignmentId && req.method === 'GET') {
          return await handleGetAssignment(supabaseClient, assignmentId, user.id)
        }
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Assignments function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleGradeAssignment(req: Request, supabase: any, userId: string) {
  try {
    const { submissionId, grade, feedback }: GradeAssignmentRequest = await req.json()

    // Verify user is lecturer or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile || !['lecturer', 'admin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Only lecturers and admins can grade assignments' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get submission with assignment and course info
    const { data: submission, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments(
          id, title, course_id, max_points,
          course:courses(id, title, lecturer_id)
        ),
        student:profiles!assignment_submissions_student_id_fkey(id, name, email)
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Assignment submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if lecturer is the course lecturer (admins can grade any assignment)
    if (profile.role === 'lecturer' && submission.assignment.course.lecturer_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Lecturers can only grade assignments for their own courses' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate grade
    if (grade < 0 || grade > submission.assignment.max_points) {
      return new Response(
        JSON.stringify({ error: `Grade must be between 0 and ${submission.assignment.max_points}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update submission with grade
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        grade,
        feedback,
        status: 'graded',
        graded_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select(`
        *,
        assignment:assignments(id, title, course_id),
        student:profiles!assignment_submissions_student_id_fkey(id, name, email)
      `)
      .single()

    if (updateError) {
      console.error('Grade update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update grade' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notification to student
    await supabase.rpc('send_notification', {
      p_user_id: submission.student_id,
      p_title: 'Assignment Graded',
      p_message: `Your assignment "${submission.assignment.title}" has been graded: ${grade}/${submission.assignment.max_points}`,
      p_type: 'success',
      p_data: {
        assignmentId: submission.assignment.id,
        assignmentTitle: submission.assignment.title,
        grade,
        maxPoints: submission.assignment.max_points
      }
    })

    return new Response(
      JSON.stringify({
        id: updatedSubmission.id,
        grade: updatedSubmission.grade,
        feedback: updatedSubmission.feedback,
        gradedAt: updatedSubmission.graded_at,
        message: 'Assignment graded successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleGradeAssignment:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to grade assignment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleSubmitAssignment(req: Request, supabase: any, userId: string) {
  try {
    const { assignmentId, submissionText, fileUrl }: SubmitAssignmentRequest = await req.json()

    // Verify user is a student
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile || profile.role !== 'student') {
      return new Response(
        JSON.stringify({ error: 'Only students can submit assignments' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify assignment exists and student is enrolled
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(id, title)
      `)
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: 'Assignment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if student is enrolled in the course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('course_id', assignment.course_id)
      .single()

    if (!enrollment) {
      return new Response(
        JSON.stringify({ error: 'You must be enrolled in the course to submit assignments' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if assignment is still open
    if (assignment.status !== 'published') {
      return new Response(
        JSON.stringify({ error: 'Assignment is not available for submission' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already submitted
    const { data: existingSubmission } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', userId)
      .single()

    if (existingSubmission) {
      // Update existing submission
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('assignment_submissions')
        .update({
          submission_text: submissionText,
          file_url: fileUrl,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        })
        .eq('id', existingSubmission.id)
        .select()
        .single()

      if (updateError) {
        console.error('Submission update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update submission' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          id: updatedSubmission.id,
          message: 'Assignment submission updated successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Create new submission
      const { data: newSubmission, error: insertError } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: userId,
          submission_text: submissionText,
          file_url: fileUrl,
          status: 'submitted'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Submission insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to submit assignment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          id: newSubmission.id,
          message: 'Assignment submitted successfully'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in handleSubmitAssignment:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to submit assignment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleGetSubmissions(req: Request, supabase: any, userId: string) {
  try {
    const url = new URL(req.url)
    const courseId = url.searchParams.get('courseId')
    const assignmentId = url.searchParams.get('assignmentId')

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    let query = supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments(id, title, course_id, max_points, due_date),
        student:profiles!assignment_submissions_student_id_fkey(id, name, email)
      `)

    // Filter based on user role
    if (profile?.role === 'student') {
      query = query.eq('student_id', userId)
    } else if (profile?.role === 'lecturer') {
      // Lecturers can only see submissions for their courses
      query = query.select(`
        *,
        assignment:assignments!inner(
          id, title, course_id, max_points, due_date,
          course:courses!inner(id, lecturer_id)
        ),
        student:profiles!assignment_submissions_student_id_fkey(id, name, email)
      `).eq('assignment.course.lecturer_id', userId)
    }
    // Admins can see all submissions (no additional filter)

    if (courseId) {
      query = query.eq('assignment.course_id', courseId)
    }

    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }

    const { data: submissions, error } = await query.order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch submissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data: submissions || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleGetSubmissions:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch submissions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleGetAssignment(supabase: any, assignmentId: string, userId: string) {
  try {
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(id, title, lecturer_id),
        submissions:assignment_submissions(
          id, student_id, grade, submitted_at, status,
          student:profiles!assignment_submissions_student_id_fkey(id, name, email)
        )
      `)
      .eq('id', assignmentId)
      .single()

    if (error || !assignment) {
      return new Response(
        JSON.stringify({ error: 'Assignment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has access to this assignment
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role === 'student') {
      // Check if student is enrolled in the course
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', userId)
        .eq('course_id', assignment.course_id)
        .single()

      if (!enrollment) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // For students, only show their own submission
      assignment.submissions = assignment.submissions.filter(s => s.student_id === userId)
    } else if (profile?.role === 'lecturer') {
      // Check if lecturer teaches this course
      if (assignment.course.lecturer_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    // Admins can see everything

    return new Response(
      JSON.stringify(assignment),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handleGetAssignment:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch assignment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}