import { Controller, Put, Body, UseGuards, Get, Param, Request } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Put('grade')
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async gradeAssignment(@Body() gradeAssignmentDto: GradeAssignmentDto, @Request() req) {
    return this.assignmentsService.gradeAssignment(gradeAssignmentDto, req.user.userId);
  }
}