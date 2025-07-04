import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface RecommendationRequest {
  academicLevel?: 'beginner' | 'intermediate' | 'advanced'
  interests?: string[]
  preferredDifficulty?: 'easy' | 'medium' | 'hard'
  timeCommitment?: number
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
  previousCourses?: string[]
  careerGoals?: string[]
}

interface SyllabusRequest {
  courseTitle: string
  topics: string[]
  duration: number
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  learningObjectives: string[]
  prerequisites: string[]
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
    const path = url.pathname.replace('/ai-assistant', '')

    switch (path) {
      case '/recommend':
        return await handleRecommendations(req, supabaseClient, user.id)
      case '/syllabus':
        return await handleSyllabus(req, supabaseClient, user.id)
      default:
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('AI Assistant error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleRecommendations(req: Request, supabase: any, userId: string) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const requestData: RecommendationRequest = await req.json()
  const startTime = Date.now()

  try {
    let recommendations
    const useMockAI = Deno.env.get('USE_MOCK_AI') === 'true'
    const geminiApiKey = Deno.env.get('GOOGLE_AI_API_KEY')

    if (!useMockAI && geminiApiKey) {
      recommendations = await generateRealRecommendations(requestData, geminiApiKey)
    } else {
      recommendations = await generateMockRecommendations(requestData)
    }

    const processingTime = Date.now() - startTime

    // Store AI interaction
    await supabase.from('ai_interactions').insert({
      user_id: userId,
      interaction_type: 'recommendation',
      request_data: requestData,
      response_data: recommendations,
      processing_time: processingTime,
    })

    const response = {
      success: true,
      recommendations: recommendations.recommendations,
      metadata: {
        totalRecommendations: recommendations.recommendations.length,
        confidenceScore: recommendations.confidenceScore || 0.9,
        processingTime,
        algorithmVersion: useMockAI ? 'mock-2.1.0' : 'gemini-1.5-flash',
        lastUpdated: new Date().toISOString(),
      },
      userProfile: {
        academicLevel: requestData.academicLevel,
        interests: requestData.interests,
        preferredDifficulty: requestData.preferredDifficulty,
        timeCommitment: requestData.timeCommitment,
        learningStyle: requestData.learningStyle,
      }
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Recommendation generation error:', error)
    
    // Fallback to mock data
    const mockRecommendations = await generateMockRecommendations(requestData)
    const processingTime = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: mockRecommendations.recommendations,
        metadata: {
          totalRecommendations: mockRecommendations.recommendations.length,
          confidenceScore: 0.8,
          processingTime,
          algorithmVersion: 'mock-fallback',
          lastUpdated: new Date().toISOString(),
        },
        userProfile: {
          academicLevel: requestData.academicLevel,
          interests: requestData.interests,
          preferredDifficulty: requestData.preferredDifficulty,
          timeCommitment: requestData.timeCommitment,
          learningStyle: requestData.learningStyle,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleSyllabus(req: Request, supabase: any, userId: string) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const requestData: SyllabusRequest = await req.json()
  const startTime = Date.now()

  try {
    let syllabus
    const useMockAI = Deno.env.get('USE_MOCK_AI') === 'true'
    const geminiApiKey = Deno.env.get('GOOGLE_AI_API_KEY')

    if (!useMockAI && geminiApiKey) {
      syllabus = await generateRealSyllabus(requestData, geminiApiKey)
    } else {
      syllabus = await generateMockSyllabus(requestData)
    }

    const processingTime = Date.now() - startTime

    // Store AI interaction
    await supabase.from('ai_interactions').insert({
      user_id: userId,
      interaction_type: 'syllabus',
      request_data: requestData,
      response_data: syllabus,
      processing_time: processingTime,
    })

    const response = {
      success: true,
      syllabus,
      metadata: {
        generatedAt: new Date().toISOString(),
        estimatedDuration: `${requestData.duration} weeks`,
        difficultyLevel: requestData.difficultyLevel,
        totalHours: calculateTotalHours(syllabus.weeks),
        aiConfidence: 0.92,
      }
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Syllabus generation error:', error)
    
    // Fallback to mock data
    const mockSyllabus = await generateMockSyllabus(requestData)
    const processingTime = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        syllabus: mockSyllabus,
        metadata: {
          generatedAt: new Date().toISOString(),
          estimatedDuration: `${requestData.duration} weeks`,
          difficultyLevel: requestData.difficultyLevel,
          totalHours: calculateTotalHours(mockSyllabus.weeks),
          aiConfidence: 0.8,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function generateRealRecommendations(request: RecommendationRequest, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `
You are an expert educational advisor. Generate 6 personalized course recommendations based on these student preferences:

Student Profile:
- Academic Level: ${request.academicLevel || 'beginner'}
- Interests: ${request.interests?.join(', ') || 'general'}
- Preferred Difficulty: ${request.preferredDifficulty || 'easy'}
- Time Commitment: ${request.timeCommitment || 10} hours per week
- Learning Style: ${request.learningStyle || 'mixed'}
- Previous Courses: ${request.previousCourses?.join(', ') || 'none'}
- Career Goals: ${request.careerGoals?.join(', ') || 'not specified'}

Please provide exactly 6 course recommendations in JSON format with this structure:
{
  "recommendations": [
    {
      "id": "unique-course-id",
      "title": "Course Title",
      "description": "Detailed course description (2-3 sentences)",
      "category": "Subject Category",
      "level": "beginner/intermediate/advanced",
      "difficulty": "easy/medium/hard",
      "duration": 12,
      "rating": 4.8,
      "enrolledStudents": 15420,
      "instructor": "Instructor Name",
      "tags": ["tag1", "tag2", "tag3"],
      "prerequisites": ["prerequisite1", "prerequisite2"],
      "learningOutcomes": ["outcome1", "outcome2", "outcome3"],
      "estimatedHours": 8,
      "price": 99,
      "nextStartDate": "2024-02-15",
      "matchScore": 0.95
    }
  ]
}

Make sure each recommendation is relevant to the student's profile and includes realistic data.
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      recommendations: parsed.recommendations || [],
      confidenceScore: 0.95
    }
  }

  throw new Error('Failed to parse AI response')
}

async function generateRealSyllabus(request: SyllabusRequest, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `
You are an expert curriculum designer. Create a comprehensive ${request.duration}-week syllabus for the course "${request.courseTitle}".

Course Requirements:
- Course Title: ${request.courseTitle}
- Duration: ${request.duration} weeks
- Difficulty Level: ${request.difficultyLevel}
- Topics to Cover: ${request.topics.join(', ')}
- Learning Objectives: ${request.learningObjectives.join(', ')}
- Prerequisites: ${request.prerequisites.join(', ')}

Please generate a detailed syllabus in JSON format with this structure:
{
  "courseTitle": "${request.courseTitle}",
  "description": "Comprehensive course description",
  "duration": "${request.duration} weeks",
  "difficultyLevel": "${request.difficultyLevel}",
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "learningObjectives": [
    {
      "id": "obj-1",
      "description": "Learning objective description",
      "bloomLevel": "Understanding/Applying/Analyzing",
      "assessmentMethod": "Assignment/Exam"
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week 1: Topic Title",
      "topics": ["topic1", "topic2"],
      "learningGoals": ["goal1", "goal2"],
      "activities": ["activity1", "activity2"],
      "assignments": ["assignment1"],
      "readings": ["reading1", "reading2"],
      "estimatedHours": 8
    }
  ],
  "assessments": [
    {
      "type": "Assignment",
      "count": 4,
      "weight": 40,
      "description": "Regular assignments description"
    }
  ],
  "resources": {
    "textbooks": [
      {
        "title": "Textbook Title",
        "author": "Author Name",
        "isbn": "978-0123456789",
        "required": true
      }
    ],
    "onlineResources": ["resource1", "resource2"],
    "software": ["software1", "software2"]
  },
  "gradingScheme": {
    "assignments": 40,
    "midtermExam": 25,
    "finalProject": 25,
    "participation": 10
  }
}

Create a realistic, well-structured syllabus appropriate for the ${request.difficultyLevel} level.
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse AI response')
}

async function generateMockRecommendations(request: RecommendationRequest) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

  const mockCourses = [
    {
      id: 'cs101',
      title: 'Introduction to Programming',
      description: 'Learn the fundamentals of programming using Python. Perfect for beginners with no prior experience.',
      category: 'Computer Science',
      level: 'beginner',
      difficulty: 'easy',
      duration: 12,
      rating: 4.8,
      enrolledStudents: 15420,
      instructor: 'Dr. Sarah Chen',
      tags: ['programming', 'python', 'algorithms', 'problem-solving'],
      prerequisites: [],
      learningOutcomes: [
        'Write basic Python programs',
        'Understand programming logic and flow control',
        'Implement simple algorithms and data structures'
      ],
      estimatedHours: 8,
      price: 99,
      nextStartDate: '2024-02-15',
      matchScore: 0.95
    },
    {
      id: 'math201',
      title: 'Calculus I',
      description: 'Comprehensive introduction to differential calculus with applications in science and engineering.',
      category: 'Mathematics',
      level: 'intermediate',
      difficulty: 'medium',
      duration: 16,
      rating: 4.6,
      enrolledStudents: 8930,
      instructor: 'Prof. Michael Rodriguez',
      tags: ['calculus', 'derivatives', 'limits', 'mathematics'],
      prerequisites: ['Pre-calculus', 'Algebra II'],
      learningOutcomes: [
        'Master the concept of limits',
        'Calculate derivatives using various techniques',
        'Apply calculus to real-world problems'
      ],
      estimatedHours: 12,
      price: 149,
      nextStartDate: '2024-02-20',
      matchScore: 0.88
    },
    {
      id: 'ai201',
      title: 'Machine Learning Basics',
      description: 'Introduction to machine learning concepts and practical applications.',
      category: 'Artificial Intelligence',
      level: 'intermediate',
      difficulty: 'medium',
      duration: 18,
      rating: 4.8,
      enrolledStudents: 6750,
      instructor: 'Dr. James Liu',
      tags: ['machine-learning', 'ai', 'python', 'data-science'],
      prerequisites: ['Statistics', 'Python Programming'],
      learningOutcomes: [
        'Understand ML algorithms and concepts',
        'Build predictive models',
        'Evaluate model performance'
      ],
      estimatedHours: 14,
      price: 249,
      nextStartDate: '2024-03-15',
      matchScore: 0.92
    },
    {
      id: 'web101',
      title: 'Web Development Fundamentals',
      description: 'Learn to build modern websites using HTML, CSS, and JavaScript.',
      category: 'Web Development',
      level: 'beginner',
      difficulty: 'easy',
      duration: 10,
      rating: 4.7,
      enrolledStudents: 12680,
      instructor: 'Alex Thompson',
      tags: ['web-development', 'html', 'css', 'javascript'],
      prerequisites: [],
      learningOutcomes: [
        'Create responsive web layouts',
        'Add interactivity with JavaScript',
        'Deploy websites to the internet'
      ],
      estimatedHours: 6,
      price: 79,
      nextStartDate: '2024-02-10',
      matchScore: 0.85
    },
    {
      id: 'cs301',
      title: 'Advanced Data Structures',
      description: 'Deep dive into complex data structures and algorithms for efficient problem solving.',
      category: 'Computer Science',
      level: 'advanced',
      difficulty: 'hard',
      duration: 14,
      rating: 4.9,
      enrolledStudents: 3240,
      instructor: 'Dr. Emily Watson',
      tags: ['data-structures', 'algorithms', 'optimization', 'advanced'],
      prerequisites: ['Data Structures Basics', 'Programming Fundamentals'],
      learningOutcomes: [
        'Implement advanced tree and graph structures',
        'Analyze algorithm complexity',
        'Optimize code for performance'
      ],
      estimatedHours: 15,
      price: 199,
      nextStartDate: '2024-03-01',
      matchScore: 0.78
    },
    {
      id: 'design101',
      title: 'UI/UX Design Principles',
      description: 'Learn the fundamentals of user interface and user experience design.',
      category: 'Design',
      level: 'beginner',
      difficulty: 'easy',
      duration: 8,
      rating: 4.5,
      enrolledStudents: 9420,
      instructor: 'Maria Garcia',
      tags: ['design', 'ui', 'ux', 'user-experience'],
      prerequisites: [],
      learningOutcomes: [
        'Apply design principles effectively',
        'Create user-centered designs',
        'Use design tools and software'
      ],
      estimatedHours: 5,
      price: 129,
      nextStartDate: '2024-02-25',
      matchScore: 0.82
    }
  ]

  // Filter and sort based on preferences
  let filteredCourses = mockCourses.filter(course => {
    if (request.academicLevel && course.level !== request.academicLevel) {
      return false
    }
    if (request.preferredDifficulty && course.difficulty !== request.preferredDifficulty) {
      return false
    }
    if (request.interests && request.interests.length > 0) {
      const hasMatchingInterest = request.interests.some(interest => 
        course.tags.includes(interest.toLowerCase()) || 
        course.category.toLowerCase().includes(interest.toLowerCase())
      )
      if (!hasMatchingInterest) return false
    }
    return true
  })

  if (filteredCourses.length === 0) {
    filteredCourses = mockCourses.slice(0, 6)
  }

  return {
    recommendations: filteredCourses.slice(0, 6),
    confidenceScore: 0.9
  }
}

async function generateMockSyllabus(request: SyllabusRequest) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500))

  const weeks = []
  const topicsPerWeek = Math.ceil(request.topics.length / request.duration)
  
  for (let i = 0; i < request.duration; i++) {
    const weekTopics = request.topics.slice(i * topicsPerWeek, (i + 1) * topicsPerWeek)
    
    weeks.push({
      weekNumber: i + 1,
      title: `Week ${i + 1}: ${weekTopics[0] || 'Advanced Topics'}`,
      topics: weekTopics.length > 0 ? weekTopics : ['Review and Practice'],
      learningGoals: weekTopics.map(topic => `Understand and apply ${topic} concepts`),
      activities: [
        'Interactive lectures and discussions',
        'Hands-on laboratory exercises',
        'Group problem-solving sessions'
      ],
      assignments: i % 3 === 2 ? [`Assignment ${Math.floor(i / 3) + 1}`] : [],
      readings: weekTopics.map(topic => `Chapter on ${topic} from course textbook`),
      estimatedHours: request.difficultyLevel === 'beginner' ? 6 : 
                     request.difficultyLevel === 'intermediate' ? 8 : 12
    })
  }

  const learningObjectives = request.topics.map((topic, index) => ({
    id: `obj-${index + 1}`,
    description: `Master the concepts and applications of ${topic}`,
    bloomLevel: request.difficultyLevel === 'beginner' ? 'Understanding' :
                request.difficultyLevel === 'intermediate' ? 'Applying' : 'Analyzing',
    assessmentMethod: index % 2 === 0 ? 'Assignment' : 'Exam'
  }))

  return {
    courseTitle: request.courseTitle,
    description: `This ${request.difficultyLevel}-level course covers the fundamental concepts of ${request.courseTitle}. Students will learn through hands-on exercises and practical applications.`,
    duration: `${request.duration} weeks`,
    difficultyLevel: request.difficultyLevel,
    prerequisites: request.prerequisites,
    learningObjectives,
    weeks,
    assessments: [
      {
        type: 'Assignment',
        count: Math.ceil(request.duration / 3),
        weight: 40,
        description: 'Regular assignments to reinforce learning'
      },
      {
        type: 'Midterm Exam',
        count: 1,
        weight: 25,
        description: 'Comprehensive examination of first half material'
      },
      {
        type: 'Final Project',
        count: 1,
        weight: 25,
        description: 'Capstone project demonstrating mastery of course concepts'
      },
      {
        type: 'Participation',
        count: 'Ongoing',
        weight: 10,
        description: 'Active participation in class discussions and activities'
      }
    ],
    resources: {
      textbooks: [
        {
          title: `Fundamentals of ${request.courseTitle}`,
          author: 'Academic Press',
          isbn: '978-0123456789',
          required: true
        }
      ],
      onlineResources: [
        'Course learning management system',
        'Supplementary video lectures',
        'Practice problem databases'
      ],
      software: request.courseTitle.toLowerCase().includes('programming') ? 
        ['Development environment', 'Version control system'] : 
        ['Specialized software as needed']
    },
    gradingScheme: {
      assignments: 40,
      midtermExam: 25,
      finalProject: 25,
      participation: 10
    }
  }
}

function calculateTotalHours(weeks: any[]): number {
  return weeks.reduce((total, week) => total + week.estimatedHours, 0)
}