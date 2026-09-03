import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { User } from '../../users/entities/user.entity';
import { PaginationService } from '../../../common/pagination/pagination-service';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { Designation } from 'src/modules/users/enums/users.enum';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createProductDto: CreateProductDto, userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.designation !== Designation.SUPPORTER) {
      throw new ForbiddenException(
        'Only System Supporter can create a product',
      );
    }

    const existingProduct = await this.productRepository.findOne({
      where: {
        name: createProductDto.name,
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product "${createProductDto.name}" already exists`,
      );
    }

    const newProduct = this.productRepository.create({
      ...createProductDto,
      createdBy: user,
      updatedBy: user,
    });

    const savedProduct = await this.productRepository.save(newProduct);

    const product = await this.productRepository.findOne({
      where: {
        id: savedProduct.id,
      },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product could not be retrieved');
    }

    return product;
  }

  async findAll(query: ProductQueryDto) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.updatedBy', 'updatedBy');

    // Search by product name OR product number
    if (query.search) {
      const search = query.search.trim();

      if (/^PR-\d+$/i.test(search)) {
        // Example: PR-0001 -> product ID 1
        const productId = Number(search.toUpperCase().replace('PR-', ''));

        queryBuilder.andWhere('product.id = :productId', {
          productId,
        });
      }  else if (/^\d+$/.test(search)) {
    // 1 -> product ID 1
    const productId = Number(search);

    queryBuilder.andWhere('product.id = :productId', {
      productId,
    });

  }
      
      else {
        // Search product name
        queryBuilder.andWhere('product.name ILIKE :search', {
          search: `%${search}%`,
        });
      }
    }

    // Check if searched product exists
    const productExists = await queryBuilder.getOne();
    if (!productExists) {
      throw new NotFoundException('Product does not exist');
    }

    // Allowed sorting columns
    const allowedOrderBy = ['id', 'name', 'createdAt', 'updatedAt'];

    const orderBy = allowedOrderBy.includes(query.orderBy ?? '')
      ? query.orderBy
      : 'createdAt';

    // Sorting
    queryBuilder.orderBy(`product.${orderBy}`, query.sortOrder ?? 'DESC');

    // Pagination
    return PaginationService.paginate(queryBuilder, query);
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
      throw new NotFoundException(`Product with UUID ${uuid} not found`);
    }

    return product;
  }
}
