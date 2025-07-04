import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway, GradeUpdateNotification, EnrollmentUpdateNotification } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private notificationsGateway: NotificationsGateway) {}

  // Send grade update notification
  async sendGradeUpdate(data: {
    studentId: string;
    assignmentId: string;
    assignmentTitle: string;
    courseName: string;
    grade: number;
  }) {
    const notification: GradeUpdateNotification = {
      type: 'gradeUpdate',
      studentId: data.studentId,
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      courseName: data.courseName,
      grade: data.grade,
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.emitGradeUpdate(notification);
    this.logger.log(`Grade update notification sent for student ${data.studentId}`);
  }

  // Send enrollment update notification
  async sendEnrollmentUpdate(data: {
    studentId: string;
    courseId: string;
    courseName: string;
    action: 'enrolled' | 'unenrolled';
  }) {
    const notification: EnrollmentUpdateNotification = {
      type: 'enrollmentUpdate',
      studentId: data.studentId,
      courseId: data.courseId,
      courseName: data.courseName,
      action: data.action,
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.emitEnrollmentUpdate(notification);
    this.logger.log(`Enrollment update notification sent for student ${data.studentId}`);
  }

  // Test method to simulate notifications
  async sendTestNotifications() {
    // Simulate grade update
    setTimeout(() => {
      this.sendGradeUpdate({
        studentId: 'test-student-id',
        assignmentId: 'test-assignment-id',
        assignmentTitle: 'Programming Assignment 1',
        courseName: 'Introduction to Computer Science',
        grade: 92,
      });
    }, 2000);

    // Simulate enrollment update
    setTimeout(() => {
      this.sendEnrollmentUpdate({
        studentId: 'test-student-id',
        courseId: 'test-course-id',
        courseName: 'Advanced Mathematics',
        action: 'enrolled',
      });
    }, 4000);

    this.logger.log('Test notifications scheduled');
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      connectedUsers: this.notificationsGateway.getConnectedUsersCount(),
      timestamp: new Date().toISOString(),
    };
  }
}