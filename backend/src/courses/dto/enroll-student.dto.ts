import { IsUUID } from 'class-validator';

export class EnrollStudentDto {
  @IsUUID(4, { message: 'Student ID must be a valid UUID' })
  studentId: string;

  @IsUUID(4, { message: 'Course ID must be a valid UUID' })
  courseId: string;
}