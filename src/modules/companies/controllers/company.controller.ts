import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { CompaniesService } from '../company.service';

@ApiTags('Companies')
@Controller('api/companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    const data = await this.companiesService.create(createCompanyDto);
    return {
      status: HttpStatus.CREATED,
      message: 'Company created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async findAll() {
    const data = await this.companiesService.findAll();
    return {
      status: HttpStatus.OK,
      message: 'Companies retrieved successfully',
      data,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  async findOne(@Param('uuid') id: string) {
    const data = await this.companiesService.findOne(id);
    return {
      status: HttpStatus.OK,
      data,
    };
  }
}