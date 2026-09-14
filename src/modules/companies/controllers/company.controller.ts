import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { CompaniesService } from '../company.service';
import { CompanyQueryDto } from '../dtos/company-query.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import {ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,} from '@nestjs/swagger';
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
  Patch,
} from '@nestjs/common';
import { UpdateProductDto } from 'src/modules/products/dtos/update-productdto';
import { PaginationOptionsDto } from '../../../common/pagination/dto/pagination-options.dto';
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

  @Patch(':uuid')
  @ApiOperation({ summary: 'update company' })
  @ApiResponse({
    status: 201,
    description: 'Company updated successfully.',
  })
  UpdateCompany(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateDto: UpdateCompanyDto,
    @Req() req,
  ) {
    return this.companiesService.update(uuid, updateDto, req.user.id);
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
  async findAll(@Query() query: CompanyQueryDto,@Query() paginationOptsDto: PaginationOptionsDto,@Req() req:any) {
     const baseUrl =
    `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const result = await this.companiesService.findAll(query,paginationOptsDto,
      baseUrl,
    );

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
