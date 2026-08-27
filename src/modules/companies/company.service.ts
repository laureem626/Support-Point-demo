import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Company } from './entities/company.entity';

import { CreateCompanyDto } from './dtos/create-company.dto';

import { User } from '../users/entities/user.entity';

import { Product } from '../products/entities/product.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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

    const savedCompany =
      await this.companyRepository.save(newCompany);

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

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find({
      relations: {
        product: true,
        createdBy: true,
        updatedBy: true,
      },
    });
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
      throw new NotFoundException(
        `Company with UUID ${uuid} not found`,
      );
    }

    return company;
  }
}