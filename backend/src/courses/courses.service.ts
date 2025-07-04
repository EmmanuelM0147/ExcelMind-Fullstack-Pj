import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async enrollStudent(enrollStudentDto: EnrollStudentDto): Promise<Enrollment> {
    const { studentId, courseId } = enrollStudentDto;

    // Verify student exists and has student role
    const student = await this.usersRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.role !== UserRole.STUDENT) {
      throw new ConflictException('User must have student role to enroll in courses');
    }

    // Verify course exists
    const course = await this.coursesRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if student is already enrolled
    const existingEnrollment = await this.enrollmentsRepository.findOne({
      where: { studentId, courseId },
    });
    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    // Create enrollment
    const enrollment = this.enrollmentsRepository.create({
      studentId,
      courseId,
    });

    const savedEnrollment = await this.enrollmentsRepository.save(enrollment);

    // Send real-time notification
    try {
      await this.notificationsService.sendEnrollmentUpdate({
        studentId,
        courseId,
        courseName: course.title,
        action: 'enrolled',
      });
    } catch (error) {
      console.error('Failed to send enrollment update notification:', error);
      // Don't fail the enrollment operation if notification fails
    }

    return savedEnrollment;
  }

  async findAll(): Promise<Course[]> {
    return this.coursesRepository.find({
      relations: ['lecturer', 'enrollments', 'assignments'],
    });
  }

  async findById(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['lecturer', 'enrollments', 'assignments'],
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }
}