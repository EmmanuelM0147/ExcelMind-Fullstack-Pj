import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('enroll')
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async enrollStudent(@Body() enrollStudentDto: EnrollStudentDto) {
    return this.coursesService.enrollStudent(enrollStudentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT)
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT)
  async findOne(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }
}