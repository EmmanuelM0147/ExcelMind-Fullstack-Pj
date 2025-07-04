import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { AssignmentSubmission } from '../../assignment-submissions/entities/assignment-submission.entity';
import { Course } from '../../courses/entities/course.entity';

export enum UserRole {
  STUDENT = 'student',
  LECTURER = 'lecturer',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Enrollment, enrollment => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => AssignmentSubmission, submission => submission.student)
  assignments: AssignmentSubmission[];

  @OneToMany(() => Course, course => course.lecturer)
  courses: Course[];
}