import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-productdto';
import { User } from '../../users/entities/user.entity';
import { PaginationService } from '../../../common/pagination/pagination-service';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { Designation } from 'src/common/enums/issue.enum';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // CREATE PRODUCT 
 async create(createProductDto: CreateProductDto, userId: number): Promise<Product> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { designations: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isSupporter = user.designations?.some(
      (d) => d.designation === Designation.SUPPORTER,
    );

    if (!isSupporter) {
      throw new ForbiddenException('Only System Supporter can create a product');
    }

    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
    });

    if (existingProduct) {
      throw new ConflictException(`Product "${createProductDto.name}" already exists`);
    }

    const newProduct = this.productRepository.create({
      ...createProductDto,
      createdBy: user,
      updatedBy: user,
    });

    const savedProduct = await this.productRepository.save(newProduct);

    // Reuse findOne to return the created product with all relations
    return this.findOne(savedProduct.uuid);
  }

  //UPDATE PRODUCT
async update(
    uuid: string,
    updateProductDto: UpdateProductDto,
    userId: number,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { uuid },
    });

    if (!product) {
      throw new NotFoundException(`Product with UUID ${uuid} not found`);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { designations: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isSupporter = user.designations?.some(
      (d) => d.designation === Designation.SUPPORTER,
    );

    if (!isSupporter) {
      throw new ForbiddenException('Only System Supporter can update a product');
    }

    // Check duplicate product name only if name is being changed
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existingProduct = await this.productRepository.findOne({
        where: {
          name: updateProductDto.name,
          id: Not(product.id),
        },
      });

      if (existingProduct) {
        throw new ConflictException(`Product "${updateProductDto.name}" already exists`);
      }

      product.name = updateProductDto.name;
    }

    if (updateProductDto.description !== undefined) {
      product.description = updateProductDto.description;
    }

    if (updateProductDto.link !== undefined) {
      product.link = updateProductDto.link;
    }

    product.updatedBy = user;
    await this.productRepository.save(product);

    // Reuse findOne to return the updated product with all relations
    return this.findOne(uuid);
  }

// FIND ALL PRODUCTS
  async findAll(query: ProductQueryDto) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.updatedBy', 'updatedBy');

    // Search by product name OR product ID/number
    if (query.search) {
      const search = query.search.trim();

      if (/^PR-\d+$/i.test(search)) {
        // Example: PR-0001 -> product ID 1
        const productId = Number(search.toUpperCase().replace('PR-', ''));
        queryBuilder.andWhere('product.id = :productId', { productId });
      } else if (/^\d+$/.test(search)) {
        // Example: 1 -> product ID 1
        const productId = Number(search);
        queryBuilder.andWhere('product.id = :productId', { productId });
      } else {
        // Search product name
        queryBuilder.andWhere('product.name ILIKE :search', {
          search: `%${search}%`,
        });
      }
    }

    // Allowed sorting columns
    const allowedOrderBy = ['id', 'name', 'createdAt', 'updatedAt'];
    const orderBy = allowedOrderBy.includes(query.orderBy ?? '')
      ? query.orderBy
      : 'createdAt';

    queryBuilder.orderBy(`product.${orderBy}`, query.sortOrder ?? 'ASC');

    return PaginationService.paginate(queryBuilder, query);
  }

  // FIND ONE PRODUCT
  async findOne(uuid: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { uuid },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with UUID ${uuid} not found`);
    }

    return product;
  }
}