import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
  createProductDto: CreateProductDto,
  userId: number,
) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException(
      `User with ID ${userId} not found`,
    );
  }

  const newProduct = this.productRepository.create({
    ...createProductDto,
    createdBy: user,
    updatedBy: user,
  });

  const savedProduct = await this.productRepository.save(newProduct);

  const product = await this.productRepository.findOne({
    where: { id: savedProduct.id },
    relations: {
      createdBy: true,
      updatedBy: true,
    },
  });

  if (!product) {
    throw new NotFoundException('Product could not be retrieved');
  }

  return {
    statusCode: 201,
    message: 'Product created successfully',
    ...product,
  };
}

  async findAll() {
  const products = await this.productRepository.find({
    relations: {
      createdBy: true,
      updatedBy: true,
    },
  });

  return {
    statusCode: 200,
    message: 'Products retrieved successfully',
    data: products,
  };
}

  async findOne(uuid: string) {
  const product = await this.productRepository.findOne({
    where: { uuid },
    relations: {
      createdBy: true,
      updatedBy: true,
    },
  });

  if (!product) {
    throw new NotFoundException(
      `Product with UUID ${uuid} not found`,
    );
  }

  return {
    statusCode: 200,
    message: 'Product retrieved successfully',
    product,
  };
}
}