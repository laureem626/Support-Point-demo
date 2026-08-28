import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { CreateCompanyDto } from '../dtos/create-company.dto';

import { CompaniesService } from '../company.service';

import { QueryParamsDto } from '../../../common/queries/query-params.dto';

@ApiTags('Companies')
@Controller('api/companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // POST /api/companies
  @Post()
  @ApiOperation({
    summary: 'Create a new company',
  })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
  })
  async create(@Body() createCompanyDto: CreateCompanyDto, @Req() req: any) {
    const data = await this.companiesService.create(createCompanyDto, req.user);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Company created successfully',
      data,
    };
  }

  // GET /api/companies
  @Get()
  @ApiOperation({
    summary: 'Get all companies',
  })
  @ApiResponse({
    status: 200,
    description: 'Companies retrieved successfully',
  })
  async findAll(@Query() query: QueryParamsDto) {
    const result = await this.companiesService.findAll(query);

    return {
      data: result.data,
      meta: result.meta,
    };
  }

  // GET /api/companies/:uuid
  @Get(':uuid')
  @ApiOperation({
    summary: 'Get company by UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Company returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found.',
  })
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    const data = await this.companiesService.findOne(uuid);

    return {
      statusCode: HttpStatus.OK,
      message: 'Company returned successfully',
      data,
    };
  }
}
