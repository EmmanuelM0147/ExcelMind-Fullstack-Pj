/**
 * Interface definitions for AI service responses
 * These interfaces define the structure of data returned by AI endpoints
 */

export interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  difficulty: string;
  duration: number; // in weeks
  rating: number;
  enrolledStudents: number;
  instructor: string;
  tags: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  estimatedHours: number; // per week
  price: number;
  nextStartDate: string;
  matchScore: number; // 0-1, how well it matches user preferences
}

export interface RecommendationMetadata {
  totalRecommendations: number;
  confidenceScore: number; // 0-1
  processingTime: number; // in milliseconds
  algorithmVersion: string;
  lastUpdated: string;
}

export interface UserProfile {
  academicLevel?: string;
  interests?: string[];
  preferredDifficulty?: string;
  timeCommitment?: number;
  learningStyle?: string;
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: CourseRecommendation[];
  metadata: RecommendationMetadata;
  userProfile: UserProfile;
}

export interface LearningObjective {
  id: string;
  description: string;
  bloomLevel: string; // Bloom's taxonomy level
  assessmentMethod: string;
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

export interface SyllabusAssessment {
  type: string;
  count: number | string;
  weight: number; // percentage
  description: string;
}

export interface SyllabusResources {
  textbooks: Array<{
    title: string;
    author: string;
    isbn: string;
    required: boolean;
  }>;
  onlineResources: string[];
  software: string[];
}

export interface Syllabus {
  courseTitle: string;
  description: string;
  duration: string;
  difficultyLevel: string;
  prerequisites: string[];
  learningObjectives: LearningObjective[];
  weeks: SyllabusWeek[];
  assessments: SyllabusAssessment[];
  resources: SyllabusResources;
  gradingScheme: {
    assignments: number;
    midtermExam: number;
    finalProject: number;
    participation: number;
  };
}

export interface SyllabusMetadata {
  generatedAt: string;
  estimatedDuration: string;
  difficultyLevel: string;
  totalHours: number;
  aiConfidence: number; // 0-1
}

export interface SyllabusResponse {
  success: boolean;
  syllabus: Syllabus;
  metadata: SyllabusMetadata;
}