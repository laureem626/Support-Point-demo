import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    user: User,
  ): Promise<Company> { 
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
    const newCompany = this.companyRepository.create({
      ...createCompanyDto,
      createdBy: user,
      updatedBy: user,
    });

    const savedCompany = await this.companyRepository.save(newCompany);

    const company = await this.companyRepository.findOne({
      where: { uuid: savedCompany.uuid },
      relations: {
        product: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!company) {
      throw new NotFoundException( `Company with UUID ${savedCompany.uuid} not found`, );
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
      where: { uuid },
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