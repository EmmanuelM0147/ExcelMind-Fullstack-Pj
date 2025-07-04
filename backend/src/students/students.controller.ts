import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AssignmentsService } from '../assignments/assignments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get(':studentId/courses/:courseId/grade')
  @Roles(UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT)
  async getStudentGrade(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.assignmentsService.calculateStudentGrade(studentId, courseId);
  }
}