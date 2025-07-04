import { api } from './client';

/**
 * TypeScript interfaces for AI service requests and responses
 */
export interface RecommendationRequest {
  academicLevel?: 'beginner' | 'intermediate' | 'advanced';
  interests?: string[];
  preferredDifficulty?: 'easy' | 'medium' | 'hard';
  timeCommitment?: number;
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  previousCourses?: string[];
  careerGoals?: string[];
}

export interface SyllabusRequest {
  courseTitle: string;
  topics: string[];
  duration: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  prerequisites: string[];
}

export interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  difficulty: string;
  duration: number;
  rating: number;
  enrolledStudents: number;
  instructor: string;
  tags: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  estimatedHours: number;
  price: number;
  nextStartDate: string;
  matchScore: number;
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: CourseRecommendation[];
  metadata: {
    totalRecommendations: number;
    confidenceScore: number;
    processingTime: number;
    algorithmVersion: string;
    lastUpdated: string;
  };
  userProfile: {
    academicLevel?: string;
    interests?: string[];
    preferredDifficulty?: string;
    timeCommitment?: number;
    learningStyle?: string;
  };
}

export interface SyllabusWeek {
  weekNumber: number;
  title: string;
  topics: string[];
  learningGoals: string[];
  activities: string[];
  assignments: string[];
  readings: string[];
  estimatedHours: number;
}

export interface SyllabusResponse {
  success: boolean;
  syllabus: {
    courseTitle: string;
    description: string;
    duration: string;
    difficultyLevel: string;
    prerequisites: string[];
    learningObjectives: Array<{
      id: string;
      description: string;
      bloomLevel: string;
      assessmentMethod: string;
    }>;
    weeks: SyllabusWeek[];
    assessments: Array<{
      type: string;
      count: number | string;
      weight: number;
      description: string;
    }>;
    resources: {
      textbooks: Array<{
        title: string;
        author: string;
        isbn: string;
        required: boolean;
      }>;
      onlineResources: string[];
      software: string[];
    };
    gradingScheme: {
      assignments: number;
      midtermExam: number;
      finalProject: number;
      participation: number;
    };
  };
  metadata: {
    generatedAt: string;
    estimatedDuration: string;
    difficultyLevel: string;
    totalHours: number;
    aiConfidence: number;
  };
}

/**
 * AI Service API functions
 */
export const aiService = {
  /**
   * Get course recommendations based on user preferences
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const response = await api.post('/ai-assistant/recommend', request);
    return response.data;
  },

  /**
   * Generate a course syllabus based on requirements
   */
  async generateSyllabus(request: SyllabusRequest): Promise<SyllabusResponse> {
    const response = await api.post('/ai-assistant/syllabus', request);
    return response.data;
  },
};