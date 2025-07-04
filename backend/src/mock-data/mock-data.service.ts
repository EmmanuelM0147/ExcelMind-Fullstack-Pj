import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { AssignmentSubmission } from '../assignment-submissions/entities/assignment-submission.entity';

@Injectable()
export class MockDataService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(AssignmentSubmission)
    private submissionsRepository: Repository<AssignmentSubmission>,
  ) {}

  async onModuleInit() {
    await this.createMockData();
  }

  private async createMockData() {
    // Check if data already exists
    const userCount = await this.usersRepository.count();
    if (userCount > 0) {
      console.log('Mock data already exists, skipping creation...');
      return;
    }

    console.log('Creating mock data...');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create lecturers
    const lecturer1 = await this.usersRepository.save({
      email: 'dr.smith@university.edu',
      name: 'Dr. John Smith',
      password: hashedPassword,
      role: UserRole.LECTURER,
    });

    const lecturer2 = await this.usersRepository.save({
      email: 'prof.johnson@university.edu',
      name: 'Prof. Sarah Johnson',
      password: hashedPassword,
      role: UserRole.LECTURER,
    });

    // Create admin
    const admin = await this.usersRepository.save({
      email: 'admin@university.edu',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    // Create students
    const students = [];
    for (let i = 1; i <= 10; i++) {
      const student = await this.usersRepository.save({
        email: `student${i}@university.edu`,
        name: `Student ${i}`,
        password: hashedPassword,
        role: UserRole.STUDENT,
      });
      students.push(student);
    }

    // Create courses
    const course1 = await this.coursesRepository.save({
      title: 'Introduction to Computer Science',
      credits: 3,
      syllabus: 'This course introduces fundamental concepts of computer science including programming, algorithms, and data structures.',
      lecturerId: lecturer1.id,
    });

    const course2 = await this.coursesRepository.save({
      title: 'Advanced Mathematics',
      credits: 4,
      syllabus: 'Advanced mathematical concepts including calculus, linear algebra, and discrete mathematics.',
      lecturerId: lecturer2.id,
    });

    const course3 = await this.coursesRepository.save({
      title: 'Database Systems',
      credits: 3,
      syllabus: 'Introduction to database design, SQL, and database management systems.',
      lecturerId: lecturer1.id,
    });

    // Create assignments
    const assignments = [];

    // Course 1 assignments
    const assignment1 = await this.assignmentsRepository.save({
      title: 'Programming Assignment 1',
      description: 'Implement basic sorting algorithms',
      courseId: course1.id,
      dueDate: new Date('2024-02-15'),
      weight: 20,
    });
    assignments.push(assignment1);

    const assignment2 = await this.assignmentsRepository.save({
      title: 'Midterm Exam',
      description: 'Comprehensive midterm examination',
      courseId: course1.id,
      dueDate: new Date('2024-03-15'),
      weight: 30,
    });
    assignments.push(assignment2);

    const assignment3 = await this.assignmentsRepository.save({
      title: 'Final Project',
      description: 'Develop a complete software application',
      courseId: course1.id,
      dueDate: new Date('2024-05-15'),
      weight: 50,
    });
    assignments.push(assignment3);

    // Course 2 assignments
    const assignment4 = await this.assignmentsRepository.save({
      title: 'Calculus Problem Set',
      description: 'Solve advanced calculus problems',
      courseId: course2.id,
      dueDate: new Date('2024-02-20'),
      weight: 25,
    });
    assignments.push(assignment4);

    const assignment5 = await this.assignmentsRepository.save({
      title: 'Linear Algebra Quiz',
      description: 'Matrix operations and vector spaces',
      courseId: course2.id,
      dueDate: new Date('2024-03-20'),
      weight: 25,
    });
    assignments.push(assignment5);

    const assignment6 = await this.assignmentsRepository.save({
      title: 'Final Exam',
      description: 'Comprehensive final examination',
      courseId: course2.id,
      dueDate: new Date('2024-05-20'),
      weight: 50,
    });
    assignments.push(assignment6);

    // Create enrollments
    const enrollments = [];
    
    // Enroll first 5 students in course 1
    for (let i = 0; i < 5; i++) {
      const enrollment = await this.enrollmentsRepository.save({
        studentId: students[i].id,
        courseId: course1.id,
      });
      enrollments.push(enrollment);
    }

    // Enroll students 3-7 in course 2
    for (let i = 3; i < 8; i++) {
      const enrollment = await this.enrollmentsRepository.save({
        studentId: students[i].id,
        courseId: course2.id,
      });
      enrollments.push(enrollment);
    }

    // Enroll students 6-9 in course 3
    for (let i = 6; i < 10; i++) {
      const enrollment = await this.enrollmentsRepository.save({
        studentId: students[i].id,
        courseId: course3.id,
      });
      enrollments.push(enrollment);
    }

    // Create assignment submissions with grades
    const submissions = [];

    // Course 1 submissions
    for (let i = 0; i < 5; i++) {
      // Assignment 1 submissions
      const submission1 = await this.submissionsRepository.save({
        assignmentId: assignment1.id,
        studentId: students[i].id,
        grade: Math.floor(Math.random() * 30) + 70, // Random grade between 70-100
      });
      submissions.push(submission1);

      // Assignment 2 submissions
      const submission2 = await this.submissionsRepository.save({
        assignmentId: assignment2.id,
        studentId: students[i].id,
        grade: Math.floor(Math.random() * 25) + 75, // Random grade between 75-100
      });
      submissions.push(submission2);

      // Some students haven't submitted final project yet
      if (i < 3) {
        const submission3 = await this.submissionsRepository.save({
          assignmentId: assignment3.id,
          studentId: students[i].id,
          grade: Math.floor(Math.random() * 20) + 80, // Random grade between 80-100
        });
        submissions.push(submission3);
      }
    }

    // Course 2 submissions
    for (let i = 3; i < 8; i++) {
      // Assignment 4 submissions
      const submission4 = await this.submissionsRepository.save({
        assignmentId: assignment4.id,
        studentId: students[i].id,
        grade: Math.floor(Math.random() * 25) + 75, // Random grade between 75-100
      });
      submissions.push(submission4);

      // Assignment 5 submissions
      if (i < 7) {
        const submission5 = await this.submissionsRepository.save({
          assignmentId: assignment5.id,
          studentId: students[i].id,
          grade: Math.floor(Math.random() * 30) + 70, // Random grade between 70-100
        });
        submissions.push(submission5);
      }
    }

    console.log('Mock data created successfully!');
    console.log(`Created ${students.length} students, 2 lecturers, 1 admin`);
    console.log(`Created 3 courses with ${assignments.length} assignments`);
    console.log(`Created ${enrollments.length} enrollments and ${submissions.length} submissions`);
    console.log('\nTest credentials:');
    console.log('Admin: admin@university.edu / password123');
    console.log('Lecturer: dr.smith@university.edu / password123');
    console.log('Student: student1@university.edu / password123');
  }
}