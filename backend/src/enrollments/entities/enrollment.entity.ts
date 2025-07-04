import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  studentId: string;

  @Column('uuid')
  courseId: string;

  @CreateDateColumn()
  enrollmentDate: Date;

  // Relationships
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => Course, course => course.enrollments, { eager: true })
  @JoinColumn({ name: 'courseId' })
  course: Course;
}