import { Company } from '../../companies/entities/company.entity';
import type { Relation } from 'typeorm';

import { 
  Entity,
  PrimaryGeneratedColumn, 
  Column, 
  Generated,
  OneToMany
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ type: 'int', default: 1001 })
  number: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @OneToMany(() => Company, (company: Company) => company.product)
  companies: Relation<Company[]>;

  @Column()
  link: string;
}