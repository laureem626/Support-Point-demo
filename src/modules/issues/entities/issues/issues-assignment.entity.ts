import { Issue } from 'src/modules/issues/entities/issues/issues.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('issue_assignments')
export class IssueAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'issue_id' })
  issueId: number;

  @ManyToOne(() => Issue, (issue) => issue.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  //@OneToMany(() => Comment, (comment) => comment.assignment, {
  //cascade: true,
//})
//comments: Comment[];

  @Column({ type: 'text' })
  description: string;
}
