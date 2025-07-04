import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('assignment_submissions')
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  assignmentId: string;

  @Column('uuid')
  studentId: string;

  @CreateDateColumn()
  submissionDate: Date;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  grade: number; // Grade from 0-100

  // Relationships
  @ManyToOne(() => Assignment, assignment => assignment.submissions, { eager: true })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: User;
}