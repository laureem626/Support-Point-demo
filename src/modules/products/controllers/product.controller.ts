import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
  HttpStatus,
  Query,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ProductsService } from '../services/product.service';
import { CreateProductDto } from '../dtos/create-product.dto';
import { QueryParamsDto } from '../../../common/queries/query-params.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('api/products')
@ApiTags('Products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // POST /api/products
  @Post()
  @ApiOperation({
    summary: 'Create a product',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: any,
  ) {
    const product = await this.productsService.create(
      createProductDto,
      req.user.id,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Product created successfully',
      data: product,
    };
  }

  // GET /api/products
  @Get()
  @ApiOperation({
    summary: 'Get all products',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully.',
  })
  async findAll(@Query() query: QueryParamsDto) {
    const result = await this.productsService.findAll(query);

    return {
      data: result.data,
      meta: result.meta,
    };
  }

  // GET /api/products/:uuid
  @Get(':uuid')
  @ApiOperation({
    summary: 'Get a product by UUID',
  })
  @ApiParam({
    name: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Product returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found.',
  })
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    const product = await this.productsService.findOne(uuid);

    return {
      statusCode: HttpStatus.OK,
      message: 'Product retrieved successfully',
      data: product,
    };
  }
}
