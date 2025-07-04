import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecommendationRequestDto } from './dto/recommendation-request.dto';
import { SyllabusRequestDto } from './dto/syllabus-request.dto';
import { 
  RecommendationResponse, 
  SyllabusResponse, 
  CourseRecommendation,
  SyllabusWeek,
  LearningObjective 
} from './interfaces/ai-response.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private useMockAI: boolean;

  constructor() {
    this.useMockAI = process.env.USE_MOCK_AI === 'true';
    
    if (!this.useMockAI && process.env.GOOGLE_AI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      this.logger.log('Google Gemini AI initialized successfully');
    } else {
      this.logger.warn('Using mock AI responses. Set GOOGLE_AI_API_KEY and USE_MOCK_AI=false for real AI');
    }
  }

  /**
   * Generates course recommendations using Google Gemini AI or mock data
   */
  async generateRecommendations(request: RecommendationRequestDto): Promise<RecommendationResponse> {
    if (this.useMockAI || !this.genAI) {
      return this.generateMockRecommendations(request);
    }

    try {
      const prompt = this.buildRecommendationPrompt(request);
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      this.logger.log('Gemini AI recommendation generated successfully');
      return this.parseGeminiRecommendationResponse(text, request);
    } catch (error) {
      this.logger.error('Gemini AI Error:', error);
      // Fallback to mock data if AI fails
      return this.generateMockRecommendations(request);
    }
  }

  /**
   * Generates a comprehensive syllabus using Google Gemini AI or mock data
   */
  async generateSyllabus(request: SyllabusRequestDto): Promise<SyllabusResponse> {
    if (this.useMockAI || !this.genAI) {
      return this.generateMockSyllabus(request);
    }

    try {
      const prompt = this.buildSyllabusPrompt(request);
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      this.logger.log('Gemini AI syllabus generated successfully');
      return this.parseGeminiSyllabusResponse(text, request);
    } catch (error) {
      this.logger.error('Gemini AI Error:', error);
      // Fallback to mock data if AI fails
      return this.generateMockSyllabus(request);
    }
  }

  /**
   * Builds a detailed prompt for course recommendations
   */
  private buildRecommendationPrompt(request: RecommendationRequestDto): string {
    return `
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
`;
  }

  /**
   * Builds a detailed prompt for syllabus generation
   */
  private buildSyllabusPrompt(request: SyllabusRequestDto): string {
    return `
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
`;
  }

  /**
   * Parses Gemini AI response for course recommendations
   */
  private parseGeminiRecommendationResponse(text: string, request: RecommendationRequestDto): RecommendationResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          success: true,
          recommendations: parsed.recommendations || [],
          metadata: {
            totalRecommendations: parsed.recommendations?.length || 0,
            confidenceScore: 0.95,
            processingTime: Math.round(Math.random() * 500 + 1000),
            algorithmVersion: 'gemini-1.5-flash',
            lastUpdated: new Date().toISOString(),
          },
          userProfile: {
            academicLevel: request.academicLevel,
            interests: request.interests,
            preferredDifficulty: request.preferredDifficulty,
            timeCommitment: request.timeCommitment,
            learningStyle: request.learningStyle,
          }
        };
      }
    } catch (error) {
      this.logger.error('Failed to parse Gemini recommendation response:', error);
    }
    
    // Fallback to mock data if parsing fails
    return this.generateMockRecommendations(request);
  }

  /**
   * Parses Gemini AI response for syllabus generation
   */
  private parseGeminiSyllabusResponse(text: string, request: SyllabusRequestDto): SyllabusResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          success: true,
          syllabus: parsed,
          metadata: {
            generatedAt: new Date().toISOString(),
            estimatedDuration: `${request.duration} weeks`,
            difficultyLevel: request.difficultyLevel,
            totalHours: this.calculateTotalHours(parsed.weeks || []),
            aiConfidence: 0.92,
          }
        };
      }
    } catch (error) {
      this.logger.error('Failed to parse Gemini syllabus response:', error);
    }
    
    // Fallback to mock data if parsing fails
    return this.generateMockSyllabus(request);
  }

  /**
   * Generates mock course recommendations based on user preferences
   */
  private generateMockRecommendations(request: RecommendationRequestDto): Promise<RecommendationResponse> {
    return new Promise(async (resolve) => {
      // Simulate AI processing delay
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

      const recommendations = this.getMockRecommendations(request);
      
      resolve({
        success: true,
        recommendations,
        metadata: {
          totalRecommendations: recommendations.length,
          confidenceScore: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
          processingTime: Math.round(Math.random() * 500 + 1000),
          algorithmVersion: 'mock-2.1.0',
          lastUpdated: new Date().toISOString(),
        },
        userProfile: {
          academicLevel: request.academicLevel,
          interests: request.interests,
          preferredDifficulty: request.preferredDifficulty,
          timeCommitment: request.timeCommitment,
          learningStyle: request.learningStyle || 'mixed',
        }
      });
    });
  }

  /**
   * Generates a comprehensive mock syllabus
   */
  private generateMockSyllabus(request: SyllabusRequestDto): Promise<SyllabusResponse> {
    return new Promise(async (resolve) => {
      // Simulate AI processing delay
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));

      const syllabus = this.createMockSyllabus(request);

      resolve({
        success: true,
        syllabus,
        metadata: {
          generatedAt: new Date().toISOString(),
          estimatedDuration: `${request.duration} weeks`,
          difficultyLevel: request.difficultyLevel,
          totalHours: this.calculateTotalHours(syllabus.weeks),
          aiConfidence: Math.round((Math.random() * 0.2 + 0.8) * 100) / 100,
        }
      });
    });
  }

  /**
   * Gets mock course recommendations based on preferences
   */
  private getMockRecommendations(request: RecommendationRequestDto): CourseRecommendation[] {
    const allCourses = this.getMockCourseDatabase();
    
    // Filter courses based on user preferences
    let filteredCourses = allCourses.filter(course => {
      if (request.academicLevel && course.level !== request.academicLevel) {
        return false;
      }
      
      if (request.interests && request.interests.length > 0) {
        const hasMatchingInterest = request.interests.some(interest => 
          course.tags.includes(interest.toLowerCase()) || 
          course.category.toLowerCase().includes(interest.toLowerCase())
        );
        if (!hasMatchingInterest) return false;
      }
      
      if (request.preferredDifficulty && course.difficulty !== request.preferredDifficulty) {
        return false;
      }
      
      return true;
    });

    if (filteredCourses.length === 0) {
      filteredCourses = allCourses.slice(0, 6);
    }

    return filteredCourses
      .map(course => ({
        ...course,
        matchScore: this.calculateMatchScore(course, request),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }

  /**
   * Mock course database
   */
  private getMockCourseDatabase(): any[] {
    return [
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
        nextStartDate: '2024-02-15'
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
        nextStartDate: '2024-02-20'
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
        nextStartDate: '2024-03-01'
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
        nextStartDate: '2024-02-10'
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
        nextStartDate: '2024-03-15'
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
        nextStartDate: '2024-02-25'
      }
    ];
  }

  /**
   * Creates a comprehensive mock syllabus
   */
  private createMockSyllabus(request: SyllabusRequestDto): any {
    const weeks = this.generateSyllabusWeeks(request);
    const objectives = this.generateLearningObjectives(request);
    
    return {
      courseTitle: request.courseTitle,
      description: this.generateCourseDescription(request),
      duration: `${request.duration} weeks`,
      difficultyLevel: request.difficultyLevel,
      prerequisites: this.generatePrerequisites(request),
      learningObjectives: objectives,
      weeks: weeks,
      assessments: this.generateAssessments(request),
      resources: this.generateResources(request),
      gradingScheme: {
        assignments: 40,
        midtermExam: 25,
        finalProject: 25,
        participation: 10
      }
    };
  }

  /**
   * Helper methods for syllabus generation
   */
  private generateSyllabusWeeks(request: SyllabusRequestDto): SyllabusWeek[] {
    const weeks: SyllabusWeek[] = [];
    const topicsPerWeek = Math.ceil(request.topics.length / request.duration);
    
    for (let i = 0; i < request.duration; i++) {
      const weekTopics = request.topics.slice(i * topicsPerWeek, (i + 1) * topicsPerWeek);
      
      weeks.push({
        weekNumber: i + 1,
        title: `Week ${i + 1}: ${weekTopics[0] || 'Advanced Topics'}`,
        topics: weekTopics.length > 0 ? weekTopics : ['Review and Practice'],
        learningGoals: this.generateWeeklyGoals(weekTopics, request.difficultyLevel),
        activities: this.generateWeeklyActivities(weekTopics, request.difficultyLevel),
        assignments: i % 3 === 2 ? [`Assignment ${Math.floor(i / 3) + 1}`] : [],
        readings: this.generateReadings(weekTopics),
        estimatedHours: this.calculateWeeklyHours(request.difficultyLevel)
      });
    }
    
    return weeks;
  }

  private generateLearningObjectives(request: SyllabusRequestDto): LearningObjective[] {
    const objectives: LearningObjective[] = [];
    
    request.topics.forEach((topic, index) => {
      objectives.push({
        id: `obj-${index + 1}`,
        description: `Master the concepts and applications of ${topic}`,
        bloomLevel: this.getBloomLevel(request.difficultyLevel),
        assessmentMethod: index % 2 === 0 ? 'Assignment' : 'Exam'
      });
    });
    
    return objectives;
  }

  private calculateMatchScore(course: any, request: RecommendationRequestDto): number {
    let score = 0.5;
    
    if (request.interests) {
      const matchingInterests = request.interests.filter(interest => 
        course.tags.includes(interest.toLowerCase())
      ).length;
      score += (matchingInterests / request.interests.length) * 0.3;
    }
    
    if (request.preferredDifficulty === course.difficulty) {
      score += 0.2;
    }
    
    score += Math.random() * 0.1;
    return Math.min(score, 1.0);
  }

  private generateCourseDescription(request: SyllabusRequestDto): string {
    const descriptions = {
      'beginner': `This introductory course covers the fundamental concepts of ${request.courseTitle}. Students will learn through hands-on exercises and practical applications.`,
      'intermediate': `This intermediate-level course builds upon foundational knowledge to explore advanced topics in ${request.courseTitle}. Students will engage in complex problem-solving and real-world applications.`,
      'advanced': `This advanced course provides in-depth coverage of sophisticated concepts in ${request.courseTitle}. Students will conduct independent research and tackle challenging theoretical and practical problems.`
    };
    
    return descriptions[request.difficultyLevel] || descriptions['intermediate'];
  }

  private generatePrerequisites(request: SyllabusRequestDto): string[] {
    const prereqMap = {
      'beginner': ['Basic computer literacy', 'High school mathematics'],
      'intermediate': ['Completion of introductory course', 'Basic programming knowledge'],
      'advanced': ['Strong foundation in core concepts', 'Previous coursework in related field']
    };
    
    return prereqMap[request.difficultyLevel] || prereqMap['intermediate'];
  }

  private generateWeeklyGoals(topics: string[], difficulty: string): string[] {
    if (topics.length === 0) return ['Review previous concepts', 'Prepare for upcoming assessments'];
    return topics.map(topic => `Understand and apply ${topic} concepts`);
  }

  private generateWeeklyActivities(topics: string[], difficulty: string): string[] {
    const activities = [
      'Interactive lectures and discussions',
      'Hands-on laboratory exercises',
      'Group problem-solving sessions'
    ];
    
    if (difficulty === 'advanced') {
      activities.push('Independent research tasks', 'Peer review activities');
    }
    
    return activities;
  }

  private generateReadings(topics: string[]): string[] {
    return topics.map(topic => `Chapter on ${topic} from course textbook`);
  }

  private generateAssessments(request: SyllabusRequestDto): any[] {
    return [
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
    ];
  }

  private generateResources(request: SyllabusRequestDto): any {
    return {
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
    };
  }

  private calculateWeeklyHours(difficulty: string): number {
    const baseHours = { 'beginner': 6, 'intermediate': 8, 'advanced': 12 };
    return baseHours[difficulty] || 8;
  }

  private calculateTotalHours(weeks: SyllabusWeek[]): number {
    return weeks.reduce((total, week) => total + week.estimatedHours, 0);
  }

  private getBloomLevel(difficulty: string): string {
    const levels = {
      'beginner': 'Understanding',
      'intermediate': 'Applying',
      'advanced': 'Analyzing'
    };
    return levels[difficulty] || 'Applying';
  }
}