import { Designation } from 'src/common/enums/issue.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users_user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ type: 'varchar', length: 20, nullable: false, unique: false })
  firstName: string;

  @Column({ type: 'varchar', length: 20, nullable: false, unique: false })
  lastName: string;

  @Column({
    type: 'enum',
    enum: Designation, nullable: false,
  })
  designation: Designation;

  @Column({ type: 'varchar', unique: true, length: 12, nullable: false })
  mobile: string;

  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  static id: any;
}
