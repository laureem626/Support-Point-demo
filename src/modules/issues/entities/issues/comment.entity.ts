import { Entity, PrimaryGeneratedColumn ,Column,Generated,CreateDateColumn,ManyToOne,JoinColumn} from "typeorm";
import { User } from "src/modules/users/entities/user.entity";
import { Issue } from "./issues.entity";


@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Column({ name: 'issue_id' })
  issueId: number;

  // @Column({ name: 'assigned_to', nullable: true })
  // assignedTo: number | null;

  @Column({ name: 'created_by' })
  createdById: number;

  @Column({ type: 'text' })
  comments: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Issue, (issue) => issue.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'issue_id',
    referencedColumnName: 'id',
  })
  issue: Issue;

  @ManyToOne(() => User, {
  nullable: true,
})
  @JoinColumn({
    name: 'assigned_to',
    referencedColumnName: 'id',
  })
  assignedUser: User;

  @Column({
  name: 'assigned_to',
  nullable: true,
})
assignedTo: number | null;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'created_by',
    referencedColumnName: 'id',
  })
  createdBy: User;
}