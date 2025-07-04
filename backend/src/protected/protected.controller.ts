import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProtectedController {
  constructor(private usersService: UsersService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  async getAdminData() {
    return {
      message: 'This is admin-only data',
      data: 'Sensitive admin information',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('lectures')
  @Roles(UserRole.ADMIN, UserRole.LECTURER)
  async getLectures() {
    return {
      message: 'Lecture management data',
      lectures: [
        { id: 1, title: 'Introduction to Computer Science', lecturer: 'Dr. Smith' },
        { id: 2, title: 'Advanced Mathematics', lecturer: 'Prof. Johnson' },
        { id: 3, title: 'Database Systems', lecturer: 'Dr. Brown' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  @Get('students')
  @Roles(UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT)
  async getStudents() {
    const students = await this.usersService.findByRole(UserRole.STUDENT);
    return {
      message: 'Student data accessible to all authenticated users',
      students: students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}