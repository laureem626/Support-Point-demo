import { IssuePriority, IssueStatus } from 'src/common/enums/issue.enum';
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

@Entity('issue')
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Column({ type: 'int', unique: true })
  number: number;

  @Column({ name: 'company_id' })
  companyId: number;

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
    default: IssueStatus.AT_SUPPORTER,
  })
  status: IssueStatus;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Automatically updated whenever the issue is updated
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ID of the user who created the issue
  @ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
createdBy: User | null;

@ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
updatedBy: User | null;

  @OneToMany(() => Comment, 'issue')
  comments: Comment[];

  @OneToMany(() => IssueAssignment, (assignment) => assignment.issue)
  assignments: IssueAssignment[];
}
