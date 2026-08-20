import { Entity, PrimaryGeneratedColumn, Column, Generated } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  // Assuming you want an auto-incrementing number starting from 1001
  @Column({ type: 'int', default: 1001 }) 
  number: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  link: string;
}