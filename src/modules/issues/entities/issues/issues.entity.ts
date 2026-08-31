import { AssignedTo, Designation, IssuePriority, IssueStatus } from 'src/common/enums/issue.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Generated,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IssueAssignment } from './issues-assignment.entity';
import { Comment } from './comment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Company } from 'src/modules/companies/entities/company.entity';
import { Expose } from 'class-transformer';

@Entity('issue')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Expose()
  get number(): string {
    return `ISSUE-${String(this.id).padStart(4, '0')}`;
  }

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({
    name: 'company_id',
    referencedColumnName: 'id',
  })
  company: Company;

  @Column({ name: 'reporter_name' })
  reporterName: string;

  @Column({ name: 'reporter_mobile' })
  reporterMobile: string;

  @Column({ type: 'enum', enum: IssuePriority, default: IssuePriority.MEDIUM })
  priority: IssuePriority;

  @Column({ type: 'varchar', nullable: true, default: null })
  attachment: string | null;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.IN_PROGRESS,
  })
  status: IssueStatus;


  @Column({
    type: 'enum',
    enum: AssignedTo,
    default: AssignedTo.SUPPORTER,
  })
  assignedTo: AssignedTo;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ID of the user who created the issue
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
  updatedBy: User;

  @OneToMany(() => Comment, 'issue')
  comments: Comment[];

  @OneToMany(() => IssueAssignment, (assignment) => assignment.issue)
  assignments: IssueAssignment[];
}
