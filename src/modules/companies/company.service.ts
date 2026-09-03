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
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { PaginationService } from '../../common/pagination/pagination-service';
import { CompanyQueryDto } from './dtos/company-query.dto';
import { Designation } from '../users/enums/users.enum';
import { UpdateCompanyDto } from './dtos/update-company.dto';
@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    user: User,
  ): Promise<Company> {
    // Check Product first
    const product = await this.productRepository.findOne({
      where: {
        id: createCompanyDto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createCompanyDto.productId} not found`,
      );
    }
    if (user.designation !== Designation.SUPPORTER) {
      throw new ForbiddenException(
        'Only System Supporter can create a product',
      );
    }

    // Check Company after Product exists
    const existingCompany = await this.companyRepository.findOne({
      where: {
        name: createCompanyDto.name,
      },
    });

    if (existingCompany) {
      throw new ConflictException(
        `Company "${createCompanyDto.name}" already exists`,
      );
    }

    // Create Company
    const newCompany = this.companyRepository.create({
      ...createCompanyDto,
      product: product,
      createdBy: user,
      updatedBy: user,
    });

    const savedCompany = await this.companyRepository.save(newCompany);

    // Get created Company with relations
    const company = await this.companyRepository.findOne({
      where: {
        uuid: savedCompany.uuid,
      },
      relations: {
        product: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!company) {
      throw new NotFoundException(
        `Company with UUID ${savedCompany.uuid} not found`,
      );
    }

    return company;
  }

  //UPDATE PRODUCT
  async update(
    uuid: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: number,
  ) {
    const company = await this.companyRepository.findOne({
      where: { uuid },
    });

    if (!company) {
      throw new NotFoundException(`Company with UUID ${uuid} not found`);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.designation !== Designation.SUPPORTER) {
      throw new ForbiddenException(
        'Only System Supporter can update a product',
      );
    }

    // Check duplicate company name only if name is being changed
    if (updateCompanyDto.name) {
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

    company.updatedBy = user;

    await this.companyRepository.save(company);

    const updatedCompany = await this.companyRepository.findOne({
      where: { uuid },
      relations: {
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!updatedCompany) {
      throw new NotFoundException('Updated company could not be retrieved');
    }

    return updatedCompany;
  }

  async findAll(query: CompanyQueryDto) {
    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.product', 'product')
      .leftJoinAndSelect('company.createdBy', 'createdBy')
      .leftJoinAndSelect('company.updatedBy', 'updatedBy');

    // Search by company name OR company number
    if (query.search) {
      const search = query.search.trim();

      if (/^COMP-\d+$/i.test(search)) {
        // Example:
        // COMP-0001 -> company ID 1
        const companyId = Number(search.toUpperCase().replace('COMP-', ''));

        queryBuilder.andWhere('company.id = :companyId', {
          companyId,
        });
      } else if (/^\d+$/.test(search)) {
        // 1 -> product ID 1
        const companyId = Number(search);

        queryBuilder.andWhere('company.id = :companyId', {
          companyId,
        });
      } else {
        // Search company name
        queryBuilder.andWhere('company.name ILIKE :search', {
          search: `%${search}%`,
        });
      }
    }

    const companyExists = await queryBuilder.getOne();
    if (!companyExists) {
      throw new NotFoundException('Company does not exist');
    }

    // Allowed sorting columns
    const allowedOrderBy = ['id', 'name', 'createdAt', 'updatedAt'];

    const orderBy = allowedOrderBy.includes(query.orderBy ?? '')
      ? query.orderBy
      : 'createdAt';

    // Sorting
    queryBuilder.orderBy(`company.${orderBy}`, query.sortOrder ?? 'DESC');

    // Pagination
    return PaginationService.paginate(queryBuilder, query);
  }

  async findOne(uuid: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: {
        uuid,
      },
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
