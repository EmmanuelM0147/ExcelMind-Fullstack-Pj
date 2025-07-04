import { IsString, IsArray, IsEnum, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export enum SyllabusDifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export class SyllabusRequestDto {
  @IsNotEmpty({ message: 'Course title is required' })
  @IsString({ message: 'Course title must be a string' })
  courseTitle: string;

  @IsNotEmpty({ message: 'Topics are required' })
  @IsArray({ message: 'Topics must be an array of strings' })
  @IsString({ each: true, message: 'Each topic must be a string' })
  topics: string[];

  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(4, { message: 'Course duration must be at least 4 weeks' })
  @Max(24, { message: 'Course duration cannot exceed 24 weeks' })
  duration: number; // in weeks

  @IsEnum(SyllabusDifficultyLevel, { message: 'Difficulty level must be beginner, intermediate, or advanced' })
  difficultyLevel: SyllabusDifficultyLevel;

  @IsArray({ message: 'Learning objectives must be an array of strings' })
  @IsString({ each: true, message: 'Each learning objective must be a string' })
  learningObjectives: string[];

  @IsArray({ message: 'Prerequisites must be an array of strings' })
  @IsString({ each: true, message: 'Each prerequisite must be a string' })
  prerequisites: string[];
}