import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Expose } from 'class-transformer';

import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Column()
  name: string;

  @Expose()
  get companyNumber(): string {
    return `COMP-${String(this.id).padStart(4, '0')}`;
  }

  @Column()
  productId: number;

  @ManyToOne(() => Product, (product) => product.companies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: false })
  link: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'id' })
  updatedBy: User;
}