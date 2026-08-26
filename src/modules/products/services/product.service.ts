import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
 async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = this.productRepository.create(createProductDto);
    return await this.productRepository.save(newProduct);
  }
  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async findOne(uuid: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { uuid } });
    if (!product) {
      throw new NotFoundException(`Product with UUID ${uuid} not found`);
    }
    return product;
  }
}