import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { PaginationService } from '../../common/pagination/pagination-service';
import { CompanyQueryDto } from './dtos/company-query.dto';
import { Designation } from 'src/common/enums/issue.enum';
import { DashboardService } from '../dashboard/services/dashboard.service';
import { PaginationOptionsDto } from 'src/common/pagination/dto/pagination-options.dto';
@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dashboardService: DashboardService,
  ) {}

  // CREATE COMPANY
  async create(
    createCompanyDto: CreateCompanyDto,
    user: User,
  ): Promise<Company> {
    const currentUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: { designations: true },
    });

    if (!currentUser) {
      throw new NotFoundException(`User with ID ${user.id} not found`);
    }

    // Safely check if user has the SUPPORTER designation
    const isSupporter = currentUser.designations?.some(
      (d) => d.designation === Designation.SUPPORTER,
    );

    if (!isSupporter) {
      throw new ForbiddenException(
        'Only System Supporter can create a company',
      );
    }

    const product = await this.productRepository.findOne({
      where: { id: createCompanyDto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createCompanyDto.productId} not found`,
      );
    }

    const existingCompany = await this.companyRepository.findOne({
      where: { name: createCompanyDto.name },
    });

    if (existingCompany) {
      throw new ConflictException(
        `Company "${createCompanyDto.name}" already exists`,
      );
    }

    const newCompany = this.companyRepository.create({
      ...createCompanyDto,
      product,
      createdBy: currentUser,
      updatedBy: currentUser,
    });

    const savedCompany = await this.companyRepository.save(newCompany);

    await this.dashboardService.broadcastDashboardStats();

    // Reuse findOne to return the newly created company with all relations
    return this.findOne(savedCompany.uuid);
  }

  // UPDATE COMPANY
  async update(
    uuid: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: number,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { uuid },
    });

    if (!company) {
      throw new NotFoundException(`Company with UUID ${uuid} not found`);
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
        'Only System Supporter can update a company',
      );
    }

    // Check duplicate company name only if the name is being changed
    if (updateCompanyDto.name && updateCompanyDto.name !== company.name) {
      const existingCompany = await this.companyRepository.findOne({
        where: {
          name: updateCompanyDto.name,
          id: Not(company.id),
        },
      });

      if (existingCompany) {
        throw new ConflictException(
          `Company "${updateCompanyDto.name}" already exists`,
        );
      }

      company.name = updateCompanyDto.name;
    }

    if (updateCompanyDto.link !== undefined) {
      company.link = updateCompanyDto.link;
    }

    if (updateCompanyDto.productId !== undefined) {
      const product = await this.productRepository.findOne({
        where: { id: updateCompanyDto.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${updateCompanyDto.productId} not found`,
        );
      }

      company.product = product;
    }

    company.updatedBy = user;
    await this.companyRepository.save(company);

    await this.dashboardService.broadcastDashboardStats();

    // Reuse findOne to return the updated company with all relations
    return this.findOne(uuid);
  }

  // FIND ALL COMPANIES
  async findAll(
  query: CompanyQueryDto,
  paginationOptsDto: PaginationOptionsDto,
  baseUrl: string,
) {
  const queryBuilder = this.companyRepository
    .createQueryBuilder('company')
    .leftJoinAndSelect(
      'company.product',
      'product',
    )
    .leftJoinAndSelect(
      'company.createdBy',
      'createdBy',
    )
    .leftJoinAndSelect(
      'company.updatedBy',
      'updatedBy',
    );

  // ----------------------------------------------------------
  // 1. SEARCH
  // ----------------------------------------------------------

  if (query.search) {
    const search = query.search.trim();

    if (/^COMP-\d+$/i.test(search)) {
      // Example: COMP-0001 -> company ID 1
      const companyId = Number(
        search
          .toUpperCase()
          .replace('COMP-', ''),
      );

      queryBuilder.andWhere(
        'company.id = :companyId',
        { companyId },
      );
    } else if (/^\d+$/.test(search)) {
      // Example: 1 -> company ID 1
      const companyId = Number(search);

      queryBuilder.andWhere(
        'company.id = :companyId',
        { companyId },
      );
    } else {
      // Search company name
      queryBuilder.andWhere(
        'company.name ILIKE :search',
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
    query.sortOrder === 'DESC'
      ? 'DESC'
      : 'ASC';

  queryBuilder.orderBy(
    `company.${orderBy}`,
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
  // 4. GET COMPANIES + TOTAL
  // ----------------------------------------------------------

  const [
    companies,
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

    return `${baseUrl}?${params.toString()}`;
  };

  // ----------------------------------------------------------
  // 7. RESPONSE
  // ----------------------------------------------------------

  return {
    data: companies,

    meta: {
      page,
      pageSize,
      itemCount: companies.length,
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

  // FIND ONE COMPANY
  async findOne(uuid: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { uuid },
      relations: {
        product: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with UUID ${uuid} not found`);
    }

    return company;
  }
}
