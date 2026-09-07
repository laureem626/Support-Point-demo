
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Not,
  Repository,
} from 'typeorm';

import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';

import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';

import { PaginationService } from '../../common/pagination/pagination-service';
import { CompanyQueryDto } from './dtos/company-query.dto';

import {
  Designation,
} from 'src/common/enums/issue.enum';

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

  // CREATE COMPANY
  async create(
    createCompanyDto: CreateCompanyDto,
    user: User,
  ): Promise<Company> {
    /**
     * Reload the user with designations.
     *
     * User.designations is a relation, so we need
     * to explicitly load it before checking the role.
     */
    const currentUser =
      await this.userRepository.findOne({
        where: {
          id: user.id,
        },
        relations: {
          designations: true,
        },
      });

    if (!currentUser) {
      throw new NotFoundException(
        `User with ID ${user.id} not found`,
      );
    }

    /**
     * Check Supporter permission.
     *
     * designations is an array of Designation entities,
     * therefore we access the actual enum value using:
     *
     * currentUser.designations[0].designation
     */
    if (
      currentUser.designations?.[0]?.designation !==
      Designation.SUPPORTER
    ) {
      throw new ForbiddenException(
        'Only System Supporter can create a company',
      );
    }

    // Check Product first.
    const product =
      await this.productRepository.findOne({
        where: {
          id: createCompanyDto.productId,
        },
      });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createCompanyDto.productId} not found`,
      );
    }

    // Check if company already exists.
    const existingCompany =
      await this.companyRepository.findOne({
        where: {
          name: createCompanyDto.name,
        },
      });

    if (existingCompany) {
      throw new ConflictException(
        `Company "${createCompanyDto.name}" already exists`,
      );
    }

    // Create Company.
    const newCompany =
      this.companyRepository.create({
        ...createCompanyDto,
        product,
        createdBy: currentUser,
        updatedBy: currentUser,
      });

    const savedCompany =
      await this.companyRepository.save(
        newCompany,
      );

    // Get created Company with relations.
    const company =
      await this.companyRepository.findOne({
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

  // UPDATE COMPANY
  async update(
    uuid: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: number,
  ) {
    // Find company.
    const company =
      await this.companyRepository.findOne({
        where: {
          uuid,
        },
      });

    if (!company) {
      throw new NotFoundException(
        `Company with UUID ${uuid} not found`,
      );
    }

    /**
     * Load user WITH designations.
     */
    const user =
      await this.userRepository.findOne({
        where: {
          id: userId,
        },
        relations: {
          designations: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${userId} not found`,
      );
    }

    /**
     * Only System Supporter can update company.
     */
    if (
      user.designations?.[0]?.designation !==
      Designation.SUPPORTER
    ) {
      throw new ForbiddenException(
        'Only System Supporter can update a company',
      );
    }

    /**
     * Check duplicate company name only
     * if the name is being changed.
     */
    if (
      updateCompanyDto.name &&
      updateCompanyDto.name !== company.name
    ) {
      const existingCompany =
        await this.companyRepository.findOne({
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

      company.name =
        updateCompanyDto.name;
    }

    /**
     * Update company link.
     */
    if (
      updateCompanyDto.link !==
      undefined
    ) {
      company.link =
        updateCompanyDto.link;
    }

    /**
     * Update product if productId
     * was provided.
     */
    if (
      updateCompanyDto.productId !==
      undefined
    ) {
      const product =
        await this.productRepository.findOne({
          where: {
            id: updateCompanyDto.productId,
          },
        });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${updateCompanyDto.productId} not found`,
        );
      }

      company.product = product;
    }

    // Set updatedBy.
    company.updatedBy = user;

    // Save changes.
    await this.companyRepository.save(
      company,
    );

    /**
     * Get updated company with
     * all required relations.
     */
    const updatedCompany =
      await this.companyRepository.findOne({
        where: {
          uuid,
        },
        relations: {
          product: true,
          createdBy: true,
          updatedBy: true,
        },
      });

    if (!updatedCompany) {
      throw new NotFoundException(
        'Updated company could not be retrieved',
      );
    }

    return updatedCompany;
  }

  // FIND ALL COMPANIES
  async findAll(
    query: CompanyQueryDto,
  ) {
    const queryBuilder =
      this.companyRepository
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

    /**
     * Search by company name
     * OR company number.
     */
    if (query.search) {
      const search =
        query.search.trim();

      if (
        /^COMP-\d+$/i.test(search)
      ) {
        /**
         * Example:
         * COMP-0001 -> company ID 1
         */
        const companyId =
          Number(
            search
              .toUpperCase()
              .replace(
                'COMP-',
                '',
              ),
          );

        queryBuilder.andWhere(
          'company.id = :companyId',
          {
            companyId,
          },
        );
      } else if (
        /^\d+$/.test(search)
      ) {
        /**
         * Example:
         * 1 -> company ID 1
         */
        const companyId =
          Number(search);

        queryBuilder.andWhere(
          'company.id = :companyId',
          {
            companyId,
          },
        );
      } else {
        /**
         * Search company name.
         */
        queryBuilder.andWhere(
          'company.name ILIKE :search',
          {
            search: `%${search}%`,
          },
        );
      }
    }

    /**
     * Allowed sorting columns.
     */
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

    /**
     * Make sure only ASC/DESC
     * can be used.
     */
    const sortOrder =
      query.sortOrder === 'ASC'
        ? 'ASC'
        : 'DESC';

    // Sorting.
    queryBuilder.orderBy(
      `company.${orderBy}`,
      sortOrder,
    );

    // Pagination.
    return PaginationService.paginate(
      queryBuilder,
      query,
    );
  }

  // FIND ONE COMPANY
  async findOne(
    uuid: string,
  ): Promise<Company> {
    const company =
      await this.companyRepository.findOne({
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
      throw new NotFoundException(
        `Company with UUID ${uuid} not found`,
      );
    }

    return company;
  }
}

