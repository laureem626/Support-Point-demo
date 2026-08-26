import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createCompanyDto: CreateCompanyDto, user: User): Promise<Company> {
    const saved = await this.companyRepository.save(
      this.companyRepository.create({ ...createCompanyDto, createdBy: user, updatedBy: user })
    );

    saved.number = `COMP-${String(saved.id).padStart(4, '0')}`;
      await this.companyRepository.save(saved);

    const company = await this.companyRepository.findOne({
      where: { uuid: saved.uuid },
      relations: { product: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find({
      relations: { product: true },
    });
  }

  async findOne(uuid: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { uuid },
      relations: { product: true },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${uuid} not found`);
    }

    return company;
  }
}