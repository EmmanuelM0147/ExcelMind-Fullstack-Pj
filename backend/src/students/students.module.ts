import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [AssignmentsModule],
  controllers: [StudentsController],
})
export class StudentsModule {}