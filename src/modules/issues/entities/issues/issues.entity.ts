import { IssuePriority, IssueStatus } from 'src/common/enums/issue.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Generated,
} from 'typeorm';
import { IssueAssignment } from './issues-assignment.entity';
import { Comment } from './comment.entity';


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

  @Column({ name: 'reported_at', type: 'timestamptz' })
  reportedAt: Date;

  @Column({ type: 'varchar', nullable: true, default: null })
  attachment: string | null;

  @Column({ type: 'enum', enum: IssueStatus, default: IssueStatus.AT_SUPPORT })
  status: IssueStatus;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

 @OneToMany(() => Comment, 'issue')
comments: Comment[];

  @OneToMany(() => IssueAssignment, (assignment) => assignment.issue)
  assignments: IssueAssignment[];
}