import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MockDataService } from './mock-data.service';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { AssignmentSubmission } from '../assignment-submissions/entities/assignment-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Course,
      Assignment,
      Enrollment,
      AssignmentSubmission,
    ]),
  ],
  providers: [MockDataService],
})
export class MockDataModule {}