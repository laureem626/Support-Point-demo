import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Column()
  name: string;

  @Column({ type: 'int', unique: true })
  number: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, (product) => product.companies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ nullable: true })
  link?: string;

  @BeforeInsert()
  generateCompanyNumber() {
    if (!this.number) {
      this.number = Math.floor(5000 + Math.random() * 1000);
    }
  }
}