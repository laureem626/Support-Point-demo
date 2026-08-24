import { Issue } from 'src/modules/issues/entities/issues/issues.entity';
import { Entity, PrimaryGeneratedColumn, Column, Generated, ManyToOne, JoinColumn } from 'typeorm';

@Entity('comments')
export class Comment {
  
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'issue_id' })
  issueId: number;

   

  @ManyToOne(() => Issue, (issue) => issue.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_id' })
  issue: Issue;

  @Column({ type: 'text' })
  comments: string;
}