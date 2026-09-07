import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

import {
  Designation as DesignationEnum,
} from 'src/common/enums/issue.enum';

@Entity('designations')
export class Designation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'uuid',
    unique: true,
  })
  @Generated('uuid')
  uuid: string;

  @Column({
    type: 'enum',
    enum: DesignationEnum,
    nullable: false,
  })
  designation: DesignationEnum;

  @Column({
    name: 'userId',
  })
  userId: number;

  @ManyToOne(
    () => User,
    (user) => user.designations,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'userId',
  })
  user: User;
}