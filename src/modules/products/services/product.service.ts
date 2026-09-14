import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-productdto';
import { User } from '../../users/entities/user.entity';
import { PaginationService } from '../../../common/pagination/pagination-service';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { Designation } from 'src/common/enums/issue.enum';
import { DashboardService } from 'src/modules/dashboard/services/dashboard.service';
import { PaginationOptionsDto } from 'src/common/pagination/dto/pagination-options.dto';
import type { Request } from 'express';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dashboardService: DashboardService,
  ) {}

  // CREATE PRODUCT
  async create(
    createProductDto: CreateProductDto,
    userId: number,
  ): Promise<Product> {
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
      throw new ForbiddenException(
        'Only System Supporter can create a product',
      );
    }

    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
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

    //  BROADCAST FRESH DASHBOARD STATS
    await this.dashboardService.broadcastDashboardStats();

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
      throw new ForbiddenException(
        'Only System Supporter can update a product',
      );
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
        throw new ConflictException(
          `Product "${updateProductDto.name}" already exists`,
        );
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

    await this.dashboardService.broadcastDashboardStats();

    // Reuse findOne to return the updated product with all relations
    return this.findOne(uuid);
  }

  // FIND ALL PRODUCTS


async findAll(
  query: ProductQueryDto,
  paginationOptsDto: PaginationOptionsDto,
  baseUrl: string,
) {
  const queryBuilder = this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect(
      'product.createdBy',
      'createdBy',
    )
    .leftJoinAndSelect(
      'product.updatedBy',
      'updatedBy',
    );

  // ----------------------------------------------------------
  // 1. SEARCH
  // ----------------------------------------------------------

  if (query.search) {
    const search = query.search.trim();

    if (/^PR-\d+$/i.test(search)) {
      // Example: PR-0001 -> product ID 1
      const productId = Number(
        search
          .toUpperCase()
          .replace('PR-', ''),
      );

      queryBuilder.andWhere(
        'product.id = :productId',
        { productId },
      );
    } else if (/^\d+$/.test(search)) {
      // Example: 1 -> product ID 1
      const productId = Number(search);

      queryBuilder.andWhere(
        'product.id = :productId',
        { productId },
      );
    } else {
      // Search product name
      queryBuilder.andWhere(
        'product.name ILIKE :search',
        {
          search: `%${search}%`,
        },
      );
    }
  }

  // ----------------------------------------------------------
  // 2. SORTING
  // ----------------------------------------------------------

  const allowedOrderBy = [
    'id',
    'name',
    'createdAt',
    'updatedAt',
  ];

  const orderBy =
    allowedOrderBy.includes(
      query.orderBy ?? '',
    )
      ? query.orderBy
      : 'createdAt';

  const sortOrder =
    query.sortOrder ?? 'ASC';

  queryBuilder.orderBy(
    `product.${orderBy}`,
    sortOrder,
  );

  // ----------------------------------------------------------
  // 3. PAGINATION
  // ----------------------------------------------------------

  const page =
    paginationOptsDto.page || 1;

  const pageSize =
    paginationOptsDto.pageSize || 10;

  const skip =
    (page - 1) * pageSize;

  queryBuilder
    .skip(skip)
    .take(pageSize);

  // ----------------------------------------------------------
  // 4. GET PRODUCTS + TOTAL
  // ----------------------------------------------------------

  const [
    products,
    total,
  ] = await queryBuilder.getManyAndCount();

  // ----------------------------------------------------------
  // 5. PAGE COUNT
  // ----------------------------------------------------------

  const pageCount =
    Math.ceil(total / pageSize);

  // ----------------------------------------------------------
  // 6. BUILD PAGINATION LINK
  // ----------------------------------------------------------

  const buildPaginationLink = (
    targetPage: number,
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      'page',
      targetPage.toString(),
    );

    params.set(
      'pageSize',
      pageSize.toString(),
    );

    // Preserve search
    if (query.search) {
      params.set(
        'search',
        query.search,
      );
    }

    // Preserve sorting
    if (query.orderBy) {
      params.set(
        'orderBy',
        query.orderBy,
      );
    }

    if (query.sortOrder) {
      params.set(
        'sortOrder',
        query.sortOrder,
      );
    }

    //const baseUrl =
    //  `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;

    return `${baseUrl}?${params.toString()}`;
  };

  // ----------------------------------------------------------
  // 7. RESPONSE
  // ----------------------------------------------------------

  return {
    data: products,

    meta: {
      page,
      pageSize,
      itemCount: products.length,
      pageCount,
      nextLink:
        page < pageCount
          ? buildPaginationLink(
              page + 1,
            )
          : null,

      prevLink:
        page > 1
          ? buildPaginationLink(
              page - 1,
            )
          : null,
    },
  };
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
