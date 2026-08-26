import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import type { Relation } from 'typeorm';
import { Expose } from 'class-transformer';
import { Entity,PrimaryGeneratedColumn, Column, Generated, OneToMany, ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({type: 'varchar', unique: true})
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Expose()
  get productNumber(): string {
    return `PR-${String(this.id).padStart(4, '0')}`;
  }

  @OneToMany(() => Company, (company: Company) => company.product)
  companies: Relation<Company[]>;

  @Column()
  link: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'uuid' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'updated_by', referencedColumnName: 'uuid' })
  updatedBy: User;
}