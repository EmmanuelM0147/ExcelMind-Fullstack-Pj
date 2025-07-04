import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentSubmission } from '../assignment-submissions/entities/assignment-submission.entity';
import { Assignment } from './entities/assignment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(AssignmentSubmission)
    private submissionsRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async gradeAssignment(gradeAssignmentDto: GradeAssignmentDto, graderId: string): Promise<AssignmentSubmission> {
    const { submissionId, grade } = gradeAssignmentDto;

    // Verify grader is lecturer or admin
    const grader = await this.usersRepository.findOne({ where: { id: graderId } });
    if (!grader || (grader.role !== UserRole.LECTURER && grader.role !== UserRole.ADMIN)) {
      throw new ForbiddenException('Only lecturers and admins can grade assignments');
    }

    // Find submission
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment', 'assignment.course', 'assignment.course.lecturer', 'student'],
    });
    if (!submission) {
      throw new NotFoundException('Assignment submission not found');
    }

    // Check if lecturer is the course lecturer (admins can grade any assignment)
    if (grader.role === UserRole.LECTURER && submission.assignment.course.lecturerId !== graderId) {
      throw new ForbiddenException('Lecturers can only grade assignments for their own courses');
    }

    // Update grade
    submission.grade = grade;
    const updatedSubmission = await this.submissionsRepository.save(submission);

    // Send real-time notification
    try {
      await this.notificationsService.sendGradeUpdate({
        studentId: submission.studentId,
        assignmentId: submission.assignmentId,
        assignmentTitle: submission.assignment.title,
        courseName: submission.assignment.course.title,
        grade: grade,
      });
    } catch (error) {
      console.error('Failed to send grade update notification:', error);
      // Don't fail the grading operation if notification fails
    }

    return updatedSubmission;
  }

  async calculateStudentGrade(studentId: string, courseId: string): Promise<{
    assignments: Array<{
      id: string;
      title: string;
      weight: number;
      grade: number | null;
      dueDate: Date;
    }>;
    finalGrade: number | null;
    totalWeight: number;
  }> {
    // Get all assignments for the course
    const assignments = await this.assignmentsRepository.find({
      where: { courseId },
      relations: ['submissions'],
    });

    // Get student submissions for these assignments
    const submissions = await this.submissionsRepository.find({
      where: { studentId },
      relations: ['assignment'],
    });

    // Create a map of assignment submissions
    const submissionMap = new Map();
    submissions.forEach(submission => {
      if (submission.assignment.courseId === courseId) {
        submissionMap.set(submission.assignmentId, submission);
      }
    });

    // Calculate grades
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let gradedWeight = 0;

    const assignmentGrades = assignments.map(assignment => {
      const submission = submissionMap.get(assignment.id);
      const grade = submission?.grade || null;
      
      totalWeight += assignment.weight;
      
      if (grade !== null) {
        totalWeightedScore += (grade * assignment.weight) / 100;
        gradedWeight += assignment.weight;
      }

      return {
        id: assignment.id,
        title: assignment.title,
        weight: assignment.weight,
        grade,
        dueDate: assignment.dueDate,
      };
    });

    // Calculate final grade (only if there are graded assignments)
    const finalGrade = gradedWeight > 0 ? (totalWeightedScore / gradedWeight) * 100 : null;

    return {
      assignments: assignmentGrades,
      finalGrade: finalGrade ? Math.round(finalGrade * 100) / 100 : null,
      totalWeight,
    };
  }
}