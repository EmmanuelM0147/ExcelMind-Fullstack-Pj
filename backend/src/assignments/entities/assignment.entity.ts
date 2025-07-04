import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { AssignmentSubmission } from '../../assignment-submissions/entities/assignment-submission.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('uuid')
  courseId: string;

  @Column()
  dueDate: Date;

  @Column('decimal', { precision: 5, scale: 2 })
  weight: number; // Percentage weight for final grade (0-100)

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Course, course => course.assignments, { eager: true })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @OneToMany(() => AssignmentSubmission, submission => submission.assignment)
  submissions: AssignmentSubmission[];
}