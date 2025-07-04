import { IsString, IsArray, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';

export enum AcademicLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  KINESTHETIC = 'kinesthetic',
  MIXED = 'mixed'
}

export class RecommendationRequestDto {
  @IsOptional()
  @IsEnum(AcademicLevel, { message: 'Academic level must be beginner, intermediate, or advanced' })
  academicLevel?: AcademicLevel;

  @IsOptional()
  @IsArray({ message: 'Interests must be an array of strings' })
  @IsString({ each: true, message: 'Each interest must be a string' })
  interests?: string[];

  @IsOptional()
  @IsEnum(DifficultyLevel, { message: 'Preferred difficulty must be easy, medium, or hard' })
  preferredDifficulty?: DifficultyLevel;

  @IsOptional()
  @IsNumber({}, { message: 'Time commitment must be a number' })
  @Min(1, { message: 'Time commitment must be at least 1 hour per week' })
  @Max(40, { message: 'Time commitment cannot exceed 40 hours per week' })
  timeCommitment?: number; // hours per week

  @IsOptional()
  @IsEnum(LearningStyle, { message: 'Learning style must be visual, auditory, kinesthetic, or mixed' })
  learningStyle?: LearningStyle;

  @IsOptional()
  @IsArray({ message: 'Previous courses must be an array of strings' })
  @IsString({ each: true, message: 'Each previous course must be a string' })
  previousCourses?: string[];

  @IsOptional()
  @IsArray({ message: 'Career goals must be an array of strings' })
  @IsString({ each: true, message: 'Each career goal must be a string' })
  careerGoals?: string[];
}