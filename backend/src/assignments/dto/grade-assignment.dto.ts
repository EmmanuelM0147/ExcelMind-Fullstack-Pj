import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class GradeAssignmentDto {
  @IsUUID(4, { message: 'Submission ID must be a valid UUID' })
  submissionId: string;

  @IsNumber({}, { message: 'Grade must be a number' })
  @Min(0, { message: 'Grade must be at least 0' })
  @Max(100, { message: 'Grade must be at most 100' })
  grade: number;
}